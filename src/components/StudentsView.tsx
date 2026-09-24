import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Eye, 
  Check, 
  Search,
  BookOpen,
  Camera,
  Printer,
  FileSpreadsheet,
  Users,
  Filter,
  ArrowUpDown,
  X,
  User
} from 'lucide-react';
import { Student, SchoolInfo } from '../types';
import { SUBJECT_LIST } from '../constants/defaults';
import { downloadFile, escapeCSV, printFormattedSection } from '../utils/export';
import { formatStudentRegNo, getNextStudentRegNo } from '../utils/studentRegUtils';

interface StudentsViewProps {
  students: Student[];
  schoolInfo?: SchoolInfo;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: number) => void;
  onBulkAddStudents?: (newStudents: Student[]) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  schoolInfo,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkAddStudents
}) => {
  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('Male');
  const [className, setClassName] = useState('Form 1');
  const [level, setLevel] = useState<'CSEE' | 'ACSEE'>('CSEE');
  const [stream, setStream] = useState('STREAM A');
  const [combination, setCombination] = useState('PCM');
  const [dob, setDob] = useState('2010-01-01');
  const [passportPhoto, setPassportPhoto] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'English Language', 'Kiswahili', 'Mathematics', 'Biology', 'Chemistry', 'Physics'
  ]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [showAutoFillNotice, setShowAutoFillNotice] = useState(false);

  // Active sub-tab: 'form' | 'register_list'
  const [activeTab, setActiveTab] = useState<'form' | 'register_list'>('form');

  // Dynamic streams collected from all registered students
  const allRegisteredStreams: string[] = useMemo(() => {
    const set = new Set<string>();
    ['A', 'B', 'C', 'D', 'E'].forEach((st: string) => set.add(st));
    students.forEach(s => {
      if (s.stream && s.stream.trim()) {
        const clean = s.stream.trim().replace(/^STREAM\s+/i, '');
        if (clean) set.add(clean.toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [students]);

  // List filters & sorting
  const [searchFilter, setSearchFilter] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [streamFilter, setStreamFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'regNo_asc' | 'regNo_desc' | 'name_asc'>('regNo_asc');

  // Edit and View Modals
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingRecordStudent, setViewingRecordStudent] = useState<Student | null>(null);

  const handleLevelChange = (newLevel: 'CSEE' | 'ACSEE') => {
    setLevel(newLevel);
    if (newLevel === 'ACSEE') {
      autoFillCombinationSubjects(combination);
    }
  };

  const autoFillCombinationSubjects = (combo: string) => {
    const comboMap: Record<string, string[]> = {
      'PCM': ['Physics', 'Chemistry', 'Advanced Mathematics'],
      'PCB': ['Physics', 'Chemistry', 'Biology'],
      'CBG': ['Chemistry', 'Biology', 'Geography'],
      'HGE': ['History', 'Geography', 'Economics'],
      'HKL': ['History', 'Kiswahili', 'English Language'],
      'EGM': ['Economics', 'Geography', 'Advanced Mathematics'],
      'ECA': ['Economics', 'Chemistry', 'Agriculture'],
      'CBA': ['Chemistry', 'Biology', 'Agriculture'],
      'PGM': ['Physics', 'Geography', 'Advanced Mathematics'],
      'PGK': ['Physics', 'Geography', 'Kiswahili'],
      'HGL': ['History', 'Geography', 'English Language'],
      'HGK': ['History', 'Geography', 'Kiswahili'],
      'KLF': ['Kiswahili', 'English Language', 'Fine Art']
    };

    const compulsory = ['Academic Communications', 'Historia Ya Tanzania Na Maadili'];
    const specific = comboMap[combo] || ['Physics', 'Chemistry', 'Mathematics'];
    setSelectedSubjects([...compulsory, ...specific]);
    setShowAutoFillNotice(true);
    setTimeout(() => setShowAutoFillNotice(false), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);

          if (isEditing && editingStudent) {
            setEditingStudent({ ...editingStudent, passportPhoto: compressed });
          } else {
            setPassportPhoto(compressed);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter student full name.');
      return;
    }
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject.');
      return;
    }

    const regNo = getNextStudentRegNo(students, schoolInfo?.schoolNumber);
    const newStudent: Student = {
      id: Date.now(),
      regNo,
      name: name.trim(),
      gender,
      className,
      level,
      stream: level === 'CSEE' ? stream : undefined,
      combination: level === 'ACSEE' ? combination : undefined,
      dob,
      passportPhoto: passportPhoto || undefined,
      subjects: selectedSubjects,
      marks: {},
      total: 0,
      average: '0.0',
      division: '-'
    };

    onAddStudent(newStudent);
    setName('');
    setPassportPhoto('');
    alert(`Student ${name} registered successfully with Reg Token: ${regNo}`);
  };

  const exportTemplate = () => {
    const headers = ['Full Name', 'Gender', 'Class', 'Level', 'Stream or Combination', 'Date of Birth', 'Subjects (comma separated)', 'Assigned Token Reg No (Optional)'];
    const sample = [
      'Juma Ally Mrisho',
      'Male',
      'Form 1',
      'CSEE',
      'STREAM A',
      '2010-05-14',
      'English Language; Kiswahili; Mathematics; Physics; Chemistry; Biology',
      formatStudentRegNo(schoolInfo?.schoolNumber, 1)
    ];
    downloadFile('student_registration_template.csv', [headers.join(','), sample.map(escapeCSV).join(',')].join('\n'));
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = String(evt.target?.result || '');
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const newStudentsBatch: Student[] = [];

      lines.slice(1).forEach((line, index) => {
        const parts = line.split(',');
        if (parts.length >= 5) {
          const sName = parts[0]?.replace(/"/g, '').trim();
          const sGender = (parts[1]?.replace(/"/g, '').trim() as 'Male' | 'Female') || 'Male';
          const sClass = parts[2]?.replace(/"/g, '').trim() || 'Form 1';
          const sLevel = (parts[3]?.replace(/"/g, '').trim() as 'CSEE' | 'ACSEE') || 'CSEE';
          const sStream = parts[4]?.replace(/"/g, '').trim() || 'STREAM A';
          const sDob = parts[5]?.replace(/"/g, '').trim() || '2010-01-01';
          const sSubs = parts[6] ? parts[6].replace(/"/g, '').split(';').map(s => s.trim()) : ['English Language', 'Mathematics'];
          const explicitRegNo = parts[7]?.replace(/"/g, '').trim();

          if (sName) {
            newStudentsBatch.push({
              id: Date.now() + index,
              regNo: explicitRegNo || formatStudentRegNo(schoolInfo?.schoolNumber, students.length + newStudentsBatch.length + 1),
              name: sName,
              gender: sGender,
              className: sClass,
              level: sLevel,
              stream: sLevel === 'CSEE' ? sStream : undefined,
              combination: sLevel === 'ACSEE' ? sStream : undefined,
              dob: sDob,
              subjects: sSubs
            });
          }
        }
      });

      if (newStudentsBatch.length > 0) {
        if (onBulkAddStudents) {
          onBulkAddStudents(newStudentsBatch);
        } else {
          newStudentsBatch.forEach(s => onAddStudent(s));
        }
        alert(`Imported ${newStudentsBatch.length} students successfully!`);
      } else {
        alert('No valid student rows found in the uploaded CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportRegisteredListCSV = () => {
    const headers = ['Registration Order', 'Reg No', 'Student Full Name', 'Gender', 'Class', 'Level', 'Stream / Combination', 'DOB', 'Total Subjects Enrolled'];
    const rows = sortedFilteredStudents.map((s, idx) => [
      String(idx + 1),
      s.regNo || '',
      s.name,
      s.gender || '',
      s.className,
      s.level,
      s.stream || s.combination || '',
      s.dob || '',
      String(s.subjects.length)
    ]);
    const csvContent = [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\n');
    downloadFile('Official_Registered_Students_List.csv', csvContent, 'text/csv;charset=utf-8');
  };

  const handlePrintRegisteredList = () => {
    printFormattedSection(
      'registered-students-print-table',
      'Official Master List of Registered Students',
      schoolInfo?.name || 'SECONDARY SCHOOL',
      { orientation: 'portrait', pageSize: 'A4', fontSize: 'large' }
    );
  };

  const filteredSubjects = SUBJECT_LIST.filter(s => 
    s.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  // Filter and sort registered students according to registration
  const sortedFilteredStudents = [...students].filter(s => {
    const q = searchFilter.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.regNo && s.regNo.toLowerCase().includes(q));
    if (!matchSearch) return false;
    if (classFilter !== 'ALL' && s.className !== classFilter) return false;
    if (streamFilter !== 'ALL') {
      const target = streamFilter.toUpperCase().replace(/^STREAM\s+/i, '');
      const sStream = (s.stream || '').toUpperCase().replace(/^STREAM\s+/i, '');
      const sCombo = (s.combination || '').toUpperCase();
      const match = sStream === target || sStream.includes(target) || sCombo === target || sCombo.includes(target);
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'regNo_asc') {
      return (a.regNo || '').localeCompare(b.regNo || '', undefined, { numeric: true });
    }
    if (sortBy === 'regNo_desc') {
      return (b.regNo || '').localeCompare(a.regNo || '', undefined, { numeric: true });
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Student Registration Form</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register_list')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'register_list'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Official Registered Students List ({students.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintRegisteredList}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Registered Students List with Large Clear Font"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Print Register (Large Font)</span>
          </button>
          <button
            type="button"
            onClick={handleExportRegisteredListCSV}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download CSV of all registered students"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Registration Form Tab */}
      {activeTab === 'form' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1f4d8b]">Student Registration</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register new students with passport photo, biographical details, class allocation, and subject enrollments.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-800 bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-xs">
              <span className="text-slate-500 uppercase text-[10px] tracking-wider">Next Reg Token:</span>
              <span className="font-mono text-xs font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                {getNextStudentRegNo(students, schoolInfo?.schoolNumber)}
              </span>
            </div>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Passport Photo Upload Box */}
              <div className="lg:col-span-1 flex flex-col items-center justify-start p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3 text-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Passport Size Photo
                </label>

                <div className="relative w-28 h-36 bg-white border-2 border-dashed border-slate-300 rounded-lg overflow-hidden flex flex-col items-center justify-center shadow-xs group hover:border-blue-400 transition-colors">
                  {passportPhoto ? (
                    <>
                      <img
                        src={passportPhoto}
                        alt="Student Passport"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPassportPhoto('')}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm cursor-pointer"
                        title="Remove Photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center p-2 cursor-pointer text-slate-400 hover:text-blue-600">
                      <User className="w-10 h-10 mb-1 stroke-1" />
                      <span className="text-[10px] font-bold text-slate-500">Attach Photo</span>
                      <span className="text-[8px] text-slate-400 mt-0.5">3.5 × 4.5 cm (Passport)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handlePhotoUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-1.5">
                  <label className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Select Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handlePhotoUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                  {passportPhoto && (
                    <button
                      type="button"
                      onClick={() => setPassportPhoto('')}
                      className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Official 35×45mm passport picture for Student ID Cards and School Roster.
                </p>
              </div>

              {/* Biographical Details */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Amina Selemani"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Class / Form *</label>
                  <select
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option>Form 1</option>
                    <option>Form 2</option>
                    <option>Form 3</option>
                    <option>Form 4</option>
                    <option>Form 5</option>
                    <option>Form 6</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Level *</label>
                  <select
                    value={level}
                    onChange={e => handleLevelChange(e.target.value as 'CSEE' | 'ACSEE')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="CSEE">CSEE (Ordinary Level Form 1-4)</option>
                    <option value="ACSEE">ACSEE (Advanced Level Form 5-6)</option>
                  </select>
                </div>

                {level === 'CSEE' ? (
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Stream *</label>
                    <select
                      value={stream}
                      onChange={e => setStream(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      {allRegisteredStreams.map((st: string) => (
                        <option key={st} value={`STREAM ${st}`}>STREAM {st}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Combination *</label>
                    <select
                      value={combination}
                      onChange={e => {
                        setCombination(e.target.value);
                        autoFillCombinationSubjects(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-bold text-blue-700"
                    >
                      <option value="PCM">PCM (Physics, Chemistry, Mathematics)</option>
                      <option value="PCB">PCB (Physics, Chemistry, Biology)</option>
                      <option value="CBG">CBG (Chemistry, Biology, Geography)</option>
                      <option value="HGE">HGE (History, Geography, Economics)</option>
                      <option value="HKL">HKL (History, Kiswahili, English)</option>
                      <option value="EGM">EGM (Economics, Geography, Mathematics)</option>
                      <option value="ECA">ECA (Economics, Chemistry, Agriculture)</option>
                      <option value="CBA">CBA (Chemistry, Biology, Agriculture)</option>
                      <option value="PGM">PGM (Physics, Geography, Mathematics)</option>
                      <option value="PGK">PGK (Physics, Geography, Kiswahili)</option>
                      <option value="HGL">HGL (History, Geography, English)</option>
                      <option value="HGK">HGK (History, Geography, Kiswahili)</option>
                      <option value="KLF">KLF (Kiswahili, English, Fine Art)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Subjects Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 uppercase">
                  Enrolled Subjects ({selectedSubjects.length} selected)
                </label>
                {showAutoFillNotice && (
                  <span className="text-xs font-bold text-emerald-600 animate-fade-in">
                    ✓ Compulsory & combination subjects auto-filled for ACSEE
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search subject..."
                  value={subjectSearch}
                  onChange={e => setSubjectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                {filteredSubjects.map(sub => {
                  const checked = selectedSubjects.includes(sub);
                  return (
                    <label
                      key={sub}
                      className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer select-none transition-colors ${
                        checked
                          ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedSubjects([...selectedSubjects, sub]);
                          } else {
                            setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span className="truncate">{sub}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Register Student
              </button>

              <button
                type="button"
                onClick={exportTemplate}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                Download CSV Template
              </button>

              <label className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4 text-purple-600" />
                Import CSV
                <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
              </label>
            </div>
          </form>
        </div>
      )}

      {/* Registered Students Master List (According to Registration) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-[#1f4d8b] flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Official Registered Students List According to Registration ({sortedFilteredStudents.length} of {students.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Accredited enrollment register arranged by registration order (Reg No) with passport photos and class streams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search name, Reg No..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Classes</option>
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
              <option value="Form 5">Form 5</option>
              <option value="Form 6">Form 6</option>
            </select>

            {/* Stream Filter */}
            <select
              value={streamFilter}
              onChange={e => setStreamFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Streams</option>
              {allRegisteredStreams.map((str: string) => (
                <option key={str} value={str}>Stream {str}</option>
              ))}
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="regNo_asc">Registration Order (S0001 →)</option>
              <option value="regNo_desc">Latest Registered First</option>
              <option value="name_asc">Alphabetical (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Printable Section with Increased Font Size */}
        <div id="registered-students-print-table" className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-2.5 border-r border-slate-200 w-10 text-center">#</th>
                <th className="p-2.5 border-r border-slate-200 w-14 text-center">Photo</th>
                <th className="p-2.5 border-r border-slate-200">Registration No</th>
                <th className="p-2.5 border-r border-slate-200">Full Name</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Gender</th>
                <th className="p-2.5 border-r border-slate-200">Class & Stream</th>
                <th className="p-2.5 border-r border-slate-200">Level</th>
                <th className="p-2.5 border-r border-slate-200">Subjects Enrolled</th>
                <th className="p-2.5 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFilteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No registered students found matching your criteria.
                  </td>
                </tr>
              ) : (
                sortedFilteredStudents.map((s, idx) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center">
                      {s.passportPhoto ? (
                        <img
                          src={s.passportPhoto}
                          alt={s.name}
                          className="w-9 h-11 object-cover rounded border border-slate-300 mx-auto shadow-2xs"
                        />
                      ) : (
                        <div className="w-9 h-11 bg-slate-100 rounded border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-blue-700">
                      {s.regNo || `S${String(idx + 1).padStart(4, '0')}`}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{s.name}</td>
                    <td className="p-2.5 border-r border-slate-200 text-center">{s.gender}</td>
                    <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-700">
                      {s.className} - {s.stream || s.combination || 'Standard'}
                    </td>
                    <td className="p-2.5 border-r border-slate-200">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.level === 'ACSEE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {s.level}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 max-w-xs truncate" title={s.subjects.join(', ')}>
                      <span className="font-bold text-slate-800">({s.subjects.length})</span> {s.subjects.slice(0, 4).join(', ')}{s.subjects.length > 4 ? '...' : ''}
                    </td>
                    <td className="p-2.5 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingRecordStudent(s)}
                          className="px-2 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 cursor-pointer"
                        >
                          Record
                        </button>
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete student ${s.name}?`)) {
                              onDeleteStudent(s.id);
                            }
                          }}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-slate-800">
                Edit Student Information ({editingStudent.regNo})
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4 items-start">
              {/* Passport in edit modal */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-20 h-24 bg-slate-100 border border-slate-300 rounded overflow-hidden flex items-center justify-center">
                  {editingStudent.passportPhoto ? (
                    <img
                      src={editingStudent.passportPhoto}
                      alt={editingStudent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <label className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handlePhotoUpload(e, true)}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingStudent.name}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Class</label>
                    <select
                      value={editingStudent.className}
                      onChange={e => setEditingStudent({ ...editingStudent, className: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option>Form 1</option>
                      <option>Form 2</option>
                      <option>Form 3</option>
                      <option>Form 4</option>
                      <option>Form 5</option>
                      <option>Form 6</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Stream</label>
                    <select
                      value={editingStudent.stream ? editingStudent.stream.replace(/^STREAM\s+/i, '') : 'A'}
                      onChange={e => setEditingStudent({ ...editingStudent, stream: `STREAM ${e.target.value}` })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      {allRegisteredStreams.map((st: string) => (
                        <option key={st} value={st}>Stream {st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Gender</label>
                    <select
                      value={editingStudent.gender}
                      onChange={e => setEditingStudent({ ...editingStudent, gender: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateStudent(editingStudent);
                  setEditingStudent(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Academic Record Modal */}
      {viewingRecordStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 border-b pb-3">
              {viewingRecordStudent.passportPhoto ? (
                <img
                  src={viewingRecordStudent.passportPhoto}
                  alt={viewingRecordStudent.name}
                  className="w-12 h-14 object-cover rounded border border-slate-300 shadow-xs"
                />
              ) : (
                <div className="w-12 h-14 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-[#1f4d8b]">
                  {viewingRecordStudent.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Reg No: {viewingRecordStudent.regNo} • {viewingRecordStudent.className} {viewingRecordStudent.stream || viewingRecordStudent.combination}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-800">{viewingRecordStudent.total || 0}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Total Marks</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="text-lg font-bold text-emerald-800">{viewingRecordStudent.average || '0.0'}%</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Average</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-800">{viewingRecordStudent.division || '-'}</div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Division</div>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs mt-3">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <th className="p-2 border">Subject</th>
                  <th className="p-2 border text-center">Mark</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(viewingRecordStudent.marks || {}).map(([sub, mark]) => (
                  <tr key={sub} className="border-b">
                    <td className="p-2 border font-medium">{sub}</td>
                    <td className="p-2 border text-center font-bold">{mark}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setViewingRecordStudent(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
