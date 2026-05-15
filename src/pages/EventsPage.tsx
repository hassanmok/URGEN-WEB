import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '../components/events/EventCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { Button } from '../components/ui/Button'
import { useEvents } from '../hooks/useEvents'
import { useLocaleContext } from '../i18n/useLocaleContext'

const Box = ({ className, children }: { className?: string; children?: React.ReactNode }) =>
  createElement('div', { className }, children)

export function EventsPage() {
  const { locale, messages: m } = useLocaleContext()
  const { events, loading } = useEvents()

  return (
    <Box className="bg-white py-14 lg:py-20">
      <Box className="container-urgen">
        <SectionHeading
          eyebrow={m.eventsPage.eyebrow}
          title={m.eventsPage.title}
          subtitle={m.eventsPage.subtitle}
        />

        {loading ? (
          <p className="mt-12 text-center text-slate-500">{m.eventsPage.loading}</p>
        ) : events.length === 0 ? (
          <Box className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
            <p className="text-slate-600">{m.eventsPage.empty}</p>
          </Box>
        ) : (
          <Box className="mt-12 grid gap-8 md:grid-cols-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                locale={locale}
                dateLabel={m.eventsPage.dateLabel}
              />
            ))}
          </Box>
        )}

        <Box className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <Link to="/contact">
            <Button variant="outline">{m.eventsPage.contactCta}</Button>
          </Link>
        </Box>
      </Box>
    </Box>
  )
}
