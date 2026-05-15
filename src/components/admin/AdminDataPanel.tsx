import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { fetchContactMessagesAdmin, type ContactMessageRow } from '../../lib/contactStore'
import { syncDefaultSiteContentToSupabase } from '../../lib/siteContentStore'
import { syncCatalogToSupabase } from '../../lib/testsStore'
import { supabase } from '../../lib/supabase'
import { useSiteContent } from '../../i18n/useSiteContent'
import type { Messages } from '../../i18n/messages'

type AdminDataPanelProps = {
  m: Messages['admin']
}

export function AdminDataPanel({ m }: AdminDataPanelProps) {
  const { reload: reloadSiteContent } = useSiteContent()
  const [syncingTests, setSyncingTests] = useState(false)
  const [syncingContent, setSyncingContent] = useState(false)
  const [messages, setMessages] = useState<ContactMessageRow[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [status, setStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const hasSupabase = Boolean(supabase)

  async function loadMessages() {
    setLoadingMessages(true)
    setMessages(await fetchContactMessagesAdmin())
    setLoadingMessages(false)
  }

  useEffect(() => {
    if (hasSupabase) void loadMessages()
  }, [hasSupabase])

  async function onSyncTests() {
    setStatus(null)
    setSyncingTests(true)
    const result = await syncCatalogToSupabase()
    setSyncingTests(false)
    if (!result.ok) {
      setStatus({ type: 'err', text: m.syncTestsFailed })
      return
    }
    setStatus({
      type: 'ok',
      text: m.syncTestsOk.replace('{n}', String(result.count ?? 0)),
    })
  }

  async function onSyncContent() {
    setStatus(null)
    setSyncingContent(true)
    const result = await syncDefaultSiteContentToSupabase()
    setSyncingContent(false)
    if (!result.ok) {
      setStatus({ type: 'err', text: m.syncContentFailed })
      return
    }
    await reloadSiteContent()
    setStatus({ type: 'ok', text: m.syncContentOk })
  }

  if (!hasSupabase) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        {m.supabaseRequired}
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-urgen-navy">{m.dataTitle}</h2>
        <p className="mt-2 text-sm text-slate-600">{m.dataSubtitle}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" disabled={syncingTests} onClick={() => void onSyncTests()}>
            {syncingTests ? m.syncingTests : m.syncTests}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={syncingContent}
            onClick={() => void onSyncContent()}
          >
            {syncingContent ? m.syncingContent : m.syncContent}
          </Button>
        </div>

        {status && (
          <p
            className={`mt-4 text-sm ${status.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}
          >
            {status.text}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-urgen-navy">{m.contactInbox}</h2>
        {loadingMessages ? (
          <p className="mt-4 text-sm text-slate-500">{m.loadingInbox}</p>
        ) : messages.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{m.emptyInbox}</p>
        ) : (
          <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">
            {messages.map((msg) => (
              <li key={msg.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-urgen-navy">{msg.full_name}</p>
                {msg.email && (
                  <p className="text-slate-500" dir="ltr">
                    {msg.email}
                  </p>
                )}
                <p className="mt-2 text-slate-700">{msg.message}</p>
                <p className="mt-2 text-xs text-slate-400">{msg.created_at}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
