import React, { useState, useMemo, useEffect } from 'react';
import { 
  Lock, 
  Edit3, 
  Printer, 
  Download, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Search,
  Filter
} from 'lucide-react';
import { Student, Teacher, UserAccount, Exam } from '../types';
import { SUBJECT_LIST } from '../constants/defaults';
import { calculateOLevelDivision } from '../utils/reportCardUtils';

interface MarkEntryViewProps {
  students: Student[];
  teachers: Teacher[];
  exams: Exam[];
  currentUser?: UserAccount | null;
  onUpdateStudents: (updatedStudents: Student[]) => void;
}

export const MarkEntryView: React.FC<MarkEntryViewProps> = ({
  students,
  teachers,
  exams,
  currentUser,
  onUpdateStudents
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('Form 1');
  const [selectedStream, setSelectedStream] = useState<string>('All');
  const [selectedExam, setSelectedExam] = useState<string>('Midterm I');
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Dynamic registered streams across all students
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

  // Subjects filtered for teacher mode
  const availableSubjects = useMemo(() => {
    const allValid = SUBJECT_LIST.filter(s => !['Breakfast', 'Lunch', 'Sports and Games', 'General Assembly'].includes(s));
    if (currentUser?.role === 'TEACHER') {
      const assigned = currentUser.assignedSubjects || [];
      if (assigned.length > 0) {
        return allValid.filter(sub => 
          assigned.some(a => 
            a.toLowerCase() === sub.toLowerCase() || 
            sub.toLowerCase().includes(a.toLowerCase()) ||
            a.toLowerCase().includes(sub.toLowerCase())
          )
        );
      }
    }
    return allValid;
  }, [currentUser]);

  const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || 'English Language');

  // Keep selected subject in sync with available subjects
  useEffect(() => {
    if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject]);

  // Local state for mark values: studentId -> score
  const [localScores, setLocalScores] = useState<Record<number, number | string>>({});

  // Filter students matching class and stream
  const filteredStudents = useMemo(() => {
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

  // Determine current score for a student
  const getStudentScore = (s: Student): number | string => {
    if (localScores[s.id] !== undefined) {
      return localScores[s.id];
    }
    return s.marks?.[selectedSubject] ?? '';
  };

  const handleScoreChange = (studentId: number, val: string) => {
    if (val === '') {
      setLocalScores(prev => ({ ...prev, [studentId]: '' }));
      return;
    }
    const num = Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    setLocalScores(prev => ({ ...prev, [studentId]: num }));
  };

  const getGradeInfo = (score: number | string) => {
    if (score === '' || isNaN(Number(score))) {
      return { grade: '-', color: 'text-slate-400 bg-slate-100' };
    }
    const s = Number(score);
    // Official O-Level: A=75-100, B=65-74, C=45-64, D=30-44, F=0-29
    if (s >= 75) return { grade: 'A', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (s >= 65) return { grade: 'B', color: 'text-blue-700 bg-blue-100 border-blue-300' };
    if (s >= 45) return { grade: 'C', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    if (s >= 30) return { grade: 'D', color: 'text-orange-700 bg-orange-100 border-orange-300' };
    return { grade: 'F', color: 'text-red-700 bg-red-100 border-red-300' };
  };

  // Calculate stats for current selection
  const stats = useMemo(() => {
    let markedCount = 0;
    let totalScore = 0;
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    filteredStudents.forEach(s => {
      const scoreVal = getStudentScore(s);
      if (scoreVal !== '' && !isNaN(Number(scoreVal))) {
        markedCount++;
        const num = Number(scoreVal);
        totalScore += num;
        const { grade } = getGradeInfo(num);
        if (dist[grade] !== undefined) {
          dist[grade]++;
        }
      }
    });

    const avg = markedCount > 0 ? (totalScore / markedCount).toFixed(1) : '-';
    return {
      total: filteredStudents.length,
      marked: markedCount,
      avg,
      dist
    };
  }, [filteredStudents, localScores, selectedSubject]);

  const handleSaveAll = () => {
    const updated = students.map(s => {
      const pending = localScores[s.id];
      if (pending === undefined) return s;

      const currentMarks = { ...(s.marks || {}) };
      if (pending === '') {
        delete currentMarks[selectedSubject];
      } else {
        currentMarks[selectedSubject] = Number(pending);
      }

      const markVals = Object.values(currentMarks).filter(v => typeof v === 'number' && !isNaN(v as number)) as number[];
      const total = markVals.reduce((acc, curr) => acc + curr, 0);
      const avg = markVals.length > 0 ? (total / markVals.length).toFixed(1) : undefined;
      
      // Calculate Official NECTA O-Level Division (Best 7, A=1..F=5, <7 subjects = INCOMPLETE)
      const olevel = calculateOLevelDivision(currentMarks);

      return {
        ...s,
        marks: currentMarks,
        total,
        average: avg,
        division: olevel.division
      };
    });

    onUpdateStudents(updated);
    setLocalScores({});
    setSaveSuccessMsg(`Marks for ${selectedSubject} (${selectedClass} ${selectedStream} - ${selectedExam}) saved successfully!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleExportCsv = () => {
    const rows = [
      ['REG NO', 'NAME', 'GENDER', 'CLASS', 'STREAM', 'EXAM', 'SUBJECT', 'SCORE', 'GRADE']
    ];
    filteredStudents.forEach(s => {
      const score = getStudentScore(s);
      const { grade } = getGradeInfo(score);
      rows.push([
        s.regNo,
        s.name,
        s.gender || '',
        s.className,
        s.stream || '',
        selectedExam,
        selectedSubject,
        score === '' ? '' : String(score),
        grade
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marks_${selectedClass}_${selectedStream}_${selectedSubject.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Teacher Restricted Notification Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 shadow-xs">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-700 mt-0.5">
          <Lock className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <span>Mark Entry - {currentUser?.role === 'TEACHER' ? 'Teacher Restricted Mode' : 'Academic Grading Ledger'}</span>
            {currentUser && (
              <span className="text-[11px] font-medium bg-amber-200/60 px-2 py-0.5 rounded-md">
                Logged in as: {currentUser.fullName} ({currentUser.role})
              </span>
            )}
          </h2>
          <p className="text-xs text-amber-700 mt-0.5">
            {currentUser?.role === 'TEACHER' ? (
              <span>
                You are restricted to your registered subjects: <strong>{availableSubjects.join(', ') || 'None assigned yet'}</strong>. Only marks for your registered subjects can be viewed and edited.
              </span>
            ) : (
              <span>
                Enter marks by subject for all candidate classes and registered streams. Changes synchronize directly with student report cards.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter Controls Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
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
              <option value="Mock">Mock Exam</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase tracking-wider text-[11px]">Subject:</span>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            >
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name or reg no..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-56 sm:w-64 focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Card Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#1f4d8b]">
              {selectedClass.toUpperCase()} {selectedStream !== 'All' ? selectedStream : ''} Marks - {selectedSubject}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter marks for your subject only. Assessment: <strong>{selectedExam}</strong>. NECTA Grading applies.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditing 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Editing Enabled' : 'Edit Marks'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={handleSaveAll}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Marks</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Stats Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 bg-white text-center">
          <div className="p-3 sm:p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Students</div>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">{stats.total}</div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Marked</div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">{stats.marked} / {stats.total}</div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Class Avg</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600 mt-0.5">{stats.avg}%</div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grade Distribution</div>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 text-xs font-bold">
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">A:{stats.dist.A}</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">B:{stats.dist.B}</span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">C:{stats.dist.C}</span>
              <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded">D:{stats.dist.D}</span>
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded">F:{stats.dist.F}</span>
            </div>
          </div>
        </div>

        {/* Candidate Marks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 border-r border-slate-200 w-12 text-center">#</th>
                <th className="p-3 border-r border-slate-200 w-28">Reg No</th>
                <th className="p-3 border-r border-slate-200 min-w-[180px]">Student Name</th>
                <th className="p-3 border-r border-slate-200 w-20 text-center">Sex</th>
                <th className="p-3 border-r border-slate-200 w-24 text-center">Class / Stream</th>
                <th className="p-3 border-r border-slate-200 w-36 text-center">Score (0-100)</th>
                <th className="p-3 border-r border-slate-200 w-20 text-center">Grade</th>
                <th className="p-3 border-r border-slate-200 min-w-[140px]">Remark</th>
                <th className="p-3 text-center w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    No candidates found for {selectedClass} {selectedStream} ({selectedSubject}). Register students in the Registration view.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const currentScore = getStudentScore(st);
                  const { grade, color } = getGradeInfo(currentScore);
                  const hasScore = currentScore !== '' && !isNaN(Number(currentScore));

                  let remark = '-';
                  if (hasScore) {
                    const sc = Number(currentScore);
                    if (sc >= 75) remark = 'Excellent';
                    else if (sc >= 65) remark = 'Very Good';
                    else if (sc >= 45) remark = 'Good / Pass';
                    else if (sc >= 30) remark = 'Satisfactory';
                    else remark = 'Failed / Needs Help';
                  }

                  return (
                    <tr key={st.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3 border-r border-slate-200 text-center text-slate-500 font-mono font-medium">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-mono font-bold text-slate-800">
                        {st.regNo}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900">
                        {st.name}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center font-medium">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                          {st.gender ? (st.gender === 'Female' ? 'F' : 'M') : '-'}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center text-slate-600 font-medium">
                        {st.className} {st.stream || 'A'}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={currentScore}
                              onChange={e => handleScoreChange(st.id, e.target.value)}
                              placeholder="0-100"
                              className="w-20 px-2.5 py-1 text-center font-bold text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        ) : (
                          <span className="font-bold text-sm text-slate-800">
                            {hasScore ? currentScore : '-'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs border ${color}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="p-3 border-r border-slate-200 text-slate-600 font-medium">
                        {remark}
                      </td>
                      <td className="p-3 text-center">
                        {hasScore ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Recorded</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-400">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong>{filteredStudents.length}</strong> candidates for <strong>{selectedSubject}</strong>.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish All Marks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
