import { Link } from "react-router-dom";
import { useTests } from "../../hooks/useTests";
import { useLocaleContext } from "../../i18n/useLocaleContext";
import { pickLocale, useSiteContent } from "../../i18n/useSiteContent";
import { SectionHeading } from "../ui/SectionHeading";
import { TestCard } from "../ui/TestCard";
import { Button } from "../ui/Button";

export function TestsPreview() {
  const { tests, loading } = useTests();
  const { locale } = useLocaleContext();
  const { content } = useSiteContent();
  const previewCopy = pickLocale(content.tests_preview, locale);
  const preview = tests.slice(0, 4);

  return (
    <section className="py-16 lg:py-24">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={previewCopy.eyebrow}
          title={previewCopy.title}
          subtitle={previewCopy.subtitle}
        />

        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[340px] animate-pulse rounded-2xl bg-slate-100"
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {preview.map((t) => (
              <TestCard key={t.id} test={t} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link to="/tests">
            <Button variant="outline" className="min-w-[220px]">
              {previewCopy.viewAll}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
