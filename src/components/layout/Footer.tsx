import { Link } from "react-router-dom";
import { useLocaleContext } from "../../i18n/useLocaleContext";
import { Logo } from "../Logo";

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
              <Logo light large />
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
                <Link className="text-slate-300 hover:text-white" to="/technology">
                  {m.nav.technology}
                </Link>
              </li>
              <li>
                <Link className="text-slate-300 hover:text-white" to="/book">
                  {m.bookPage.eyebrow}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-white">{m.footer.contact}</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
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
              <li className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 p-1.5" aria-hidden>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881.001 1.44 1.44 0 012.881-.001z" />
                  </svg>
                </span>
                <a
                  href="https://www.instagram.com/urgenlaboratory?igsh=bjhsN2pncGJ5MXBu"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-white"
                >
                  @urgenlaboratory
                </a>
              </li>
            </ul>
            <div className="mt-6 flex items-center gap-4">
              <div className="rounded-xl bg-white p-2 shadow-inner">
                <img
                  src="/qr-placeholder.svg"
                  alt=""
                  width={88}
                  height={88}
                  className="block"
                />
              </div>
              <p className="max-w-40 text-xs leading-relaxed text-slate-400">
                {m.footer.qrHint}
              </p>
            </div>
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
