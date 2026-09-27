import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  GraduationCap, 
  ArrowRight, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  History, 
  Clock 
} from 'lucide-react';
import { Student, PromotionHistory } from '../../types';
import { detectCalendarType, getNextProgressionClass } from '../../utils/examinationRecordsUtils';

interface AutoPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onExecutePromotion: (promotedStudents: Student[], historyLogs: PromotionHistory[]) => void;
  currentUserName?: string;
  academicYear: string;
}

export const AutoPromotionModal: React.FC<AutoPromotionModalProps> = ({
  isOpen,
  onClose,
  students,
  onExecutePromotion,
  currentUserName = 'Headmaster Admin',
  academicYear
}) => {
  const [targetGroup, setTargetGroup] = useState<'ALL' | 'JAN-DEC' | 'JULY-JUNE'>('ALL');
  const [confirmStep, setConfirmStep] = useState(false);

  if (!isOpen) return null;

  // Filter eligible students based on chosen calendar
  const eligibleStudents = students.filter(s => {
    const cal = detectCalendarType(s.className);
    if (s.className.toLowerCase().includes('graduated')) return false;
    if (targetGroup === 'ALL') return true;
    return cal === targetGroup;
  });

  const janDecCount = students.filter(s => detectCalendarType(s.className) === 'JAN-DEC' && !s.className.toLowerCase().includes('graduated')).length;
  const julyJuneCount = students.filter(s => detectCalendarType(s.className) === 'JULY-JUNE' && !s.className.toLowerCase().includes('graduated')).length;

  const handleRunPromotion = () => {
    const historyLogs: PromotionHistory[] = [];
    const timestamp = new Date().toISOString();

    const updatedStudents = students.map(s => {
      const cal = detectCalendarType(s.className);
      const isEligible = (targetGroup === 'ALL' || cal === targetGroup) && !s.className.toLowerCase().includes('graduated');

      if (!isEligible) return s;

      const { nextClass, isGraduated } = getNextProgressionClass(s.className);

      historyLogs.push({
        id: `promo_${s.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        studentId: s.id,
        studentName: s.name,
        fromClass: s.className,
        toClass: nextClass,
        academicYear,
        calendarType: cal,
        promotedAt: timestamp,
        promotedBy: `${currentUserName} (Manual Run)`,
        status: isGraduated ? 'GRADUATED' : 'PROMOTED'
      });

      return {
        ...s,
        className: nextClass
      };
    });

    onExecutePromotion(updatedStudents, historyLogs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2948] to-[#1f4d8b] text-white p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Kituo cha Ukuzaji Wanafunzi (Auto-Promotion Engine)</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Kukuza madarasa ya wanafunzi mwisho wa mwaka wa masomo kulingana na kalenda za NECTA
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Policy Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  Kalenda ya JAN - DEC
                </span>
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-black">
                  {janDecCount} Wanafunzi
                </span>
              </div>
              <p className="text-xs text-blue-950 font-semibold">
                Nursery • Primary (Std 1-7) • Secondary (Form 1-4)
              </p>
              <div className="text-[11px] text-blue-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>Auto-Promotion: <strong>31 Desemba, 23:59</strong></span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  Kalenda ya JULY - JUNE
                </span>
                <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-black">
                  {julyJuneCount} Wanafunzi
                </span>
              </div>
              <p className="text-xs text-purple-950 font-semibold">
                High School (Form 5 & Form 6)
              </p>
              <div className="text-[11px] text-purple-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-600" />
                <span>Auto-Promotion: <strong>30 Juni, 23:59</strong></span>
              </div>
            </div>
          </div>

          {/* Group selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Chagua Kundi la Kukuza (Target Promotion Scope):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ALL', label: 'Wanafunzi Wote', desc: 'Madarasa Yote Shuleni' },
                { id: 'JAN-DEC', label: 'Nursery hadi Form 4', desc: 'Kalenda ya JAN-DEC' },
                { id: 'JULY-JUNE', label: 'Form 5 hadi Form 6', desc: 'Kalenda ya JULY-JUNE' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTargetGroup(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    targetGroup === opt.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progression Preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Mfano wa Mlolongo wa Ukuzaji (Progression Pipeline)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Wanafunzi {eligibleStudents.length} watafaulu kusonga mbele
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Nursery</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  Nursery <ArrowRight className="w-3 h-3 text-blue-600" /> Baby
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Awali hadi Msingi</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  Pre-Unit <ArrowRight className="w-3 h-3 text-blue-600" /> Std 1
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Msingi hadi Sekondari</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  Std 7 <ArrowRight className="w-3 h-3 text-blue-600" /> Form 1
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Kuhitimu (Graduation)</span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  Form 4 / 6 <ArrowRight className="w-3 h-3 text-emerald-600" /> Graduated
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Notice */}
          {confirmStep ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Uthibitisho wa Mwisho wa Ukuzaji:</h4>
                  <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                    Je, una uhakika unataka kuendesha ukuzaji wa madarasa sasa kwa wanafunzi <strong>{eligibleStudents.length}</strong>? 
                    Madarasa yao yatapandishwa daraja moja mbele, na rekodi zote za awali zitaendelea kuhifadhiwa kwenye kumbukumbu (Promotion History).
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmStep(false)}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Ghairi
                </button>
                <button
                  type="button"
                  onClick={handleRunPromotion}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Ndio, Endesha Ukuzaji Sasa
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Kila ukuzaji unahifadhiwa kwenye logi ya shule (Promotion History) ikiwa na tarehe, aliyeruhusu, na darasa la awali.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
          >
            Funga / Close
          </button>

          {!confirmStep && (
            <button
              type="button"
              disabled={eligibleStudents.length === 0}
              onClick={() => setConfirmStep(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Endesha Ukuzaji Sasa (Run Promotion Now)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
