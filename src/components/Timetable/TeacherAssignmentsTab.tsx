import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Edit3, 
  X,
  BookOpen
} from 'lucide-react';
import { Teacher, TeacherAssignment, StreamSetting } from '../../types';
import { SUBJECT_LIST } from '../../constants/defaults';

interface TeacherAssignmentsTabProps {
  teachers: Teacher[];
  streamSettings: StreamSetting[];
  teacherAssignments: TeacherAssignment[];
  onUpdateTeacherAssignments: (assignments: TeacherAssignment[]) => void;
}

export const TeacherAssignmentsTab: React.FC<TeacherAssignmentsTabProps> = ({
  teachers,
  streamSettings,
  teacherAssignments,
  onUpdateTeacherAssignments
}) => {
  const [localAssignments, setLocalAssignments] = useState<TeacherAssignment[]>(teacherAssignments);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(teachers[0]?.id || 101);
  const [selectedLevel, setSelectedLevel] = useState<'NURSERY' | 'PRIMARY' | 'SECONDARY'>('SECONDARY');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(teachers[0]?.subjects || ['Mathematics']);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [savedToast, setSavedToast] = useState(false);

  // Available streams across all classes
  const allAvailableStreamOptions = streamSettings.flatMap(ss => 
    ss.streams.map(str => `${ss.className} - ${str}`)
  );

  const handleToggleStream = (streamTag: string) => {
    if (selectedStreams.includes(streamTag)) {
      setSelectedStreams(selectedStreams.filter(s => s !== streamTag));
    } else {
      setSelectedStreams([...selectedStreams, streamTag]);
    }
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = teachers.find(t => t.id === Number(selectedTeacherId));
    if (!teacher) return;

    const newAssignment: TeacherAssignment = {
      id: `ta_${teacher.id}_${selectedLevel}_${Date.now()}`,
      teacherId: teacher.id,
      teacherName: teacher.name,
      level: selectedLevel,
      subjects: selectedSubjects.length > 0 ? selectedSubjects : teacher.subjects,
      streams: selectedStreams
    };

    const next = [...localAssignments, newAssignment];
    setLocalAssignments(next);
    setSelectedStreams([]);
  };

  const handleDeleteAssignment = (id: string) => {
    const next = localAssignments.filter(a => a.id !== id);
    setLocalAssignments(next);
  };

  const handleSaveAll = () => {
    onUpdateTeacherAssignments(localAssignments);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1f4d8b] to-blue-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Upangaji wa Walimu kwa Ngazi na Mikondo (Teacher Assignments)</h2>
            <p className="text-xs text-blue-200">
              Panga kila mwalimu: Ngazi anayofundisha (Nursery/Primary/Secondary), masomo, na mikondo anayofundisha
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>Hifadhi Mgawanyo (Save Assignments)</span>
        </button>
      </div>

      {savedToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Mgawanyo wa walimu umehifadhiwa kikamilifu kwenye jedwali la teacher_assignments!</span>
        </div>
      )}

      {/* Assignment Creator Form */}
      <form onSubmit={handleAddAssignment} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Panga Mwalimu Mpya kwenye Ngazi na Mkondo
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Teacher Selector */}
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
              Chagua Mwalimu (Teacher)
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                const tid = Number(e.target.value);
                setSelectedTeacherId(tid);
                const t = teachers.find(item => item.id === tid);
                if (t) setSelectedSubjects(t.subjects || []);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.schoolRole || 'Mwalimu'})</option>
              ))}
            </select>
          </div>

          {/* Level Selector */}
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
              Ngazi Anayofundisha (Teaching Level)
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option value="NURSERY">NURSERY LEVEL (Awali & Nursery)</option>
              <option value="PRIMARY">PRIMARY LEVEL (Standard 1 - 7)</option>
              <option value="SECONDARY">SECONDARY LEVEL (Form 1 - 6)</option>
            </select>
          </div>

          {/* Subject Display */}
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
              Masomo Anayofundisha (Subjects)
            </label>
            <input
              type="text"
              readOnly
              value={selectedSubjects.join(', ')}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* Multi-Stream Selector Chips */}
        <div>
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-2">
            Chagua Mikondo Anayofundisha Mwalimu Huyu (Select Streams Taught e.g., Std 1A, 1B, 2A):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
            {allAvailableStreamOptions.map(tag => {
              const checked = selectedStreams.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleStream(tag)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition flex items-center justify-between cursor-pointer ${
                    checked
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate">{tag}</span>
                  {checked && <span className="text-white text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={selectedStreams.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ongeza Kwenye Jedwali (Add Assignment)</span>
          </button>
        </div>
      </form>

      {/* Assignments Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
            Jedwali la Walimu na Mikondo (Teacher Assignments Table - {localAssignments.length} Rekodi)
          </span>
          <span className="text-xs text-slate-500">Imehifadhiwa kwenye jedwali la teacher_assignments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1f4d8b] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Mwalimu (Teacher)</th>
                <th className="p-3">Ngazi (Level)</th>
                <th className="p-3">Masomo (Subjects)</th>
                <th className="p-3">Mikondo Anayofundisha (Streams)</th>
                <th className="p-3 text-center w-20">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {localAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Hakuna walimu waliopangiwa bado. Tumia fomu ya juu kupanga walimu kwenye mikondo.
                  </td>
                </tr>
              ) : (
                localAssignments.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                        {item.teacherName.charAt(0)}
                      </div>
                      <span>{item.teacherName}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        item.level === 'NURSERY'
                          ? 'bg-amber-100 text-amber-800'
                          : item.level === 'PRIMARY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.level}
                      </span>
                    </td>
                    <td className="p-3 text-slate-800 font-medium">
                      {item.subjects.join(', ')}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.streams.map(str => (
                          <span key={str} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]">
                            {str}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(item.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Futa Mgawanyo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
