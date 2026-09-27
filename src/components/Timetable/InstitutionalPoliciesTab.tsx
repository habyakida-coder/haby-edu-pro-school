import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Coffee, 
  Utensils, 
  Calendar, 
  CheckCircle2, 
  Save, 
  Sliders, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { InstitutionalPolicy } from '../../types';

interface InstitutionalPoliciesTabProps {
  policy: InstitutionalPolicy;
  onUpdatePolicy: (policy: InstitutionalPolicy) => void;
}

export const InstitutionalPoliciesTab: React.FC<InstitutionalPoliciesTabProps> = ({
  policy,
  onUpdatePolicy
}) => {
  const [formData, setFormData] = useState<InstitutionalPolicy>({
    totalPeriodsPerDay: policy.totalPeriodsPerDay || 8,
    periodDurationMinutes: policy.periodDurationMinutes || 40,
    breakAfterPeriod: policy.breakAfterPeriod || 2,
    lunchAfterPeriod: policy.lunchAfterPeriod || 5,
    workingDays: policy.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    maxPeriodsPerTeacherPerDay: policy.maxPeriodsPerTeacherPerDay || 5,
    rules: {
      noTeacherTwoClassesSameTime: policy.rules?.noTeacherTwoClassesSameTime ?? true,
      noClassTwoTeachersSameTime: policy.rules?.noClassTwoTeachersSameTime ?? true,
      noSameSubjectTwiceSameDay: policy.rules?.noSameSubjectTwiceSameDay ?? true
    }
  });

  const [savedToast, setSavedToast] = useState(false);

  const handleWorkingDaysToggle = (day: string) => {
    setFormData(prev => {
      const exists = prev.workingDays.includes(day);
      const updated = exists 
        ? prev.workingDays.filter(d => d !== day) 
        : [...prev.workingDays, day];
      return { ...prev, workingDays: updated };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePolicy(formData);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1f4d8b] to-blue-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Sera za Ratiba ya Shule (Institutional Policies)</h2>
            <p className="text-xs text-blue-200">Weka vigezo vya vipindi, muda wa chai na chakula cha mchana, na sheria za kuzuia migongano</p>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>Hifadhi Sera (Save Policies)</span>
        </button>
      </div>

      {savedToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Sera za ratiba ya shule zimehifadhiwa kikamilifu na kuwekwa kwenye injini ya AI!</span>
        </div>
      )}

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Bell Schedule & Period Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Mpangilio wa Vipindi kwa Siku (Periods Configuration)
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Jumla ya Vipindi kwa Siku (Total Periods per Day)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={4}
                  max={12}
                  value={formData.totalPeriodsPerDay}
                  onChange={(e) => setFormData({ ...formData, totalPeriodsPerDay: Number(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-slate-500">Vipindi vya masomo kwa siku (kawaida 8)</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Muda wa Kipindi Kimoja (Period Duration in Minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={20}
                  max={90}
                  value={formData.periodDurationMinutes}
                  onChange={(e) => setFormData({ ...formData, periodDurationMinutes: Number(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-slate-500">Dakika (kawaida dakika 40 kwa mtaala wa Tanzania)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mapumziko ya Chai (Tea Break)</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-600">Baada ya Kipindi:</span>
                  <input
                    type="number"
                    min={1}
                    max={formData.totalPeriodsPerDay - 2}
                    value={formData.breakAfterPeriod}
                    onChange={(e) => setFormData({ ...formData, breakAfterPeriod: Number(e.target.value) })}
                    className="w-16 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-black text-amber-950 text-center"
                  />
                </div>
              </div>

              <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-900 mb-1">
                  <Utensils className="w-3.5 h-3.5 text-orange-600" />
                  <span>Mchana (Lunch Break)</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-600">Baada ya Kipindi:</span>
                  <input
                    type="number"
                    min={formData.breakAfterPeriod + 1}
                    max={formData.totalPeriodsPerDay - 1}
                    value={formData.lunchAfterPeriod}
                    onChange={(e) => setFormData({ ...formData, lunchAfterPeriod: Number(e.target.value) })}
                    className="w-16 px-2 py-1 bg-white border border-orange-300 rounded-lg text-xs font-black text-orange-950 text-center"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kiwango cha Juu cha Vipindi kwa Mwalimu kwa Siku (Max Periods/Teacher/Day)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={formData.maxPeriodsPerTeacherPerDay}
                  onChange={(e) => setFormData({ ...formData, maxPeriodsPerTeacherPerDay: Number(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-slate-500">Kuzuia mwalimu kuchoka na kudumisha ubora wa ufundishaji</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Working Days & Conflict Rules */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Siku za Kazi na Sheria za AI (Working Days & Conflict Rules)
            </h3>
          </div>

          {/* Working Days */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Siku za Masomo kwa Wiki (Working Days):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                const isSelected = formData.workingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleWorkingDaysToggle(day)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-800 border-blue-300' 
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.slice(0, 3)}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mandatory Institutional Rules Toggles */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 block">
              Sheria za Lazima za Kuzuia Migongano (Conflict Prevention Rules):
            </label>

            {/* Rule 1 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  1. Hakuna mwalimu anayefundisha madarasa 2 kwa wakati mmoja
                </span>
                <span className="text-[11px] text-slate-500">
                  (No teacher teaches 2 classes at the same period)
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.rules.noTeacherTwoClassesSameTime}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, noTeacherTwoClassesSameTime: e.target.checked }
                })}
                className="w-5 h-5 accent-blue-600 cursor-pointer mt-0.5 rounded"
              />
            </div>

            {/* Rule 2 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  2. Hakuna darasa lenye walimu 2 kwa wakati mmoja
                </span>
                <span className="text-[11px] text-slate-500">
                  (No class has 2 teachers or subjects at the same period)
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.rules.noClassTwoTeachersSameTime}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, noClassTwoTeachersSameTime: e.target.checked }
                })}
                className="w-5 h-5 accent-blue-600 cursor-pointer mt-0.5 rounded"
              />
            </div>

            {/* Rule 3 */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-xs text-slate-900 block">
                  3. Somo moja halifundishwi mara mbili siku moja katika darasa moja
                </span>
                <span className="text-[11px] text-slate-500">
                  (Same subject not scheduled twice in the same day unless double period)
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.rules.noSameSubjectTwiceSameDay}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, noSameSubjectTwiceSameDay: e.target.checked }
                })}
                className="w-5 h-5 accent-blue-600 cursor-pointer mt-0.5 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
