import React from 'react';
import { 
  Users, 
  GraduationCap, 
  FileText, 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  Activity 
} from 'lucide-react';
import { Student, Teacher, Exam, InvigilationSession } from '../types';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  exams: Exam[];
  sessions: InvigilationSession[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  exams,
  sessions
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
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-xl font-bold text-[#1f4d8b]">School Academic Dashboard</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time summary of student enrolment, staff readiness, examinations, and invigilation sessions
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-center">
            <Users className="w-5 h-5 text-blue-700 mx-auto mb-1.5" />
            <div className="text-2xl sm:text-3xl font-extrabold text-[#1d4182]">{students.length}</div>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">Total Students</div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-center">
            <GraduationCap className="w-5 h-5 text-emerald-700 mx-auto mb-1.5" />
            <div className="text-2xl sm:text-3xl font-extrabold text-[#065f46]">{teachers.length}</div>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">Teaching Staff</div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-center">
            <FileText className="w-5 h-5 text-amber-700 mx-auto mb-1.5" />
            <div className="text-2xl sm:text-3xl font-extrabold text-[#92400e]">{exams.length}</div>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">Registered Exams</div>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/70 text-center">
            <Clock className="w-5 h-5 text-purple-700 mx-auto mb-1.5" />
            <div className="text-2xl sm:text-3xl font-extrabold text-[#5b21b6]">{sessions.length}</div>
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mt-1">Exam Sessions</div>
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
