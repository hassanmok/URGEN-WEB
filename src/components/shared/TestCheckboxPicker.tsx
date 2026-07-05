import { useMemo, useState } from 'react'
import {
  dedupeTestsBySlug,
  filterTestsBySearch,
  sortTestsByLocale,
  testPickerDisplayTitle,
} from '../../lib/testCatalog'
import type { TestRow } from '../../types/database'

export type TestCheckboxPickerLabels = {
  legend: string
  hint: string
  loading: string
  empty: string
  searchPlaceholder: string
  searchNoResults: string
  otherOption?: string
}

type Props = {
  tests: TestRow[]
  loading?: boolean
  selectedTests: Set<string>
  onToggle: (slug: string) => void
  locale: string
  labels: TestCheckboxPickerLabels
  className?: string
  otherTests?: Map<string, string>
  onRequestAddOther?: () => void
}

const searchInputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-urgen-purple focus:outline-none focus:ring-2 focus:ring-urgen-purple/20'

export function TestCheckboxPicker({
  tests,
  loading = false,
  selectedTests,
  onToggle,
  locale,
  labels,
  className = '',
  otherTests,
  onRequestAddOther,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')

  const uniqueTests = useMemo(() => dedupeTestsBySlug(tests), [tests])

  const sortedTests = useMemo(
    () => sortTestsByLocale(uniqueTests, locale),
    [uniqueTests, locale],
  )

  const filteredTests = useMemo(
    () => filterTestsBySearch(sortedTests, searchQuery, locale),
    [sortedTests, searchQuery, locale],
  )

  return (
    <fieldset className={`block ${className}`}>
      <legend className="text-sm font-semibold text-urgen-navy">{labels.legend}</legend>
      <p className="mt-1 text-xs text-slate-500">{labels.hint}</p>

      {!loading && sortedTests.length > 0 && (
        <label className="mt-3 block">
          <span className="sr-only">{labels.searchPlaceholder}</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className={searchInputClass}
            autoComplete="off"
          />
        </label>
      )}

      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
        {loading ? (
          <p className="text-sm text-slate-500">{labels.loading}</p>
        ) : sortedTests.length === 0 ? (
          <p className="text-sm text-slate-500">{labels.empty}</p>
        ) : filteredTests.length === 0 ? (
          <p className="text-sm text-slate-500">{labels.searchNoResults}</p>
        ) : (
          filteredTests.map((t) => (
            <label
              key={t.slug}
              className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-urgen-purple focus:ring-urgen-purple"
                checked={selectedTests.has(t.slug)}
                onChange={() => onToggle(t.slug)}
              />
              <span className="text-sm text-slate-800">
                {testPickerDisplayTitle(t, locale, sortedTests)}
              </span>
            </label>
          ))
        )}
        {otherTests &&
          [...otherTests.entries()].map(([slug, title]) => (
            <label
              key={slug}
              className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-urgen-purple focus:ring-urgen-purple"
                checked={selectedTests.has(slug)}
                onChange={() => onToggle(slug)}
              />
              <span className="text-sm text-slate-800">{title}</span>
            </label>
          ))}
        {labels.otherOption && onRequestAddOther && (
          <button
            type="button"
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start text-sm font-semibold text-urgen-purple hover:bg-urgen-purple/5"
            onClick={onRequestAddOther}
          >
            + {labels.otherOption}
          </button>
        )}
      </div>
    </fieldset>
  )
}
