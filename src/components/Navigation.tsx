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
  Grid,
  Wallet
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
  | 'remedialanalyzer';

interface NavigationProps {
  activeView: ActiveView;
  schoolInfo: SchoolInfo;
  onSelectView: (view: ActiveView) => void;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  saveStatus?: 'saving' | 'saved' | 'offline' | 'error';
  layout?: 'vertical' | 'horizontal';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  schoolInfo,
  onSelectView,
  currentUser,
  onLogout,
  saveStatus = 'saved',
  layout = 'horizontal'
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
    { id: 'remedialanalyzer', label: 'Remedial Pay', icon: <Wallet className="w-4 h-4 text-emerald-400" /> }
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

  return (
    <header className={layout === 'vertical' ? 'flex h-screen bg-[#0f2948] text-white w-64 fixed left-0 top-0 flex-col' : 'space-y-3 mb-6'}>
      {/* Top/Side Header content... (simplify for brevity if needed) */}
      
      {/* Navigation Tabs */}
      <nav className={layout === 'vertical' ? 'flex flex-col gap-1 p-2 overflow-y-auto' : 'flex flex-wrap gap-1.5 p-2 rounded-xl border shadow-xs bg-white border-slate-200'}>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? (layout === 'vertical' ? 'bg-white text-[#1f4d8b]' : 'bg-[#1f4d8b] text-white shadow-xs')
                  : (layout === 'vertical' ? 'text-blue-100 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
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
