import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, School as SchoolIcon, Loader2, User, KeyRound, ShieldAlert, Sparkles, CheckCircle2, ShieldCheck, Info } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, loginAsDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cloud Database Connected
          </div>
        </div>

        <div className="p-7 space-y-5">
          {/* Primary Google Login Button */}
          <div className="space-y-2">
            <button
              type="button"
              id="google-signin-btn"
              onClick={handleGoogleClick}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl font-semibold text-sm shadow-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
            <p className="text-center text-[11px] text-slate-500">Sign in with your authorized school Google account</p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-xs uppercase font-bold tracking-wider">Or Sign In with Email</span>
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
              <label className="text-[10px] font-black text-slate-600 uppercase mb-1 block tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium text-slate-800"
                  placeholder="e.g. habibuakida@gmail.com or staff@school.tz"
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
                  placeholder="Enter your assigned password"
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

