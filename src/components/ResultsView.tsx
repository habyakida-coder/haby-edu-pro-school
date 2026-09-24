import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Award, 
  Printer, 
  CheckCircle, 
  FileText, 
  Edit3, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Layers, 
  Layout, 
  Clock, 
  UserCheck, 
  GraduationCap, 
  Heart, 
  Eye, 
  BookOpen, 
  AlertCircle, 
  Users, 
  CalendarCheck, 
  Calculator, 
  Download, 
  Save, 
  Search, 
  RotateCcw,
  Sliders,
  Upload,
  Trash2,
  CheckSquare,
  Square,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import { Student, SchoolInfo, UserAccount } from '../types';
import { printReportCardDocument } from '../utils/export';
import { ReportCardDocument } from './ReportCard/ReportCardDocument';
import { EditReportCardModal } from './ReportCard/EditReportCardModal';
import { StudentComparisonView } from './StudentComparisonView';
import { 
  calculatePerformanceSummary, 
  generateCharacterFromPerformance, 
  getDefaultPeriodSetting,
  calculateOLevelDivision
} from '../utils/reportCardUtils';

interface ResultsViewProps {
  students: Student[];
  resultsStatus: 'active' | 'inactive';
  schoolInfo: SchoolInfo;
  onUpdateStudent: (student: Student) => void;
  onUpdateStudents?: (students: Student[]) => void;
  onToggleResultsStatus: (status: 'active' | 'inactive') => void;
  currentUser?: UserAccount | null;
  onNavigateToAttendance?: () => void;
}

// Complete list of available secondary and high school subjects with categories
export interface LedgerSubjectItem {
  key: string;
  label: string;
  fullName: string;
  category: 'Core' | 'Languages' | 'Sciences' | 'Social' | 'Commercial' | 'Technical' | 'Religion' | 'Arts';
}

export const ALL_AVAILABLE_SUBJECTS: LedgerSubjectItem[] = [
  { key: 'ENG', label: 'ENG', fullName: 'English Language', category: 'Languages' },
  { key: 'KIS', label: 'KIS', fullName: 'Kiswahili', category: 'Languages' },
  { key: 'B.MATH', label: 'B.MATH', fullName: 'Mathematics', category: 'Core' },
  { key: 'CIV', label: 'CIV', fullName: 'Civics', category: 'Core' },
  { key: 'GEO', label: 'GEO', fullName: 'Geography', category: 'Social' },
  { key: 'HIS', label: 'HIS', fullName: 'History', category: 'Social' },
  { key: 'BIO', label: 'BIO', fullName: 'Biology', category: 'Sciences' },
  { key: 'CHE', label: 'CHE', fullName: 'Chemistry', category: 'Sciences' },
  { key: 'PHY', label: 'PHY', fullName: 'Physics', category: 'Sciences' },
  { key: 'BUS', label: 'BUS', fullName: 'Business Studies', category: 'Commercial' },
  { key: 'B.KEEP', label: 'B.KEEP', fullName: 'Book Keeping', category: 'Commercial' },
  { key: 'COMM', label: 'COMM', fullName: 'Commerce', category: 'Commercial' },
  { key: 'COMP', label: 'COMP', fullName: 'Computer Studies', category: 'Technical' },
  { key: 'AGRI', label: 'AGRI', fullName: 'Agriculture', category: 'Technical' },
  { key: 'F.ART', label: 'F.ART', fullName: 'Fine Art', category: 'Arts' },
  { key: 'H.TZ', label: 'H.TZ', fullName: 'Historia Ya Tanzania Na Maadili', category: 'Social' },
  { key: 'E.DINI', label: 'E.DINI', fullName: 'Elimu ya Dini ya Kiislamu', category: 'Religion' },
  { key: 'CRE', label: 'CRE', fullName: 'Christian Religious Education', category: 'Religion' },
  { key: 'LIT', label: 'LIT', fullName: 'Literature in English', category: 'Languages' },
  { key: 'FRE', label: 'FRE', fullName: 'French', category: 'Languages' },
  { key: 'ARA', label: 'ARA', fullName: 'Arabic', category: 'Languages' },
  { key: 'PE', label: 'PE', fullName: 'Physical Education', category: 'Arts' }
];

export const DEFAULT_ACTIVE_SUBJECT_KEYS = [
  'ENG', 'KIS', 'B.MATH', 'GEO', 'HIS', 'BIO', 'CHE', 'PHY', 'CIV', 'BUS', 'COMP'
];

export const ResultsView: React.FC<ResultsViewProps> = ({
  students,
  resultsStatus,
  schoolInfo,
  onUpdateStudent,
  onUpdateStudents,
  onToggleResultsStatus,
  currentUser,
  onNavigateToAttendance
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'dashboard' | 'reportcard' | 'comparison'>('ledger');
  const [selectedClass, setSelectedClass] = useState<string>('Form 1');
  const [selectedStream, setSelectedStream] = useState<string>('All');
  const [selectedExam, setSelectedExam] = useState<string>('Midterm I');
  const [isEditMarksMode, setIsEditMarksMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected student for Report Card tab
  const [selectedStudentReg, setSelectedStudentReg] = useState<string>(students[0]?.regNo || '');
  const [reportOrientation, setReportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Dynamic streams collected from all registered students
  const availableStreams = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.stream && s.stream.trim()) {
        const clean = s.stream.trim().replace(/^STREAM\s+/i, '');
        if (clean) set.add(clean.toUpperCase());
      }
    });
    ['A', 'B', 'C', 'D', 'E'].forEach(st => set.add(st));
    return Array.from(set).sort();
  }, [students]);

  // Selected custom subject keys for the ledger
  const [selectedSubjectKeys, setSelectedSubjectKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`haby_ledger_subjects_${schoolInfo?.name || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ACTIVE_SUBJECT_KEYS;
  });

  // Modal and batch management states
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [bulkClearTarget, setBulkClearTarget] = useState<'ALL' | string>('ALL');
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState<string>('ALL');
  const [subjectSearchQuery, setSubjectSearchQuery] = useState<string>('');

  // CSV Upload file handling state
  const [uploadCsvFile, setUploadCsvFile] = useState<File | null>(null);
  const [uploadParsedRows, setUploadParsedRows] = useState<{
    matched: boolean;
    studentName?: string;
    regNo: string;
    scores: Record<string, number>;
  }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save customized subjects to localStorage whenever changed
  const handleSaveSubjectKeys = (keys: string[]) => {
    setSelectedSubjectKeys(keys);
    try {
      localStorage.setItem(`haby_ledger_subjects_${schoolInfo?.name || 'default'}`, JSON.stringify(keys));
    } catch {}
  };

  // Restrict ledger columns for Teacher role to only their registered/assigned subjects, or user customization
  const activeLedgerSubjects = useMemo(() => {
    if (currentUser?.role === 'TEACHER') {
      const assigned = currentUser.assignedSubjects || [];
      if (assigned.length > 0) {
        return ALL_AVAILABLE_SUBJECTS.filter(sub =>
          assigned.some(a =>
            a.toLowerCase() === sub.fullName.toLowerCase() ||
            a.toLowerCase() === sub.key.toLowerCase() ||
            sub.fullName.toLowerCase().includes(a.toLowerCase()) ||
            a.toLowerCase().includes(sub.fullName.toLowerCase())
          )
        );
      }
    }
    const filtered = ALL_AVAILABLE_SUBJECTS.filter(sub => selectedSubjectKeys.includes(sub.key));
    return filtered.length > 0 ? filtered : ALL_AVAILABLE_SUBJECTS.slice(0, 7);
  }, [currentUser, selectedSubjectKeys]);

  // Local pending marks: studentId -> { [subjectKey]: score }
  const [pendingMarks, setPendingMarks] = useState<Record<number, Record<string, number | string>>>({});

  // Sync selected student for report card
  useEffect(() => {
    if (students.length > 0 && !selectedStudentReg) {
      setSelectedStudentReg(students[0].regNo);
    }
  }, [students, selectedStudentReg]);

  // Filter students for the ledger matching Class and Stream
  const classCandidates = useMemo(() => {
    return students.filter(s => {
      const matchClass = !selectedClass || s.className.toLowerCase() === selectedClass.toLowerCase();
      const matchStream = !selectedStream || selectedStream === 'All' || 
        (s.stream ? (
          s.stream.toUpperCase().replace(/^STREAM\s+/i, '') === selectedStream.toUpperCase() ||
          s.stream.toUpperCase().includes(selectedStream.toUpperCase())
        ) : true);
      const matchSearch = !searchQuery || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.regNo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchStream && matchSearch;
    });
  }, [students, selectedClass, selectedStream, searchQuery]);

  // Multi-select handlers
  const handleToggleSelectAll = () => {
    if (selectedCandidateIds.length === classCandidates.length && classCandidates.length > 0) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(classCandidates.map(c => c.id));
    }
  };

  const handleToggleSelectCandidate = (id: number) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getScore = (student: Student, subjectFullName: string, subjectKey: string): number | string => {
    if (pendingMarks[student.id] && pendingMarks[student.id][subjectKey] !== undefined) {
      return pendingMarks[student.id][subjectKey];
    }
    return student.marks?.[subjectFullName] ?? student.marks?.[subjectKey] ?? '';
  };

  const handleCellChange = (studentId: number, subjectKey: string, val: string) => {
    const num = val === '' ? '' : Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    setPendingMarks(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectKey]: num
      }
    }));
  };

  const handleCalculateAll = () => {
    // Recompute total, average, division and ranking for all candidates in this class
    const updatedCandidates = classCandidates.map(s => {
      const p = pendingMarks[s.id] || {};
      const newMarks = { ...(s.marks || {}) };

      ALL_AVAILABLE_SUBJECTS.forEach(sub => {
        if (p[sub.key] !== undefined) {
          if (p[sub.key] === '') {
            delete newMarks[sub.fullName];
            delete newMarks[sub.key];
          } else {
            newMarks[sub.fullName] = Number(p[sub.key]);
          }
        }
      });

      const scores = Object.values(newMarks).filter(v => typeof v === 'number' && !isNaN(v as number)) as number[];
      const total = scores.reduce((a, b) => a + b, 0);
      const avgNum = scores.length > 0 ? Number((total / scores.length).toFixed(1)) : 0;
      
      // Official NECTA O-Level Division Calculation:
      // Best 7 subjects: Div I (7-17), Div II (18-21), Div III (22-25), Div IV (26-33), Div 0 (34-35).
      const olevel = calculateOLevelDivision(newMarks);
      const division = scores.length > 0 ? olevel.division : undefined;

      return {
        ...s,
        marks: newMarks,
        total,
        average: scores.length > 0 ? String(avgNum) : undefined,
        division
      };
    });

    // Rank candidates
    const sorted = [...updatedCandidates].sort((a, b) => (b.total || 0) - (a.total || 0));
    const rankedMap = new Map<number, number>();
    sorted.forEach((s, idx) => {
      rankedMap.set(s.id, idx + 1);
    });

    const finalStudents = students.map(s => {
      const found = updatedCandidates.find(u => u.id === s.id);
      if (found) {
        return {
          ...found,
          reportCardData: {
            ...(found.reportCardData || {}),
            positionInClass: rankedMap.get(found.id),
            totalStudentsInClass: updatedCandidates.length
          }
        };
      }
      return s;
    });

    if (onUpdateStudents) {
      onUpdateStudents(finalStudents);
    } else {
      finalStudents.forEach(s => onUpdateStudent(s));
    }

    setPendingMarks({});
    setSaveToast(`Calculated totals, averages, NECTA O-Level divisions (Best 7) & rankings for ${updatedCandidates.length} candidates!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleSaveMarks = () => {
    handleCalculateAll();
  };

  // CSV Template Export (with clean or pre-filled marks)
  const handleDownloadCsvTemplate = (withExistingMarks = false) => {
    const headers = [
      'REG NO', 
      'FULL NAME', 
      'SEX', 
      'CLASS', 
      'STREAM', 
      ...activeLedgerSubjects.map(s => s.key)
    ];
    const rows = [headers];

    classCandidates.forEach(s => {
      const subjectCols = activeLedgerSubjects.map(sub => {
        if (!withExistingMarks) return '';
        const sc = getScore(s, sub.fullName, sub.key);
        return sc === '' ? '' : String(sc);
      });

      rows.push([
        s.regNo,
        s.name,
        s.gender ? (s.gender === 'Female' ? 'F' : 'M') : '',
        s.className,
        s.stream || 'A',
        ...subjectCols
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Marks_Template_${selectedClass}_${selectedStream}_${selectedExam}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Batch Delete Marks for selected candidates
  const handleBulkDeleteMarks = () => {
    if (selectedCandidateIds.length === 0) return;
    const count = selectedCandidateIds.length;
    const targetLabel = bulkClearTarget === 'ALL' 
      ? 'ALL subject marks' 
      : `marks for ${ALL_AVAILABLE_SUBJECTS.find(s => s.key === bulkClearTarget)?.fullName || bulkClearTarget}`;

    const updated = students.map(s => {
      if (!selectedCandidateIds.includes(s.id)) return s;
      const newMarks = { ...(s.marks || {}) };
      
      if (bulkClearTarget === 'ALL') {
        return {
          ...s,
          marks: {},
          total: undefined,
          average: undefined,
          division: undefined
        };
      } else {
        const targetSub = ALL_AVAILABLE_SUBJECTS.find(x => x.key === bulkClearTarget);
        if (targetSub) {
          delete newMarks[targetSub.fullName];
          delete newMarks[targetSub.key];
        }
        const scores = Object.values(newMarks).filter(v => typeof v === 'number' && !isNaN(v as number)) as number[];
        const total = scores.reduce((a, b) => a + b, 0);
        const avgNum = scores.length > 0 ? Number((total / scores.length).toFixed(1)) : 0;
        const olevel = calculateOLevelDivision(newMarks);
        return {
          ...s,
          marks: newMarks,
          total: scores.length > 0 ? total : undefined,
          average: scores.length > 0 ? String(avgNum) : undefined,
          division: scores.length > 0 ? olevel.division : undefined
        };
      }
    });

    if (onUpdateStudents) {
      onUpdateStudents(updated);
    } else {
      updated.forEach(st => onUpdateStudent(st));
    }

    setSelectedCandidateIds([]);
    setIsBulkDeleteModalOpen(false);
    setSaveToast(`Successfully cleared ${targetLabel} for ${count} candidate(s)!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // CSV File Upload & Parsing Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadCsvFile(file);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setUploadError('Uploaded file is empty.');
          return;
        }

        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setUploadError('CSV file must contain a header row and at least one candidate row.');
          return;
        }

        // Parse header
        const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toUpperCase());
        const regNoIdx = rawHeaders.findIndex(h => h.includes('REG') || h === 'ID' || h === 'TOKEN');
        const nameIdx = rawHeaders.findIndex(h => h.includes('NAME'));

        if (regNoIdx === -1 && nameIdx === -1) {
          setUploadError('Header must include a "REG NO" or "NAME" column.');
          return;
        }

        // Map recognized subject column indexes
        const subjectColMap: { subKey: string; fullName: string; colIdx: number }[] = [];
        ALL_AVAILABLE_SUBJECTS.forEach(sub => {
          const idx = rawHeaders.findIndex(h => 
            h === sub.key.toUpperCase() || 
            h === sub.label.toUpperCase() || 
            h === sub.fullName.toUpperCase() ||
            h.includes(sub.key.toUpperCase())
          );
          if (idx !== -1) {
            subjectColMap.push({ subKey: sub.key, fullName: sub.fullName, colIdx: idx });
          }
        });

        if (subjectColMap.length === 0) {
          setUploadError('No recognized subject columns found. Expected headers like: ENG, KIS, B.MATH, GEO, BIO, CHE, PHY...');
          return;
        }

        const parsed: {
          matched: boolean;
          studentName?: string;
          regNo: string;
          scores: Record<string, number>;
        }[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          const regNo = regNoIdx !== -1 ? cols[regNoIdx] || '' : '';
          const name = nameIdx !== -1 ? cols[nameIdx] || '' : '';

          if (!regNo && !name) continue;

          // Match student by regNo or name
          const matchedStudent = students.find(s => 
            (regNo && s.regNo.toLowerCase() === regNo.toLowerCase()) ||
            (name && s.name.toLowerCase() === name.toLowerCase())
          );

          const scores: Record<string, number> = {};
          subjectColMap.forEach(sc => {
            const rawVal = cols[sc.colIdx];
            if (rawVal !== undefined && rawVal !== '' && !isNaN(Number(rawVal))) {
              const num = Math.min(100, Math.max(0, parseInt(rawVal, 10)));
              scores[sc.fullName] = num;
            }
          });

          parsed.push({
            matched: !!matchedStudent,
            studentName: matchedStudent?.name || name || 'Unknown',
            regNo: matchedStudent?.regNo || regNo,
            scores
          });
        }

        setUploadParsedRows(parsed);
      } catch (err: any) {
        setUploadError(`Failed to parse CSV: ${err.message || 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  // Apply parsed CSV upload to student marks
  const handleApplyCsvUpload = () => {
    if (uploadParsedRows.length === 0) return;

    let updatedCount = 0;
    const updated = students.map(s => {
      const match = uploadParsedRows.find(p => 
        p.matched && (p.regNo.toLowerCase() === s.regNo.toLowerCase() || p.studentName?.toLowerCase() === s.name.toLowerCase())
      );
      if (!match || Object.keys(match.scores).length === 0) return s;

      const newMarks = { ...(s.marks || {}), ...match.scores };
      const scores = Object.values(newMarks).filter(v => typeof v === 'number' && !isNaN(v as number)) as number[];
      const total = scores.reduce((a, b) => a + b, 0);
      const avgNum = scores.length > 0 ? Number((total / scores.length).toFixed(1)) : 0;
      const olevel = calculateOLevelDivision(newMarks);
      updatedCount++;

      return {
        ...s,
        marks: newMarks,
        total,
        average: scores.length > 0 ? String(avgNum) : undefined,
        division: scores.length > 0 ? olevel.division : undefined
      };
    });

    if (onUpdateStudents) {
      onUpdateStudents(updated);
    } else {
      updated.forEach(st => onUpdateStudent(st));
    }

    setIsUploadModalOpen(false);
    setUploadCsvFile(null);
    setUploadParsedRows([]);
    setSaveToast(`Successfully imported and updated marks for ${updatedCount} candidates from CSV!`);
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handleExportCsv = () => {
    const headers = ['REG NO', 'NAME', 'SEX', ...activeLedgerSubjects.map(s => s.key), 'TOT', 'AVG', 'DIV', 'RANK'];
    const rows = [headers];

    classCandidates.forEach((s, idx) => {
      const subjectScores = activeLedgerSubjects.map(sub => {
        const sc = getScore(s, sub.fullName, sub.key);
        return sc === '' ? '-' : String(sc);
      });

      rows.push([
        s.regNo,
        s.name,
        s.gender ? (s.gender === 'Female' ? 'F' : 'M') : '-',
        ...subjectScores,
        s.total !== undefined ? String(s.total) : '-',
        s.average ? `${s.average}%` : '-',
        s.division ? s.division : '-',
        String(s.reportCardData?.positionInClass ?? idx + 1)
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `results_${selectedClass}_${selectedStream}_${selectedExam}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Dashboard calculations matching Screenshot C
  const dashboardMetrics = useMemo(() => {
    const totalCandidates = classCandidates.length;
    let divI = 0;
    let divII = 0;
    let divIII = 0;
    let divIV = 0;
    let div0 = 0;
    let divIncomplete = 0;
    let sumAvg = 0;
    let countedAvg = 0;

    classCandidates.forEach(s => {
      if (s.division === 'I') divI++;
      else if (s.division === 'II') divII++;
      else if (s.division === 'III') divIII++;
      else if (s.division === 'IV') divIV++;
      else if (s.division === 'INCOMPLETE') divIncomplete++;
      else if (s.division === '0') div0++;

      if (s.average) {
        const num = parseFloat(s.average);
        if (!isNaN(num)) {
          sumAvg += num;
          countedAvg++;
        }
      }
    });

    const avgOverall = countedAvg > 0 ? (sumAvg / countedAvg).toFixed(1) : '-';
    // School GPA calculation (standard NECTA scale: Div I=1, Div II=2, Div III=3, Div IV=4, 0=5)
    let schoolGPA = '-';
    const gradedCandidates = divI + divII + divIII + divIV + div0;
    if (gradedCandidates > 0) {
      const weighted = (divI * 1.0 + divII * 2.0 + divIII * 3.0 + divIV * 4.0 + div0 * 5.0) / gradedCandidates;
      schoolGPA = weighted.toFixed(2);
    }

    return {
      totalCandidates,
      schoolGPA,
      divI,
      divII,
      divIII,
      divIV,
      div0,
      divIncomplete,
      avgOverall
    };
  }, [classCandidates]);

  // Report Card navigation
  const currentIndex = students.findIndex(s => s.regNo === selectedStudentReg);
  const reportStudent = students.find(s => s.regNo === selectedStudentReg) || students[0];

  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      setSelectedStudentReg(students[currentIndex - 1].regNo);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex < students.length - 1) {
      setSelectedStudentReg(students[currentIndex + 1].regNo);
    }
  };

  const handlePrintReport = () => {
    if (!reportStudent) return;
    printReportCardDocument(
      'report-card-printable-area',
      reportOrientation,
      reportStudent.name,
      schoolInfo.name
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Filter Bar matching Screenshot B & C */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Class:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
              <option value="Form 5">Form 5</option>
              <option value="Form 6">Form 6</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Stream:</span>
            <select
              value={selectedStream}
              onChange={e => setSelectedStream(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Streams</option>
              {availableStreams.map(str => (
                <option key={str} value={str}>Stream {str}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Exam:</span>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Midterm I">Midterm I</option>
              <option value="Terminal">Terminal</option>
              <option value="Annual">Annual</option>
              <option value="Midterm II">Midterm II</option>
              <option value="Mock">Mock</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name or reg no..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-56 sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Sub-Tabs: Results Entry | Dashboard | Report Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-[#1f4d8b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Results Entry
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-[#1f4d8b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('reportcard')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reportcard'
                ? 'bg-[#1f4d8b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report Card</span>
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comparison'
                ? 'bg-[#1f4d8b] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Side-by-Side Comparison</span>
            {selectedCandidateIds.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'comparison' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                {selectedCandidateIds.length}
              </span>
            )}
          </button>
        </div>

        {onNavigateToAttendance && (
          <button
            onClick={onNavigateToAttendance}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Student Attendance</span>
          </button>
        )}
      </div>

      {/* Toast Alert */}
      {saveToast && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* TAB 1: RESULTS ENTRY / CANDIDATE MARKS LEDGER (Screenshot B) */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {/* Ledger Header matching Screenshot B */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#1f4d8b]">
                {selectedClass.toUpperCase()} {selectedStream !== 'All' ? selectedStream : ''} - {selectedExam.toUpperCase()} Candidate Marks Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click Edit Marks to enter scores. Save when done. Real-time NECTA standard calculations.
              </p>
            </div>

            {/* Action Buttons matching Screenshot B + Customization & Bulk Operations */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Select which subjects to display or omit in the ledger"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Customize Subjects ({activeLedgerSubjects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Import multiple student marks from CSV spreadsheet"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload Marks (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadCsvTemplate(true)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Download CSV template populated with candidates"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV Template</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditMarksMode(!isEditMarksMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isEditMarksMode 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditMarksMode ? 'Done Editing' : 'Edit Marks'}</span>
              </button>

              {selectedCandidateIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('comparison')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs animate-pulse"
                  title="Compare selected candidates side by side"
                >
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>Compare Selected ({selectedCandidateIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCalculateAll}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                <span>Calculate</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMarks}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Marks</span>
              </button>
            </div>
          </div>

          {/* Batch Operations Floating/Inline Bar */}
          {selectedCandidateIds.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>{selectedCandidateIds.length} candidate(s) selected</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-[11px] text-slate-600 font-normal">Apply batch operations across all selected rows</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkClearTarget('ALL');
                    setIsBulkDeleteModalOpen(true);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Marks ({selectedCandidateIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCandidateIds([])}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Table Header with Candidate Count (e.g. 0 CANDIDATES in Screenshot B) */}
          <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>{classCandidates.length} CANDIDATES</span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({activeLedgerSubjects.length} subjects displayed)
              </span>
            </div>
            {currentUser?.role === 'TEACHER' ? (
              <span className="text-[11px] text-amber-700 font-semibold lowercase bg-amber-100/80 px-2.5 py-0.5 rounded">
                teacher mode: showing your subjects ({activeLedgerSubjects.map(s => s.label).join(', ')})
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                Customize Subject Columns
              </button>
            )}
          </div>

          {/* Teacher Mode Notice Banner */}
          {currentUser?.role === 'TEACHER' && (
            <div className="bg-amber-50/90 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
              <span className="font-medium">
                Showing candidate marks for your assigned subjects only: <strong>{activeLedgerSubjects.map(s => s.fullName).join(', ') || 'No subjects assigned'}</strong>
              </span>
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Restricted View</span>
            </div>
          )}

          {/* Full Marks Table Matching Screenshot B */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-2.5 border-r border-slate-200 text-center w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all candidates in this view"
                      checked={selectedCandidateIds.length === classCandidates.length && classCandidates.length > 0}
                      onChange={handleToggleSelectAll}
                      className="cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-2.5 border-r border-slate-200 whitespace-nowrap">REG NO</th>
                  <th className="p-2.5 border-r border-slate-200 min-w-[150px] whitespace-nowrap">NAME</th>
                  <th className="p-2.5 border-r border-slate-200 text-center w-10">SEX</th>
                  {activeLedgerSubjects.map(sub => (
                    <th key={sub.key} className="p-2 border-r border-slate-200 text-center w-12 font-mono" title={sub.fullName}>
                      {sub.label}
                    </th>
                  ))}
                  <th className="p-2 border-r border-slate-200 text-center font-black bg-blue-50/50 w-12">TOT</th>
                  <th className="p-2 border-r border-slate-200 text-center font-black bg-blue-50/50 w-14">AVG</th>
                  <th className="p-2 border-r border-slate-200 text-center font-black bg-blue-50/50 w-10">DIV</th>
                  <th className="p-2 border-r border-slate-200 text-center font-black bg-blue-50/50 w-10">RANK</th>
                  <th className="p-2 text-center w-16">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {classCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={activeLedgerSubjects.length + 9} className="p-8 text-center text-slate-400 font-bold">
                      0 CANDIDATES FOUND FOR {selectedClass} {selectedStream}. Register students in the Registration view.
                    </td>
                  </tr>
                ) : (
                  classCandidates.map((st, idx) => (
                    <tr 
                      key={st.id} 
                      className={`hover:bg-blue-50/30 transition-colors ${
                        selectedCandidateIds.includes(st.id) ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <td className="p-2 border-r border-slate-200 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select ${st.name}`}
                          checked={selectedCandidateIds.includes(st.id)}
                          onChange={() => handleToggleSelectCandidate(st.id)}
                          className="cursor-pointer rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {st.regNo}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900 whitespace-nowrap">
                        {st.name}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">
                        <span className={st.gender === 'Female' ? 'text-pink-700' : 'text-blue-700'}>
                          {st.gender ? (st.gender === 'Female' ? 'F' : 'M') : '-'}
                        </span>
                      </td>

                      {/* Subject Scores */}
                      {activeLedgerSubjects.map(sub => {
                        const sc = getScore(st, sub.fullName, sub.key);
                        return (
                          <td key={sub.key} className="p-1 border-r border-slate-200 text-center font-mono">
                            {isEditMarksMode ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={sc}
                                onChange={e => handleCellChange(st.id, sub.key, e.target.value)}
                                placeholder="-"
                                className="w-11 px-1 py-0.5 text-center font-bold text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            ) : (
                              <span className={`font-semibold ${sc !== '' ? 'text-slate-800' : 'text-slate-300'}`}>
                                {sc !== '' ? sc : '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Summary Metrics */}
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-black text-slate-900 bg-slate-50/40">
                        {st.total ?? '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-black text-blue-700 bg-slate-50/40">
                        {st.average ? `${st.average}%` : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-black bg-slate-50/40">
                        {st.division ? (
                          <span 
                            title={st.division === 'INCOMPLETE' ? 'Incomplete: Fewer than 7 subjects scored' : `Division ${st.division}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              st.division === 'I' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              st.division === 'II' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              st.division === 'III' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              st.division === 'IV' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                              st.division === 'INCOMPLETE' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                              'bg-red-100 text-red-800 border border-red-300'
                            }`}
                          >
                            {st.division === 'INCOMPLETE' ? 'INC' : st.division}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-700 bg-slate-50/40">
                        {st.reportCardData?.positionInClass ?? idx + 1}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudentReg(st.regNo);
                            setActiveTab('reportcard');
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                        >
                          Report
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD (Screenshot C) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics matching Screenshot C */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Candidates</div>
              <div className="text-3xl font-black text-slate-800 mt-1">{dashboardMetrics.totalCandidates}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">School GPA</div>
              <div className="text-3xl font-black text-indigo-600 mt-1">{dashboardMetrics.schoolGPA}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Division I</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">{dashboardMetrics.divI}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average</div>
              <div className="text-3xl font-black text-blue-600 mt-1">
                {dashboardMetrics.avgOverall !== '-' ? `${dashboardMetrics.avgOverall}%` : '-'}
              </div>
            </div>
          </div>

          {/* Division Summary Section matching Screenshot C */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Division Summary ({selectedClass} {selectedStream} - {selectedExam})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">Division I</div>
                <div className="text-xs text-emerald-600 font-semibold mt-0.5">7-17 pts</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{dashboardMetrics.divI}</div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <div className="text-[11px] font-bold text-blue-800 uppercase">Division II</div>
                <div className="text-xs text-blue-600 font-semibold mt-0.5">18-21 pts</div>
                <div className="text-2xl font-black text-blue-700 mt-1">{dashboardMetrics.divII}</div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <div className="text-[11px] font-bold text-amber-800 uppercase">Division III</div>
                <div className="text-xs text-amber-600 font-semibold mt-0.5">22-25 pts</div>
                <div className="text-2xl font-black text-amber-700 mt-1">{dashboardMetrics.divIII}</div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center">
                <div className="text-[11px] font-bold text-orange-800 uppercase">Division IV</div>
                <div className="text-xs text-orange-600 font-semibold mt-0.5">26-33 pts</div>
                <div className="text-2xl font-black text-orange-700 mt-1">{dashboardMetrics.divIV}</div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <div className="text-[11px] font-bold text-red-800 uppercase">Below / Div 0</div>
                <div className="text-xs text-red-600 font-semibold mt-0.5">34-35 pts</div>
                <div className="text-2xl font-black text-red-700 mt-1">{dashboardMetrics.div0}</div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
                <div className="text-[11px] font-bold text-purple-800 uppercase">Incomplete</div>
                <div className="text-xs text-purple-600 font-semibold mt-0.5">&lt; 7 subjects</div>
                <div className="text-2xl font-black text-purple-700 mt-1">{dashboardMetrics.divIncomplete}</div>
              </div>
            </div>
          </div>

          {/* Subject Performance Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1f4d8b] uppercase tracking-wider">
              Subject Mean Performance
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {activeLedgerSubjects.map(sub => {
                let subTotal = 0;
                let subCount = 0;
                classCandidates.forEach(s => {
                  const sc = s.marks?.[sub.fullName] ?? s.marks?.[sub.key];
                  if (typeof sc === 'number' && !isNaN(sc)) {
                    subTotal += sc;
                    subCount++;
                  }
                });
                const subAvg = subCount > 0 ? (subTotal / subCount).toFixed(1) : '-';

                return (
                  <div key={sub.key} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase truncate" title={sub.fullName}>
                      {sub.label}
                    </div>
                    <div className="text-lg font-black text-slate-800 mt-0.5">
                      {subAvg !== '-' ? `${subAvg}%` : '-'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                      {subCount} scored
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REPORT CARD (Screenshot F) */}
      {activeTab === 'reportcard' && (
        <div className="space-y-4">
          {/* Report Card Action Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevStudent}
                disabled={currentIndex <= 0}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedStudentReg}
                onChange={e => setSelectedStudentReg(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs text-slate-800 max-w-xs"
              >
                {students.map(s => (
                  <option key={s.id} value={s.regNo}>
                    {s.regNo} - {s.name} ({s.className})
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextStudent}
                disabled={currentIndex >= students.length - 1}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Remarks</span>
              </button>

              <button
                onClick={handlePrintReport}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report Card</span>
              </button>
            </div>
          </div>

          {/* Report Card Printable Component */}
          {reportStudent && (
            <div id="report-card-printable-area" className="bg-white border border-slate-200 rounded-xl p-4 sm:p-8 shadow-sm">
              <ReportCardDocument
                student={reportStudent}
                schoolInfo={schoolInfo}
                orientation={reportOrientation}
              />
            </div>
          )}

          {/* Edit Modal */}
          {isEditModalOpen && reportStudent && (
            <EditReportCardModal
              isOpen={isEditModalOpen}
              student={reportStudent}
              onClose={() => setIsEditModalOpen(false)}
              onSave={(updated) => {
                onUpdateStudent(updated);
                setIsEditModalOpen(false);
                setSaveToast(`Report card remarks updated for ${updated.name}!`);
                setTimeout(() => setSaveToast(null), 3000);
              }}
            />
          )}
        </div>
      )}

      {/* TAB 4: MULTI-STUDENT SIDE-BY-SIDE PERFORMANCE COMPARISON */}
      {activeTab === 'comparison' && (
        <StudentComparisonView
          students={students}
          classCandidates={classCandidates}
          selectedCandidateIds={selectedCandidateIds}
          onToggleSelectCandidate={handleToggleSelectCandidate}
          onClearSelectedCandidates={() => setSelectedCandidateIds([])}
          onSelectCandidates={(ids) => setSelectedCandidateIds(ids)}
          activeLedgerSubjects={activeLedgerSubjects}
          selectedClass={selectedClass}
          selectedStream={selectedStream}
          selectedExam={selectedExam}
          schoolInfo={schoolInfo}
          onBackToLedger={() => setActiveTab('ledger')}
        />
      )}

      {/* MODAL 1: CUSTOMIZE SUBJECTS MODAL */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Customize Academic Marks Ledger Subjects</h3>
                  <p className="text-xs text-slate-500">
                    Select which subjects to display or omit in the ledger, CSV templates, and exports.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets and Filter Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600 mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => handleSaveSubjectKeys(ALL_AVAILABLE_SUBJECTS.map(s => s.key))}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  Show All ({ALL_AVAILABLE_SUBJECTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubjectKeys(['ENG', 'KIS', 'B.MATH', 'GEO', 'HIS', 'BIO', 'CIV'])}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-blue-700 cursor-pointer"
                >
                  NECTA Core 7
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubjectKeys(['B.MATH', 'PHY', 'CHE', 'BIO', 'GEO'])}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-emerald-700 cursor-pointer"
                >
                  Sciences
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubjectKeys(['ENG', 'KIS', 'GEO', 'HIS', 'CIV', 'H.TZ'])}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-amber-700 cursor-pointer"
                >
                  Arts & Social
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSubjectKeys(['B.MATH', 'BUS', 'B.KEEP', 'COMM', 'ENG', 'KIS'])}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-purple-700 cursor-pointer"
                >
                  Commercial
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Category tabs */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold py-0.5">
                  {['ALL', 'Core', 'Sciences', 'Languages', 'Social', 'Commercial', 'Technical', 'Religion', 'Arts'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSubjectCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        subjectCategoryFilter === cat 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-200/70 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search subject..."
                    value={subjectSearchQuery}
                    onChange={e => setSubjectSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-lg w-44 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Subject Checkboxes Grid */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_AVAILABLE_SUBJECTS
                  .filter(s => {
                    const matchCat = subjectCategoryFilter === 'ALL' || s.category === subjectCategoryFilter;
                    const matchQ = !subjectSearchQuery || 
                      s.fullName.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
                      s.key.toLowerCase().includes(subjectSearchQuery.toLowerCase());
                    return matchCat && matchQ;
                  })
                  .map(sub => {
                    const isChecked = selectedSubjectKeys.includes(sub.key);
                    return (
                      <label
                        key={sub.key}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked 
                            ? 'bg-blue-50/60 border-blue-300 shadow-2xs' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                if (selectedSubjectKeys.length <= 1) {
                                  alert('At least one subject must remain selected for the ledger.');
                                  return;
                                }
                                handleSaveSubjectKeys(selectedSubjectKeys.filter(k => k !== sub.key));
                              } else {
                                handleSaveSubjectKeys([...selectedSubjectKeys, sub.key]);
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{sub.fullName}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-semibold">
                                {sub.key}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Category: {sub.category}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isChecked ? 'bg-blue-200/80 text-blue-900' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isChecked ? 'Included' : 'Omitted'}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                <strong>{selectedSubjectKeys.length}</strong> of {ALL_AVAILABLE_SUBJECTS.length} subjects currently active in ledger
              </span>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Done & Apply</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD MARKS CSV MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Multiple Upload of Marks (CSV Import)</h3>
                  <p className="text-xs text-slate-500">
                    Upload candidate marks spreadsheet for {selectedClass} ({selectedExam}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadCsvFile(null);
                  setUploadParsedRows([]);
                  setUploadError(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Step 1: Download Template */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Step 1: Download Standard CSV Template</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-populated with all candidate names, registration numbers, and currently active subject headers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadCsvTemplate(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Blank Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadCsvTemplate(true)}
                    className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Template with Current Marks</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Upload CSV File */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Step 2: Select or Drop Completed CSV</h4>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-all"
                >
                  <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-700">
                    {uploadCsvFile ? uploadCsvFile.name : 'Click to browse or drop CSV file here'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Accepts comma-separated .csv files formatted with candidate identifiers and subject columns
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Error Display */}
              {uploadError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error importing CSV: </span>
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {/* Step 3: Live Preview Table */}
              {uploadParsedRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-800">
                      Step 3: Verification & Import Preview ({uploadParsedRows.length} candidates detected)
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                      {uploadParsedRows.filter(p => p.matched).length} matched candidates ready
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2 border-b border-r border-slate-200">Status</th>
                          <th className="p-2 border-b border-r border-slate-200">Candidate</th>
                          <th className="p-2 border-b border-r border-slate-200">Reg No</th>
                          <th className="p-2 border-b border-slate-200">Scores Detected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {uploadParsedRows.map((row, rIdx) => (
                          <tr key={rIdx} className={row.matched ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                            <td className="p-2 border-r border-slate-200 font-bold">
                              {row.matched ? (
                                <span className="text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                                </span>
                              ) : (
                                <span className="text-rose-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Unmatched
                                </span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-800">
                              {row.studentName}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                              {row.regNo}
                            </td>
                            <td className="p-2 text-slate-700 font-mono">
                              {Object.entries(row.scores)
                                .map(([sub, score]) => `${sub}: ${score}`)
                                .join(' | ') || 'None'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadCsvFile(null);
                  setUploadParsedRows([]);
                  setUploadError(null);
                }}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={uploadParsedRows.filter(p => p.matched).length === 0}
                onClick={handleApplyCsvUpload}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Import & Save All Marks ({uploadParsedRows.filter(p => p.matched).length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BULK DELETE / CLEAR MARKS MODAL */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clear Candidate Marks</h3>
                  <p className="text-xs text-rose-700">
                    Bulk delete scores for selected candidates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                You have selected <strong className="text-slate-900">{selectedCandidateIds.length} candidate(s)</strong>. 
                Please choose which marks you want to clear:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Scope of Marks to Delete:
                </label>
                <select
                  value={bulkClearTarget}
                  onChange={e => setBulkClearTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="ALL">All Subjects (Clear entire candidate result)</option>
                  <optgroup label="Specific Subject Only:">
                    {ALL_AVAILABLE_SUBJECTS.map(sub => (
                      <option key={sub.key} value={sub.key}>
                        {sub.fullName} ({sub.key})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Totals, class ranks, averages, and NECTA division standings will be automatically recalculated immediately.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteMarks}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
