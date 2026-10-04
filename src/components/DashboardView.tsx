import React from 'react';
import { 
  Users, 
  GraduationCap, 
  FileText, 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Activity,
  RefreshCw,
  CloudCheck,
  CheckCircle2
} from 'lucide-react';
import { Student, Teacher, Exam, InvigilationSession } from '../types';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  exams: Exam[];
  sessions: InvigilationSession[];
  isCloudSynced?: boolean;
  isSyncing?: boolean;
  onForceRefreshSync?: () => void;
  syncToast?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  exams,
  sessions,
  isCloudSynced = false,
  isSyncing = false,
  onForceRefreshSync,
  syncToast = null
}) => {
  const cseeStudents = students.filter(s => s.level === 'CSEE').length;
  const acseeStudents = students.filter(s => s.level === 'ACSEE').length;
  const availableTeachers = teachers.filter(t => !t.excludeInvigilation).length;
  const excludedTeachers = teachers.filter(t => t.excludeInvigilation).length;

  // Class distribution
  const classCounts: Record<string, number> = {};
  students.forEach(s => {
    classCounts[s.className] = (classCounts[s.className] || 0) + 1;
  });
  const maxClassCount = Math.max(...Object.values(classCounts), 1);

  // Subject popularity
  const subjectCounts: Record<string, number> = {};
  students.forEach(s => {
    s.subjects.forEach(sub => {
      subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
    });
  });
  const sortedSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxSubCount = Math.max(...sortedSubjects.map(s => s[1]), 1);

  return (
    <div className="space-y-6">
      {syncToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{syncToast}</span>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1f4d8b]">School Academic Dashboard</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time summary of student enrolment, staff readiness, examinations, and invigilation sessions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isCloudSynced && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-[11px] text-emerald-800 font-extrabold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cloud Synced</span>
              </div>
            )}

            {onForceRefreshSync && (
              <button
                type="button"
                onClick={onForceRefreshSync}
                disabled={isSyncing}
                className="px-3.5 py-1.5 bg-[#1f4d8b] hover:bg-[#163765] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Clear local cache and re-fetch real-time data from Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Refresh / Force Sync'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-blue-900">{students.length}</div>
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Students</div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-lg text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-900">{teachers.length}</div>
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Teaching Staff</div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-600 rounded-lg text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-3xl font-black text-amber-900">{exams.length}</div>
              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Active Examinations</div>
            </div>
          </div>
        </div>

        {/* Secondary Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <div className="text-xl font-bold text-slate-800">{cseeStudents}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">CSEE (O-Level)</div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <div className="text-xl font-bold text-slate-800">{acseeStudents}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">ACSEE (A-Level)</div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <div className="text-xl font-bold text-emerald-700">{availableTeachers}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Available Invigilators</div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
            <div className="text-xl font-bold text-rose-700">{excludedTeachers}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Excluded Invigilators</div>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1f4d8b] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Student Distribution by Class
          </h3>
          <div className="h-56 flex items-end justify-around gap-2 pt-6 px-2 bg-slate-50 rounded-lg border border-slate-200">
            {['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Form 6'].map(className => {
              const count = classCounts[className] || 0;
              const heightPct = Math.max((count / maxClassCount) * 100, 8);
              return (
                <div key={className} className="flex-1 flex flex-col items-center h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600 mb-1">{count}</span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[38px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md transition-all duration-300 shadow-2xs"
                  />
                  <span className="text-[10px] font-semibold text-slate-700 mt-2 truncate w-full text-center">
                    {className}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Popularity */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#1f4d8b] flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Most Enrolled Subjects
          </h3>
          <div className="space-y-2.5 pt-1">
            {sortedSubjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No student subjects recorded yet.</p>
            ) : (
              sortedSubjects.map(([sub, count]) => {
                const widthPct = (count / maxSubCount) * 100;
                return (
                  <div key={sub} className="flex items-center gap-3 text-xs">
                    <span className="w-36 text-slate-700 font-semibold truncate text-right">{sub}</span>
                    <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      />
                    </div>
                    <span className="w-8 font-bold text-slate-800 text-right">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* System Provider & Support Info (Super Admin Visibility) */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg border border-white/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-400">Official System Provider</h3>
              <p className="text-lg font-bold text-white">Eng. Habibu Akida</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Support Active
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-300 font-mono">habibuakida@gmail.com</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              HabyEduPro v2.4.0
            </div>
            <a 
              href="mailto:habibuakida@gmail.com"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black shadow-lg transition-all active:scale-95"
            >
              Get Technical Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
