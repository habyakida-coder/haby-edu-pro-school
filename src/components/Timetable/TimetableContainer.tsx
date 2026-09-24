import React, { useState } from 'react';
import { 
  Plus, 
  Printer, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  Calendar, 
  Layers, 
  Clock, 
  CheckCircle,
  FileSpreadsheet,
  Move,
  Info,
  Palette,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  Coffee,
  Utensils,
  BookMarked,
  Trees,
  Trophy,
  MessageSquare,
  BookOpen,
  Users,
  Library,
  FileCheck
} from 'lucide-react';
import { 
  TimetableAssignment, 
  Teacher, 
  PeriodSetting, 
  StreamSetting, 
  ActivityType 
} from '../../types';
import { 
  DAYS_OF_WEEK, 
  DEFAULT_CLASSES, 
  EXTRA_CURRICULAR_ACTIVITIES,
  DEFAULT_DAY_THEMES
} from '../../constants/defaults';
import { 
  getSubjectColor, 
  getTeacherColor, 
  getDayTheme, 
  getFormStreamTheme,
  getExtraCurricularInfo 
} from '../../utils/colors';
import { 
  exportTimetableToCSV, 
  exportClassTimetableGridToCSV, 
  printFormattedSection 
} from '../../utils/export';
import { detectTimetableConflicts } from '../../utils/conflicts';
import { EditSlotModal } from './EditSlotModal';
import { PeriodSettingsManager } from './PeriodSettingsManager';
import { ScheduleExtraCurricularModal } from './ScheduleExtraCurricularModal';

export const renderActivityIcon = (iconName: string, className = "w-3 h-3") => {
  switch (iconName) {
    case 'Coffee': return <Coffee className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'BookMarked': return <BookMarked className={className} />;
    case 'Trees': return <Trees className={className} />;
    case 'Trophy': return <Trophy className={className} />;
    case 'MessageSquare': return <MessageSquare className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Users': return <Users className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Library': return <Library className={className} />;
    case 'FileCheck': return <FileCheck className={className} />;
    default: return <Sparkles className={className} />;
  }
};

interface TimetableContainerProps {
  assignments: TimetableAssignment[];
  teachers: Teacher[];
  periodSettings: PeriodSetting[];
  streamSettings: StreamSetting[];
  classTimetableReleased: Record<string, boolean>;
  schoolName: string;
  dayThemes?: Record<string, string>;
  onUpdateAssignments: (assignments: TimetableAssignment[]) => void;
  onUpdatePeriodSettings: (settings: PeriodSetting[]) => void;
  onUpdateStreamSettings: (settings: StreamSetting[]) => void;
  onToggleClassRelease: (className: string) => void;
  onUpdateDayThemes?: (themes: Record<string, string>) => void;
}

export const TimetableContainer: React.FC<TimetableContainerProps> = ({
  assignments,
  teachers,
  periodSettings,
  streamSettings,
  classTimetableReleased,
  schoolName,
  dayThemes,
  onUpdateAssignments,
  onUpdatePeriodSettings,
  onUpdateStreamSettings,
  onToggleClassRelease,
  onUpdateDayThemes
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'class' | 'teacher' | 'master' | 'settings'>('general');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('Form 1');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<number>(teachers[0]?.id || 0);

  // Manual editing modal state
  const [editingSlot, setEditingSlot] = useState<{
    className: string;
    stream: string;
    day: string;
    period: string;
    assignment?: TimetableAssignment;
  } | null>(null);

  // Drag and drop state
  const [draggedAssignment, setDraggedAssignment] = useState<TimetableAssignment | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Conflict detection
  const conflicts = detectTimetableConflicts(assignments, teachers);
  const totalConflicts = Object.keys(conflicts).length;

  // Resolve all conflicts by unassigning teachers from redundant slots
  const handleResolveConflicts = () => {
    if (totalConflicts === 0) return;
    
    if (window.confirm(`Are you sure you want to resolve all ${totalConflicts} conflicts? This will unassign teachers from conflicting slots while keeping the subjects.`)) {
      const resolved = [...assignments];
      
      // Group assignments by the conflict key
      const slotTeacherMap: Record<string, TimetableAssignment[]> = {};
      assignments.forEach(a => {
        if (!a.teacherId) return;
        const normalizedPeriod = a.periodName || a.period.split(' (')[0];
        const key = `${a.day}_${normalizedPeriod}_teacher_${a.teacherId}`;
        if (!slotTeacherMap[key]) slotTeacherMap[key] = [];
        slotTeacherMap[key].push(a);
      });

      // For each group with more than 1 assignment, unassign all but the first
      Object.values(slotTeacherMap).forEach(group => {
        if (group.length > 1) {
          // Keep the first one, unassign others
          for (let i = 1; i < group.length; i++) {
            const assignmentToFix = group[i];
            const idx = resolved.findIndex(r => r.id === assignmentToFix.id);
            if (idx !== -1) {
              resolved[idx] = { ...resolved[idx], teacherId: undefined };
            }
          }
        }
      });

      onUpdateAssignments(resolved);
    }
  };

  // Helpers for class streams
  const getStreamsForClass = (className: string): string[] => {
    const setting = streamSettings.find(s => s.className === className);
    return setting && setting.streams.length > 0 ? setting.streams : ['STREAM A'];
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, assignment: TimetableAssignment) => {
    setDraggedAssignment(assignment);
    e.dataTransfer.setData('text/plain', JSON.stringify(assignment));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverKey !== targetKey) {
      setDragOverKey(targetKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverKey(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetClass: string,
    targetStream: string,
    targetDay: string,
    targetPeriod: string
  ) => {
    e.preventDefault();
    setDragOverKey(null);

    if (!draggedAssignment) return;

    // Check if dropping on the exact same slot
    if (
      draggedAssignment.className === targetClass &&
      draggedAssignment.stream === targetStream &&
      draggedAssignment.day === targetDay &&
      draggedAssignment.period === targetPeriod
    ) {
      return;
    }

    // Check if target already has an assignment
    const targetExisting = assignments.find(
      a =>
        a.className === targetClass &&
        a.stream === targetStream &&
        a.day === targetDay &&
        a.period === targetPeriod
    );

    let updated: TimetableAssignment[];

    if (targetExisting) {
      // SWAP positions
      updated = assignments.map(a => {
        if (a.id === draggedAssignment.id) {
          return {
            ...a,
            className: targetClass,
            stream: targetStream,
            day: targetDay,
            period: targetPeriod
          };
        }
        if (a.id === targetExisting.id) {
          return {
            ...a,
            className: draggedAssignment.className,
            stream: draggedAssignment.stream,
            day: draggedAssignment.day,
            period: draggedAssignment.period
          };
        }
        return a;
      });
    } else {
      // MOVE to empty slot
      updated = assignments.map(a => {
        if (a.id === draggedAssignment.id) {
          return {
            ...a,
            className: targetClass,
            stream: targetStream,
            day: targetDay,
            period: targetPeriod
          };
        }
        return a;
      });
    }

    onUpdateAssignments(updated);
    setDraggedAssignment(null);
  };

  // Slot Save from Modal
  const handleSaveSlot = (data: {
    className: string;
    stream: string;
    day: string;
    period: string;
    subject: string;
    teacherId?: number;
    room?: string;
    activityType: ActivityType;
    customNote?: string;
    applySchoolWide?: boolean;
  }) => {
    if (data.applySchoolWide) {
      // Apply to ALL streams across ALL classes for this day + period
      const newItems: TimetableAssignment[] = [];
      const updatedList = assignments.filter(a => !(a.day === data.day && a.period === data.period));

      DEFAULT_CLASSES.forEach(cName => {
        const streams = getStreamsForClass(cName);
        streams.forEach(sName => {
          newItems.push({
            id: Date.now() + Math.floor(Math.random() * 10000),
            className: cName,
            stream: sName,
            day: data.day,
            period: data.period,
            subject: data.subject,
            teacherId: data.teacherId,
            room: data.room,
            activityType: data.activityType,
            customNote: data.customNote
          });
        });
      });

      onUpdateAssignments([...updatedList, ...newItems]);
    } else {
      // Apply to single slot
      const existing = assignments.find(
        a =>
          a.className === data.className &&
          a.stream === data.stream &&
          a.day === data.day &&
          a.period === data.period
      );

      if (existing) {
        onUpdateAssignments(
          assignments.map(a => (a.id === existing.id ? { ...a, ...data } : a))
        );
      } else {
        onUpdateAssignments([
          ...assignments,
          {
            id: Date.now(),
            ...data
          }
        ]);
      }
    }
  };

  const handleDeleteSlot = (id: number) => {
    onUpdateAssignments(assignments.filter(a => a.id !== id));
  };

  // Extra-Curricular Scheduling Modal State (Supports Editable Start/End Times)
  const [extraCurricularModalOpen, setExtraCurricularModalOpen] = useState(false);
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<typeof EXTRA_CURRICULAR_ACTIVITIES[0] | null>(null);

  const handleOpenScheduleExtraCurricular = (act?: typeof EXTRA_CURRICULAR_ACTIVITIES[0]) => {
    setSelectedActivityForModal(act || null);
    setExtraCurricularModalOpen(true);
  };

  const handleSaveExtraCurricularSchedule = (data: {
    activity: typeof EXTRA_CURRICULAR_ACTIVITIES[0];
    day: string;
    periodName: string;
    startTime: string;
    endTime: string;
    isSchoolWide: boolean;
    targetClass?: string;
    targetStream?: string;
    teacherId?: number;
    room: string;
    customNote?: string;
    syncToPeriodSettings: boolean;
  }) => {
    // 1. Sync or add to PeriodSettings if requested
    if (data.syncToPeriodSettings) {
      const existingIndex = periodSettings.findIndex(
        p => p.day === data.day && (p.name.toLowerCase() === data.periodName.toLowerCase() || (p.start === data.startTime && p.end === data.endTime))
      );
      let updatedPeriods = [...periodSettings];
      if (existingIndex >= 0) {
        updatedPeriods[existingIndex] = {
          ...updatedPeriods[existingIndex],
          name: data.periodName,
          start: data.startTime,
          end: data.endTime
        };
      } else {
        updatedPeriods.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          day: data.day,
          name: data.periodName,
          start: data.startTime,
          end: data.endTime
        });
      }
      onUpdatePeriodSettings(updatedPeriods);
    }

    // 2. Format period label
    const periodKey = `${data.periodName} (${data.startTime}-${data.endTime})`;

    // 3. Update assignments
    let newItems: TimetableAssignment[] = [];
    let updatedList = assignments.filter(a => {
      if (a.day !== data.day) return true;
      if (data.isSchoolWide) {
        return a.period !== periodKey && a.period !== data.periodName && a.periodName !== data.periodName;
      } else {
        return !(
          a.className === data.targetClass &&
          a.stream === data.targetStream &&
          (a.period === periodKey || a.period === data.periodName || a.periodName === data.periodName)
        );
      }
    });

    if (data.isSchoolWide) {
      DEFAULT_CLASSES.forEach(cName => {
        const streams = getStreamsForClass(cName);
        streams.forEach(sName => {
          newItems.push({
            id: Date.now() + Math.floor(Math.random() * 100000),
            className: cName,
            stream: sName,
            day: data.day,
            period: periodKey,
            periodName: data.periodName,
            subject: data.activity.name,
            activityType: data.activity.id as ActivityType,
            teacherId: data.teacherId,
            room: data.room,
            customNote: data.customNote
          });
        });
      });
    } else if (data.targetClass && data.targetStream) {
      newItems.push({
        id: Date.now() + Math.floor(Math.random() * 100000),
        className: data.targetClass,
        stream: data.targetStream,
        day: data.day,
        period: periodKey,
        periodName: data.periodName,
        subject: data.activity.name,
        activityType: data.activity.id as ActivityType,
        teacherId: data.teacherId,
        room: data.room,
        customNote: data.customNote
      });
    }

    onUpdateAssignments([...updatedList, ...newItems]);
  };

  // Stream Settings Form state
  const [newStreamClass, setNewStreamClass] = useState('Form 1');
  const [newStreamLevel, setNewStreamLevel] = useState<'CSEE' | 'ACSEE'>('CSEE');
  const [newStreamNames, setNewStreamNames] = useState('STREAM A, STREAM B');

  // Master Assignment Form state
  const [assignClass, setAssignClass] = useState('Form 1');
  const [assignStream, setAssignStream] = useState('STREAM A');
  const [assignDay, setAssignDay] = useState('Monday');
  const [assignPeriod, setAssignPeriod] = useState('');
  const [assignTeacher, setAssignTeacher] = useState<number>(teachers[0]?.id || 0);
  const [assignSubject, setAssignSubject] = useState(teachers[0]?.subjects[0] || 'Mathematics');

  const handleMasterAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPeriod) {
      alert('Please select a period.');
      return;
    }

    const data: TimetableAssignment = {
      id: Date.now(),
      className: assignClass,
      stream: assignStream,
      day: assignDay,
      period: assignPeriod,
      teacherId: assignTeacher || undefined,
      subject: assignSubject,
      activityType: 'academic'
    };

    const updated = assignments.filter(
      a =>
        !(
          a.className === assignClass &&
          a.stream === assignStream &&
          a.day === assignDay &&
          a.period === assignPeriod
        )
    );

    onUpdateAssignments([...updated, data]);
    alert(`Assigned ${assignSubject} to ${assignClass} ${assignStream} on ${assignDay}!`);
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          General Timetable
        </button>

        <button
          onClick={() => setActiveTab('class')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'class'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Class Timetable
        </button>

        <button
          onClick={() => setActiveTab('teacher')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'teacher'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Teacher Timetable
        </button>

        <button
          onClick={() => setActiveTab('master')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'master'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          Master Assignment
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          Timetable & Period Settings
        </button>
      </div>

      {/* Conflict Bar Alert (if any teacher is double-booked) */}
      {totalConflicts > 0 && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-bold">Schedule Conflict Detected</span>
              <span className="text-[11px] opacity-90 font-medium">
                {totalConflicts} period slot(s) have teacher clashes (double-booked teachers). Clashing slots are highlighted in red below.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResolveConflicts}
              className="px-3 py-1.5 bg-white text-rose-600 border border-rose-200 rounded-lg text-xs font-black hover:bg-rose-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resolve All Conflicts
            </button>
            <span className="text-xs font-bold px-2.5 py-1 bg-rose-600 text-white rounded-full">
              {totalConflicts} Conflicts
            </span>
          </div>
        </div>
      )}

      {/* Quick Add Extra-Curricular Bar (Editable Times) */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 rounded-xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h4 className="text-sm font-bold text-white">
                Extra-Curricular & Special Periods (Fully Editable Times)
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Select any activity to set custom start & end times, duration, day, and room. Choose school-wide or specific stream.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenScheduleExtraCurricular()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Schedule Custom Activity</span>
            </button>
            {EXTRA_CURRICULAR_ACTIVITIES.map(act => (
              <button
                key={act.id}
                type="button"
                onClick={() => handleOpenScheduleExtraCurricular(act)}
                style={{ backgroundColor: act.color }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white hover:brightness-110 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={`Schedule ${act.name} with editable times`}
              >
                {renderActivityIcon(act.icon, "w-3.5 h-3.5")}
                <span>{act.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. GENERAL TIMETABLE TAB                                */}
      {/* ======================================================== */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Day:</span>
              <select
                value={selectedDayFilter}
                onChange={e => setSelectedDayFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
              >
                <option value="All">All Days</option>
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1 ml-2">
                <Move className="w-3.5 h-3.5 text-blue-500" />
                <span>Drag slots to reschedule • Click any slot to edit manually</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                <button
                  onClick={() => setPrintOrientation('portrait')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    printOrientation === 'portrait' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setPrintOrientation('landscape')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                    printOrientation === 'landscape' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Landscape
                </button>
              </div>

              <button
                onClick={() => exportTimetableToCSV(assignments, teachers)}
                className="px-3 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export CSV
              </button>

              <button
                onClick={() => printFormattedSection('general-printable-view', 'General Teaching Timetable', schoolName, { orientation: printOrientation })}
                className="px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Export PDF
              </button>
            </div>
          </div>

          {/* Timetable View by Days */}
          <div id="general-printable-view" className="space-y-8 master-timetable-container">
            {DAYS_OF_WEEK.filter(day => selectedDayFilter === 'All' || selectedDayFilter === day).map(day => {
              const dayTheme = getDayTheme(day, dayThemes);
  const timeToMinutes = (timeStr: string) => {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const dayPeriods = periodSettings
    .filter(p => p.day === day)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

              if (dayPeriods.length === 0) return null;

              return (
                <div
                  key={day}
                  style={{ backgroundColor: dayTheme.bg, borderColor: dayTheme.border }}
                  className="border rounded-xl shadow-xs overflow-hidden transition-all print-avoid-break"
                >
                  {/* Day Header */}
                  <div
                    style={{ backgroundColor: dayTheme.headerBg }}
                    className="px-5 py-3 text-white flex items-center justify-between font-bold"
                  >
                    <div className="flex items-center gap-2 text-base">
                      <span>{day}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
                        {dayPeriods.length} Periods Configured
                      </span>
                    </div>
                    <span className="text-xs font-medium text-white/90">
                      Drag & Drop enabled • Color-coded Streams
                    </span>
                  </div>

                  {/* Day Grid by Forms */}
                  <div className="p-4 space-y-4">
                    {DEFAULT_CLASSES.map(className => {
                      const formTheme = getFormStreamTheme(className);
                      const streams = getStreamsForClass(className);

                      return (
                        <div
                          key={className}
                          className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs"
                        >
                          {/* Class / Form Header */}
                          <div
                            style={{ backgroundColor: formTheme.lightBg, borderLeftColor: formTheme.accent }}
                            className="px-4 py-2 border-l-4 flex items-center justify-between"
                          >
                            <span
                              style={{ color: formTheme.accent }}
                              className="text-xs font-extrabold tracking-wide uppercase"
                            >
                              {className}
                            </span>
                            <div className="flex items-center gap-1">
                              {streams.map(st => (
                                <span
                                  key={st}
                                  style={{ backgroundColor: formTheme.badgeBg, color: formTheme.badgeText }}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Matrix Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                                  <th className="p-2.5 w-32 border-r border-slate-200">Stream</th>
                                  {dayPeriods.map(p => {
                                    const periodExtra = getExtraCurricularInfo(p.name);
                                    const isBreakfast = p.name.toLowerCase().includes('breakfast');
                                    const isLunch = p.name.toLowerCase().includes('lunch');
                                    const isReligion = p.name.toLowerCase().includes('religion');

                                    const thBg = isBreakfast 
                                      ? '#fef3c7' 
                                      : isLunch 
                                      ? '#ffedd5' 
                                      : isReligion 
                                      ? '#e0e7ff' 
                                      : periodExtra 
                                      ? periodExtra.cardBg 
                                      : undefined;

                                    const thText = isBreakfast 
                                      ? '#78350f' 
                                      : isLunch 
                                      ? '#7c2d12' 
                                      : isReligion 
                                      ? '#312e81' 
                                      : periodExtra 
                                      ? periodExtra.text 
                                      : undefined;

                                    const thBorder = isBreakfast 
                                      ? '2px solid #f59e0b' 
                                      : isLunch 
                                      ? '2px solid #ea580c' 
                                      : isReligion 
                                      ? '2px solid #6366f1' 
                                      : periodExtra 
                                      ? `2px solid ${periodExtra.cellBorder}` 
                                      : undefined;

                                    return (
                                      <th 
                                        key={p.id} 
                                        style={{
                                          backgroundColor: thBg,
                                          color: thText,
                                          borderBottom: thBorder
                                        }}
                                        className={`p-2.5 border-r border-slate-200 min-w-[135px] transition-colors ${
                                          thBg ? 'font-extrabold' : ''
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          {isBreakfast && <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                                          {isLunch && <Utensils className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                                          {isReligion && <BookMarked className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                                          {!isBreakfast && !isLunch && !isReligion && periodExtra && renderActivityIcon(periodExtra.iconName, "w-3.5 h-3.5 shrink-0")}
                                          <span>{p.name}</span>
                                        </div>
                                        <div 
                                          style={{ color: thText ? thText : undefined }}
                                          className={`text-[10px] font-normal ${thText ? 'opacity-80' : 'text-slate-400'}`}
                                        >
                                          {p.start} - {p.end}
                                        </div>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {streams.map(stream => {
                                  return (
                                    <tr key={stream} className="border-b border-slate-100 hover:bg-slate-50/50">
                                      <td className="p-2.5 border-r border-slate-200 font-bold text-xs bg-slate-50/70">
                                        <span
                                          style={{
                                            backgroundColor: formTheme.lightBg,
                                            color: formTheme.accent,
                                            borderColor: formTheme.border
                                          }}
                                          className="px-2 py-0.5 rounded-md border text-[11px] inline-block"
                                        >
                                          {stream}
                                        </span>
                                      </td>

                                      {dayPeriods.map(period => {
                                        const periodKey = `${period.name} (${period.start}-${period.end})`;
                                        const assignment = assignments.find(
                                          a =>
                                            a.className === className &&
                                            a.stream === stream &&
                                            a.day === day &&
                                            (a.period === periodKey || a.period === period.name || (a.periodName && a.periodName === period.name))
                                        );

                                        const teacher = assignment?.teacherId
                                          ? teachers.find(t => t.id === assignment.teacherId)
                                          : undefined;

                                        const conflict = assignment ? conflicts[assignment.id] : undefined;
                                        const cellKey = `${className}_${stream}_${day}_${periodKey}`;
                                        const isDragOver = dragOverKey === cellKey;

                                        const subColor = assignment ? getSubjectColor(assignment.subject) : null;
                                        const teacherColor = teacher ? getTeacherColor(teacher.id) : null;

                                        const extraInfo = assignment
                                          ? getExtraCurricularInfo(assignment.subject, assignment.activityType)
                                          : getExtraCurricularInfo(period.name);

                                        return (
                                          <td
                                            key={period.id}
                                            onDragOver={e => handleDragOver(e, cellKey)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={e => handleDrop(e, className, stream, day, periodKey)}
                                            onClick={() =>
                                              setEditingSlot({
                                                className,
                                                stream,
                                                day,
                                                period: periodKey,
                                                assignment
                                              })
                                            }
                                            style={{
                                              backgroundColor: isDragOver
                                                ? '#dbeafe'
                                                : conflict?.hasConflict
                                                ? '#fff1f2'
                                                : extraInfo
                                                ? extraInfo.cellBg
                                                : undefined,
                                              borderLeft: extraInfo ? `3px solid ${extraInfo.cellBorder}` : undefined
                                            }}
                                            className={`p-2 border-r border-slate-200 align-top cursor-pointer transition-all ${
                                              isDragOver
                                                ? 'ring-2 ring-blue-400 ring-inset'
                                                : conflict?.hasConflict
                                                ? 'ring-1 ring-rose-400'
                                                : assignment
                                                ? 'hover:brightness-95'
                                                : extraInfo
                                                ? 'hover:brightness-95'
                                                : 'hover:bg-blue-50/40'
                                            }`}
                                          >
                                            {assignment ? (
                                              <div
                                                draggable
                                                onDragStart={e => handleDragStart(e, assignment)}
                                                style={{
                                                  backgroundColor: extraInfo ? extraInfo.cardBg : subColor?.bg,
                                                  borderColor: conflict?.hasConflict ? '#f43f5e' : extraInfo ? extraInfo.cellBorder : subColor?.border
                                                }}
                                                className={`p-1.5 rounded-md border text-xs relative group shadow-2xs select-none ${
                                                  extraInfo ? 'border-2' : ''
                                                }`}
                                              >
                                                {/* Activity / Meal / Religion Badge */}
                                                {extraInfo && (
                                                  <div className="flex items-center justify-between gap-1 mb-1">
                                                    <span
                                                      style={{
                                                        backgroundColor: extraInfo.accent,
                                                        color: '#ffffff'
                                                      }}
                                                      className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-2xs"
                                                    >
                                                      {renderActivityIcon(extraInfo.iconName, "w-2.5 h-2.5")}
                                                      <span>{extraInfo.badgeText}</span>
                                                    </span>
                                                    {assignment.activityType && assignment.activityType !== 'academic' && (
                                                      <span className="text-[8px] font-semibold text-slate-500 uppercase">
                                                        Special
                                                      </span>
                                                    )}
                                                  </div>
                                                )}

                                                {/* Subject Tag */}
                                                <div
                                                  style={{ color: extraInfo ? extraInfo.text : subColor?.text }}
                                                  className="font-bold leading-tight truncate flex items-center justify-between gap-1"
                                                >
                                                  <span title={assignment.subject} className="flex items-center gap-1">
                                                    {!extraInfo && <span>{assignment.subject}</span>}
                                                    {extraInfo && <span className="font-extrabold">{assignment.subject}</span>}
                                                  </span>
                                                  {conflict?.hasConflict && (
                                                    <span
                                                      title={`Clash! Double-booked with ${conflict.conflictingWith
                                                        .map(c => `${c.className} ${c.stream}`)
                                                        .join(', ')}`}
                                                      className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shrink-0 animate-pulse"
                                                    >
                                                      !
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Teacher / Coordinator & Room */}
                                                <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px]">
                                                  {teacher ? (
                                                    <span
                                                      style={{
                                                        backgroundColor: teacherColor?.hex,
                                                        color: '#ffffff'
                                                      }}
                                                      title={`${teacher.name} (${teacher.subjects.join(', ')})`}
                                                      className="px-1.5 py-0.2 rounded-full font-bold shadow-2xs"
                                                    >
                                                      {teacher.initial}
                                                    </span>
                                                  ) : (
                                                    <span className="text-slate-400 italic text-[9px]">
                                                      {extraInfo ? 'Coordinator' : 'No teacher'}
                                                    </span>
                                                  )}

                                                  {assignment.room && (
                                                    <span
                                                      style={{ color: extraInfo ? extraInfo.text : undefined }}
                                                      className="font-semibold truncate max-w-[80px]"
                                                    >
                                                      {assignment.room}
                                                    </span>
                                                  )}
                                                </div>

                                                {/* Conflict tooltip */}
                                                {conflict?.hasConflict && (
                                                  <div className="text-[9px] text-rose-700 font-bold mt-0.5 leading-none">
                                                    Clash: {conflict.conflictingWith[0]?.className}
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="h-10 flex items-center justify-center text-xs">
                                                {extraInfo ? (
                                                  <span
                                                    style={{ color: extraInfo.accent }}
                                                    className="text-[10px] font-bold flex items-center gap-1 opacity-75 hover:opacity-100"
                                                  >
                                                    {renderActivityIcon(extraInfo.iconName, "w-3 h-3")}
                                                    + {extraInfo.name}
                                                  </span>
                                                ) : (
                                                  <div className="text-slate-300 group-hover:text-slate-400">
                                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-blue-500">
                                                      + Assign
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CLASS TIMETABLE TAB                                  */}
      {/* ======================================================== */}
      {activeTab === 'class' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Class:</label>
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
              >
                {DEFAULT_CLASSES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button
                onClick={() => onToggleClassRelease(selectedClassFilter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                  classTimetableReleased[selectedClassFilter]
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                {classTimetableReleased[selectedClassFilter] ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    Released to Teachers
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Admin Only (Unreleased)
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const streams = getStreamsForClass(selectedClassFilter);
                  exportClassTimetableGridToCSV(
                    selectedClassFilter,
                    streams[0] || 'A',
                    DAYS_OF_WEEK,
                    periodSettings,
                    assignments,
                    teachers
                  );
                }}
                className="px-3 py-2 text-xs font-bold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Grid CSV
              </button>

              <button
                onClick={() => printFormattedSection('class-printable-view', `${selectedClassFilter} Timetable`, schoolName)}
                className="px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Class Timetable
              </button>
            </div>
          </div>

          {/* Printable Class Grid */}
          <div id="class-printable-view" className="space-y-6 master-timetable-container">
            {getStreamsForClass(selectedClassFilter).map(stream => {
              const formTheme = getFormStreamTheme(selectedClassFilter);

              return (
                <div key={stream} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div
                    style={{ backgroundColor: formTheme.accent }}
                    className="px-5 py-3 text-white flex items-center justify-between font-bold"
                  >
                    <span className="text-sm">
                      {selectedClassFilter} — {stream}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20">
                      Standard Weekly Roster
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase text-[11px]">
                          <th className="p-2.5 border-r border-slate-200 w-36">Period / Time</th>
                          {DAYS_OF_WEEK.map(day => {
                            const dayTheme = getDayTheme(day, dayThemes);
                            return (
                              <th
                                key={day}
                                style={{ backgroundColor: dayTheme.bg, color: dayTheme.text }}
                                className="p-2.5 border-r border-slate-200 min-w-[120px] text-center"
                              >
                                {day}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(new Set(periodSettings.map(p => `${p.name} (${p.start}-${p.end})`))).map(periodKey => {
                          return (
                            <tr key={periodKey} className="border-b border-slate-100">
                              <td className="p-2.5 border-r border-slate-200 font-semibold bg-slate-50 text-slate-800">
                                {periodKey}
                              </td>

                              {DAYS_OF_WEEK.map(day => {
                                const pNameOnly = periodKey.split(' (')[0];
                                const assignment = assignments.find(
                                  a =>
                                    a.className === selectedClassFilter &&
                                    a.stream === stream &&
                                    a.day === day &&
                                    (a.period === periodKey || a.period === pNameOnly || (a.periodName && a.periodName === pNameOnly))
                                );
                                const teacher = assignment?.teacherId
                                  ? teachers.find(t => t.id === assignment.teacherId)
                                  : undefined;
                                const subColor = assignment ? getSubjectColor(assignment.subject) : null;
                                const teacherColor = teacher ? getTeacherColor(teacher.id) : null;
                                const extraInfo = assignment
                                  ? getExtraCurricularInfo(assignment.subject, assignment.activityType)
                                  : getExtraCurricularInfo(periodKey);

                                return (
                                  <td
                                    key={day}
                                    onClick={() =>
                                      setEditingSlot({
                                        className: selectedClassFilter,
                                        stream,
                                        day,
                                        period: periodKey,
                                        assignment
                                      })
                                    }
                                    style={{
                                      backgroundColor: extraInfo ? extraInfo.cellBg : undefined,
                                      borderLeft: extraInfo ? `3px solid ${extraInfo.cellBorder}` : undefined
                                    }}
                                    className="p-2 border-r border-slate-200 text-center cursor-pointer hover:bg-blue-50/40 transition-colors"
                                  >
                                    {assignment ? (
                                      <div
                                        style={{ 
                                          backgroundColor: extraInfo ? extraInfo.cardBg : subColor?.bg, 
                                          borderColor: extraInfo ? extraInfo.cellBorder : subColor?.border 
                                        }}
                                        className={`p-1.5 rounded-md border text-xs shadow-2xs ${extraInfo ? 'border-2' : ''}`}
                                      >
                                        {extraInfo && (
                                          <div className="flex items-center justify-center gap-1 mb-1">
                                            <span
                                              style={{ backgroundColor: extraInfo.accent, color: '#ffffff' }}
                                              className="text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase flex items-center gap-1"
                                            >
                                              {renderActivityIcon(extraInfo.iconName, "w-2.5 h-2.5")}
                                              {extraInfo.badgeText}
                                            </span>
                                          </div>
                                        )}
                                        <div 
                                          style={{ color: extraInfo ? extraInfo.text : subColor?.text }} 
                                          className="font-bold truncate"
                                        >
                                          {assignment.subject}
                                        </div>
                                        <div className="mt-1 flex items-center justify-center gap-1 text-[10px]">
                                          {teacher && (
                                            <span
                                              style={{ backgroundColor: teacherColor?.hex, color: '#ffffff' }}
                                              className="px-1.5 py-0.2 rounded-full font-bold shadow-2xs"
                                            >
                                              {teacher.initial}
                                            </span>
                                          )}
                                          {assignment.room && (
                                            <span 
                                              style={{ color: extraInfo ? extraInfo.text : undefined }}
                                              className="font-semibold truncate max-w-[80px]"
                                            >
                                              {assignment.room}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : extraInfo ? (
                                      <span
                                        style={{ color: extraInfo.accent }}
                                        className="text-[10px] font-bold flex items-center justify-center gap-1 opacity-75"
                                      >
                                        {renderActivityIcon(extraInfo.iconName, "w-3 h-3")}
                                        {extraInfo.name}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300 font-medium">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TEACHER TIMETABLE TAB                                */}
      {/* ======================================================== */}
      {activeTab === 'teacher' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Teacher:</label>
              <select
                value={selectedTeacherFilter}
                onChange={e => setSelectedTeacherFilter(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.initial})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const currentTeacher = teachers.find(t => t.id === selectedTeacherFilter);
                printFormattedSection(
                  'teacher-printable-view',
                  `${currentTeacher?.name || 'Teacher'} Teaching Timetable`,
                  schoolName
                );
              }}
              className="px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Teacher Schedule
            </button>
          </div>

          {/* Teacher Schedule View */}
          <div id="teacher-printable-view" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6 master-timetable-container">
            {(() => {
              const currentTeacher = teachers.find(t => t.id === selectedTeacherFilter);
              if (!currentTeacher) return <p className="text-slate-500">Select a teacher.</p>;

              const teacherAssignments = assignments.filter(a => a.teacherId === currentTeacher.id);
              const teacherCol = getTeacherColor(currentTeacher.id);

              return (
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <span
                      style={{ backgroundColor: teacherCol.hex, color: '#ffffff' }}
                      className="w-12 h-12 rounded-full inline-flex items-center justify-center text-base font-bold shadow-xs"
                    >
                      {currentTeacher.initial}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{currentTeacher.name}</h3>
                      <p className="text-xs text-slate-500">
                        Teaching Subjects: {currentTeacher.subjects.join(', ')} • Total Lessons: {teacherAssignments.length}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase">
                          <th className="p-2.5 border-r border-slate-200">Day</th>
                          <th className="p-2.5 border-r border-slate-200">Period / Time</th>
                          <th className="p-2.5 border-r border-slate-200">Class & Stream</th>
                          <th className="p-2.5 border-r border-slate-200">Subject</th>
                          <th className="p-2.5 border-r border-slate-200">Room / Venue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherAssignments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400">
                              No teaching assignments scheduled for this teacher.
                            </td>
                          </tr>
                        ) : (
                          teacherAssignments.map(a => {
                            const subCol = getSubjectColor(a.subject);
                            const dayTheme = getDayTheme(a.day, dayThemes);

                            return (
                              <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-2.5 border-r border-slate-200 font-bold">
                                  <span
                                    style={{ backgroundColor: dayTheme.bg, color: dayTheme.text }}
                                    className="px-2 py-0.5 rounded-full text-[11px]"
                                  >
                                    {a.day}
                                  </span>
                                </td>
                                <td className="p-2.5 border-r border-slate-200 text-slate-600">{a.period}</td>
                                <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">
                                  {a.className} • {a.stream}
                                </td>
                                <td className="p-2.5 border-r border-slate-200">
                                  <span
                                    style={{ backgroundColor: subCol.bg, color: subCol.text, borderColor: subCol.border }}
                                    className="px-2 py-0.5 rounded-md border font-bold text-[11px]"
                                  >
                                    {a.subject}
                                  </span>
                                </td>
                                <td className="p-2.5 border-r border-slate-200 text-slate-500">
                                  {a.room || 'Regular Classroom'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MASTER ASSIGNMENT TAB                                */}
      {/* ======================================================== */}
      {activeTab === 'master' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>Assign Teacher to Class Period</span>
                  {(() => {
                    const normalizedTarget = assignPeriod.split(' (')[0];
                    const hasConflict = assignments.some(a => 
                      a.day === assignDay && 
                      (a.periodName || a.period.split(' (')[0]) === normalizedTarget && 
                      a.teacherId === assignTeacher
                    );
                    return hasConflict && (
                      <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Teacher Clash!
                      </span>
                    );
                  })()}
                </h3>

            <form onSubmit={handleMasterAssign} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Class / Form</label>
                <select
                  value={assignClass}
                  onChange={e => {
                    setAssignClass(e.target.value);
                    const streams = getStreamsForClass(e.target.value);
                    setAssignStream(streams[0] || 'STREAM A');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  {DEFAULT_CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Stream / Combination</label>
                <select
                  value={assignStream}
                  onChange={e => setAssignStream(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  {getStreamsForClass(assignClass).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Day</label>
                <select
                  value={assignDay}
                  onChange={e => setAssignDay(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Period</label>
                <select
                  value={assignPeriod}
                  onChange={e => setAssignPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Select Period --</option>
                  {periodSettings
                    .filter(p => p.day === assignDay)
                    .map(p => {
                      const label = `${p.name} (${p.start}-${p.end})`;
                      return <option key={p.id} value={label}>{label}</option>;
                    })}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Teacher</label>
                <select
                  value={assignTeacher}
                  onChange={e => {
                    const tid = Number(e.target.value);
                    setAssignTeacher(tid);
                    const t = teachers.find(item => item.id === tid);
                    if (t && t.subjects.length > 0) {
                      setAssignSubject(t.subjects[0]);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.initial})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Subject</label>
                <select
                  value={assignSubject}
                  onChange={e => setAssignSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  {teachers.find(t => t.id === assignTeacher)?.subjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  )) || <option value="Mathematics">Mathematics</option>}
                </select>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save & Assign Period
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-200">
              Registered Faculty ({teachers.length})
            </h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {teachers.map(t => {
                const col = getTeacherColor(t.id);
                return (
                  <div key={t.id} className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: col.hex, color: '#ffffff' }}
                        className="w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold"
                      >
                        {t.initial}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{t.name}</div>
                        <div className="text-[10px] text-slate-500">{t.subjects.join(', ')}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                      {assignments.filter(a => a.teacherId === t.id).length} classes
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TIMETABLE & PERIOD SETTINGS TAB                       */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Day Background Colors Customizer */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                Customizable Day Theme Backgrounds & Colors
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Each day has a distinct color theme for clarity. Choose or customize accents for each day of the week.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {DAYS_OF_WEEK.map(day => {
                const theme = getDayTheme(day, dayThemes);
                return (
                  <div
                    key={day}
                    style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                    className="p-3 rounded-lg border flex flex-col items-center justify-between gap-2 text-center"
                  >
                    <span className="text-xs font-bold" style={{ color: theme.text }}>
                      {day}
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={theme.headerBg}
                        onChange={e => {
                          if (onUpdateDayThemes) {
                            onUpdateDayThemes({
                              ...(dayThemes || {}),
                              [day]: e.target.value
                            });
                          }
                        }}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                        title={`Customize ${day} accent color`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Period Settings Manager with Edit, Save, and Delete */}
          <PeriodSettingsManager
            periodSettings={periodSettings}
            onUpdatePeriodSettings={onUpdatePeriodSettings}
            assignments={assignments}
            onUpdateAssignments={onUpdateAssignments}
            dayThemes={dayThemes}
          />

          {/* Class Stream Settings */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-200">
              Class Stream Settings (Streams & Combinations)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Class</label>
                <select
                  value={newStreamClass}
                  onChange={e => setNewStreamClass(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  {DEFAULT_CLASSES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Level</label>
                <select
                  value={newStreamLevel}
                  onChange={e => {
                    const lvl = e.target.value as 'CSEE' | 'ACSEE';
                    setNewStreamLevel(lvl);
                    if (lvl === 'ACSEE') {
                      setNewStreamNames('PCM, PCB, CBG, HGE');
                    } else {
                      setNewStreamNames('STREAM A, STREAM B');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  <option value="CSEE">CSEE (Ordinary Level)</option>
                  <option value="ACSEE">ACSEE (Advanced Level)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Streams (Comma Separated)</label>
                <input
                  type="text"
                  value={newStreamNames}
                  onChange={e => setNewStreamNames(e.target.value)}
                  placeholder="e.g. STREAM A, STREAM B"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const streamList = newStreamNames
                  .split(',')
                  .map(s => s.trim().toUpperCase())
                  .filter(Boolean);

                if (!streamList.length) {
                  alert('Enter at least one stream name.');
                  return;
                }

                const existingIndex = streamSettings.findIndex(s => s.className === newStreamClass);
                if (existingIndex > -1) {
                  const copy = [...streamSettings];
                  copy[existingIndex] = {
                    ...copy[existingIndex],
                    level: newStreamLevel,
                    streams: streamList
                  };
                  onUpdateStreamSettings(copy);
                } else {
                  onUpdateStreamSettings([
                    ...streamSettings,
                    {
                      id: Date.now(),
                      className: newStreamClass,
                      level: newStreamLevel,
                      streams: streamList
                    }
                  ]);
                }
                alert(`Streams for ${newStreamClass} updated!`);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Save Class Streams
            </button>
          </div>
        </div>
      )}

      {/* Manual Slot Edit Modal */}
      {editingSlot && (
        <EditSlotModal
          slot={editingSlot}
          teachers={teachers}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {/* Schedule Extra-Curricular Period Modal (Editable Times) */}
      {extraCurricularModalOpen && (
        <ScheduleExtraCurricularModal
          initialActivity={selectedActivityForModal}
          periodSettings={periodSettings}
          teachers={teachers}
          assignments={assignments}
          onSaveSchedule={handleSaveExtraCurricularSchedule}
          onClose={() => {
            setExtraCurricularModalOpen(false);
            setSelectedActivityForModal(null);
          }}
        />
      )}
    </div>
  );
};
