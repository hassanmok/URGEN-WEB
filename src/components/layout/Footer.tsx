import { Link } from "react-router-dom";
import { useLocaleContext } from "../../i18n/useLocaleContext";
import { URGEN_SOCIAL_LINKS } from "../../lib/socialLinks";
import { Logo } from "../Logo";

const socialIconClass =
  "inline-flex rounded-full bg-white/10 p-2.5 text-slate-200 transition hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

export function Footer() {
  const { messages: m } = useLocaleContext();

  return (
    <footer className="border-t border-slate-100 bg-urgen-navy text-slate-100">
      <div className="container-urgen py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="inline-block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-urgen-navy"
            >
              <Logo light large footer />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
              {m.footer.blurb}
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {m.footer.quickLinks}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link className="text-slate-300 hover:text-white" to="/tests">
                  {m.nav.tests}
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-300 hover:text-white"
                  to="/technology"
                >
                  {m.nav.technology}
                </Link>
              </li>
              <li>
                <Link className="text-slate-300 hover:text-white" to="/events">
                  {m.nav.events}
                </Link>
              </li>
              <li>
                <Link className="text-slate-300 hover:text-white" to="/contact">
                  {m.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-white">{m.footer.contact}</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 p-1.5" aria-hidden>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
                  </svg>
                </span>
                <a
                  href="tel:+9647818220220"
                  className="hover:text-white"
                  dir="ltr"
                >
                  +9647818220220
                </a>
                <a
                  href="tel:+9647718220220"
                  className="hover:text-white"
                  dir="ltr"
                >
                  +9647718220220
                </a>
              </li>
              <li className="pt-1">
                <p className="text-sm font-bold text-white mb-3">
                  {m.footer.socialFollow}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={URGEN_SOCIAL_LINKS.whatsapp}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={socialIconClass}
                    aria-label={m.footer.socialWhatsApp}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </a>
                  <a
                    href={URGEN_SOCIAL_LINKS.telegram}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={socialIconClass}
                    aria-label={m.footer.socialTelegram}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>
                  <a
                    href={URGEN_SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={socialIconClass}
                    aria-label={m.footer.socialFacebook}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href={URGEN_SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={socialIconClass}
                    aria-label={m.footer.socialInstagram}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881.001 1.44 1.44 0 012.881-.001z" />
                    </svg>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-400 sm:flex-row">
          <p>
            <span className="text-xl justify-end">©</span>{" "}
            {new Date().getFullYear()} URGEN Laboratory. {m.footer.rights}
          </p>
          <p className="text-center sm:text-end">{m.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
