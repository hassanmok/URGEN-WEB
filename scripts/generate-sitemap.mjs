/**
 * Generates public/sitemap.xml before production build.
 * Uses Supabase (when env is set) for tests, published news, and published events.
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outPath = join(root, 'public', 'sitemap.xml')

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://www.urgenlab.com').replace(
  /\/$/,
  '',
)

function loadDotEnv() {
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toLoc(path) {
  if (!path || path === '/') return `${SITE_URL}/`
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

function urlEntry(path, { changefreq = 'weekly', priority = '0.7', lastmod } = {}) {
  const parts = [
    '  <url>',
    `    <loc>${xmlEscape(toLoc(path))}</loc>`,
  ]
  if (lastmod) parts.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`)
  parts.push(`    <changefreq>${changefreq}</changefreq>`)
  parts.push(`    <priority>${priority}</priority>`)
  parts.push('  </url>')
  return parts.join('\n')
}

function isoDateOnly(value) {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/tests', priority: '0.9', changefreq: 'weekly' },
  { path: '/technology', priority: '0.8', changefreq: 'monthly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.8', changefreq: 'monthly' },
  { path: '/events', priority: '0.8', changefreq: 'weekly' },
  { path: '/news', priority: '0.8', changefreq: 'weekly' },
]

async function fetchDynamicPaths() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[sitemap] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — static pages only.')
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const dynamic = []

  const { data: tests, error: testsErr } = await supabase
    .from('tests')
    .select('slug, created_at')
    .order('sort_order', { ascending: true })

  if (testsErr) {
    console.warn('[sitemap] tests:', testsErr.message)
  } else {
    for (const row of tests ?? []) {
      if (!row.slug?.trim()) continue
      dynamic.push({
        path: `/tests/${encodeURIComponent(row.slug.trim())}`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: isoDateOnly(row.created_at),
      })
    }
  }

  const { data: news, error: newsErr } = await supabase
    .from('news')
    .select('id, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (newsErr) {
    console.warn('[sitemap] news:', newsErr.message)
  } else {
    for (const row of news ?? []) {
      if (!row.id) continue
      dynamic.push({
        path: `/news/${encodeURIComponent(row.id)}`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: isoDateOnly(row.created_at),
      })
    }
  }

  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('id, created_at, event_date')
    .eq('published', true)
    .order('event_date', { ascending: false })

  if (eventsErr) {
    console.warn('[sitemap] events:', eventsErr.message)
  } else {
    for (const row of events ?? []) {
      if (!row.id) continue
      dynamic.push({
        path: `/events/${encodeURIComponent(row.id)}`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: isoDateOnly(row.created_at ?? row.event_date),
      })
    }
  }

  return dynamic
}

async function main() {
  loadDotEnv()

  const dynamic = await fetchDynamicPaths()
  const entries = [
    ...STATIC_PAGES.map((page) => urlEntry(page.path, page)),
    ...dynamic.map((page) => urlEntry(page.path, page)),
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, xml, 'utf8')

  console.log(`[sitemap] Wrote ${entries.length} URLs to public/sitemap.xml (${SITE_URL})`)
}

main().catch((err) => {
  console.error('[sitemap] Failed:', err)
  process.exit(1)
})
