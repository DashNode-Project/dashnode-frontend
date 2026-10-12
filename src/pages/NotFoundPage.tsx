import { Link } from 'react-router';
import { Logo } from '@/components/ui/Logo';

export function NotFoundPage() {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <Logo />
      <h1 className="text-2xl font-bold">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-[#9CA3AF]">
        La dirección solicitada no existe o ya no está disponible.
      </p>
      <Link to="/" className="text-sm font-medium text-blue-400 underline hover:text-blue-300">
        Volver al inicio
      </Link>
    </main>
  );
}
