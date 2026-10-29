import { Layers } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { PATHS } from '@/app/paths';

const PRODUCT_LINKS: { label: string; target: 'features' | 'mvps' | 'traceability' | null }[] = [
  { label: 'Capacidades', target: 'features' },
  { label: 'MVPs', target: 'mvps' },
  { label: 'Trazabilidad', target: 'traceability' },
  { label: 'Seguridad', target: null },
];

interface LandingFooterProps {
  /** When on the landing page, scroll to sections; otherwise navigate home first. */
  onLanding?: boolean;
}

export function LandingFooter({ onLanding = false }: LandingFooterProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function goToSection(id: string) {
    if (onLanding || pathname === PATHS.landing) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(PATHS.landing, { state: { scrollTo: id } });
  }

  return (
    <footer className="border-t border-white/6 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500">
                <Layers size={13} className="text-white" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold">DashNode</span>
            </div>
            <p className="text-xs leading-relaxed text-[#6B7280]">
              Plataforma inteligente para gestión y seguimiento de proyectos de software.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#F9FAFB]">
              Producto
            </p>
            <ul className="flex flex-col gap-2 text-xs">
              {PRODUCT_LINKS.map(({ label, target }) =>
                target ? (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => goToSection(target)}
                      className="cursor-pointer text-[#6B7280] transition-colors hover:text-[#9CA3AF]"
                    >
                      {label}
                    </button>
                  </li>
                ) : (
                  <li key={label} className="text-[#6B7280]">
                    {label}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#F9FAFB]">
              Equipo
            </p>
            <ul className="flex flex-col gap-2 text-xs text-[#6B7280]">
              {['Andrey Quiceno', 'Jhorman Gómez', 'Iván Ausecha', 'David Enciso'].map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#F9FAFB]">
              Institución
            </p>
            <ul className="flex flex-col gap-2 text-xs text-[#6B7280]">
              <li>Universidad del Valle</li>
              <li>Ingeniería de Sistemas y Computación</li>
              <li>Proyecto Integrador II</li>
              <li>v1.0 conceptual</li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/6 pt-6">
          <p className="text-xs text-[#6B7280]">© 2026 DashNode · Universidad del Valle</p>
          <Link
            to={PATHS.about}
            className="text-xs text-[#6B7280] transition-colors hover:text-[#9CA3AF]"
          >
            Acerca del proyecto
          </Link>
        </div>
      </div>
    </footer>
  );
}
