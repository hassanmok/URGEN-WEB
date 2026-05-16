import { useLocaleContext } from "../../i18n/useLocaleContext";
import { pickLocale, useSiteContent } from "../../i18n/useSiteContent";
import { FeatureCard } from "../ui/FeatureCard";

const icons = [
  <svg
    key="tech"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>,
  <svg
    key="acc"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M5 13l4 4L19 7"
    />
  </svg>,
  <svg
    key="priv"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
    />
  </svg>,
  <svg
    key="coverage"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>,
] as const;

export function FeatureBar() {
  const { locale } = useLocaleContext();
  const { content } = useSiteContent();
  const items = pickLocale(content.feature_bar, locale);

  return (
    <div
      className={[
        "relative z-10 -mt-12 sm:-mt-16 lg:-mt-20",
        "lg:bg-[linear-gradient(to_bottom,transparent_0%,transparent_30%,var(--color-urgen-sky-soft)_20%,var(--color-urgen-sky-soft)_100%)]",
        "sm:bg-[linear-gradient(to_bottom,transparent_0%,transparent_10%,var(--color-urgen-sky-soft)_10%,var(--color-urgen-sky-soft)_100%)]",
        "bg-[linear-gradient(to_bottom,transparent_0%,transparent_5%,var(--color-urgen-sky-soft)_0%,var(--color-urgen-sky-soft)_100%)]"
      ].join(" ")}
    >
      <div className="container-urgen relative">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {items.map((item, i) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              description={item.description}
              icon={icons[i]!}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
