import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Trash2, 
  Edit3, 
  ShieldAlert, 
  Palette, 
  Camera, 
  Upload, 
  X, 
  Award, 
  Phone, 
  Mail, 
  Briefcase,
  Search, 
  Filter, 
  User, 
  Layers, 
  Clock, 
  Sparkles, 
  Check,
  Calendar,
  Plus,
  Printer,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { 
  Teacher, 
  SchoolStaffRole, 
  TeacherEvaluation, 
  SchoolInfo, 
  UserAccount, 
  StreamSetting,
  TimetableAssignment,
  PeriodSetting 
} from '../types';
import { SUBJECT_LIST, INVIGILATOR_COLORS, STAFF_ROLES_LIST, DEFAULT_CLASSES } from '../constants/defaults';
import { getTeacherColor } from '../utils/colors';
import { TeacherEvaluationView } from './TeacherEvaluationView';

interface TeachersViewProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: number) => void;
  teacherEvaluations?: TeacherEvaluation[];
  onSaveEvaluation?: (evaluation: TeacherEvaluation) => void;
  onDeleteEvaluation?: (id: string) => void;
  streamSettings?: StreamSetting[];
  timetableAssignments?: TimetableAssignment[];
  onUpdateTimetableAssignments?: (assignments: TimetableAssignment[]) => void;
  periodSettings?: PeriodSetting[];
  schoolInfo?: SchoolInfo;
  currentUser?: UserAccount | null;
}

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const POPULAR_SUBJECTS = [
  'Mathematics',
  'Basic Mathematics',
  'English Language',
  'Kiswahili',
  'Biology',
  'Chemistry',
  'Physics',
  'Geography',
  'History',
  'Civics',
  'ICT / TEHAMA',
  'Commerce',
  'Book Keeping'
];

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  teacherEvaluations = [],
  onSaveEvaluation,
  onDeleteEvaluation,
  streamSettings = [],
  timetableAssignments = [],
  onUpdateTimetableAssignments,
  periodSettings = [],
  schoolInfo,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'evaluations'>('roster');

  // Form states
  const [name, setName] = useState('');
  const [schoolRole, setSchoolRole] = useState<string>('Subject Teacher');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  
  // MULTIPLE TEACHING SUBJECTS (not limited to 2)
  const [subjects, setSubjects] = useState<string[]>(['Basic Mathematics', 'English Language']);
  const [subjectSearch, setSubjectSearch] = useState('');

  const [excludeInvigilation, setExcludeInvigilation] = useState(false);
  const [customColor, setCustomColor] = useState(INVIGILATOR_COLORS[0].hex);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string>('');
  
  // Teaching streams allocation
  const [teachingStreams, setTeachingStreams] = useState<string[]>([]);
  const [maxPeriodsPerWeek, setMaxPeriodsPerWeek] = useState<number>(20);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Timetable schedule modal state
  const [viewingTimetableTeacher, setViewingTimetableTeacher] = useState<Teacher | null>(null);

  // New timetable slot form within modal
  const [slotDay, setSlotDay] = useState('MONDAY');
  const [slotPeriod, setSlotPeriod] = useState('PERIOD 1');
  const [slotClass, setSlotClass] = useState('Form 1');
  const [slotStream, setSlotStream] = useState('STREAM A');
  const [slotSubject, setSlotSubject] = useState('');
  const [slotRoom, setSlotRoom] = useState('');
  const [slotToast, setSlotToast] = useState<string | null>(null);

  // Compute all available class streams for selection
  const allAvailableStreams = useMemo(() => {
    const list: string[] = [];
    DEFAULT_CLASSES.forEach(cName => {
      const found = streamSettings.find(s => s.className === cName);
      const streams = found?.streams && found.streams.length > 0 ? found.streams : ['STREAM A', 'STREAM B'];
      streams.forEach(sName => {
        list.push(`${cName} - ${sName}`);
      });
    });
    return list;
  }, [streamSettings]);

  // Standard period names
  const periodsList = useMemo(() => {
    if (periodSettings.length > 0) {
      return periodSettings.map((p, idx) => p.name || `PERIOD ${idx + 1}`);
    }
    return [
      'PERIOD 1', 'PERIOD 2', 'PERIOD 3', 'PERIOD 4', 
      'PERIOD 5', 'PERIOD 6', 'PERIOD 7', 'PERIOD 8'
    ];
  }, [periodSettings]);

  // Auto-generate initials
  const generateInitials = (fullName: string, currentTeacherId?: number): string => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'NN';
    const first = parts[0].charAt(0);
    const second = parts.length > 1 ? parts[1].charAt(0) : parts[0].charAt(1) || 'N';
    const base = `${first}${second}`.toUpperCase();

    let result = base;
    let counter = 1;
    while (teachers.some(t => t.initial === result && t.id !== currentTeacherId)) {
      counter++;
      result = `${base}${counter}`;
    }
    return result;
  };

  const currentInitial = name.trim() ? generateInitials(name, editingTeacher?.id) : '--';

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setPassportPhoto(compressed);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle subject selection
  const handleToggleSubject = (sub: string) => {
    setSubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  // Toggle stream selection
  const handleToggleStream = (streamName: string) => {
    setTeachingStreams(prev => 
      prev.includes(streamName) ? prev.filter(s => s !== streamName) : [...prev, streamName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter teacher full name.');
      return;
    }
    if (subjects.length === 0) {
      alert('Please select at least one teaching subject.');
      return;
    }

    const finalRole = isCustomRole ? (customRole.trim() || 'Subject Teacher') : schoolRole;

    if (editingTeacher) {
      const updatedTeacher: Teacher = {
        ...editingTeacher,
        name: name.trim(),
        initial: generateInitials(name.trim(), editingTeacher.id),
        schoolRole: finalRole,
        subjects: subjects,
        excludeInvigilation,
        color: customColor,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        passportPhoto: passportPhoto || undefined,
        teachingStreams,
        maxPeriodsPerWeek
      };
      onUpdateTeacher(updatedTeacher);
      setEditingTeacher(null);
      alert(`Teacher ${updatedTeacher.name} updated successfully with ${subjects.length} subjects!`);
    } else {
      const newTeacher: Teacher = {
        id: Date.now(),
        name: name.trim(),
        initial: currentInitial,
        schoolRole: finalRole,
        subjects: subjects,
        excludeInvigilation,
        color: customColor,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        passportPhoto: passportPhoto || undefined,
        teachingStreams,
        maxPeriodsPerWeek
      };
      onAddTeacher(newTeacher);
      alert(`Teacher ${newTeacher.name} (${newTeacher.initial}) registered successfully with ${subjects.length} teaching subjects!`);
    }
    
    // Reset form
    setName('');
    setSchoolRole('Subject Teacher');
    setIsCustomRole(false);
    setCustomRole('');
    setSubjects(['Basic Mathematics', 'English Language']);
    setSubjectSearch('');
    setExcludeInvigilation(false);
    setCustomColor(INVIGILATOR_COLORS[0].hex);
    setPhone('');
    setEmail('');
    setPassportPhoto('');
    setTeachingStreams([]);
    setMaxPeriodsPerWeek(20);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    
    if (teacher.schoolRole && STAFF_ROLES_LIST.includes(teacher.schoolRole)) {
      setSchoolRole(teacher.schoolRole);
      setIsCustomRole(false);
      setCustomRole('');
    } else if (teacher.schoolRole) {
      setIsCustomRole(true);
      setCustomRole(teacher.schoolRole);
    } else {
      setSchoolRole('Subject Teacher');
      setIsCustomRole(false);
    }

    setSubjects(teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects : [SUBJECT_LIST[0]]);
    setExcludeInvigilation(teacher.excludeInvigilation);
    setCustomColor(teacher.color || INVIGILATOR_COLORS[0].hex);
    setPhone(teacher.phone || '');
    setEmail(teacher.email || '');
    setPassportPhoto(teacher.passportPhoto || '');
    setTeachingStreams(teacher.teachingStreams || []);
    setMaxPeriodsPerWeek(teacher.maxPeriodsPerWeek || 20);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTeacher(null);
    setName('');
    setSchoolRole('Subject Teacher');
    setIsCustomRole(false);
    setCustomRole('');
    setSubjects(['Basic Mathematics', 'English Language']);
    setSubjectSearch('');
    setExcludeInvigilation(false);
    setCustomColor(INVIGILATOR_COLORS[0].hex);
    setPhone('');
    setEmail('');
    setPassportPhoto('');
    setTeachingStreams([]);
    setMaxPeriodsPerWeek(20);
  };

  // Filter teachers by search and role
  const filteredTeachers = teachers.filter(t => {
    const q = searchFilter.toLowerCase();
    const matchesSearch = !q || 
      t.name.toLowerCase().includes(q) || 
      (t.schoolRole && t.schoolRole.toLowerCase().includes(q)) ||
      (t.subjects && t.subjects.some(s => s.toLowerCase().includes(q)));
    
    if (!matchesSearch) return false;

    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'ACADEMIC') {
      return t.schoolRole?.includes('Academic') || t.schoolRole?.includes('Examination');
    }
    if (roleFilter === 'DISCIPLINE') {
      return t.schoolRole?.includes('Discipline');
    }
    if (roleFilter === 'LEADERSHIP') {
      return t.schoolRole?.includes('Headmaster') || t.schoolRole?.includes('Second Master') || t.schoolRole?.includes('Deputy');
    }
    if (roleFilter === 'HOD') {
      return t.schoolRole?.includes('Head of Department');
    }
    return true;
  });

  const getRoleBadgeStyle = (role?: string) => {
    if (!role) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (role.includes('Headmaster') || role.includes('Deputy')) {
      return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
    }
    if (role.includes('Academic') || role.includes('Examination')) {
      return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
    }
    if (role.includes('Discipline')) {
      return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    }
    if (role.includes('Head of Department')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Filter subjects for the multi-select search
  const searchedSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return SUBJECT_LIST;
    const q = subjectSearch.toLowerCase();
    return SUBJECT_LIST.filter(s => s.toLowerCase().includes(q));
  }, [subjectSearch]);

  // Timetable slots for viewing teacher
  const viewingTeacherSlots = useMemo(() => {
    if (!viewingTimetableTeacher) return [];
    const tName = viewingTimetableTeacher.name.toLowerCase();
    const tInit = viewingTimetableTeacher.initial?.toLowerCase();

    return timetableAssignments.filter(a => {
      const matchId = a.teacherId === viewingTimetableTeacher.id;
      const aTeacher = (('teacher' in a ? (a as any).teacher : '') || '').toLowerCase();
      return matchId || aTeacher === tName || (tInit && aTeacher === tInit) || aTeacher.includes(tName);
    });
  }, [viewingTimetableTeacher, timetableAssignments]);

  // Matrix: day -> period -> assignment
  const viewingScheduleMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, TimetableAssignment | undefined>> = {};
    WEEKDAYS.forEach(day => {
      matrix[day] = {};
      periodsList.forEach(p => {
        const found = viewingTeacherSlots.find(s => 
          s.day.toUpperCase() === day && s.period.toUpperCase() === p.toUpperCase()
        );
        matrix[day][p] = found;
      });
    });
    return matrix;
  }, [viewingTeacherSlots, periodsList]);

  // Handle adding a timetable slot for the teacher
  const handleAddTimetableSlot = () => {
    if (!viewingTimetableTeacher || !onUpdateTimetableAssignments) return;
    const subjectToAssign = slotSubject || viewingTimetableTeacher.subjects[0] || 'Basic Mathematics';

    const newSlot: TimetableAssignment = {
      id: Date.now(),
      day: slotDay as any,
      period: slotPeriod,
      teacherId: viewingTimetableTeacher.id,
      subject: subjectToAssign,
      className: slotClass,
      stream: slotStream,
      room: slotRoom.trim() || undefined
    };
    (newSlot as any).teacher = viewingTimetableTeacher.name;

    // Filter out existing slot in same day & period if exists
    const updated = [
      ...timetableAssignments.filter(a => 
        !(a.day.toUpperCase() === slotDay.toUpperCase() && 
          a.period.toUpperCase() === slotPeriod.toUpperCase() &&
          a.className.toLowerCase() === slotClass.toLowerCase() &&
          a.stream.toLowerCase() === slotStream.toLowerCase())
      ),
      newSlot
    ];

    onUpdateTimetableAssignments(updated);
    setSlotToast(`Assigned ${subjectToAssign} for ${slotClass} (${slotStream}) on ${slotDay} ${slotPeriod}`);
    setTimeout(() => setSlotToast(null), 3000);
  };

  const handleRemoveTimetableSlot = (slotId: number | string) => {
    if (!onUpdateTimetableAssignments) return;
    const updated = timetableAssignments.filter(a => String(a.id) !== String(slotId));
    onUpdateTimetableAssignments(updated);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Faculty Roster &amp; Staff Registration</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === 'roster' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {teachers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('evaluations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'evaluations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Academic Teaching Evaluations</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSubTab === 'evaluations' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {teacherEvaluations.length}
            </span>
          </button>
        </div>

        {activeSubTab === 'roster' && (
          <span className="text-xs text-slate-500 font-medium">
            Standard: <strong>40 minutes</strong> per teaching period
          </span>
        )}
      </div>

      {activeSubTab === 'evaluations' ? (
        <TeacherEvaluationView
          teachers={teachers}
          evaluations={teacherEvaluations}
          onSaveEvaluation={onSaveEvaluation || (() => {})}
          onDeleteEvaluation={onDeleteEvaluation || (() => {})}
          schoolInfo={schoolInfo}
          currentUser={currentUser}
          streamSettings={streamSettings}
        />
      ) : (
        <>
          {/* Registration / Edit Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1f4d8b] flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  {editingTeacher ? `Edit Faculty Record: ${editingTeacher.name}` : 'Staff & Faculty Registration'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Register teachers with multiple teaching subjects, class stream allocations, weekly timetable quotas, and administrative roles.
                </p>
              </div>
              {editingTeacher && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Passport Photo Upload Column */}
                <div className="lg:col-span-1 flex flex-col items-center justify-start p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Passport Size Photo
                  </label>

                  <div className="relative w-28 h-36 bg-white border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex flex-col items-center justify-center shadow-xs group hover:border-blue-400 transition-colors">
                    {passportPhoto ? (
                      <>
                        <img
                          src={passportPhoto}
                          alt="Teacher Passport"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPassportPhoto('')}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center p-2 cursor-pointer text-slate-400 hover:text-blue-600">
                        <User className="w-10 h-10 mb-1 stroke-1" />
                        <span className="text-[10px] font-bold text-slate-500">Upload Photo</span>
                        <span className="text-[8px] text-slate-400 mt-0.5">3.5 × 4.5 cm (Passport)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <label className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Select Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
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
                    Recommended 350×450px. Appears on printed faculty rosters and IDs.
                  </p>
                </div>

                {/* Inputs Column */}
                <div className="lg:col-span-3 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Teacher Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Adelmarcy Mallya"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                        required
                      />
                    </div>

                    {/* School Administrative / Faculty Role */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase block mb-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        School Staff Role *
                      </label>
                      {!isCustomRole ? (
                        <select
                          value={schoolRole}
                          onChange={e => {
                            if (e.target.value === 'CUSTOM') {
                              setIsCustomRole(true);
                              setCustomRole('');
                            } else {
                              setSchoolRole(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                        >
                          <optgroup label="Academic & Discipline Leadership">
                            <option value="Academic Master">Academic Master</option>
                            <option value="Academic Mistress">Academic Mistress</option>
                            <option value="Discipline Master">Discipline Master</option>
                            <option value="Discipline Mistress">Discipline Mistress</option>
                            <option value="Examination Officer">Examination Officer</option>
                          </optgroup>
                          <optgroup label="School Executive Administration">
                            <option value="Headmaster">Headmaster</option>
                            <option value="Headmistress">Headmistress</option>
                            <option value="Second Master">Second Master</option>
                            <option value="Deputy Headmaster">Deputy Headmaster</option>
                          </optgroup>
                          <optgroup label="Heads of Department (HOD)">
                            <option value="Head of Department (HOD) - Science">Head of Department (HOD) - Science</option>
                            <option value="Head of Department (HOD) - Mathematics">Head of Department (HOD) - Mathematics</option>
                            <option value="Head of Department (HOD) - Languages">Head of Department (HOD) - Languages</option>
                            <option value="Head of Department (HOD) - Arts & Social Studies">Head of Department (HOD) - Arts & Social Studies</option>
                            <option value="Head of Department (HOD) - Business & ICT">Head of Department (HOD) - Business & ICT</option>
                          </optgroup>
                          <optgroup label="Student Welfare & Special Roles">
                            <option value="Class Teacher / Master">Class Teacher / Master</option>
                            <option value="Sports & Games Master">Sports & Games Master</option>
                            <option value="Health, Sanitation & Environment Master">Health & Environmental Master</option>
                            <option value="Guidance & Counseling Master">Guidance & Counseling Master</option>
                            <option value="Patron / Matron (Boarding)">Patron / Matron (Boarding)</option>
                            <option value="Subject Teacher">Subject Teacher (Standard)</option>
                          </optgroup>
                          <option value="CUSTOM">+ Specify Other Custom Role...</option>
                        </select>
                      ) : (
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="e.g. Lab Technician"
                            value={customRole}
                            onChange={e => setCustomRole(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomRole(false);
                              setSchoolRole('Subject Teacher');
                            }}
                            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 rounded border"
                            title="Back to list"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Weekly Period Quota</label>
                      <input
                        type="number"
                        min="1"
                        max="45"
                        value={maxPeriodsPerWeek}
                        onChange={e => setMaxPeriodsPerWeek(Number(e.target.value) || 20)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                        placeholder="e.g. 20 periods"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Phone Number (Optional)</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          placeholder="+255 7..."
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Email Address (Optional)</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          placeholder="teacher@school.ac.tz"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Invigilation Availability</label>
                      <select
                        value={excludeInvigilation ? 'yes' : 'no'}
                        onChange={e => setExcludeInvigilation(e.target.value === 'yes')}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="no">Available for Invigilation</option>
                        <option value="yes">Excluded from Invigilation</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Color Identity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customColor}
                          onChange={e => setCustomColor(e.target.value)}
                          className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs text-slate-600">Distinct Invigilator Color</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Initial Preview</label>
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: customColor, color: '#ffffff' }}
                          className="w-9 h-9 rounded-full inline-flex items-center justify-center font-bold text-sm shadow-xs"
                        >
                          {currentInitial}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Auto-assigned</span>
                      </div>
                    </div>
                  </div>

                  {/* MULTIPLE TEACHING SUBJECTS REGISTRATION (Not limited to 2) */}
                  <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-700" />
                        <span className="text-xs font-bold text-blue-900 uppercase">
                          Teaching Subjects ({subjects.length} selected - no limit)
                        </span>
                      </div>
                      <span className="text-[11px] text-blue-700">
                        Select multiple subjects registered for this teacher
                      </span>
                    </div>

                    {/* Selected subjects badges with remove button */}
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white rounded-xl border border-blue-200">
                      {subjects.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No subjects selected yet. Click from list below.</span>
                      ) : (
                        subjects.map(sub => (
                          <span
                            key={sub}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs"
                          >
                            <span>{sub}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleSubject(sub)}
                              className="text-blue-700 hover:text-rose-700 hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Quick Add Popular Subjects */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase">Quick Add Curriculum Subjects:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SUBJECTS.map(ps => {
                          const isSelected = subjects.includes(ps);
                          return (
                            <button
                              key={ps}
                              type="button"
                              onClick={() => handleToggleSubject(ps)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? `✓ ${ps}` : `+ ${ps}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Search & All Subjects Picker */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Filter or search all school subjects..."
                            value={subjectSearch}
                            onChange={e => setSubjectSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                          />
                        </div>
                        {subjectSearch && (
                          <button
                            type="button"
                            onClick={() => setSubjectSearch('')}
                            className="text-xs text-slate-500 hover:text-slate-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {subjectSearch && (
                        <div className="max-h-36 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
                          {searchedSubjects.map(sub => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => handleToggleSubject(sub)}
                              className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer border ${
                                subjects.includes(sub)
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {subjects.includes(sub) ? `✓ ${sub}` : `+ ${sub}`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TEACHING STREAM & CLASS ALLOCATION */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          Teaching Stream / Class Timetable Allocation ({teachingStreams.length} allocated)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Streams where this teacher conducts lessons
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl">
                      {allAvailableStreams.map(st => {
                        const isSelected = teachingStreams.includes(st);
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleToggleStream(st)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? `✓ ${st}` : `+ ${st}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                    editingTeacher ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  {editingTeacher ? 'Update Teacher Record' : 'Register Faculty Member'}
                </button>
                {editingTeacher && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl shadow-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Registered Teachers Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-[#1f4d8b] flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Registered School Faculty &amp; Staff ({filteredTeachers.length} of {teachers.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete registry of teaching faculty, subject allocations, and weekly timetables.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search teacher, subject..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium text-slate-700"
                >
                  <option value="ALL">All Roles ({teachers.length})</option>
                  <option value="ACADEMIC">Academic &amp; Exam Officers</option>
                  <option value="DISCIPLINE">Discipline Staff</option>
                  <option value="LEADERSHIP">School Leadership</option>
                  <option value="HOD">Heads of Department (HOD)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-2.5 border-r border-slate-200 w-10 text-center">#</th>
                    <th className="p-2.5 border-r border-slate-200 w-14 text-center">Photo</th>
                    <th className="p-2.5 border-r border-slate-200">Teacher Full Name</th>
                    <th className="p-2.5 border-r border-slate-200">Staff Role</th>
                    <th className="p-2.5 border-r border-slate-200 text-center">Initial</th>
                    <th className="p-2.5 border-r border-slate-200">Teaching Subjects</th>
                    <th className="p-2.5 border-r border-slate-200">Class Timetable &amp; Streams</th>
                    <th className="p-2.5 border-r border-slate-200">Contact</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No faculty members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t, idx) => {
                      const col = getTeacherColor(t.id);
                      const tSlots = timetableAssignments.filter(a => {
                        const matchId = a.teacherId === t.id;
                        const aT = (('teacher' in a ? (a as any).teacher : '') || '').toLowerCase();
                        return matchId || aT === t.name.toLowerCase() || (t.initial && aT === t.initial.toLowerCase()) || aT.includes(t.name.toLowerCase());
                      });

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                          <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 border-r border-slate-200 text-center">
                            {t.passportPhoto ? (
                              <img
                                src={t.passportPhoto}
                                alt={t.name}
                                className="w-9 h-11 object-cover rounded-lg border border-slate-300 mx-auto shadow-2xs"
                              />
                            ) : (
                              <div className="w-9 h-11 bg-slate-100 rounded-lg border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            <div className="font-bold text-slate-800">{t.name}</div>
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border shadow-2xs ${getRoleBadgeStyle(t.schoolRole)}`}>
                              {t.schoolRole || 'Subject Teacher'}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-center">
                            <span
                              style={{ backgroundColor: t.color || col.hex, color: '#ffffff' }}
                              className="w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs shadow-2xs"
                            >
                              {t.initial}
                            </span>
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(t.subjects || []).map(sub => (
                                <span
                                  key={sub}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-slate-200">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-xs">
                                  {tSlots.length} periods/wk
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingTimetableTeacher(t);
                                    if (t.subjects && t.subjects.length > 0) setSlotSubject(t.subjects[0]);
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="View complete weekly teaching schedule"
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>Timetable</span>
                                </button>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-xs">
                                {(t.teachingStreams || []).join(', ') || 'Streams: Standard Allocation'}
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 border-r border-slate-200 text-[11px] text-slate-600">
                            {t.phone && <div>{t.phone}</div>}
                            {t.email && <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{t.email}</div>}
                            {!t.phone && !t.email && <span className="text-slate-400 italic">--</span>}
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(t)}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                                  editingTeacher?.id === t.id 
                                    ? 'bg-amber-600 text-white border-amber-600' 
                                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                                }`}
                              >
                                {editingTeacher?.id === t.id ? 'Editing...' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Delete staff member ${t.name}?`)) {
                                    onDeleteTeacher(t.id);
                                    if (editingTeacher?.id === t.id) cancelEdit();
                                  }
                                }}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete Teacher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TEACHER TIMETABLE & TEACHING SCHEDULE MODAL */}
      {viewingTimetableTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0f2948] via-[#1f4d8b] to-indigo-900 text-white p-5 flex flex-wrap items-center justify-between gap-4 border-b border-blue-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black tracking-tight">
                      Teaching Schedule: {viewingTimetableTeacher.name}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                      {viewingTimetableTeacher.schoolRole || 'Teacher'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Subjects: {(viewingTimetableTeacher.subjects || []).join(', ')} | Allocated Streams: {(viewingTimetableTeacher.teachingStreams || []).join(', ') || 'All'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Timetable</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTimetableTeacher(null)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              {slotToast && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{slotToast}</span>
                </div>
              )}

              {/* Weekly Timetable Grid */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Weekly Teaching Timetable ({viewingTeacherSlots.length} periods assigned)
                  </span>
                  <span className="text-xs text-slate-500">
                    Target Quota: <strong>{viewingTimetableTeacher.maxPeriodsPerWeek || 20}</strong> periods / week
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#1f4d8b] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5 text-center w-24 border-r border-blue-900">Day</th>
                        {periodsList.map((p, idx) => (
                          <th key={p} className="p-2 text-center border-r border-blue-900 min-w-[110px]">
                            <div>{p}</div>
                            <div className="text-[9px] text-blue-200 font-normal">
                              {periodSettings[idx] ? `${periodSettings[idx].start} - ${periodSettings[idx].end}` : `Period ${idx + 1}`}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {WEEKDAYS.map(day => (
                        <tr key={day} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 border-r border-slate-200 font-black text-slate-800 bg-slate-50 text-center">
                            {day}
                          </td>
                          {periodsList.map(p => {
                            const slot = viewingScheduleMatrix[day]?.[p];
                            return (
                              <td key={p} className="p-2 border-r border-slate-200 text-center align-top">
                                {slot ? (
                                  <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-slate-800 relative group">
                                    <div className="font-bold text-xs text-blue-900 leading-tight">
                                      {slot.subject}
                                    </div>
                                    <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                                      {slot.className} {slot.stream ? `(${slot.stream})` : ''}
                                    </div>
                                    {slot.room && (
                                      <div className="text-[9px] text-slate-500 font-mono">
                                        Rm: {slot.room}
                                      </div>
                                    )}
                                    {onUpdateTimetableAssignments && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTimetableSlot(slot.id)}
                                        className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 p-0.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition cursor-pointer"
                                        title="Remove slot"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-mono text-xs">--</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Add Timetable Slot Form */}
              {onUpdateTimetableAssignments && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Assign Teaching Period Slot to {viewingTimetableTeacher.name}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Day</label>
                      <select
                        value={slotDay}
                        onChange={e => setSlotDay(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                      >
                        {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Period</label>
                      <select
                        value={slotPeriod}
                        onChange={e => setSlotPeriod(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                      >
                        {periodsList.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Class</label>
                      <select
                        value={slotClass}
                        onChange={e => setSlotClass(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                      >
                        {DEFAULT_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Stream</label>
                      <select
                        value={slotStream}
                        onChange={e => setSlotStream(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                      >
                        {['STREAM A', 'STREAM B', 'STREAM C', 'STREAM D', 'PCM', 'PCB', 'CBG', 'HGE'].map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Subject</label>
                      <select
                        value={slotSubject || viewingTimetableTeacher.subjects[0] || 'Basic Mathematics'}
                        onChange={e => setSlotSubject(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-bold"
                      >
                        {(viewingTimetableTeacher.subjects && viewingTimetableTeacher.subjects.length > 0 
                          ? viewingTimetableTeacher.subjects 
                          : SUBJECT_LIST
                        ).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddTimetableSlot}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                      >
                        Add to Schedule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
