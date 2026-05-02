import { useLocaleContext } from '../../i18n/useLocaleContext'

export function LanguageSwitcher() {
  const { locale, setLocale, messages: m } = useLocaleContext()

  return (
    <div
      className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-sm"
      role="group"
      aria-label={locale === 'ar' ? m.language.switchToEn : m.language.switchToAr}
    >
      <button
        type="button"
        onClick={() => setLocale('ar')}
        className={`rounded-md px-2.5 py-1.5 transition ${
          locale === 'ar'
            ? 'bg-urgen-purple text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
        aria-pressed={locale === 'ar'}
        aria-label={m.language.switchToAr}
      >
        {m.language.arShort}
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-md px-2.5 py-1.5 transition ${
          locale === 'en'
            ? 'bg-urgen-purple text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50'
        }`}
        aria-pressed={locale === 'en'}
        aria-label={m.language.switchToEn}
      >
        {m.language.enShort}
      </button>
    </div>
  )
}
