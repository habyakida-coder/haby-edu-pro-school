import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Award, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Settings as SettingsIcon,
  Download,
  LogOut,
  User,
  Shield,
  CalendarCheck,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  UserPlus,
  RotateCw,
  Save,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';
import { SchoolInfo, UserAccount } from '../types';

export type ActiveView = 
  | 'dashboard'
  | 'students'
  | 'results'
  | 'examrecords'
  | 'lessonplans'
  | 'attendance'
  | 'discipline'
  | 'studentid'
  | 'exams'
  | 'teachers'
  | 'timetable'
  | 'invigilation'
  | 'settings'
  | 'markentry';

interface NavigationProps {
  activeView: ActiveView;
  schoolInfo: SchoolInfo;
  onSelectView: (view: ActiveView) => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  saveStatus?: 'saving' | 'saved' | 'offline' | 'error';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  schoolInfo,
  onSelectView,
  currentUser,
  onLogout,
  saveStatus = 'saved'
}) => {
  const isTeacher = currentUser?.role === 'TEACHER';

  const navItems = ([
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Registration', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'results', label: 'Academic', icon: <Award className="w-4 h-4" /> },
    { id: 'examrecords', label: 'Exam Records', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'lessonplans', label: 'Lesson Plans', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'discipline', label: 'Discipline', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'studentid', label: 'Student ID', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'exams', label: 'Exams', icon: <FileText className="w-4 h-4" /> },
    { id: 'teachers', label: 'Teachers', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable', icon: <Calendar className="w-4 h-4" /> },
    { id: 'invigilation', label: 'Invigilation', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'markentry', label: 'Mark Entry', icon: <CheckCircle2 className="w-4 h-4" /> }
  ] as { id: ActiveView; label: string; icon: React.ReactNode }[]).filter(item => {
    if (isTeacher) {
      return (['markentry', 'lessonplans', 'results', 'examrecords', 'attendance', 'timetable', 'discipline', 'dashboard'] as ActiveView[]).includes(item.id);
    }
    return true;
  });

  return (
    <header className="space-y-3 mb-6">
      {/* Top Banner */}
      <div className="bg-[#1f4d8b] text-white rounded-xl px-6 py-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-900">
        <div className="flex items-center gap-3.5">
          {schoolInfo.logo ? (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white p-1 shadow-md border-2 border-amber-400 flex items-center justify-center shrink-0 overflow-hidden">
              <img src={schoolInfo.logo} alt={schoolInfo.name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-800 text-amber-300 flex items-center justify-center font-black text-xl border-2 border-amber-400 shadow-sm shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {schoolInfo.name || 'HABY EDU PRO'}
              </h1>
              {schoolInfo.schoolNumber && (
                <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
                  CTR: {schoolInfo.schoolNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-blue-200 mt-0.5 font-medium">
              {schoolInfo.motto || 'Comprehensive School Management & Academic Scheduling System'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* User Authentication Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-xs bg-white/10 border-white/15">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shadow-2xs bg-emerald-400 text-slate-900">
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                </span>
                <div className="text-left leading-none">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{currentUser.fullName}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      currentUser.isSuperAdmin && currentUser.email?.toLowerCase() === 'habibuakida@gmail.com'
                        ? 'text-amber-300 bg-amber-950/60 border-amber-500/30' 
                        : 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30'
                    }`}>
                      {currentUser.isSuperAdmin && currentUser.email?.toLowerCase() === 'habibuakida@gmail.com' ? 'Super Admin' : currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-200 font-mono mt-0.5">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              {!currentUser.isSuperAdmin && (
                <div className="ml-3 hidden lg:flex items-center gap-2 border-l border-white/20 pl-3">
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-blue-300 uppercase tracking-tighter">Support Admin</div>
                    <div className="text-[10px] font-bold text-white leading-tight">habibuakida@gmail.com</div>
                  </div>
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                </div>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out of current user session"
                  className="ml-1 p-1 text-blue-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : null}

          {/* Live Sync Status */}
          {saveStatus === 'saving' && (
            <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cloud Synced</span>
            </span>
          )}
          {saveStatus === 'offline' && (
            <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Save className="w-3.5 h-3.5 text-sky-300" />
              <span>Saved Locally</span>
            </span>
          )}

          <span className="bg-white/10 text-blue-200 border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold">
            v2.0 Active
          </span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex flex-wrap gap-1.5 p-2 rounded-xl border shadow-xs bg-white border-slate-200">
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1f4d8b] text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
