import React, { useState } from 'react';
import { Eye, EyeOff, Layers, AlertCircle, ArrowLeft } from 'lucide-react';
import { useApp } from '../store';
import { Button, Input } from '../components/ui';

type Mode = 'login' | 'register';

export default function Login() {
  const { login, navigate, dispatch, state } = useApp();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNick, setRegNick] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regErr, setRegErr] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Ingresa tu correo.'); return; }
    if (!password) { setError('Ingresa tu contraseña.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(email, password);
    setLoading(false);
    if (!result.success) setError(result.error ?? 'Error de autenticación.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErr('');
    if (!regName || !regLast || !regEmail || !regNick || !regPass) { setRegErr('Todos los campos son obligatorios.'); return; }
    if (state.users.find(u => u.email.toLowerCase() === regEmail.toLowerCase())) { setRegErr('Ya existe una cuenta con ese correo.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const newUser = {
      id: `u${Date.now()}`,
      name: regName, lastName: regLast, email: regEmail, nickname: regNick,
      role: 'manager' as const, status: 'active' as const,
      skills: [], projectIds: [],
      lastActivity: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_USER', user: newUser });
    // Store password conceptually - in real app this would be hashed
    setLoading(false);
    setMode('login');
    setEmail(regEmail);
    dispatch({ type: 'SHOW_TOAST', message: 'Cuenta creada. Inicia sesión para continuar.', toastType: 'success' });
  };

  const demoAccounts = [
    { email: 'andrey@dashnode.dev', password: 'admin123', role: 'Administrador' },
    { email: 'jhorman@dashnode.dev', password: 'manager123', role: 'Gerente' },
    { email: 'ivan@dashnode.dev', password: 'dev123', role: 'Desarrollador' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0E] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-[#070809] border-r border-white/6 p-10">
        <div>
          <button onClick={() => navigate({ page: 'landing' })} className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Layers size={17} className="text-white" />
            </div>
            <span className="font-bold text-[#F9FAFB]">DashNode</span>
          </button>
          <h2 className="text-2xl font-bold text-[#F9FAFB] leading-tight mb-4">
            Gestión inteligente de proyectos de software
          </h2>
          <p className="text-[#9CA3AF] text-sm leading-relaxed mb-8">
            Centraliza tu equipo, backlog, sprints, reuniones y diagnóstico con IA en una plataforma profesional.
          </p>
          <div className="flex flex-col gap-3">
            {['Proyectos, épicas y sprints', 'Disponibilidad y agendamiento', 'Tablero Kanban y métricas', 'IA multimodal y RAG'].map(f => (
              <div key={f} className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-[#6B7280] mb-4 font-medium uppercase tracking-wide">Cuentas de demostración</p>
          <div className="flex flex-col gap-2">
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                onClick={() => { setEmail(acc.email); setPassword(acc.password); setMode('login'); }}
                className="flex items-center justify-between bg-[#12131C] border border-white/6 hover:border-white/12 rounded-lg px-4 py-2.5 text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-semibold text-[#F9FAFB]">{acc.role}</p>
                  <p className="text-xs text-blue-400 font-mono">{acc.email}</p>
                </div>
                <span className="text-xs text-[#6B7280] group-hover:text-[#9CA3AF]">Usar →</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <button
            onClick={() => navigate({ page: 'landing' })}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#9CA3AF] transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Volver al inicio
          </button>

          <div className="flex gap-1 mb-8 bg-[#12131C] rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 h-8 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-[#1E1F2B] text-[#F9FAFB]' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 h-8 rounded-md text-sm font-medium transition-colors ${mode === 'register' ? 'bg-[#1E1F2B] text-[#F9FAFB]' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`}
            >
              Registro de Gerente
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <h1 className="text-xl font-bold text-[#F9FAFB] mb-1">Bienvenido</h1>
              <p className="text-sm text-[#9CA3AF] mb-6">Ingresa con tus credenciales de acceso.</p>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#F9FAFB]">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-[#1E1F2B] border border-white/10 rounded-md h-9 px-3 pr-10 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#9CA3AF]"
                      aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2.5">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                <Button type="submit" loading={loading} className="w-full mt-1">
                  Iniciar sesión
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#F9FAFB] mb-1">Registro de Gerente</h1>
              <p className="text-sm text-[#9CA3AF] mb-6">Crea tu cuenta para gestionar proyectos.</p>
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nombre" placeholder="Nombre" value={regName} onChange={e => setRegName(e.target.value)} />
                  <Input label="Apellido" placeholder="Apellido" value={regLast} onChange={e => setRegLast(e.target.value)} />
                </div>
                <Input label="Correo electrónico" type="email" placeholder="tu@correo.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                <Input label="Nickname" placeholder="@tuusuario" value={regNick} onChange={e => setRegNick(e.target.value)} hint="Sin espacios ni caracteres especiales." />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#F9FAFB]">Contraseña inicial</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={regPass}
                      onChange={e => setRegPass(e.target.value)}
                      className="w-full bg-[#1E1F2B] border border-white/10 rounded-md h-9 px-3 pr-10 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]" aria-label="Toggle">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-xs text-[#6B7280]">Se te pedirá cambiarla en el primer acceso.</p>
                </div>
                {regErr && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2.5">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{regErr}</p>
                  </div>
                )}
                <Button type="submit" loading={loading} className="w-full mt-1">
                  Crear cuenta de Gerente
                </Button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/6 lg:hidden">
            <p className="text-xs text-[#6B7280] mb-3">Cuentas demo:</p>
            {demoAccounts.map(acc => (
              <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword(acc.password); setMode('login'); }}
                className="w-full flex items-center justify-between text-xs py-1.5 text-left group">
                <span className="text-[#6B7280]">{acc.role}:</span>
                <span className="text-blue-400 font-mono group-hover:text-blue-300">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
