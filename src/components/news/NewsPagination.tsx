import type { Messages } from '../../i18n/messages'

type Props = {
  page: number
  totalPages: number
  onPage: (page: number) => void
  labels: Messages['newsPage']
}

export function NewsPagination({ page, totalPages, onPage, labels }: Props) {
  if (totalPages <= 1) return null

  const pages = buildPageList(page, totalPages)

  return (
    <nav className="mt-14 flex flex-wrap items-center justify-center gap-2" aria-label={labels.pagination}>
      {page > 1 && (
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-urgen-purple hover:bg-urgen-purple/5"
        >
          {labels.prevPage}
        </button>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium ${
              p === page
                ? 'bg-urgen-purple text-white'
                : 'text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}
      {page < totalPages && (
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-urgen-purple hover:bg-urgen-purple/5"
        >
          {labels.nextPage}
        </button>
      )}
    </nav>
  )
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = [1]
  if (current > 3) out.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    out.push(p)
  }
  if (current < total - 2) out.push('…')
  out.push(total)
  return out
}
