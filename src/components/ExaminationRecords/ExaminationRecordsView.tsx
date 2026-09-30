import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  ArrowUpDown, 
  GraduationCap, 
  TrendingUp, 
  Award, 
  Calendar, 
  Share2, 
  ArrowRightLeft, 
  Play, 
  History, 
  CheckCircle2, 
  Eye, 
  Layers, 
  Download, 
  Printer, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  Users,
  ChevronDown,
  X,
  MessageSquare
} from 'lucide-react';
import { 
  ExaminationRecord, 
  Student, 
  SchoolInfo, 
  PromotionHistory, 
  TransferHistory, 
  ExamTerm, 
  RecordExamType 
} from '../../types';
import { 
  ALL_SCHOOL_CLASSES, 
  NURSERY_CLASSES, 
  PRIMARY_CLASSES, 
  SECONDARY_CLASSES 
} from '../../constants/defaults';
import { getGradeColor, getGradeRemark, detectCalendarType } from '../../utils/examinationRecordsUtils';
import { StudentYearlyProfileModal } from './StudentYearlyProfileModal';
import { StudentTransferModal } from './StudentTransferModal';
import { AutoPromotionModal } from './AutoPromotionModal';
import { HistoryAuditModal } from './HistoryAuditModal';
import { BulkWhatsAppModal } from './BulkWhatsAppModal';

interface ExaminationRecordsViewProps {
  students: Student[];
  examinationRecords: ExaminationRecord[];
  promotionHistory: PromotionHistory[];
  transferHistory: TransferHistory[];
  schoolInfo: SchoolInfo;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateExaminationRecords: (records: ExaminationRecord[]) => void;
  onUpdatePromotionHistory: (history: PromotionHistory[]) => void;
  onUpdateTransferHistory: (history: TransferHistory[]) => void;
  currentUserName?: string;
}

export type ViewToggleMode = 'marks' | 'grade' | 'both';
export type SortOption = 
  | 'name_asc' 
  | 'name_desc' 
  | 'rank_asc' 
  | 'rank_desc' 
  | 'avg_desc' 
  | 'avg_asc' 
  | 'total_desc' 
  | 'total_asc';

export type QuickGradeFilter = 'ALL' | 'A' | 'B' | 'C' | 'D' | 'F' | 'TOP_10' | 'BOTTOM_10' | 'FAILED';

export const ExaminationRecordsView: React.FC<ExaminationRecordsViewProps> = ({
  students,
  examinationRecords,
  promotionHistory,
  transferHistory,
  schoolInfo,
  onUpdateStudents,
  onUpdateExaminationRecords,
  onUpdatePromotionHistory,
  onUpdateTransferHistory,
  currentUserName = 'Academic Master'
}) => {
  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedStream, setSelectedStream] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<string>('All');
  const [selectedExamType, setSelectedExamType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 3 Instant View Toggles: Marks (78), Grade (B), Both (78 B)
  const [viewToggle, setViewToggle] = useState<ViewToggleMode>('both');

  // Instant Sorting
  const [sortBy, setSortBy] = useState<SortOption>('rank_asc');

  // Quick Grade & Ranking Filters
  const [gradeFilter, setGradeFilter] = useState<QuickGradeFilter>('ALL');

  // Modals state
  const [profileModalStudent, setProfileModalStudent] = useState<Student | null>(null);
  const [transferModalStudent, setTransferModalStudent] = useState<Student | null>(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isBulkWhatsAppOpen, setIsBulkWhatsAppOpen] = useState<boolean>(false);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState<boolean>(false);

  // Available Academic Years from records
  const availableYears = useMemo(() => {
    const set = new Set<string>(['2026', '2025', '2024']);
    examinationRecords.forEach(r => {
      if (r.academicYear) set.add(r.academicYear);
    });
    return Array.from(set).sort().reverse();
  }, [examinationRecords]);

  // Available Streams for selected class
  const availableStreams = useMemo(() => {
    const set = new Set<string>();
    examinationRecords.forEach(r => {
      if ((selectedClass === 'All' || r.className === selectedClass) && r.stream) {
        set.add(r.stream);
      }
    });
    students.forEach(s => {
      if ((selectedClass === 'All' || s.className === selectedClass) && s.stream) {
        set.add(s.stream);
      }
    });
    return Array.from(set).sort();
  }, [examinationRecords, students, selectedClass]);

  // Handle inline remarks updates
  const handleUpdateRemarks = (recordId: string, remarks: string) => {
    const updated = examinationRecords.map(r => r.id === recordId ? { ...r, teacherRemarks: remarks } : r);
    onUpdateExaminationRecords(updated);
  };

  // Filtered examination records
  const filteredRecords = useMemo(() => {
    let list = examinationRecords.filter(r => {
      const matchYear = selectedYear === 'All' || r.academicYear === selectedYear;
      const matchClass = selectedClass === 'All' || r.className === selectedClass;
      const matchStream = selectedStream === 'All' || r.stream === selectedStream || (!r.stream && selectedStream === 'All');
      const matchTerm = selectedTerm === 'All' || r.term === selectedTerm;
      const matchExam = selectedExamType === 'All' || r.examType === selectedExamType;
      const matchSearch = !searchQuery.trim() || 
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.studentId).includes(searchQuery);

      return matchYear && matchClass && matchStream && matchTerm && matchExam && matchSearch;
    });

    // Apply Grade & Ranking Quick Filters
    if (gradeFilter === 'A') {
      list = list.filter(r => r.overallGrade === 'A');
    } else if (gradeFilter === 'B') {
      list = list.filter(r => r.overallGrade === 'B');
    } else if (gradeFilter === 'C') {
      list = list.filter(r => r.overallGrade === 'C');
    } else if (gradeFilter === 'D') {
      list = list.filter(r => r.overallGrade === 'D');
    } else if (gradeFilter === 'F' || gradeFilter === 'FAILED') {
      list = list.filter(r => r.overallGrade === 'F');
    }

    // Apply Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.studentName.localeCompare(b.studentName);
        case 'name_desc':
          return b.studentName.localeCompare(a.studentName);
        case 'rank_asc':
          return (a.positionInClass || 999) - (b.positionInClass || 999);
        case 'rank_desc':
          return (b.positionInClass || 0) - (a.positionInClass || 0);
        case 'avg_desc':
          return b.averageMarks - a.averageMarks;
        case 'avg_asc':
          return a.averageMarks - b.averageMarks;
        case 'total_desc':
          return b.totalMarks - a.totalMarks;
        case 'total_asc':
          return a.totalMarks - b.totalMarks;
        default:
          return 0;
      }
    });

    // Top 10 & Bottom 10
    if (gradeFilter === 'TOP_10') {
      return list.slice(0, 10);
    } else if (gradeFilter === 'BOTTOM_10') {
      return list.slice(-10);
    }

    return list;
  }, [examinationRecords, selectedYear, selectedClass, selectedTerm, selectedExamType, searchQuery, gradeFilter, sortBy]);

  // Gender-wise summary for Division (Form 1 - 4) and Grades (A, B, C, D, F)
  const genderSummary = useMemo(() => {
    const divBreakdown: Record<string, { B: number; G: number; T: number }> = {
      'I': { B: 0, G: 0, T: 0 },
      'II': { B: 0, G: 0, T: 0 },
      'III': { B: 0, G: 0, T: 0 },
      'IV': { B: 0, G: 0, T: 0 },
      '0': { B: 0, G: 0, T: 0 }
    };

    const gradeBreakdown: Record<string, { B: number; G: number; T: number }> = {
      'A': { B: 0, G: 0, T: 0 },
      'B': { B: 0, G: 0, T: 0 },
      'C': { B: 0, G: 0, T: 0 },
      'D': { B: 0, G: 0, T: 0 },
      'F': { B: 0, G: 0, T: 0 }
    };

    let totalBoys = 0;
    let totalGirls = 0;

    filteredRecords.forEach(rec => {
      const matchSt = students.find(s => s.id === rec.studentId);
      const gender = (rec.gender || matchSt?.gender || '').toLowerCase();
      const isGirl = gender.startsWith('f') || gender.includes('female');
      const isBoy = !isGirl;

      if (isGirl) totalGirls++;
      else totalBoys++;

      // Division breakdown
      const divRaw = (rec.division || '').replace(/^DIV\s*/i, '').trim();
      if (divBreakdown[divRaw]) {
        if (isGirl) divBreakdown[divRaw].G++;
        else divBreakdown[divRaw].B++;
        divBreakdown[divRaw].T++;
      } else if (rec.overallGrade === 'F') {
        if (isGirl) divBreakdown['0'].G++;
        else divBreakdown['0'].B++;
        divBreakdown['0'].T++;
      }

      // Grade breakdown
      const g = rec.overallGrade || 'F';
      if (gradeBreakdown[g]) {
        if (isGirl) gradeBreakdown[g].G++;
        else gradeBreakdown[g].B++;
        gradeBreakdown[g].T++;
      }
    });

    return {
      divBreakdown,
      gradeBreakdown,
      totalBoys,
      totalGirls,
      total: filteredRecords.length
    };
  }, [filteredRecords, students]);

  // Aggregate subjects in current records for dynamic table headers
  const activeSubjectKeys = useMemo(() => {
    const keys = new Set<string>();
    filteredRecords.forEach(r => {
      if (r.subjects) {
        Object.keys(r.subjects).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [filteredRecords]);

  // Counts for Promotion readiness
  const janDecStudentsCount = students.filter(s => detectCalendarType(s.className) === 'JAN-DEC' && !s.className.includes('Graduated')).length;
  const julyJuneStudentsCount = students.filter(s => detectCalendarType(s.className) === 'JULY-JUNE' && !s.className.includes('Graduated')).length;

  // Handle Transfer execution
  const handleConfirmTransfer = (transferEntry: TransferHistory) => {
    const updatedTransferHistory = [transferEntry, ...transferHistory];
    onUpdateTransferHistory(updatedTransferHistory);

    // Update student's class
    const cleanClassName = transferEntry.toClass.split(' - ')[0] || transferEntry.toClass;
    const cleanStream = transferEntry.toClass.split(' - ')[1] || 'STREAM A';

    const updatedStudents = students.map(s => {
      if (s.id === transferEntry.studentId) {
        return {
          ...s,
          className: cleanClassName,
          stream: cleanStream
        };
      }
      return s;
    });

    onUpdateStudents(updatedStudents);
  };

  // Handle Promotion execution
  const handleExecutePromotion = (promotedStudents: Student[], historyLogs: PromotionHistory[]) => {
    onUpdateStudents(promotedStudents);
    onUpdatePromotionHistory([...historyLogs, ...promotionHistory]);
  };

  // WhatsApp individual student results
  const handleWhatsAppStudent = (rec: ExaminationRecord) => {
    const pointsStr = rec.points !== undefined && rec.points !== null ? String(rec.points) : '-';
    const divStr = rec.division || rec.overallGrade || '-';
    const remarks = getGradeRemark(rec.overallGrade);

    const subjectStrings: string[] = [];
    if (rec.subjects) {
      Object.entries(rec.subjects).forEach(([subName, info]) => {
        subjectStrings.push(`${subName}: ${info.marks}/100 (${info.grade})`);
      });
    }
    const subjectsText = subjectStrings.length > 0 ? subjectStrings.join(', ') : 'None';
    const streamText = rec.stream ? `Stream ${rec.stream}` : '';

    const text = `HABY EDUPRO - ${schoolInfo.name.toUpperCase()}
Name: ${rec.studentName} Class: ${rec.className} ${streamText} Year: ${rec.academicYear} Term: ${rec.term} Exam: ${rec.examType}
${subjectsText}
Total: ${rec.totalMarks} Avg: ${rec.averageMarks}% Points: ${pointsStr} Div: ${divStr} Pos: ${rec.positionInClass}/${rec.totalStudents} Remarks: ${remarks}`;

    const phoneDigits = (rec.parentPhone || '').replace(/[^0-9]/g, '');
    const url = phoneDigits
      ? `https://wa.me/${phoneDigits.startsWith('0') ? '255' + phoneDigits.slice(1) : phoneDigits}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="bg-gradient-to-r from-[#0f2948] via-[#1f4d8b] to-[#1e3a8a] text-white rounded-2xl p-6 shadow-md border border-blue-900 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400 text-slate-900 rounded-xl font-black shadow-sm">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Examination Records & Academic Ledger</h1>
                <p className="text-blue-200 text-xs mt-0.5">
                  Official examination records, grades (A/B/C/D/F), NECTA divisions & points, transfers and automatic promotion
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-4 flex items-center gap-4 flex-wrap text-xs">
              <div className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-blue-200 block text-[10px]">Registered Records:</span>
                <strong className="text-white font-black text-sm">{examinationRecords.length}</strong>
              </div>
              <div className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-blue-200 block text-[10px]">JAN-DEC Calendar (Std 1-7, Form 1-4):</span>
                <strong className="text-emerald-300 font-bold">{janDecStudentsCount} Students</strong>
              </div>
              <div className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-xs">
                <span className="text-blue-200 block text-[10px]">JULY-JUNE Calendar (Form 5-6):</span>
                <strong className="text-purple-300 font-bold">{julyJuneStudentsCount} Students</strong>
              </div>
            </div>
          </div>

          {/* Action Center Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPdfExportModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-[0.98] border border-blue-400"
              title="Export results ledger as clean, printable PDF with remarks and signatures"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>Export Results PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkWhatsAppOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-black rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-[0.98] border border-emerald-400"
              title="Send results to whole class parents via WhatsApp automatically"
            >
              <Share2 className="w-4 h-4 text-emerald-200" />
              <span>Send Bulk Results to WhatsApp (Whole Class)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition cursor-pointer backdrop-blur-xs"
            >
              <History className="w-4 h-4 text-amber-300" />
              <span>History Logs ({promotionHistory.length + transferHistory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPromotionModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Run Promotion Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, Search, View Toggles & Sorting */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
        {/* Primary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Year selector */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              Academic Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="All">All Years</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Year {yr}</option>
              ))}
            </select>
          </div>

          {/* Class selector */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              Class Level (Nursery - Form 6)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStream('All');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="All">All Classes</option>
              <optgroup label="NURSERY LEVEL">
                {NURSERY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="PRIMARY LEVEL (Std 1 - 7)">
                {PRIMARY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="SECONDARY LEVEL (Form 1 - 6)">
                {SECONDARY_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Stream selector */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              Stream
            </label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="All">All Streams</option>
              {availableStreams.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Term selector */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="All">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          {/* Exam Type selector */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="All">All Exam Types</option>
              <option value="Monthly">Monthly Test</option>
              <option value="Midterm">Midterm Examination</option>
              <option value="Terminal">Terminal Examination</option>
              <option value="Annual">Annual Examination</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
              Search Candidate
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or ID..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* View Toggle (Marks / Grade / Both) & Sorting Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* 3 Instant View Toggles */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">View Mode:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewToggle('marks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  viewToggle === 'marks'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Marks (78)
              </button>
              <button
                type="button"
                onClick={() => setViewToggle('grade')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  viewToggle === 'grade'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grade (B)
              </button>
              <button
                type="button"
                onClick={() => setViewToggle('both')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                  viewToggle === 'both'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Both (78 B)
              </button>
            </div>
          </div>

          {/* Instant Sorting Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="rank_asc">Rank (1 → Last)</option>
              <option value="rank_desc">Rank (Last → 1)</option>
              <option value="name_asc">Candidate Name (A - Z)</option>
              <option value="name_desc">Candidate Name (Z - A)</option>
              <option value="avg_desc">Average (High - Low)</option>
              <option value="avg_asc">Average (Low - High)</option>
              <option value="total_desc">Total Marks (High - Low)</option>
              <option value="total_asc">Total Marks (Low - High)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips: Grade A, B, C, D, F, Top10, Bottom10, Failed */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Filters:</span>
          {(
            [
              { id: 'ALL', label: 'All Candidates' },
              { id: 'A', label: 'Grade A (80-100)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { id: 'B', label: 'Grade B (60-79)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
              { id: 'C', label: 'Grade C (45-59)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
              { id: 'D', label: 'Grade D (30-44)', color: 'text-orange-700 bg-orange-50 border-orange-200' },
              { id: 'F', label: 'Grade F (0-29)', color: 'text-rose-700 bg-rose-50 border-rose-200' },
              { id: 'TOP_10', label: 'Top 10 Ranked', color: 'text-purple-700 bg-purple-50 border-purple-200' },
              { id: 'BOTTOM_10', label: 'Bottom 10 Ranked', color: 'text-slate-700 bg-slate-100 border-slate-300' },
              { id: 'FAILED', label: 'Failed (Grade F)', color: 'text-rose-800 bg-rose-100 border-rose-300' }
            ] as const
          ).map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setGradeFilter(chip.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                gradeFilter === chip.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender-wise Summary Breakdown Card (Item 6) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Gender-Wise Performance Summary ({selectedClass !== 'All' ? selectedClass : 'All Levels'})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown filled gender-wise per level and stream for NECTA divisions and grade scale
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-slate-700">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Boys: <strong className="text-blue-700">{genderSummary.totalBoys}</strong></span>
            <span>•</span>
            <span>Girls: <strong className="text-rose-700">{genderSummary.totalGirls}</strong></span>
            <span>•</span>
            <span>Total: <strong className="text-slate-900">{genderSummary.total}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* NECTA Division Gender Breakdown */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
            <h4 className="text-xs font-black text-[#1f4d8b] uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>NECTA Division by Gender (Secondary)</span>
              <span className="text-[10px] font-bold text-blue-600">Div I (7-17) → Div 0 (34-35)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['I', 'II', 'III', 'IV', '0'] as const).map(div => {
                const item = genderSummary.divBreakdown[div] || { B: 0, G: 0, T: 0 };
                return (
                  <div key={div} className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-blue-900">DIV {div}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        T={item.T}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="text-blue-700">B = {item.B}</span>
                      <span className="text-rose-600">G = {item.G}</span>
                      <span className="text-slate-900">T = {item.T}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grade Scale Gender Breakdown */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Grade Distribution by Gender (All Levels)</span>
              <span className="text-[10px] font-bold text-emerald-700">A (80-100) → F (0-29)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['A', 'B', 'C', 'D', 'F'] as const).map(gr => {
                const item = genderSummary.gradeBreakdown[gr] || { B: 0, G: 0, T: 0 };
                return (
                  <div key={gr} className="bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-xs text-emerald-900">GRADE {gr}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                        T={item.T}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="text-blue-700">B = {item.B}</span>
                      <span className="text-rose-600">G = {item.G}</span>
                      <span className="text-slate-900">T = {item.T}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Examination Records Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-800 text-sm">
              Examination Records ({filteredRecords.length})
            </span>
            <span className="text-xs text-slate-500">
              {selectedYear !== 'All' ? `Year ${selectedYear}` : ''} 
              {selectedClass !== 'All' ? ` • ${selectedClass}` : ''}
              {selectedTerm !== 'All' ? ` • ${selectedTerm}` : ''}
            </span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Grade Scale:</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">A: 80-100</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">B: 60-79</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">C: 45-59</span>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-bold">D: 30-44</span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">F: 0-29</span>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">No examination records found matching current filters.</p>
            <p className="text-xs text-slate-400 mt-1">
              Records are added automatically when academic staff calculate and click 'Release Results to Examination Records'.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1f4d8b] text-white uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-3 w-12 text-center">Rank</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class & Stream</th>
                  <th className="p-3">Term & Exam</th>
                  {/* Subject headers */}
                  {activeSubjectKeys.slice(0, 6).map(sub => (
                    <th key={sub} className="p-3 text-center truncate max-w-[120px]" title={sub}>
                      {sub.split(' ')[0]}
                    </th>
                  ))}
                  <th className="p-3 text-center">Total</th>
                  <th className="p-3 text-center">Average</th>
                  <th className="p-3 text-center">Grade & Division</th>
                  <th className="p-3 text-left min-w-[220px]">Teacher Remarks / Comments</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.map((rec) => {
                  const matchingStudent: Student = students.find(s => s.id === rec.studentId) || {
                    id: rec.studentId,
                    name: rec.studentName,
                    gender: (rec.gender as any) || 'Male',
                    regNo: `REG${rec.studentId}`,
                    className: rec.className,
                    stream: rec.stream,
                    level: 'PRIMARY' as any,
                    dob: '2015-01-01',
                    subjects: Object.keys(rec.subjects || {})
                  };

                  const gradeStyle = getGradeColor(rec.overallGrade);

                  return (
                    <tr key={rec.id} className="hover:bg-blue-50/50 transition">
                      {/* Rank in class */}
                      <td className="p-3 text-center font-black">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                          rec.positionInClass === 1
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                            : rec.positionInClass === 2
                            ? 'bg-slate-200 text-slate-900'
                            : rec.positionInClass === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rec.positionInClass}
                        </span>
                      </td>

                      {/* Student info */}
                      <td className="p-3">
                        <div className="font-black text-slate-900 text-sm">{rec.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {rec.studentId}</div>
                      </td>

                      {/* Class & Calendar */}
                      <td className="p-3">
                        <span className="font-bold text-slate-800 block">
                          {rec.className} {rec.stream ? `(${rec.stream})` : ''}
                        </span>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          rec.academicCalendarType === 'JULY-JUNE'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.academicCalendarType}
                        </span>
                      </td>

                      {/* Term & Exam Type */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{rec.term}</span>
                        <div className="text-[11px] text-slate-500">{rec.examType} ({rec.academicYear})</div>
                      </td>

                      {/* Subject Marks with View Toggle */}
                      {activeSubjectKeys.slice(0, 6).map(sub => {
                        const info = rec.subjects?.[sub];
                        if (!info) {
                          return <td key={sub} className="p-3 text-center text-slate-300">-</td>;
                        }

                        const subGradeStyle = getGradeColor(info.grade);

                        return (
                          <td key={sub} className="p-3 text-center">
                            {viewToggle === 'marks' && (
                              <span className="font-black text-slate-900">{info.marks}</span>
                            )}
                            {viewToggle === 'grade' && (
                              <span className={`px-2 py-0.5 rounded font-black text-xs ${subGradeStyle.bg}`}>
                                {info.grade}
                              </span>
                            )}
                            {viewToggle === 'both' && (
                              <div className="inline-flex items-center gap-1 font-bold text-xs">
                                <span className="font-black text-slate-900">{info.marks}</span>
                                <span className={`px-1 rounded text-[10px] font-black ${subGradeStyle.bg}`}>
                                  {info.grade}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {/* Total Marks */}
                      <td className="p-3 text-center font-black text-slate-900">
                        {rec.totalMarks}
                      </td>

                      {/* Average Marks */}
                      <td className="p-3 text-center">
                        <span className="font-black text-emerald-700 text-sm">
                          {rec.averageMarks}%
                        </span>
                      </td>

                      {/* Overall Grade & Division */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg font-black text-xs ${gradeStyle.bg}`}>
                          Grade {rec.overallGrade}
                        </span>
                        {rec.division && (
                          <span className="block text-[10px] text-blue-700 font-bold mt-0.5">
                            Div {rec.division} {rec.points !== undefined && rec.points !== null ? `(${rec.points} pts)` : ''}
                          </span>
                        )}
                      </td>

                      {/* Inline Annotatable Teacher Remarks */}
                      <td className="p-2.5 min-w-[220px]">
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Add remark inline..."
                            value={rec.teacherRemarks || ''}
                            onChange={(e) => handleUpdateRemarks(rec.id, e.target.value)}
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:bg-amber-50 focus:border-amber-400 focus:ring-1 focus:ring-amber-300 outline-none font-medium transition"
                            title="Click to edit teacher remark inline"
                          />
                          <div className="flex items-center gap-1 flex-wrap">
                            {['Excellent', 'Very Good', 'Good Effort', 'Needs Improvement', 'Amefaulu'].map(badge => (
                              <button
                                key={badge}
                                type="button"
                                onClick={() => handleUpdateRemarks(rec.id, badge)}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 border border-slate-200 cursor-pointer transition"
                              >
                                {badge}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Report */}
                          <button
                            type="button"
                            title="View Yearly Student Profile & Report"
                            onClick={() => setProfileModalStudent(matchingStudent)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Report</span>
                          </button>

                          {/* Transfer */}
                          <button
                            type="button"
                            title="Transfer Student to Another Class or Stream"
                            onClick={() => setTransferModalStudent(matchingStudent)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Transfer</span>
                          </button>

                          {/* WhatsApp */}
                          <button
                            type="button"
                            title="Send Results to Parent via WhatsApp"
                            onClick={() => handleWhatsAppStudent(rec)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk WhatsApp Modal */}
      {isBulkWhatsAppOpen && (
        <BulkWhatsAppModal
          isOpen={isBulkWhatsAppOpen}
          onClose={() => setIsBulkWhatsAppOpen(false)}
          records={filteredRecords}
          students={students}
          schoolInfo={schoolInfo}
        />
      )}

      {/* Modals */}
      {profileModalStudent && (
        <StudentYearlyProfileModal
          isOpen={true}
          onClose={() => setProfileModalStudent(null)}
          student={profileModalStudent}
          records={filteredRecords}
          allRecords={examinationRecords}
          schoolInfo={schoolInfo}
          selectedYear={selectedYear}
        />
      )}

      {transferModalStudent && (
        <StudentTransferModal
          isOpen={true}
          onClose={() => setTransferModalStudent(null)}
          student={transferModalStudent}
          onConfirmTransfer={handleConfirmTransfer}
          currentUserName={currentUserName}
        />
      )}

      {isPromotionModalOpen && (
        <AutoPromotionModal
          isOpen={true}
          onClose={() => setIsPromotionModalOpen(false)}
          students={students}
          onExecutePromotion={handleExecutePromotion}
          currentUserName={currentUserName}
          academicYear={selectedYear}
        />
      )}

      {isHistoryModalOpen && (
        <HistoryAuditModal
          isOpen={true}
          onClose={() => setIsHistoryModalOpen(false)}
          promotionHistory={promotionHistory}
          transferHistory={transferHistory}
        />
      )}

      {/* PDF Export & Clean Printable Modal */}
      {isPdfExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="no-print bg-[#0f2948] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-xl text-blue-300">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Official Examination Results Ledger (PDF / Print)</h3>
                  <p className="text-xs text-blue-200">
                    Filtered by: {selectedClass !== 'All' ? selectedClass : 'All Classes'} • {selectedStream !== 'All' ? selectedStream : 'All Streams'} • {selectedTerm} • Year {selectedYear}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfExportModalOpen(false)}
                  className="p-2 text-white/70 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-900 bg-white" id="results-pdf-print-area">
              {/* Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-4">
                  {schoolInfo.logo && (
                    <img src={schoolInfo.logo} alt="School Logo" className="w-16 h-16 object-contain" />
                  )}
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                      {schoolInfo.name || 'HABY EDU PRO SCHOOL'}
                    </h2>
                    <p className="text-xs font-bold text-slate-600 uppercase">
                      OFFICIAL EXAMINATION LEDGER & STUDENT REPORT RECORD
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      CTR: {schoolInfo.schoolNumber || 'S.0123'} • {schoolInfo.address || 'Tanzania'} • Tel: {schoolInfo.phone || '+255...'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Metadata & Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Class Level:</span>
                  <strong className="text-slate-900 font-black">{selectedClass}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Stream:</span>
                  <strong className="text-slate-900 font-black">{selectedStream}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Academic Year:</span>
                  <strong className="text-slate-900 font-black">{selectedYear}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Term & Exam:</span>
                  <strong className="text-slate-900 font-black">{selectedTerm} ({selectedExamType})</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Candidates:</span>
                  <strong className="text-blue-900 font-black">{filteredRecords.length} Students</strong>
                </div>
              </div>

              {/* Division / Grade Summary Badges */}
              <div className="flex items-center justify-between gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex-wrap">
                <span className="font-bold text-blue-950">Cohort Summary:</span>
                <div className="flex items-center gap-3 flex-wrap text-xs font-bold">
                  <span className="text-emerald-800">Boys: {genderSummary.totalBoys}</span>
                  <span className="text-rose-800">Girls: {genderSummary.totalGirls}</span>
                  <span className="text-slate-700">|</span>
                  <span className="text-emerald-700">Div I: {genderSummary.divBreakdown['I']?.T || 0}</span>
                  <span className="text-blue-700">Div II: {genderSummary.divBreakdown['II']?.T || 0}</span>
                  <span className="text-amber-700">Div III: {genderSummary.divBreakdown['III']?.T || 0}</span>
                  <span className="text-orange-700">Div IV: {genderSummary.divBreakdown['IV']?.T || 0}</span>
                  <span className="text-rose-700">Div 0: {genderSummary.divBreakdown['0']?.T || 0}</span>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#1f4d8b] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-2.5 text-center w-10 border-r border-blue-900">Pos</th>
                      <th className="p-2.5 border-r border-blue-900">Student Name</th>
                      <th className="p-2.5 text-center w-14 border-r border-blue-900">Gender</th>
                      <th className="p-2.5 text-center border-r border-blue-900">Class (Stream)</th>
                      {activeSubjectKeys.slice(0, 7).map(sub => (
                        <th key={sub} className="p-2 text-center border-r border-blue-900 max-w-[90px] truncate" title={sub}>
                          {sub.split(' ')[0]}
                        </th>
                      ))}
                      <th className="p-2.5 text-center border-r border-blue-900 w-14">Total</th>
                      <th className="p-2.5 text-center border-r border-blue-900 w-14">Avg%</th>
                      <th className="p-2.5 text-center border-r border-blue-900 w-16">Grade/Div</th>
                      <th className="p-2.5 min-w-[180px]">Teacher Remarks & Annotations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {filteredRecords.map((rec, i) => (
                      <tr key={rec.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-2 text-center font-black border-r border-slate-200">
                          {rec.positionInClass}
                        </td>
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                          {rec.studentName}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          {rec.gender?.toLowerCase().startsWith('f') ? 'F' : 'M'}
                        </td>
                        <td className="p-2 text-center border-r border-slate-200 text-slate-700">
                          {rec.className} {rec.stream ? `(${rec.stream})` : ''}
                        </td>
                        {activeSubjectKeys.slice(0, 7).map(sub => {
                          const subInfo = rec.subjects?.[sub];
                          return (
                            <td key={sub} className="p-2 text-center border-r border-slate-200">
                              {subInfo ? (
                                <span className="font-bold">
                                  {subInfo.marks} <span className="text-[10px] text-slate-500">({subInfo.grade})</span>
                                </span>
                              ) : '-'}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-black text-slate-900 border-r border-slate-200">
                          {rec.totalMarks}
                        </td>
                        <td className="p-2 text-center font-black text-blue-900 border-r border-slate-200">
                          {rec.averageMarks}%
                        </td>
                        <td className="p-2 text-center border-r border-slate-200 font-bold">
                          <div>Grade {rec.overallGrade}</div>
                          {rec.division && <div className="text-[10px] text-blue-700">Div {rec.division}</div>}
                        </td>
                        <td className="p-2 text-slate-800 text-xs italic">
                          {rec.teacherRemarks || 'Good progress.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures Block */}
              <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Mwalimu wa Darasa (Class Teacher):</span>
                  <div className="mt-8 border-b border-slate-400"></div>
                  <span className="block text-[10px] font-semibold text-slate-700 mt-1">Saini na Tarehe</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Mwalimu wa Taaluma (Academic Master):</span>
                  <div className="mt-8 border-b border-slate-400"></div>
                  <span className="block text-[10px] font-semibold text-slate-700 mt-1">Saini na Tarehe</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase">Mkuu wa Shule (Head of School):</span>
                  <div className="mt-8 border-b border-slate-400"></div>
                  <span className="block text-[10px] font-semibold text-slate-700 mt-1">Muhuri Rasmi na Saini</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
