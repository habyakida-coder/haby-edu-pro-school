import React, { useRef } from 'react';
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
  Menu,
  Activity,
  Sparkles,
  ChevronLeft,
  ChevronRight
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
  | 'classjournal'
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
  layout?: 'horizontal' | 'vertical';
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onStartTour?: () => void;
}

interface NavItemMeta {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  activeBg: string;
  hoverBg: string;
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
  onMobileClose,
  onStartTour
}) => {
  const isTeacher = currentUser?.role === 'TEACHER';

  // Comprehensive list with UNIQUE VIBRANT COLOR for each single menu item
  const allNavItems: NavItemMeta[] = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: <LayoutDashboard className="w-4 h-4" />,
      iconColor: 'text-blue-500',
      activeBg: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
      hoverBg: 'hover:bg-blue-50 text-slate-700 hover:text-blue-700'
    },
    {
      id: 'students',
      label: 'Registration',
      icon: <UserPlus className="w-4 h-4" />,
      iconColor: 'text-emerald-500',
      activeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
      hoverBg: 'hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
    },
    {
      id: 'results',
      label: 'Academic / Results',
      icon: <Award className="w-4 h-4" />,
      iconColor: 'text-purple-500',
      activeBg: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
      hoverBg: 'hover:bg-purple-50 text-slate-700 hover:text-purple-700'
    },
    {
      id: 'markentry',
      label: 'Mark Entry',
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: 'text-teal-500',
      activeBg: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
      hoverBg: 'hover:bg-teal-50 text-slate-700 hover:text-teal-700'
    },
    {
      id: 'examrecords',
      label: 'Exam Records',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      iconColor: 'text-indigo-500',
      activeBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      hoverBg: 'hover:bg-indigo-50 text-slate-700 hover:text-indigo-700'
    },
    {
      id: 'nectaanalyzer',
      label: 'NECTA Analyzer',
      icon: <Award className="w-4 h-4" />,
      iconColor: 'text-amber-500',
      activeBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
      hoverBg: 'hover:bg-amber-50 text-slate-700 hover:text-amber-800'
    },
    {
      id: 'sittingplan',
      label: 'Sitting Plan',
      icon: <Grid className="w-4 h-4" />,
      iconColor: 'text-sky-500',
      activeBg: 'bg-sky-600 text-white shadow-md shadow-sky-600/30',
      hoverBg: 'hover:bg-sky-50 text-slate-700 hover:text-sky-700'
    },
    {
      id: 'finance',
      label: 'SaaS Finance',
      icon: <Wallet className="w-4 h-4" />,
      iconColor: 'text-emerald-600',
      activeBg: 'bg-[#0d9488] text-white shadow-md shadow-teal-600/30',
      hoverBg: 'hover:bg-teal-50 text-slate-700 hover:text-teal-800'
    },
    {
      id: 'sms',
      label: 'SMS Module',
      icon: <Smartphone className="w-4 h-4" />,
      iconColor: 'text-rose-500',
      activeBg: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
      hoverBg: 'hover:bg-rose-50 text-slate-700 hover:text-rose-700'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: <CalendarCheck className="w-4 h-4" />,
      iconColor: 'text-green-600',
      activeBg: 'bg-green-600 text-white shadow-md shadow-green-600/30',
      hoverBg: 'hover:bg-green-50 text-slate-700 hover:text-green-700'
    },
    {
      id: 'timetable',
      label: 'Timetable',
      icon: <Calendar className="w-4 h-4" />,
      iconColor: 'text-indigo-600',
      activeBg: 'bg-indigo-700 text-white shadow-md shadow-indigo-700/30',
      hoverBg: 'hover:bg-indigo-50 text-slate-700 hover:text-indigo-800'
    },
    {
      id: 'classjournal',
      label: 'Shajara ya Darasa (Class Journal)',
      icon: <BookOpen className="w-4 h-4" />,
      iconColor: 'text-amber-600',
      activeBg: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
      hoverBg: 'hover:bg-amber-50 text-slate-700 hover:text-amber-800'
    },
    {
      id: 'teachers',
      label: 'Teachers & Staff',
      icon: <GraduationCap className="w-4 h-4" />,
      iconColor: 'text-cyan-600',
      activeBg: 'bg-cyan-700 text-white shadow-md shadow-cyan-700/30',
      hoverBg: 'hover:bg-cyan-50 text-slate-700 hover:text-cyan-800'
    },
    {
      id: 'exams',
      label: 'Exams Setup',
      icon: <FileText className="w-4 h-4" />,
      iconColor: 'text-amber-600',
      activeBg: 'bg-amber-600 text-white shadow-md shadow-amber-600/30',
      hoverBg: 'hover:bg-amber-50 text-slate-700 hover:text-amber-800'
    },
    {
      id: 'invigilation',
      label: 'Invigilation',
      icon: <ShieldCheck className="w-4 h-4" />,
      iconColor: 'text-slate-600',
      activeBg: 'bg-slate-800 text-white shadow-md shadow-slate-800/30',
      hoverBg: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
    },
    {
      id: 'schemes',
      label: 'Scheme of Work',
      icon: <FileText className="w-4 h-4" />,
      iconColor: 'text-teal-600',
      activeBg: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
      hoverBg: 'hover:bg-teal-50 text-slate-700 hover:text-teal-700'
    },
    {
      id: 'lessonplans',
      label: 'Lesson Plans',
      icon: <BookOpen className="w-4 h-4" />,
      iconColor: 'text-violet-600',
      activeBg: 'bg-violet-600 text-white shadow-md shadow-violet-600/30',
      hoverBg: 'hover:bg-violet-50 text-slate-700 hover:text-violet-700'
    },
    {
      id: 'discipline',
      label: 'Discipline',
      icon: <ShieldAlert className="w-4 h-4" />,
      iconColor: 'text-red-500',
      activeBg: 'bg-red-600 text-white shadow-md shadow-red-600/30',
      hoverBg: 'hover:bg-red-50 text-slate-700 hover:text-red-700'
    },
    {
      id: 'studentid',
      label: 'Student ID',
      icon: <CreditCard className="w-4 h-4" />,
      iconColor: 'text-fuchsia-500',
      activeBg: 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30',
      hoverBg: 'hover:bg-fuchsia-50 text-slate-700 hover:text-fuchsia-700'
    },
    {
      id: 'dailytracker',
      label: 'Daily Tracker',
      icon: <CalendarCheck className="w-4 h-4" />,
      iconColor: 'text-lime-600',
      activeBg: 'bg-lime-700 text-white shadow-md shadow-lime-700/30',
      hoverBg: 'hover:bg-lime-50 text-slate-700 hover:text-lime-800'
    },
    {
      id: 'evaluationanalysis',
      label: 'Evaluation Analysis',
      icon: <Award className="w-4 h-4" />,
      iconColor: 'text-orange-500',
      activeBg: 'bg-orange-600 text-white shadow-md shadow-orange-600/30',
      hoverBg: 'hover:bg-orange-50 text-slate-700 hover:text-orange-700'
    },
    {
      id: 'remedialtimetable',
      label: 'Remedial Table',
      icon: <Calendar className="w-4 h-4" />,
      iconColor: 'text-indigo-600',
      activeBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30',
      hoverBg: 'hover:bg-indigo-50 text-slate-700 hover:text-indigo-700'
    },
    {
      id: 'remedialdaily',
      label: 'Remedial Ticker',
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: 'text-rose-600',
      activeBg: 'bg-rose-600 text-white shadow-md shadow-rose-600/30',
      hoverBg: 'hover:bg-rose-50 text-slate-700 hover:text-rose-700'
    },
    {
      id: 'remedialanalyzer',
      label: 'Remedial Pay',
      icon: <Wallet className="w-4 h-4" />,
      iconColor: 'text-emerald-600',
      activeBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
      hoverBg: 'hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
    },
    {
      id: 'parentportal',
      label: 'Parent Portal',
      icon: <Phone className="w-4 h-4" />,
      iconColor: 'text-sky-500',
      activeBg: 'bg-sky-600 text-white shadow-md shadow-sky-600/30',
      hoverBg: 'hover:bg-sky-50 text-slate-700 hover:text-sky-700'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon className="w-4 h-4" />,
      iconColor: 'text-slate-600',
      activeBg: 'bg-slate-700 text-white shadow-md shadow-slate-700/30',
      hoverBg: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
    }
  ];

  const filteredNavItems = allNavItems.filter(item => {
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
        'classjournal',
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

  const navRef = useRef<HTMLDivElement>(null);

  const handleItemClick = (id: ActiveView) => {
    onSelectView(id);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      {/* Top Header Row: School Branding & User Info */}
      <div className="max-w-full px-3.5 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 bg-gradient-to-br from-[#0f2948] to-[#1f4d8b] rounded-xl shadow-xs shrink-0 flex items-center justify-center text-white">
            <HabyEduProLogo variant="icon" size="sm" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-xs sm:text-base text-[#0f2948] truncate tracking-tight" title={schoolInfo?.name || 'HABY EDU PRO'}>
              {schoolInfo?.name || 'HABY EDU PRO SCHOOL'}
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
              Comprehensive School Management System
            </p>
          </div>
        </div>

        {/* Right Status Badges & User Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-time Save Status */}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-[9px] sm:text-[10px] font-black uppercase animate-pulse">
              <RotateCw className="w-3 h-3 animate-spin" />
              <span className="hidden xs:inline">Saving</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-[9px] sm:text-[10px] font-black uppercase">
              <Save className="w-3 h-3 text-emerald-600" />
              <span className="hidden xs:inline">Synced</span>
            </div>
          )}

          {/* User Account Profile Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2 sm:px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-[10px] sm:text-xs">
              {(currentUser?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-[11px] font-black text-slate-800 truncate leading-tight">{currentUser?.fullName || 'Authorized User'}</p>
              <p className="text-[9px] text-blue-600 font-bold uppercase truncate leading-tight">{currentUser?.role || 'ACADEMIC'}</p>
            </div>
          </div>

          {/* Tour Button */}
          {onStartTour && (
            <button
              type="button"
              onClick={onStartTour}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl transition-all cursor-pointer text-xs font-black flex items-center gap-1.5 border border-amber-200 shadow-2xs"
              title="Anza Mwongozo wa Mfumo (Interactive Tour)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span className="hidden md:inline">Mwongozo (Tour)</span>
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
              title="Logout from System"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Bar Row: Vibrant Horizontal Scrolling Tabs with Unique Item Colors */}
      <div className="relative flex items-center px-1 sm:px-2 bg-white border-t border-slate-100">
        {/* Left Scroll Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="hidden sm:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 z-10 cursor-pointer"
          title="Scroll Left"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Tabs Container */}
        <div 
          ref={navRef}
          className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-2 px-1 scroll-smooth"
        >
          {filteredNavItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? `${item.activeBg} border-transparent ring-2 ring-blue-500/20 shadow-xs scale-[1.02]`
                    : `bg-slate-50/70 border-slate-200/80 ${item.hoverBg} hover:border-slate-300 hover:bg-white`
                }`}
              >
                <span className={`shrink-0 transition-transform ${isActive ? 'text-white scale-110' : item.iconColor}`}>
                  {item.icon}
                </span>
                <span className="whitespace-nowrap tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="hidden sm:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 z-10 cursor-pointer"
          title="Scroll Right"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
