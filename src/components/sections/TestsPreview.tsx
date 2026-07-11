import { Link } from "react-router-dom";
import { useLocaleContext } from "../../i18n/useLocaleContext";
import { pickLocale, useSiteContent } from "../../i18n/useSiteContent";
import { SectionHeading } from "../ui/SectionHeading";
import { CategoryCard } from "../ui/CategoryCard";
import { Button } from "../ui/Button";
import { testCategoryCards } from "../../data/testCategoryCards";

export function TestsPreview() {
  const { locale } = useLocaleContext();
  const { content } = useSiteContent();
  const previewCopy = pickLocale(content.tests_preview, locale);

  return (
    <section className="py-16 lg:py-24">
      <div className="container-urgen">
        <SectionHeading
          eyebrow={previewCopy.eyebrow}
          title={previewCopy.title}
          subtitle={previewCopy.subtitle}
        />

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testCategoryCards.map((card) => (
            <CategoryCard key={card.slug} card={card} />
          ))}
        </div>

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
