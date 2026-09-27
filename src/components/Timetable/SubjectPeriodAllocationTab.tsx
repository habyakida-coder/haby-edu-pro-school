import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Filter, 
  Layers, 
  Sliders,
  Check
} from 'lucide-react';
import { SubjectPeriodAllocation, StreamSetting } from '../../types';
import { 
  NURSERY_CLASSES, 
  PRIMARY_CLASSES, 
  SECONDARY_CLASSES, 
  NURSERY_SUBJECTS, 
  PRIMARY_SUBJECTS, 
  SUBJECT_LIST 
} from '../../constants/defaults';

interface SubjectPeriodAllocationTabProps {
  allocations: SubjectPeriodAllocation[];
  streamSettings: StreamSetting[];
  onUpdateAllocations: (allocations: SubjectPeriodAllocation[]) => void;
}

export const SubjectPeriodAllocationTab: React.FC<SubjectPeriodAllocationTabProps> = ({
  allocations,
  streamSettings,
  onUpdateAllocations
}) => {
  const [activeLevel, setActiveLevel] = useState<'NURSERY' | 'PRIMARY' | 'SECONDARY'>('PRIMARY');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [localAllocations, setLocalAllocations] = useState<SubjectPeriodAllocation[]>(allocations);
  const [savedToast, setSavedToast] = useState(false);

  // New allocation form modal or inline adder
  const [newClass, setNewClass] = useState<string>('Standard 1');
  const [newStream, setNewStream] = useState<string>('ALL_STREAMS');
  const [newSubject, setNewSubject] = useState<string>('Mathematics (Hisabati)');
  const [newPeriods, setNewPeriods] = useState<number>(5);

  const levelClasses = activeLevel === 'NURSERY' 
    ? NURSERY_CLASSES 
    : activeLevel === 'PRIMARY' 
    ? PRIMARY_CLASSES 
    : SECONDARY_CLASSES;

  const filteredAllocations = localAllocations.filter(a => {
    const matchLevel = a.level === activeLevel;
    const matchClass = selectedClassFilter === 'All' || a.className === selectedClassFilter;
    return matchLevel && matchClass;
  });

  const handlePeriodChange = (id: string, periods: number) => {
    const next = localAllocations.map(a => a.id === id ? { ...a, periodsPerWeek: Math.max(1, periods) } : a);
    setLocalAllocations(next);
  };

  const handleDelete = (id: string) => {
    const next = localAllocations.filter(a => a.id !== id);
    setLocalAllocations(next);
  };

  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const streamSetting = streamSettings.find(s => s.className === newClass);
    const streamsToApply = newStream === 'ALL_STREAMS' 
      ? (streamSetting?.streams || ['STREAM A']) 
      : [newStream];

    const newItems: SubjectPeriodAllocation[] = streamsToApply.map(str => ({
      id: `spa_${activeLevel}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      level: activeLevel,
      className: newClass,
      stream: str,
      subject: newSubject,
      periodsPerWeek: Number(newPeriods)
    }));

    const next = [...localAllocations, ...newItems];
    setLocalAllocations(next);
  };

  const handleSaveAll = () => {
    onUpdateAllocations(localAllocations);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1f4d8b] to-blue-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Mgawanyo wa Vipindi vya Masomo (Subject Period Allocations)</h2>
            <p className="text-xs text-blue-200">
              Weka idadi ya vipindi kwa wiki kwa kila somo kwa ngazi zote (Nursery, Primary, Secondary) katika mikondo yote iliyosajiliwa
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>Hifadhi Mgawanyo (Save Allocations)</span>
        </button>
      </div>

      {savedToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Mgawanyo wa vipindi umehifadhiwa kikamilifu na injini ya AI itautumia kupanga ratiba!</span>
        </div>
      )}

      {/* Level Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl">
          {(
            [
              { id: 'NURSERY', label: 'NURSERY LEVEL', desc: 'Awali & Nursery' },
              { id: 'PRIMARY', label: 'PRIMARY LEVEL', desc: 'Standard 1 - 7' },
              { id: 'SECONDARY', label: 'SECONDARY LEVEL', desc: 'Form 1 - 6' }
            ] as const
          ).map(lvl => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => {
                setActiveLevel(lvl.id);
                setSelectedClassFilter('All');
                if (lvl.id === 'NURSERY') {
                  setNewClass('Baby Class');
                  setNewSubject('Kuhesabu na Namba (Numeracy)');
                } else if (lvl.id === 'PRIMARY') {
                  setNewClass('Standard 1');
                  setNewSubject('Mathematics (Hisabati)');
                } else {
                  setNewClass('Form 1');
                  setNewSubject('Mathematics');
                }
              }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                activeLevel === lvl.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div>{lvl.label}</div>
            </button>
          ))}
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-bold text-slate-600">Darasa:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="All">Madarasa Yote ya {activeLevel}</option>
            {levelClasses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add New Allocation Bar */}
      <form onSubmit={handleAddAllocation} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
            Darasa (Class)
          </label>
          <select
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            {levelClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
            Mkondo (Stream)
          </label>
          <select
            value={newStream}
            onChange={(e) => setNewStream(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="ALL_STREAMS">Mikondo Yote ya Darasa Hili</option>
            <option value="STREAM A">STREAM A</option>
            <option value="STREAM B">STREAM B</option>
            <option value="STREAM C">STREAM C</option>
          </select>
        </div>

        <div className="flex-2 min-w-[180px]">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
            Somo (Subject)
          </label>
          <input
            type="text"
            required
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
            placeholder="Jina la somo..."
          />
        </div>

        <div className="w-28">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
            Vipindi/Wiki
          </label>
          <input
            type="number"
            min={1}
            max={15}
            value={newPeriods}
            onChange={(e) => setNewPeriods(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none text-center"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer h-[38px]"
        >
          <Plus className="w-4 h-4" />
          <span>Ongeza Somo</span>
        </button>
      </form>

      {/* Allocation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
            Masomo na Vipindi kwa {activeLevel} ({filteredAllocations.length} vimeorodheshwa)
          </span>
          <span className="text-xs text-slate-500">Muda: dakika 40 kwa kila kipindi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1f4d8b] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Ngazi (Level)</th>
                <th className="p-3">Darasa (Class)</th>
                <th className="p-3">Mkondo (Stream)</th>
                <th className="p-3">Somo (Subject)</th>
                <th className="p-3 text-center w-36">Vipindi kwa Wiki</th>
                <th className="p-3 text-center w-20">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Hakuna masomo yaliyopangwa kwa ngazi hii. Tumia fomu ya juu kuongeza.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-black text-[10px]">
                        {a.level}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{a.className}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">
                        {a.stream}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{a.subject}</td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={a.periodsPerWeek}
                          onChange={(e) => handlePeriodChange(a.id, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 text-center"
                        />
                        <span className="text-[11px] text-slate-500">vipindi</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Futa Somo Hili"
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
