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
  BookOpen,
  Smartphone,
  Phone,
  Grid,
  Wallet,
  X,
  Menu
} from 'lucide-react';
import { SchoolInfo, UserAccount } from '../types';
import { HabyEduProLogo } from './common/HabyEduProLogo';

export type ActiveView = 
  | 'dashboard'
  | 'students'
  | 'results'
  | 'examrecords'
  | 'nectaanalyzer'
  | 'sittingplan'
  | 'finance'
  | 'sms'
  | 'schemes'
  | 'lessonplans'
  | 'attendance'
  | 'discipline'
  | 'studentid'
  | 'exams'
  | 'teachers'
  | 'timetable'
  | 'invigilation'
  | 'settings'
  | 'markentry'
  | 'dailytracker'
  | 'evaluationanalysis'
  | 'remedialtimetable'
  | 'remedialdaily'
  | 'remedialanalyzer'
  | 'parentportal';

interface NavigationProps {
  activeView: ActiveView;
  schoolInfo: SchoolInfo;
  onSelectView: (view: ActiveView) => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  saveStatus?: 'saving' | 'saved' | 'offline' | 'error';
  layout?: 'vertical' | 'horizontal';
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  schoolInfo,
  onSelectView,
  currentUser,
  onLogout,
  saveStatus = 'saved',
  layout = 'horizontal',
  isMobileOpen = false,
  onMobileClose
}) => {
  const isTeacher = currentUser?.role === 'TEACHER';

  const navItems = ([
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Registration', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'results', label: 'Academic', icon: <Award className="w-4 h-4" /> },
    { id: 'examrecords', label: 'Exam Records', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'nectaanalyzer', label: 'NECTA Analyzer', icon: <Award className="w-4 h-4 text-amber-400" /> },
    { id: 'sittingplan', label: 'Sitting Plan', icon: <Grid className="w-4 h-4 text-sky-400" /> },
    { id: 'finance', label: 'SaaS Finance', icon: <Wallet className="w-4 h-4 text-emerald-400" /> },
    { id: 'sms', label: 'SMS Module', icon: <Smartphone className="w-4 h-4 text-emerald-400" /> },
    { id: 'schemes', label: 'Scheme of Work', icon: <FileText className="w-4 h-4" /> },
    { id: 'lessonplans', label: 'Lesson Plans', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'discipline', label: 'Discipline', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'studentid', label: 'Student ID', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'exams', label: 'Exams', icon: <FileText className="w-4 h-4" /> },
    { id: 'teachers', label: 'Teachers', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable', icon: <Calendar className="w-4 h-4" /> },
    { id: 'invigilation', label: 'Invigilation', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'markentry', label: 'Mark Entry', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'dailytracker', label: 'Daily Tracker', icon: <CalendarCheck className="w-4 h-4 text-emerald-400" /> },
    { id: 'evaluationanalysis', label: 'Evaluation Analysis', icon: <Award className="w-4 h-4 text-amber-400" /> },
    { id: 'remedialtimetable', label: 'Remedial Table', icon: <Calendar className="w-4 h-4 text-indigo-400" /> },
    { id: 'remedialdaily', label: 'Remedial Ticker', icon: <CheckCircle2 className="w-4 h-4 text-rose-400" /> },
    { id: 'remedialanalyzer', label: 'Remedial Pay', icon: <Wallet className="w-4 h-4 text-emerald-400" /> },
    { id: 'parentportal', label: 'Parent Portal', icon: <Phone className="w-4 h-4 text-sky-400" /> }
  ] as { id: ActiveView; label: string; icon: React.ReactNode }[]).filter(item => {
    // Teachers have access to academic, planning, records, sitting plans, and timetable tools
    if (isTeacher) {
      return ([
        'dashboard', 
        'students', 
        'results', 
        'examrecords', 
        'nectaanalyzer',
        'sittingplan',
        'sms',
        'schemes', 
        'lessonplans', 
        'attendance', 
        'timetable', 
        'invigilation', 
        'discipline', 
        'markentry',
        'dailytracker',
        'evaluationanalysis',
        'remedialtimetable',
        'remedialdaily',
        'remedialanalyzer'
      ] as ActiveView[]).includes(item.id);
    }
    return true;
  });

  const handleItemClick = (id: ActiveView) => {
    onSelectView(id);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <aside className={layout === 'vertical' 
      ? `h-screen bg-[#0f2948] text-white w-72 lg:w-64 fixed left-0 top-0 flex flex-col border-r border-white/10 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }` 
      : 'space-y-3 mb-6'
    }>
      {/* Sidebar Brand / Header */}
      <div className={layout === 'vertical' ? 'p-4 sm:p-5 border-b border-white/10 flex items-center justify-between' : 'bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between'}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 bg-white/10 rounded-xl shrink-0">
            <HabyEduProLogo variant="icon" size="sm" className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={`font-black tracking-tight truncate ${layout === 'vertical' ? 'text-sm text-white' : 'text-lg text-[#1f4d8b]'}`} title={schoolInfo.name || 'HABY EDU PRO'}>
              {schoolInfo.name || 'HABY EDU PRO'}
            </h1>
            <p className={`text-[9px] font-bold uppercase tracking-wider truncate ${layout === 'vertical' ? 'text-blue-300' : 'text-slate-400'}`}>
              Management System
            </p>
          </div>
        </div>

        {layout === 'vertical' && onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0 ml-1"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {layout !== 'vertical' && (
          <div className="flex items-center gap-4">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 animate-pulse">
                <RotateCw className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-black uppercase">Saving...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                <Save className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase">Synced</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Navigation Tabs */}
      <nav className={layout === 'vertical' 
        ? 'flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto custom-scrollbar' 
        : 'flex flex-wrap gap-1.5 p-2 rounded-xl border shadow-xs bg-white border-slate-200'
      }>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                isActive
                  ? (layout === 'vertical' ? 'bg-white text-[#0f2948] shadow-lg font-black' : 'bg-[#1f4d8b] text-white shadow-xs')
                  : (layout === 'vertical' ? 'text-blue-100 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }`}
            >
              <span className={`transition-colors shrink-0 ${isActive ? (layout === 'vertical' ? 'text-[#0f2948]' : 'text-white') : (layout === 'vertical' ? 'text-blue-300 group-hover:text-white' : 'text-slate-400')}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer / User Profile */}
      {layout === 'vertical' && (
        <div className="p-3.5 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
              <User className="w-5 h-5 text-blue-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{currentUser?.fullName || 'User'}</p>
              <p className="text-[10px] text-blue-300 font-bold uppercase truncate">{currentUser?.role || 'Staff'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 uppercase">
                  <RotateCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Saving</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 uppercase">
                  <Save className="w-2.5 h-2.5" />
                  <span>Synced</span>
                </div>
              )}
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border border-rose-500/30"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
