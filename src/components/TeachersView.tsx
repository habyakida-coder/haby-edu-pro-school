import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import { Teacher, SchoolStaffRole, TeacherEvaluation, SchoolInfo, UserAccount, StreamSetting } from '../types';
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
  schoolInfo?: SchoolInfo;
  currentUser?: UserAccount | null;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  teacherEvaluations = [],
  onSaveEvaluation,
  onDeleteEvaluation,
  streamSettings = [],
  schoolInfo,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'evaluations'>('roster');

  const [name, setName] = useState('');
  const [schoolRole, setSchoolRole] = useState<string>('Subject Teacher');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [subject1, setSubject1] = useState(SUBJECT_LIST[0]);
  const [subject2, setSubject2] = useState('');
  const [excludeInvigilation, setExcludeInvigilation] = useState(false);
  const [customColor, setCustomColor] = useState(INVIGILATOR_COLORS[0].hex);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string>('');
  
  // Teaching streams & 40-minute periods allocation
  const [teachingStreams, setTeachingStreams] = useState<string[]>([]);
  const [maxPeriodsPerWeek, setMaxPeriodsPerWeek] = useState<number>(20);

  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Compute all available class streams for selection
  const allAvailableStreams = React.useMemo(() => {
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
        // Compress image using canvas
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter teacher full name.');
      return;
    }
    if (subject1 === subject2) {
      alert('Subject 1 and Subject 2 cannot be the same.');
      return;
    }

    const finalRole = isCustomRole ? (customRole.trim() || 'Subject Teacher') : schoolRole;

    if (editingTeacher) {
      const updatedTeacher: Teacher = {
        ...editingTeacher,
        name: name.trim(),
        initial: generateInitials(name.trim(), editingTeacher.id),
        schoolRole: finalRole,
        subjects: [subject1, ...(subject2 ? [subject2] : [])],
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
      alert(`Teacher ${updatedTeacher.name} updated successfully!`);
    } else {
      const newTeacher: Teacher = {
        id: Date.now(),
        name: name.trim(),
        initial: currentInitial,
        schoolRole: finalRole,
        subjects: [subject1, ...(subject2 ? [subject2] : [])],
        excludeInvigilation,
        color: customColor,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        passportPhoto: passportPhoto || undefined,
        teachingStreams,
        maxPeriodsPerWeek
      };
      onAddTeacher(newTeacher);
      alert(`Teacher ${newTeacher.name} (${newTeacher.initial}) registered successfully with role: ${finalRole}!`);
    }
    
    setName('');
    setSchoolRole('Subject Teacher');
    setIsCustomRole(false);
    setCustomRole('');
    setSubject1(SUBJECT_LIST[0]);
    setSubject2('');
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

    setSubject1(teacher.subjects[0] || SUBJECT_LIST[0]);
    setSubject2(teacher.subjects[1] || '');
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
    setSubject1(SUBJECT_LIST[0]);
    setSubject2('');
    setExcludeInvigilation(false);
    setCustomColor(INVIGILATOR_COLORS[0].hex);
    setPhone('');
    setEmail('');
    setPassportPhoto('');
    setTeachingStreams([]);
    setMaxPeriodsPerWeek(20);
  };

  const getRoleBadgeStyle = (role?: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('headmaster') || r.includes('headmistress')) {
      return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
    if (r.includes('discipline')) {
      return 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
    }
    if (r.includes('academic')) {
      return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
    }
    if (r.includes('second master') || r.includes('deputy')) {
      return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
    }
    if (r.includes('hod') || r.includes('department')) {
      return 'bg-purple-100 text-purple-900 border-purple-300 font-semibold';
    }
    if (r.includes('sports') || r.includes('games')) {
      return 'bg-orange-100 text-orange-900 border-orange-300 font-semibold';
    }
    if (r.includes('examination')) {
      return 'bg-cyan-100 text-cyan-900 border-cyan-300 font-semibold';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const filteredTeachers = teachers.filter(t => {
    const q = searchFilter.toLowerCase();
    const matchSearch = !q || 
      t.name.toLowerCase().includes(q) || 
      t.initial.toLowerCase().includes(q) ||
      (t.schoolRole && t.schoolRole.toLowerCase().includes(q)) ||
      t.subjects.some(s => s.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (roleFilter === 'ALL') return true;
    if (roleFilter === 'ACADEMIC') return (t.schoolRole || '').toLowerCase().includes('academic');
    if (roleFilter === 'DISCIPLINE') return (t.schoolRole || '').toLowerCase().includes('discipline');
    if (roleFilter === 'LEADERSHIP') {
      const r = (t.schoolRole || '').toLowerCase();
      return r.includes('headmaster') || r.includes('headmistress') || r.includes('second master') || r.includes('deputy');
    }
    if (roleFilter === 'HOD') return (t.schoolRole || '').toLowerCase().includes('hod') || (t.schoolRole || '').toLowerCase().includes('department');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
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
            <User className="w-4 h-4" />
            <span>Faculty Roster & Teaching Streams ({teachers.length})</span>
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
            <span>Academic Teaching Evaluations & Reports</span>
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1f4d8b] flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              {editingTeacher ? `Edit Staff Record: ${editingTeacher.name}` : 'Staff & Faculty Registration'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Register teachers and assign official school administrative responsibilities (Academic Master, Discipline Master, HODs, Leadership), passport size photo, subject allocations, and invigilation quotas.
            </p>
          </div>
          {editingTeacher && (
            <button
              onClick={cancelEdit}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Passport Photo Upload Column */}
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
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Adelmarcy Mallya"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
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
                      <option value="Spiritual Patron (Chaplain / Imam)">Spiritual Patron (Chaplain / Imam)</option>
                      <option value="Library Master">Library Master</option>
                      <option value="Subject Teacher">Subject Teacher (Standard)</option>
                    </optgroup>
                    <option value="CUSTOM">+ Specify Other Custom Role...</option>
                  </select>
                ) : (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Scout Patron / Lab Technician"
                      value={customRole}
                      onChange={e => setCustomRole(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
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
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Subject 1 (Primary) *</label>
                <select
                  value={subject1}
                  onChange={e => setSubject1(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  {SUBJECT_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Subject 2 (Secondary)</label>
                <select
                  value={subject2}
                  onChange={e => setSubject2(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- None --</option>
                  {SUBJECT_LIST.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Invigilation Availability</label>
                <select
                  value={excludeInvigilation ? 'yes' : 'no'}
                  onChange={e => setExcludeInvigilation(e.target.value === 'yes')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="no">Available for Invigilation</option>
                  <option value="yes">Excluded from Invigilation</option>
                </select>
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
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
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
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Color Identity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={e => setCustomColor(e.target.value)}
                    className="w-10 h-9 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600">Distinct Invigilator Color</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Generated Initial Preview</label>
                <div className="flex items-center gap-2">
                  <span
                    style={{ backgroundColor: customColor, color: '#ffffff' }}
                    className="w-9 h-9 rounded-full inline-flex items-center justify-center font-bold text-sm shadow-xs"
                  >
                    {currentInitial}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-semibold">Auto-assigned identifier</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-200">
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                editingTeacher ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              {editingTeacher ? 'Update Teacher & Role' : 'Register Teacher & Assign Role'}
            </button>
            {editingTeacher && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-xs cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Registered Teachers Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-[#1f4d8b] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Registered School Faculty & Administrative Roster ({filteredTeachers.length} of {teachers.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete registry of academic, discipline, departmental, and administrative staff.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Filter */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search teacher, role..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            {/* Role Category Filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Roles ({teachers.length})</option>
              <option value="ACADEMIC">Academic Discipline / Officers</option>
              <option value="DISCIPLINE">Discipline Masters / Mistresses</option>
              <option value="LEADERSHIP">Leadership (Head / Second Master)</option>
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
                <th className="p-2.5 border-r border-slate-200">School Staff Role</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Initial Badge</th>
                <th className="p-2.5 border-r border-slate-200">Teaching Subjects</th>
                <th className="p-2.5 border-r border-slate-200">Contact</th>
                <th className="p-2.5 border-r border-slate-200">Invigilation</th>
                <th className="p-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No faculty members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, idx) => {
                  const col = getTeacherColor(t.id);
                  return (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200 text-center">
                        {t.passportPhoto ? (
                          <img
                            src={t.passportPhoto}
                            alt={t.name}
                            className="w-9 h-11 object-cover rounded border border-slate-300 mx-auto shadow-2xs"
                          />
                        ) : (
                          <div className="w-9 h-11 bg-slate-100 rounded border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        <div className="font-bold text-slate-800">{t.name}</div>
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] border shadow-2xs ${getRoleBadgeStyle(t.schoolRole)}`}>
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
                        <div className="font-medium text-slate-700">{t.subjects[0]}</div>
                        {t.subjects[1] && (
                          <div className="text-[10px] text-slate-500">{t.subjects[1]}</div>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] text-slate-600">
                        {t.phone && <div>{t.phone}</div>}
                        {t.email && <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{t.email}</div>}
                        {!t.phone && !t.email && <span className="text-slate-400 italic">--</span>}
                      </td>
                      <td className="p-2.5 border-r border-slate-200">
                        {t.excludeInvigilation ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Excluded
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(t)}
                            className={`px-2 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer ${
                              editingTeacher?.id === t.id 
                                ? 'bg-amber-600 text-white border-amber-600' 
                                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                            }`}
                          >
                            {editingTeacher?.id === t.id ? 'Editing...' : 'Edit'}
                          </button>
                          <button
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
    </div>
  );
};
