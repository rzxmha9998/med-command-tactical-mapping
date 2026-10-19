import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  Loader2,
  LogIn,
  UserPlus,
  Radio,
  MapPin,
  Crosshair,
  Activity,
  Cpu,
  Wifi,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live telemetry mock simulation ticker for high-tech tactical realism
  const [telemetryTick, setTelemetryTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTick((prev) => (prev + 1) % 1000);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk menggunakan akun Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else {
        if (!displayName.trim()) {
          setErrorMsg('Nama lengkap wajib diisi untuk pendaftaran petugas.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email.trim(), password, displayName.trim());
      }
    } catch (err: any) {
      let msg = err.message || 'Terjadi kesalahan autentikasi.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Email atau kata sandi tidak cocok.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email ini sudah terdaftar. Silakan gunakan opsi Masuk.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Kata sandi minimal 6 karakter.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050F1D] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* 1. Tactical Radar Sweep Animation (Background) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-35">
        {/* Concentric Range Rings */}
        <div className="w-[850px] h-[850px] rounded-full border border-[#2A9D8F]/20 relative flex items-center justify-center">
          <div className="w-[650px] h-[650px] rounded-full border border-[#2A9D8F]/30 flex items-center justify-center">
            <div className="w-[450px] h-[450px] rounded-full border border-[#2A9D8F]/40 flex items-center justify-center">
              <div className="w-[250px] h-[250px] rounded-full border border-[#2A9D8F]/50 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#2A9D8F]/60 animate-ping" />
              </div>
            </div>
          </div>

          {/* Crosshair Axes */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#2A9D8F]/30 to-transparent" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-[#2A9D8F]/30 to-transparent" />

          {/* Rotating Conic Radar Sweep Beam */}
          <div
            className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(42, 157, 143, 0.35) 0deg, rgba(42, 157, 143, 0.08) 45deg, transparent 60deg, transparent 360deg)',
            }}
          />
        </div>
      </div>

      {/* 2. Cyber HUD Laser Scanline */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#2A9D8F] to-transparent shadow-[0_0_20px_#2A9D8F] animate-hud-scan absolute" />
      </div>

      {/* 3. Floating Tactical GPS Beacon Nodes */}
      <div className="absolute top-12 left-12 hidden lg:flex items-center gap-2 text-[10px] font-mono text-[#2A9D8F]/80">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>NODE [JKT-MONAS-RING1]: ACTIVE</span>
      </div>
      <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-2 text-[10px] font-mono text-[#2A9D8F]/80">
        <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>SATELLITE TELEMETRY: 12 BARS // L1/L5 GNSS LOCK</span>
      </div>
      <div className="absolute top-12 right-12 hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-400">
        <Lock className="w-3.5 h-3.5 text-[#2A9D8F]" />
        <span>FIREBASE SECURE PROTOCOL v9.2</span>
      </div>

      {/* 4. Main Login Container */}
      <div className="w-full max-w-md bg-[#071629]/95 backdrop-blur-2xl border border-[#1E3A5F] hover:border-[#2A9D8F]/60 transition-all duration-500 rounded-3xl shadow-[0_0_50px_rgba(7,22,41,0.9)] overflow-hidden relative z-10">
        {/* Glowing Top Edge Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#14365f] via-[#2A9D8F] to-[#14365f]" />

        {/* Header Section */}
        <div className="p-6 sm:p-7 text-center border-b border-[#1E3A5F]/80 bg-gradient-to-b from-[#0B2342]/80 to-[#071629]">
          {/* Animated Tactical Emblem */}
          <div className="relative w-16 h-16 mx-auto mb-3">
            <div className="absolute inset-0 rounded-2xl bg-[#2A9D8F]/20 animate-tactical-pulse blur-sm" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#2A9D8F] to-[#071629] border border-[#2A9D8F] flex items-center justify-center shadow-[0_0_30px_rgba(42,157,143,0.5)]">
              <Shield className="w-8 h-8 text-white drop-shadow" />
              <Crosshair className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white font-mono uppercase">
            MED-COMMAND
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="h-px w-6 bg-[#2A9D8F]/50" />
            <p className="text-[11px] text-[#2A9D8F] font-mono tracking-widest uppercase font-bold">
              TACTICAL MEDICAL MAPPING
            </p>
            <span className="h-px w-6 bg-[#2A9D8F]/50" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 max-w-xs mx-auto">
            Sistem Komando Operasional Ambulans, Motor Medis, dan Zona Risiko
          </p>

          {/* Telemetry Status Strip */}
          <div className="mt-3 py-1 px-2.5 rounded-full bg-[#0B2342] border border-[#1E3A5F] flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5 text-emerald-400" />
              <span>ONLINE</span>
            </span>
            <span>SEC_LVL: LEVEL-4</span>
            <span className="text-[#2A9D8F]">TICK: {String(telemetryTick).padStart(4, '0')}</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-7 space-y-4">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Google Sign In */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] disabled:opacity-60 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk Cepat dengan Akun Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-[#1E3A5F]" />
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
              atau autentikasi kredensial
            </span>
            <div className="flex-1 h-px bg-[#1E3A5F]" />
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#050F1D] rounded-xl border border-[#1E3A5F] text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-lg font-bold transition-all ${
                mode === 'login'
                  ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-lg font-bold transition-all ${
                mode === 'register'
                  ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daftar Petugas
            </button>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold flex items-center justify-between">
                  <span>Nama Lengkap Petugas</span>
                  <span className="text-[10px] text-slate-500 font-mono">Wajib</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="cth: Dr. Rian Pratama"
                    className="w-full bg-[#050F1D] border border-[#1E3A5F] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#2A9D8F] focus:ring-1 focus:ring-[#2A9D8F]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Alamat Email</span>
                <span className="text-[10px] text-slate-500 font-mono">Firebase Auth</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@medcommand.id atau email Anda"
                  className="w-full bg-[#050F1D] border border-[#1E3A5F] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#2A9D8F] focus:ring-1 focus:ring-[#2A9D8F]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Kata Sandi (Password)</span>
                <span className="text-[10px] text-slate-500 font-mono">Min. 6 Karakter</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full bg-[#050F1D] border border-[#1E3A5F] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#2A9D8F] focus:ring-1 focus:ring-[#2A9D8F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2A9D8F]/25 hover:shadow-[#2A9D8F]/50 disabled:opacity-60 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Autentikasi...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke Pusat Komando</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Akun Petugas</span>
                </>
              )}
            </button>
          </form>

          {/* Role Architecture Notice */}
          <div className="p-3 bg-[#050F1D] rounded-xl border border-[#1E3A5F] text-[11px] text-slate-400 space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs mb-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Otorisasi & Hak Akses:</span>
            </div>
            <p>
              &bull; <strong className="text-amber-400">ADMIN:</strong> Akses penuh membuat banyak peta, menambah unit & zona risiko, mengunggah foto ambulans & logo header.
            </p>
            <p>
              &bull; <strong className="text-[#2A9D8F]">PETUGAS:</strong> Mengakses peta yang ditugaskan, memplot/memperbarui posisi unit di lapangan secara real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
