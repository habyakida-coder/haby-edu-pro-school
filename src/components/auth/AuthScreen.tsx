import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, School as SchoolIcon, Loader2, User, KeyRound, ShieldAlert, Sparkles, CheckCircle2, ShieldCheck, Info } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, loginAsDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states - defaulted to requested admin user credentials
  const [email, setEmail] = useState('admin@haby.com');
  const [password, setPassword] = useState('Haby123456');

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(err.message || 'Google Sign-in failed. Please try again or use email sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0f2948] to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2948] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="w-16 h-16 bg-blue-500/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-400/30 shadow-inner">
            <SchoolIcon className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">HabyEduPro</h1>
          <p className="text-blue-200 text-xs mt-1 font-medium">School Management, Timetable & NECTA O-Level Ledger</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[11px] text-emerald-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Firebase: habyedupro
          </div>
        </div>

        <div className="p-7 space-y-5">
          {/* Quick 1-Click Direct Access for Admin (admin@haby.com) */}
          <div className="space-y-1.5">
            <button
              type="button"
              id="quick-admin-login"
              onClick={() => signInWithEmail('admin@haby.com', 'Haby123456')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-blue-500/40 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Ingia kama Admin (admin@haby.com)</span>
            </button>
            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-center text-xs text-blue-900">
              Barua Pepe: <strong className="font-black text-blue-950">admin@haby.com</strong><br />
              Nenosiri: <strong className="font-black text-blue-950">Haby123456</strong>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[11px] uppercase font-bold tracking-wider">Au Ingia kwa Barua Pepe Yoyote</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-900">Sign-in Notice</p>
                <p className="mt-0.5 text-rose-700 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@haby.com');
                      setPassword('Haby123456');
                    }}
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    admin@haby.com
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('habibuakida@gmail.com');
                      setPassword('Haby123456');
                    }}
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    habibuakida
                  </button>
                </div>
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-slate-800"
                  placeholder="admin@haby.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block tracking-wider">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-slate-800"
                  placeholder="Haby123456"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to System
                </>
              )}
            </button>
          </form>

          {/* Central Governance Policy Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">School & Member Registration Policy:</span>
              <p className="mt-0.5 leading-relaxed text-slate-500">
                All school registrations are authorized centrally by the Super Admin. School administrators register their teachers and assign login passwords in their admin settings.
              </p>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-7 -mb-7 p-5 rounded-b-2xl">
            <div className="flex items-center gap-1.5 mb-2.5 text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Access Role Switch</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="demo-headmaster-btn"
                onClick={() => loginAsDemo('HEADMASTER')}
                className="px-2.5 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition shadow-xs group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700">Dr. Habibu</div>
                <div className="text-[9px] text-slate-500">Super Admin</div>
              </button>
              <button
                type="button"
                id="demo-academic-btn"
                onClick={() => loginAsDemo('ACADEMIC')}
                className="px-2.5 py-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-lg text-left transition shadow-xs group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700">Academic</div>
                <div className="text-[9px] text-slate-500">Academic Master</div>
              </button>
              <button
                type="button"
                id="demo-teacher-btn"
                onClick={() => loginAsDemo('TEACHER')}
                className="px-2.5 py-2 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-left transition shadow-xs group cursor-pointer"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-purple-700">Teacher</div>
                <div className="text-[9px] text-slate-500">Subject Marks Only</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

