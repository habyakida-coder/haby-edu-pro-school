import React, { useState, useEffect, useMemo } from 'react';
import { 
  TimetableAssignment, 
  Teacher, 
  PeriodSetting, 
  StreamSetting, 
  SchoolInfo, 
  UserAccount, 
  Student,
  InstitutionalPolicy 
} from '../../types';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  PenTool, 
  Printer, 
  ShieldCheck, 
  BookOpen, 
  Users, 
  Layers, 
  CheckCheck, 
  RotateCcw, 
  Award,
  ChevronDown,
  Filter
} from 'lucide-react';
import { printFormattedSection } from '../../utils/export';

export interface ClassJournalEntry {
  id: string; // `${className}_${stream}_${day}_${periodIndex}_${week}`
  className: string;
  stream: string;
  week: string;
  day: string;
  periodNumber: number;
  periodName: string;
  timeRange: string;
  scheduledSubject: string;
  scheduledTeacherName: string;
  scheduledTeacherId?: number;
  
  // Real classroom status
  status: 'TAUGHT' | 'NOT_TAUGHT' | 'STAND_IN' | 'FREE_PERIOD';
  actualTeacherName?: string;
  topicTaught: string;
  studentsPresent: number;
  totalStudentsInClass: number;
  
  // Teacher sign-off
  teacherSignature: string;
  teacherSignedAt?: string;
  teacherRemarks?: string;
  
  // Monitor sign-off (Kiranja wa Darasa)
  monitorConfirmed: boolean;
  monitorName: string;
  monitorConfirmedAt?: string;
  monitorRemarks?: string;
}

interface ClassJournalTabProps {
  assignments: TimetableAssignment[];
  teachers: Teacher[];
  periodSettings: PeriodSetting[];
  streamSettings: StreamSetting[];
  schoolInfo?: SchoolInfo;
  currentUser?: UserAccount | null;
  students?: Student[];
  institutionalPolicy?: InstitutionalPolicy;
}

export const ClassJournalTab: React.FC<ClassJournalTabProps> = ({
  assignments,
  teachers,
  periodSettings,
  streamSettings,
  schoolInfo,
  currentUser,
  students = [],
  institutionalPolicy
}) => {
  // Available classes & streams
  const classList = useMemo(() => {
    if (streamSettings.length > 0) {
      return streamSettings.map(s => s.className);
    }
    return ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'];
  }, [streamSettings]);

  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || 'Form 1');

  // Streams for selected class
  const availableStreams = useMemo(() => {
    const setting = streamSettings.find(s => s.className.toLowerCase() === selectedClass.toLowerCase());
    if (setting && setting.streams.length > 0) {
      return setting.streams;
    }
    return ['STREAM A', 'STREAM B'];
  }, [streamSettings, selectedClass]);

  const [selectedStream, setSelectedStream] = useState<string>(availableStreams[0] || 'STREAM A');

  // Keep selected stream in sync
  useEffect(() => {
    if (availableStreams.length > 0 && !availableStreams.includes(selectedStream)) {
      setSelectedStream(availableStreams[0]);
    }
  }, [availableStreams, selectedStream]);

  // Working days (Monday to Friday or custom)
  const workingDays = useMemo(() => {
    if (institutionalPolicy?.workingDays && institutionalPolicy.workingDays.length > 0) {
      return institutionalPolicy.workingDays;
    }
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }, [institutionalPolicy]);

  const [selectedDayView, setSelectedDayView] = useState<string>('All'); // 'All' or specific day
  const [selectedWeek, setSelectedWeek] = useState<string>('Week 1');

  // Monitor Profile state (persisted per class & stream)
  const [monitorName, setMonitorName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`haby_monitor_${selectedClass}_${selectedStream}`);
      if (saved) return saved;
    } catch {}
    return 'Kiranja Mkuu wa Darasa';
  });

  const [classTeacherName, setClassTeacherName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`haby_classteacher_${selectedClass}_${selectedStream}`);
      if (saved) return saved;
    } catch {}
    return teachers[0]?.name || 'Mwalimu wa Darasa';
  });

  // Calculate student count for this class and stream
  const classStudentCount = useMemo(() => {
    const count = students.filter(
      s => s.className.toLowerCase() === selectedClass.toLowerCase() &&
           (!s.stream || s.stream.toUpperCase().includes(selectedStream.toUpperCase().replace(/^STREAM\s+/i, '')) || selectedStream === 'All')
    ).length;
    return count > 0 ? count : 45; // sensible default
  }, [students, selectedClass, selectedStream]);

  // Local state for Journal Entries
  const storageKey = `haby_class_journal_records_${schoolInfo?.name || 'default'}`;
  const [journalRecords, setJournalRecords] = useState<Record<string, ClassJournalEntry>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {};
  });

  // Save to localStorage whenever modified
  const updateJournalEntry = (entryId: string, updates: Partial<ClassJournalEntry>) => {
    setJournalRecords(prev => {
      const existing = prev[entryId];
      if (!existing) return prev;
      const updated = {
        ...prev,
        [entryId]: {
          ...existing,
          ...updates
        }
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Save monitor name on change
  const handleSaveMonitorName = (name: string) => {
    setMonitorName(name);
    try {
      localStorage.setItem(`haby_monitor_${selectedClass}_${selectedStream}`, name);
    } catch {}
  };

  const handleSaveClassTeacherName = (name: string) => {
    setClassTeacherName(name);
    try {
      localStorage.setItem(`haby_classteacher_${selectedClass}_${selectedStream}`, name);
    } catch {}
  };

  // Generate / Compile Journal Entries for the selected class, stream, and week
  const weekJournalEntries = useMemo(() => {
    const entries: ClassJournalEntry[] = [];

    workingDays.forEach(day => {
      // Find period settings for this day or global periods
      const daySpecificPeriods = periodSettings.filter(p => !p.day || p.day === day || p.day === 'All');
      const sortedPeriods = daySpecificPeriods.length > 0 
        ? [...daySpecificPeriods].sort((a, b) => a.start.localeCompare(b.start))
        : [
            { id: 1, name: 'Period 1', start: '08:00', end: '08:40', durationMinutes: 40, isBreak: false },
            { id: 2, name: 'Period 2', start: '08:40', end: '09:20', durationMinutes: 40, isBreak: false },
            { id: 3, name: 'Period 3', start: '09:20', end: '10:00', durationMinutes: 40, isBreak: false },
            { id: 4, name: 'Period 4', start: '10:40', end: '11:20', durationMinutes: 40, isBreak: false },
            { id: 5, name: 'Period 5', start: '11:20', end: '12:00', durationMinutes: 40, isBreak: false },
            { id: 6, name: 'Period 6', start: '12:00', end: '12:40', durationMinutes: 40, isBreak: false },
            { id: 7, name: 'Period 7', start: '13:40', end: '14:20', durationMinutes: 40, isBreak: false },
            { id: 8, name: 'Period 8', start: '14:20', end: '15:00', durationMinutes: 40, isBreak: false },
          ];

      sortedPeriods.forEach((period, pIdx) => {
        if (period.isBreak) return; // Skip tea/lunch break from official teaching journal

        const periodIndex = pIdx + 1;
        const entryId = `${selectedClass}_${selectedStream}_${day}_${period.name}_${selectedWeek}`.replace(/\s+/g, '_');
        const periodKey = `${period.name} (${period.start}-${period.end})`;
        const periodKeySpaced = `${period.name} (${period.start} - ${period.end})`;
        const cleanStream = selectedStream.replace(/^stream\s*/i, '').trim().toLowerCase();

        // Look for scheduled timetable assignment
        const match = assignments.find(a => {
          const aClass = a.className.trim().toLowerCase();
          const targetClass = selectedClass.trim().toLowerCase();
          if (aClass !== targetClass) return false;

          const aStream = a.stream.trim().toLowerCase();
          const cleanAStream = a.stream.replace(/^stream\s*/i, '').trim().toLowerCase();
          const streamMatches = 
            aStream === selectedStream.toLowerCase() ||
            aStream === 'all' ||
            selectedStream.toLowerCase() === 'all' ||
            cleanAStream === cleanStream;
          if (!streamMatches) return false;

          const aDay = a.day.trim().toLowerCase();
          if (aDay !== day.toLowerCase()) return false;

          const aPeriod = a.period.trim().toLowerCase();
          const pName = period.name.trim().toLowerCase();
          return (
            aPeriod === periodKey.toLowerCase() ||
            aPeriod === periodKeySpaced.toLowerCase() ||
            aPeriod === pName ||
            aPeriod.includes(pName) ||
            (a.periodName && a.periodName.trim().toLowerCase() === pName)
          );
        });

        const scheduledSubject = match ? match.subject : 'Self Study / Free Period';
        const assignedTeacher = match ? teachers.find(t => t.id === match.teacherId) : null;
        const scheduledTeacherName = assignedTeacher ? assignedTeacher.name : (match?.customNote || '—');

        const existingRecord = journalRecords[entryId];

        if (existingRecord) {
          entries.push(existingRecord);
        } else {
          // Pre-populate defaults
          const defaultEntry: ClassJournalEntry = {
            id: entryId,
            className: selectedClass,
            stream: selectedStream,
            week: selectedWeek,
            day,
            periodNumber: periodIndex,
            periodName: period.name,
            timeRange: `${period.start} - ${period.end}`,
            scheduledSubject,
            scheduledTeacherName,
            scheduledTeacherId: assignedTeacher?.id,
            status: scheduledSubject === 'Self Study / Free Period' ? 'FREE_PERIOD' : 'TAUGHT',
            topicTaught: '',
            studentsPresent: classStudentCount,
            totalStudentsInClass: classStudentCount,
            teacherSignature: '',
            teacherSignedAt: undefined,
            teacherRemarks: '',
            monitorConfirmed: false,
            monitorName,
            monitorConfirmedAt: undefined,
            monitorRemarks: ''
          };
          entries.push(defaultEntry);
        }
      });
    });

    return entries;
  }, [workingDays, periodSettings, selectedClass, selectedStream, selectedWeek, assignments, teachers, journalRecords, monitorName, classStudentCount]);

  // Ensure entries exist in storage
  useEffect(() => {
    let hasNew = false;
    const newRecords = { ...journalRecords };
    weekJournalEntries.forEach(entry => {
      if (!newRecords[entry.id]) {
        newRecords[entry.id] = entry;
        hasNew = true;
      }
    });
    if (hasNew) {
      setJournalRecords(newRecords);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newRecords));
      } catch {}
    }
  }, [weekJournalEntries, storageKey]);

  // Filtered entries according to Day selection
  const displayedEntries = useMemo(() => {
    if (selectedDayView === 'All') {
      return weekJournalEntries;
    }
    return weekJournalEntries.filter(e => e.day.toLowerCase() === selectedDayView.toLowerCase());
  }, [weekJournalEntries, selectedDayView]);

  // Weekly Analytics Summary
  const stats = useMemo(() => {
    const total = weekJournalEntries.length;
    const taught = weekJournalEntries.filter(e => e.status === 'TAUGHT').length;
    const standIn = weekJournalEntries.filter(e => e.status === 'STAND_IN').length;
    const notTaught = weekJournalEntries.filter(e => e.status === 'NOT_TAUGHT').length;
    const monitorConfirmed = weekJournalEntries.filter(e => e.monitorConfirmed).length;
    const teacherSigned = weekJournalEntries.filter(e => e.teacherSignature && e.teacherSignature.trim().length > 0).length;

    const teachingRate = total > 0 ? Math.round(((taught + standIn) / total) * 100) : 0;
    const monitorVerificationRate = total > 0 ? Math.round((monitorConfirmed / total) * 100) : 0;

    return {
      total,
      taught,
      standIn,
      notTaught,
      monitorConfirmed,
      teacherSigned,
      teachingRate,
      monitorVerificationRate
    };
  }, [weekJournalEntries]);

  // Quick action: Monitor confirms all taught periods for current day
  const handleBatchConfirmByMonitor = (dayName: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const targetDay = dayName === 'All' ? null : dayName;

    const updated = { ...journalRecords };
    weekJournalEntries.forEach(entry => {
      if (!targetDay || entry.day.toLowerCase() === targetDay.toLowerCase()) {
        updated[entry.id] = {
          ...entry,
          monitorConfirmed: true,
          monitorName: monitorName || 'Kiranja wa Darasa',
          monitorConfirmedAt: entry.monitorConfirmedAt || now
        };
      }
    });

    setJournalRecords(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  // Quick action: Teacher signs all their periods for the week
  const handleBatchSignAsCurrentTeacher = () => {
    const teacherName = currentUser?.fullName || currentUser?.email || 'Mwalimu wa Somo';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = { ...journalRecords };
    weekJournalEntries.forEach(entry => {
      const isTeacherMatch = currentUser?.role === 'TEACHER'
        ? (entry.scheduledTeacherName.toLowerCase().includes(teacherName.toLowerCase()) || teacherName.toLowerCase().includes(entry.scheduledTeacherName.toLowerCase()))
        : true;

      if (isTeacherMatch && entry.status === 'TAUGHT') {
        updated[entry.id] = {
          ...entry,
          teacherSignature: entry.teacherSignature || teacherName,
          teacherSignedAt: entry.teacherSignedAt || now
        };
      }
    });

    setJournalRecords(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  // Print official class journal
  const handlePrintJournal = () => {
    printFormattedSection(
      'official-class-journal-printable',
      `Official Class Journal - ${selectedClass} ${selectedStream} (${selectedWeek})`,
      schoolInfo?.name || 'KIOMONI SECONDARY SCHOOL',
      {
        orientation: 'landscape',
        pageSize: 'A4',
        margin: '5mm',
        hideLetterhead: true
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider">
                Shajara ya Darasa (Class Journal)
              </span>
              <span className="text-xs text-blue-200 font-semibold">
                Official Classroom Period Log &amp; Monitoring Book
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Shajara ya Vipindi Darasani</span>
              <span className="text-blue-300 font-normal text-base md:text-lg">
                ({selectedClass} - {selectedStream})
              </span>
            </h2>
            <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
              Shajara hii inatengenezwa kiotomatiki kutoka kwenye Ratiba Kuu ya Vipindi. Kiranja wa darasa 
              (Class Monitor) anathibitisha kufanyika kwa kipindi, na kila mwalimu anayefundisha anasaini na 
              kuweka mada iliyofundishwa kwa wiki nzima.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintJournal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Chapisha Shajara (Print / PDF)</span>
            </button>
            <button
              type="button"
              onClick={handleBatchSignAsCurrentTeacher}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Saini vipindi vyako vilivyofundishwa kiotomatiki"
            >
              <PenTool className="w-4 h-4 text-amber-300" />
              <span>Saini Kama Mwalimu</span>
            </button>
            <button
              type="button"
              onClick={() => handleBatchConfirmByMonitor(selectedDayView)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Kiranja anathibitisha vipindi vyote vilivyofundishwa"
            >
              <CheckCheck className="w-4 h-4 text-emerald-300" />
              <span>Thibitisha Vyote (Kiranja)</span>
            </button>
          </div>
        </div>

        {/* Ambient watermark */}
        <BookOpen className="w-72 h-72 text-white/5 absolute -right-10 -bottom-16 pointer-events-none" />
      </div>

      {/* Filter and Configuration Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Class Select */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Darasa (Class):
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            >
              {classList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stream Select */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Mkondo (Stream):
            </label>
            <select
              value={selectedStream}
              onChange={e => setSelectedStream(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            >
              {availableStreams.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Week Select */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Wiki ya Masomo (Week):
            </label>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            >
              {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'].map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Class Monitor Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
              <span>Kiranja wa Darasa:</span>
              <span className="text-[10px] text-blue-600 font-semibold">Monitor</span>
            </label>
            <input
              type="text"
              value={monitorName}
              onChange={e => handleSaveMonitorName(e.target.value)}
              placeholder="Jina la Kiranja wa Darasa..."
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            />
          </div>

          {/* Class Teacher Name */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
              <span>Mwalimu wa Darasa:</span>
              <span className="text-[10px] text-indigo-600 font-semibold">Class Teacher</span>
            </label>
            <input
              type="text"
              value={classTeacherName}
              onChange={e => handleSaveClassTeacherName(e.target.value)}
              placeholder="Jina la Mwalimu wa Darasa..."
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Siku:
            </span>
            <button
              type="button"
              onClick={() => setSelectedDayView('All')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                selectedDayView === 'All'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Juma Zima (All Week: Mon - Fri)
            </button>
            {workingDays.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDayView(day)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  selectedDayView === day
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Wanafunzi Darasani: <strong>{classStudentCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Jumla ya Vipindi
          </span>
          <div className="text-xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[10px] text-slate-500">Scheduled Periods</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Vilivyofundishwa
          </span>
          <div className="text-xl font-black text-emerald-700">{stats.taught}</div>
          <p className="text-[10px] text-slate-500">Taught by Scheduled Teacher</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
            Vilivyoshikiziwa
          </span>
          <div className="text-xl font-black text-amber-700">{stats.standIn}</div>
          <p className="text-[10px] text-slate-500">Relief / Stand-in Teachers</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
            Havikufundishwa
          </span>
          <div className="text-xl font-black text-rose-700">{stats.notTaught}</div>
          <p className="text-[10px] text-slate-500">Absent / Missed Periods</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            Uthibitisho Kiranja
          </span>
          <div className="text-xl font-black text-blue-700">
            {stats.monitorConfirmed} <span className="text-xs text-slate-400">/ {stats.total}</span>
          </div>
          <p className="text-[10px] text-slate-500">{stats.monitorVerificationRate}% Verified by Monitor</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
            Kiwango cha Kufundisha
          </span>
          <div className="text-xl font-black text-indigo-700">{stats.teachingRate}%</div>
          <p className="text-[10px] text-slate-500">Weekly Teaching Compliance</p>
        </div>
      </div>

      {/* Main Journal Table / Logbook */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Orodha ya Shajara ya Vipindi (Period Journal Ledger)</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {displayedEntries.length} Vipindi
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kila kipindi kinathibitishwa na kiranja wa darasa na kusainiwa na mwalimu husika wa somo.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Mwalimu wa Darasa:</span>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {classTeacherName}
            </span>
          </div>
        </div>

        {/* Table of Journal Entries */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 w-28">Siku &amp; Muda</th>
                <th className="p-3 w-36">Somo &amp; Mwalimu</th>
                <th className="p-3 w-32 text-center">Hali ya Kipindi</th>
                <th className="p-3 min-w-[200px]">Mada Iliyofundishwa (Topic)</th>
                <th className="p-3 w-24 text-center">Mahudhurio</th>
                <th className="p-3 min-w-[170px]">Sahihi ya Mwalimu</th>
                <th className="p-3 min-w-[190px]">Uthibitisho wa Kiranja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    Hakuna vipindi vilivyopangwa kwa siku hii kwenye ratiba.
                  </td>
                </tr>
              ) : (
                displayedEntries.map((entry, idx) => {
                  const isTaught = entry.status === 'TAUGHT';
                  const isStandIn = entry.status === 'STAND_IN';
                  const isNotTaught = entry.status === 'NOT_TAUGHT';
                  const isFree = entry.status === 'FREE_PERIOD';

                  return (
                    <tr 
                      key={entry.id} 
                      className={`hover:bg-blue-50/40 transition-colors ${
                        entry.monitorConfirmed ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Period # */}
                      <td className="p-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Day & Time */}
                      <td className="p-3 space-y-0.5">
                        <span className="font-extrabold text-slate-900 block">{entry.day}</span>
                        <span className="text-[11px] font-bold text-blue-700 block">{entry.periodName}</span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {entry.timeRange}
                        </span>
                      </td>

                      {/* Scheduled Subject & Teacher */}
                      <td className="p-3 space-y-1">
                        <span className="font-extrabold text-slate-900 block">{entry.scheduledSubject}</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{entry.scheduledTeacherName}</span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-3 text-center">
                        <select
                          value={entry.status}
                          onChange={e => updateJournalEntry(entry.id, { status: e.target.value as any })}
                          className={`w-full text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                            isTaught 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : isStandIn 
                              ? 'bg-amber-50 text-amber-800 border-amber-300' 
                              : isNotTaught 
                              ? 'bg-rose-50 text-rose-800 border-rose-300' 
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="TAUGHT">✓ Imefundishwa</option>
                          <option value="STAND_IN">⇄ Alishikiziwa</option>
                          <option value="NOT_TAUGHT">✗ Haikufundishwa</option>
                          <option value="FREE_PERIOD">— Kipindi Huru</option>
                        </select>
                        {isStandIn && (
                          <input
                            type="text"
                            placeholder="Mwalimu mshikizi..."
                            value={entry.actualTeacherName || ''}
                            onChange={e => updateJournalEntry(entry.id, { actualTeacherName: e.target.value })}
                            className="w-full mt-1 px-1.5 py-0.5 text-[10px] border border-amber-300 rounded bg-white text-amber-900"
                          />
                        )}
                      </td>

                      {/* Topic Covered */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={entry.topicTaught}
                          onChange={e => updateJournalEntry(entry.id, { topicTaught: e.target.value })}
                          placeholder={isNotTaught ? 'Sababu ya kutofundishwa...' : 'Mada / Subtopic iliyofundishwa...'}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                        />
                      </td>

                      {/* Attendance (Students present) */}
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            min="0"
                            max={classStudentCount}
                            value={entry.studentsPresent}
                            onChange={e => updateJournalEntry(entry.id, { studentsPresent: parseInt(e.target.value, 10) || 0 })}
                            className="w-12 px-1.5 py-1 text-center font-bold text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">/{classStudentCount}</span>
                        </div>
                      </td>

                      {/* Teacher Signature & Remarks */}
                      <td className="p-3 space-y-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={entry.teacherSignature}
                            onChange={e => updateJournalEntry(entry.id, { 
                              teacherSignature: e.target.value,
                              teacherSignedAt: e.target.value ? (entry.teacherSignedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : undefined
                            })}
                            placeholder="Sahihi ya mwalimu..."
                            className="flex-1 px-2 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                          />
                          {!entry.teacherSignature && (
                            <button
                              type="button"
                              onClick={() => {
                                const tName = currentUser?.fullName || entry.scheduledTeacherName;
                                const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                updateJournalEntry(entry.id, {
                                  teacherSignature: tName,
                                  teacherSignedAt: now
                                });
                              }}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition-colors cursor-pointer shrink-0"
                              title="Saini papo hapo"
                            >
                              Saini
                            </button>
                          )}
                        </div>
                        {entry.teacherSignedAt && (
                          <span className="text-[9px] text-slate-400 font-mono block">
                            Muda: {entry.teacherSignedAt}
                          </span>
                        )}
                      </td>

                      {/* Monitor Confirmation (Uthibitisho wa Kiranja) */}
                      <td className="p-3 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const willConfirm = !entry.monitorConfirmed;
                              const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              updateJournalEntry(entry.id, {
                                monitorConfirmed: willConfirm,
                                monitorName: monitorName || 'Kiranja wa Darasa',
                                monitorConfirmedAt: willConfirm ? now : undefined
                              });
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              entry.monitorConfirmed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            {entry.monitorConfirmed ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>✓ Imethibitishwa</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>Thibitisha (Kiranja)</span>
                              </>
                            )}
                          </button>
                        </div>
                        {entry.monitorConfirmed && (
                          <div className="text-[10px] text-emerald-700 font-medium">
                            <span>Na: <strong>{entry.monitorName}</strong></span>
                            {entry.monitorConfirmedAt && <span className="text-slate-400 ml-1">({entry.monitorConfirmedAt})</span>}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Miongozo ya Shajara:</span>
            <span>Kiranja anathibitisha kila kipindi kikiisha • Mwalimu anasaini baada ya kufundisha.</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Haby Edu Pro • Official School Academic Journal Module</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* HIDDEN PRINTABLE CONTAINER FOR OFFICIAL EXPORT / PRINTING */}
      {/* ------------------------------------------------------------- */}
      <div id="official-class-journal-printable" className="hidden print:block bg-white text-slate-900 p-6 font-sans">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase text-blue-900 tracking-wider">
              {schoolInfo?.name || 'KIOMONI SECONDARY SCHOOL'}
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              {schoolInfo?.address || 'P.O. BOX 145, TANGA, TANZANIA'} • TEL: {schoolInfo?.phone || '0717616343'}
            </p>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 mt-1">
              SHAJARA RASMI YA DARASA NA UFUATILIAJI WA VIPINDI (OFFICIAL CLASS JOURNAL)
            </p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <div className="font-black text-slate-900">DARASA: <span className="text-blue-900">{selectedClass} - {selectedStream}</span></div>
            <div className="font-bold text-slate-700">WIKI YA MASOMO: <span className="text-blue-900">{selectedWeek}</span></div>
            <div className="text-[10px] text-slate-500">Tarehe ya Kuchapishwa: {new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        {/* Particulars Bar */}
        <div className="bg-slate-100 border border-slate-400 p-2 rounded mb-3 grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Kiranja wa Darasa:</span>
            <span className="font-extrabold text-slate-900">{monitorName}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Mwalimu wa Darasa:</span>
            <span className="font-extrabold text-slate-900">{classTeacherName}</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Wanafunzi Waliosajiliwa:</span>
            <span className="font-extrabold text-slate-900">{classStudentCount} Wanafunzi</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block text-[10px] uppercase">Kiwango cha Kufundisha:</span>
            <span className="font-extrabold text-emerald-800">{stats.teachingRate}% ({stats.taught + stats.standIn}/{stats.total} Vipindi)</span>
          </div>
        </div>

        {/* Printable Table */}
        <table className="w-full text-left border-collapse text-[10px] border border-slate-900">
          <thead>
            <tr className="bg-slate-900 text-white font-extrabold uppercase">
              <th className="p-1.5 border border-slate-900 text-center w-8">#</th>
              <th className="p-1.5 border border-slate-900 w-24">Siku &amp; Muda</th>
              <th className="p-1.5 border border-slate-900 w-32">Somo &amp; Mwalimu</th>
              <th className="p-1.5 border border-slate-900 w-20 text-center">Hali</th>
              <th className="p-1.5 border border-slate-900">Mada Iliyofundishwa (Topic)</th>
              <th className="p-1.5 border border-slate-900 w-16 text-center">Mahudhurio</th>
              <th className="p-1.5 border border-slate-900 w-28">Sahihi ya Mwalimu</th>
              <th className="p-1.5 border border-slate-900 w-28">Uthibitisho wa Kiranja</th>
            </tr>
          </thead>
          <tbody>
            {weekJournalEntries.map((entry, idx) => (
              <tr key={entry.id} className="border-b border-slate-300">
                <td className="p-1 border border-slate-300 text-center font-bold">{idx + 1}</td>
                <td className="p-1 border border-slate-300">
                  <div className="font-bold">{entry.day}</div>
                  <div className="text-[9px] text-slate-600">{entry.periodName} ({entry.timeRange})</div>
                </td>
                <td className="p-1 border border-slate-300">
                  <div className="font-extrabold text-slate-900">{entry.scheduledSubject}</div>
                  <div className="text-[9px] text-slate-600">{entry.scheduledTeacherName}</div>
                </td>
                <td className="p-1 border border-slate-300 text-center font-bold">
                  {entry.status === 'TAUGHT' ? '✓ Imefundishwa' :
                   entry.status === 'STAND_IN' ? `⇄ Ushikizi (${entry.actualTeacherName || 'Stand-in'})` :
                   entry.status === 'NOT_TAUGHT' ? '✗ Haikufundishwa' : '— Huru'}
                </td>
                <td className="p-1 border border-slate-300 font-medium">
                  {entry.topicTaught || '—'}
                </td>
                <td className="p-1 border border-slate-300 text-center font-bold">
                  {entry.studentsPresent} / {classStudentCount}
                </td>
                <td className="p-1 border border-slate-300 font-bold">
                  {entry.teacherSignature ? (
                    <div>
                      <span>{entry.teacherSignature}</span>
                      {entry.teacherSignedAt && <span className="text-[8px] text-slate-500 block">{entry.teacherSignedAt}</span>}
                    </div>
                  ) : '—'}
                </td>
                <td className="p-1 border border-slate-300">
                  {entry.monitorConfirmed ? (
                    <div className="text-emerald-800 font-bold">
                      <span>✓ {entry.monitorName}</span>
                      {entry.monitorConfirmedAt && <span className="text-[8px] text-slate-500 block">{entry.monitorConfirmedAt}</span>}
                    </div>
                  ) : 'Haikuthibitishwa'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Weekly Endorsement / Sign-off Block */}
        <div className="mt-4 pt-3 border-t border-slate-400 grid grid-cols-3 gap-4 text-[10px]">
          <div>
            <span className="font-bold uppercase block text-slate-600">Kiranja wa Darasa (Class Monitor):</span>
            <div className="mt-2 border-b border-dotted border-slate-600 pb-1 font-bold">
              Jina: {monitorName}
            </div>
            <div className="mt-1 text-slate-500">Sahihi: ______________________ Tarehe: _________</div>
          </div>
          <div>
            <span className="font-bold uppercase block text-slate-600">Mwalimu wa Darasa (Class Teacher):</span>
            <div className="mt-2 border-b border-dotted border-slate-600 pb-1 font-bold">
              Jina: {classTeacherName}
            </div>
            <div className="mt-1 text-slate-500">Sahihi: ______________________ Tarehe: _________</div>
          </div>
          <div>
            <span className="font-bold uppercase block text-slate-600">Mkuu wa Shule / Taaluma (Head of School):</span>
            <div className="mt-2 border-b border-dotted border-slate-600 pb-1 font-bold">
              Mhuri &amp; Sahihi: {schoolInfo?.principal || 'Headmaster'}
            </div>
            <div className="mt-1 text-slate-500">Sahihi: ______________________ Tarehe: _________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
