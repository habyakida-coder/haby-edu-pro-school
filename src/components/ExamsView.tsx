import React, { useState } from 'react';
import { FileText, Plus, Trash2, Calendar, X, CheckCircle2, RotateCw } from 'lucide-react';
import { Exam, InvigilationSession } from '../types';

interface ExamsViewProps {
  exams: Exam[];
  onAddExam: (exam: Exam, session: InvigilationSession) => void;
  onUpdateExam?: (exam: Exam) => void;
  onDeleteExam: (id: number) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  onAddExam,
  onUpdateExam,
  onDeleteExam
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Midterm I');
  const [level, setLevel] = useState<'CSEE' | 'ACSEE'>('CSEE');
  const [className, setClassName] = useState('All');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Enter examination title.');
      return;
    }

    const examId = Date.now();
    const newExam: Exam = {
      id: examId,
      name: name.trim(),
      type: type || name.trim(),
      level,
      className,
      date,
      status
    };

    // Auto-create matching invigilation session
    const parsedDate = new Date(`${date}T00:00:00`);
    const dayName = isNaN(parsedDate.getTime()) ? 'Monday' : parsedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const newSession: InvigilationSession = {
      id: examId + 1,
      rawDate: date,
      date: formattedDate,
      day: dayName,
      session: 'SESSION I',
      start: '08:00',
      end: '10:30',
      time: '08:00-10:30',
      subject: name.trim(),
      level,
      className: className.toUpperCase(),
      stream: level === 'ACSEE' ? 'PCM' : 'STREAM A',
      rooms: 2
    };

    onAddExam(newExam, newSession);
    setIsModalOpen(false);
    setName('');
  };

  const handleToggleStatus = (exam: Exam) => {
    const updatedStatus: 'Active' | 'Inactive' = (exam.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    if (onUpdateExam) {
      onUpdateExam({
        ...exam,
        status: updatedStatus
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Examination Management Header matching Screenshot E */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#1f4d8b] flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Examination Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define, schedule and activate official term examinations and test series.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Exam</span>
        </button>
      </div>

      {/* Examination Management Table matching Screenshot E */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3 border-r border-slate-200">Name</th>
                <th className="p-3 border-r border-slate-200">Type</th>
                <th className="p-3 border-r border-slate-200">Class</th>
                <th className="p-3 border-r border-slate-200">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                    No examinations registered. Click "+ Create Exam" to add an assessment.
                  </td>
                </tr>
              ) : (
                exams.map(e => {
                  const isActive = (e.status || 'Active') === 'Active';
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900 text-sm">
                        {e.name}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-medium text-slate-700">
                        {e.type || e.name}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-medium text-slate-700">
                        {e.className || 'All'}
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-3 font-bold text-xs">
                          <button
                            onClick={() => handleToggleStatus(e)}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete exam "${e.name}"?`)) {
                                onDeleteExam(e.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                          >
                            Del
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

      {/* Create Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-lg text-[#1f4d8b] flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Create New Examination</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Exam Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Midterm I or Annual Examination"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Exam Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Midterm I">Midterm I</option>
                    <option value="Terminal">Terminal</option>
                    <option value="Annual">Annual</option>
                    <option value="Midterm II">Midterm II</option>
                    <option value="Pre-Mock">Pre-Mock</option>
                    <option value="Mock">Mock</option>
                    <option value="NECTA Final">NECTA Final</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Target Class *</label>
                  <select
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="All">All Classes</option>
                    <option value="Form 1">Form 1</option>
                    <option value="Form 2">Form 2</option>
                    <option value="Form 3">Form 3</option>
                    <option value="Form 4">Form 4</option>
                    <option value="Form 5">Form 5</option>
                    <option value="Form 6">Form 6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Level *</label>
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value as 'CSEE' | 'ACSEE')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="CSEE">CSEE (O-Level)</option>
                    <option value="ACSEE">ACSEE (A-Level)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 uppercase block mb-1">Exam Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase block mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
