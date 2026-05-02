import { SectionHeading } from '../components/ui/SectionHeading'
import { BookingForm } from '../components/booking/BookingForm'
import { useLocaleContext } from '../i18n/useLocaleContext'

export function BookPage() {
  const { messages: m } = useLocaleContext()

  return (
    <div className="bg-gradient-to-b from-white to-slate-50 py-14 lg:py-20">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={m.bookPage.eyebrow}
          title={m.bookPage.title}
          subtitle={m.bookPage.subtitle}
        />
        <div className="mt-12">
          <BookingForm />
        </div>
      </div>
    </div>
  )
}
