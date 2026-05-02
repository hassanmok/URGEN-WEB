import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useLocaleContext } from '../i18n/useLocaleContext'

export function NotFoundPage() {
  const { messages: m } = useLocaleContext()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-semibold text-urgen-purple">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-urgen-navy">{m.notFound.title}</h1>
      <p className="mt-3 max-w-md text-slate-600">{m.notFound.subtitle}</p>
      <Link to="/" className="mt-8">
        <Button>{m.notFound.home}</Button>
      </Link>
    </div>
  )
}
