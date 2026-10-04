import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppData, Student, Teacher, Exam, InvigilationSession, PeriodSetting, StreamSetting, TimetableAssignment, Supervisor, SchoolInfo, UserAccount, SchoolStatus, ActivityLog, ActivityAction, ActivityCategory, DisciplineRecord, TeacherEvaluation, UsalRecord, ExaminationRecord } from './types';
import { setCachedData } from './lib/idbService';
import { DEFAULT_APP_DATA } from './constants/defaults';
import { generateUsalRecordsForExam, ensureUsalRecordsForAllExams } from './utils/usalUtils';
import { Navigation, ActiveView } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { TeachersView } from './components/TeachersView';
import { ResultsView } from './components/ResultsView';
import { ExaminationRecordsView } from './components/ExaminationRecords/ExaminationRecordsView';
import NectaAnalyzer from './components/NectaAnalyzer.jsx';
import { SmsModule } from './components/SmsModule';
import { ExamsView } from './components/ExamsView';
import { TimetableContainer } from './components/Timetable/TimetableContainer';
import { InvigilationContainer } from './components/InvigilationContainer';
import { SettingsView } from './components/SettingsView';
import { AttendanceView } from './components/AttendanceView';
import { MarkEntryView } from './components/MarkEntryView';
import { StudentIDView } from './components/StudentIDView';
import { DisciplineView } from './components/DisciplineView';
import { LessonPlanView } from './components/LessonPlan/LessonPlanView';
import { SchemeOfWorkView } from './components/SchemeOfWork/SchemeOfWorkView';
import { FloatingBubbles } from './components/FloatingBubbles';
import { AuthScreen } from './components/auth/AuthScreen';
import { ParentPortalView } from './components/ParentPortalView';
import { DailyTeachingTrackerView } from './components/DailyTeachingTrackerView';
import { EvaluationAnalysisView } from './components/EvaluationAnalysisView';
import { RemedialTimetableSetup } from './components/Remedial/RemedialTimetableSetup';
import { RemedialDailyTracker } from './components/Remedial/RemedialDailyTracker';
import { RemedialPaymentAnalyzer } from './components/Remedial/RemedialPaymentAnalyzer';
import { useAuth } from './context/AuthContext';
import SittingPlan from './components/SittingPlan.jsx';
import SaasFinance from './components/SaasFinance.jsx';
import { 
  supabase, 
  DEFAULT_PRIMARY_SCHOOL_ID, 
  toSupabaseStudent, 
  fromSupabaseStudent, 
  toSupabaseTeacher, 
  fromSupabaseTeacher, 
  toSupabaseExam, 
  fromSupabaseExam,
  checkSupabaseHealth 
} from './lib/supabaseClient';
import { saveSchoolData, getSchoolData, subscribeSchoolData } from './lib/firestoreService';
import { Loader2, Shield, Menu, RotateCw, Check } from 'lucide-react';

const mergeById = (arr1: any[], arr2: any[]) => {
  const map = new Map();
  (arr1 || []).forEach(item => {
    if (item && item.id != null) {
      map.set(String(item.id), item);
    }
  });
  (arr2 || []).forEach(item => {
    if (item && item.id != null) {
      const existing = map.get(String(item.id)) || {};
      map.set(String(item.id), { ...existing, ...item });
    }
  });
  return Array.from(map.values());
};

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/parent')) {
    return <ParentPortalView onBackToMain={() => { window.location.pathname = '/'; }} />;
  }

  const { user, userAccount, loading: authLoading, logout } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [data, setData] = useState<AppData>(DEFAULT_APP_DATA);
  const [dataLoading, setDataLoading] = useState(true);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>('ACTIVE');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline' | 'error'>('saved');
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [smsTargetExam, setSmsTargetExam] = useState<{ examType?: string; year?: string }>({});
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Sync with Firestore & Real-Time Single Source of Truth
  useEffect(() => {
    if (!userAccount?.schoolId || userAccount.schoolId === 'PENDING') {
      setDataLoading(false);
      return;
    }

    const schoolId = userAccount.schoolId;
    console.log("Current school_id:", schoolId);
    localStorage.setItem('currentSchoolId', schoolId);
    localStorage.setItem('schoolId', schoolId);
    const schoolKey = `haby_school_data_${schoolId}`;

    // 0. Primary Database Load: Prioritize Firestore Snapshot -> Supabase -> LocalStorage fallback
    const loadFromDatabase = async () => {
      console.log("Loading data for school:", schoolId);
      setDataLoading(true);

      try {
        // A. Try Firestore for the most reliable snapshot
        const firestoreSnapshot = await getSchoolData(schoolId);
        
        if (firestoreSnapshot && Array.isArray(firestoreSnapshot.students)) {
          console.log("Loaded reliable data from Firestore for school:", schoolId, "Student count:", firestoreSnapshot.students.length);
          setData(firestoreSnapshot as AppData);
          try { localStorage.setItem(schoolKey, JSON.stringify(firestoreSnapshot)); } catch (e) {}
          setIsCloudSynced(true);
          setDataLoading(false);
        } else {
          // B. Fallback: Fetch all records from Supabase tables
          console.log("Fetching complete data from Supabase...");
          
          setDataLoading(false);

          // Fetch complete school data without limits so student counts match across devices
          const [studRes, recRes, teachRes, examRes] = await Promise.all([
            supabase.from('students').select('*').eq('school_id', schoolId),
            supabase.from('exam_records').select('*').eq('school_id', schoolId),
            supabase.from('teachers').select('*').eq('school_id', schoolId),
            supabase.from('exams').select('*').eq('school_id', schoolId)
          ]);

          const rawStudents = (studRes && Array.isArray(studRes.data)) ? studRes.data : [];
          const rawRecords = (recRes && Array.isArray(recRes.data)) ? recRes.data : [];
          const rawTeachers = (teachRes && Array.isArray(teachRes.data)) ? teachRes.data : [];
          const rawExams = (examRes && Array.isArray(examRes.data)) ? examRes.data : [];

          const remoteData = {
            students: rawStudents.length > 0 ? rawStudents.map((s, idx) => fromSupabaseStudent(s, idx)) : [],
            examinationRecords: rawRecords,
            teachers: rawTeachers.length > 0 ? rawTeachers.map((t, idx) => fromSupabaseTeacher(t, idx)) : [],
            exams: rawExams.length > 0 ? rawExams.map((e, idx) => fromSupabaseExam(e, idx)) : []
          };

          setData(prev => ({
            ...prev,
            students: rawStudents.length > 0 ? remoteData.students : prev.students,
            examinationRecords: remoteData.examinationRecords.length > 0 ? remoteData.examinationRecords : prev.examinationRecords,
            teachers: remoteData.teachers.length > 0 ? remoteData.teachers : prev.teachers,
            exams: remoteData.exams.length > 0 ? remoteData.exams : prev.exams
          }));
          try { localStorage.setItem(schoolKey, JSON.stringify(remoteData)); } catch (e) {}
          setIsCloudSynced(true);
        }
      } catch (err) {
        console.warn("Error in loadFromDatabase, falling back to localStorage:", err);
        // C. Last Resort: LocalStorage
        const cachedRaw = localStorage.getItem(schoolKey);
        if (cachedRaw) {
          try {
            setData(JSON.parse(cachedRaw));
          } catch (e) { console.warn("Failed to parse cached data"); }
        }
        setDataLoading(false);
      }
    };
    loadFromDatabase();

    // Real-Time Synchronization: Subscribe to real-time updates from Firestore across devices
    const unsubscribe = subscribeSchoolData(schoolId, (firestoreSnapshot) => {
      if (firestoreSnapshot && Array.isArray(firestoreSnapshot.students)) {
        console.log("Real-time cloud sync from Firestore! Students count:", firestoreSnapshot.students.length);
        setData(firestoreSnapshot as AppData);
        try { localStorage.setItem(schoolKey, JSON.stringify(firestoreSnapshot)); } catch (e) {}
        setIsCloudSynced(true);
      }
    });

    // Auto re-sync when window gains focus (e.g., opening on phone or switching tabs)
    const handleWindowFocus = () => {
      loadFromDatabase();
    };
    window.addEventListener('focus', handleWindowFocus);

    // Check school status from schools table
    Promise.resolve(supabase.from('schools').select('*').eq('id', schoolId).single())
      .then(({ data: sData }) => {
        if (sData) {
          setSchoolStatus(sData.status || 'ACTIVE');
        }
      })
      .catch((err: any) => console.warn("School status error:", err));

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      if (unsubscribe) unsubscribe();
    };
  }, [userAccount]);

  // Force Refresh & Sync button implementation via Supabase
  const handleForceRefreshSync = async () => {
    if (!userAccount?.schoolId) return;
    setIsSyncing(true);
    const schoolId = userAccount.schoolId;
    const schoolKey = `haby_school_data_${schoolId}`;
    try {
      const [studRes, recRes, teachRes, examRes, schoolDataRes] = await Promise.allSettled([
        supabase.from('students').select('*').eq('school_id', schoolId),
        supabase.from('exam_records').select('*').eq('school_id', schoolId),
        supabase.from('teachers').select('*').eq('school_id', schoolId),
        supabase.from('exams').select('*').eq('school_id', schoolId),
        supabase.from('school_data').select('*').eq('school_id', schoolId).limit(1)
      ]);

      const remoteStudents = (studRes.status === 'fulfilled' && Array.isArray(studRes.value.data)) ? studRes.value.data : null;
      const remoteRecords = (recRes.status === 'fulfilled' && Array.isArray(recRes.value.data)) ? recRes.value.data : null;
      const remoteTeachers = (teachRes.status === 'fulfilled' && Array.isArray(teachRes.value.data)) ? teachRes.value.data : null;
      const remoteExams = (examRes.status === 'fulfilled' && Array.isArray(examRes.value.data)) ? examRes.value.data : null;
      const remoteDataArr = (schoolDataRes.status === 'fulfilled' && Array.isArray(schoolDataRes.value.data)) ? schoolDataRes.value.data : [];
      const remoteData = (remoteDataArr.length > 0 ? remoteDataArr[0] : {}) as Partial<AppData>;

      setData(prev => {
        const next: AppData = {
          ...prev,
          ...remoteData,
          students: (remoteStudents && remoteStudents.length > 0)
            ? remoteStudents.map((s: any) => ({ ...s, id: s.id ?? (isNaN(Number(s.id)) ? s.id : Number(s.id)) }))
            : (remoteData.students || prev.students),
          teachers: (remoteTeachers && remoteTeachers.length > 0)
            ? remoteTeachers.map((t: any) => ({ ...t, id: t.id ?? (isNaN(Number(t.id)) ? t.id : Number(t.id)) }))
            : (remoteData.teachers || prev.teachers),
          exams: (remoteExams && remoteExams.length > 0)
            ? remoteExams
            : (remoteData.exams || prev.exams),
          examinationRecords: (remoteRecords && remoteRecords.length > 0)
            ? remoteRecords
            : (remoteData.examinationRecords || prev.examinationRecords)
        };
        try {
          localStorage.setItem(schoolKey, JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setIsCloudSynced(true);
      const studentCount = remoteStudents?.length || 0;
      setSyncToast(`Cloud Sync Active: Loaded ${studentCount} students and ${remoteTeachers?.length || 0} staff via Supabase.`);
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err) {
      console.error("Force sync error:", err);
      setSyncToast("Sync completed from available tables.");
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateRemoteData = useCallback(async (updates: Partial<AppData>) => {
    setSaveStatus('saving');
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEFAULT_SCHOOL';
    const schoolKey = `haby_school_data_${schoolId}`;

    let latestData: AppData = data;
    setData(prev => {
      latestData = { ...prev, ...updates };
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setCachedData(schoolKey, latestData).catch(e => console.warn("Could not save to IndexedDB:", e));
      }, 500); // 500ms debounce
      return latestData;
    });

    if (!userAccount?.schoolId) {
      setSaveStatus('saved');
      return;
    }

    console.log("Current school_id (updateRemoteData):", schoolId);
    try {
      // 2. Persist with UPSERT (never pure insert which crashes on duplicate id)
      if (updates.students && Array.isArray(updates.students) && updates.students.length > 0) {
        try {
          await supabase.from('students').upsert(
            updates.students.map(s => ({ ...s, school_id: schoolId })),
            { onConflict: 'id' }
          );
        } catch (e) {
          console.warn("Supabase students upsert error:", e);
        }
      }

      if (updates.teachers && Array.isArray(updates.teachers) && updates.teachers.length > 0) {
        try {
          await supabase.from('teachers').upsert(
            updates.teachers.map(t => ({ ...t, school_id: schoolId })),
            { onConflict: 'id' }
          );
        } catch (e) {
          console.warn("Supabase teachers upsert error:", e);
        }
      }

      if (updates.exams && Array.isArray(updates.exams) && updates.exams.length > 0) {
        try {
          await supabase.from('exams').upsert(
            updates.exams.map(e => ({ ...e, school_id: schoolId })),
            { onConflict: 'id' }
          );
        } catch (e) {
          console.warn("Supabase exams upsert error:", e);
        }
      }

      if (updates.examinationRecords && Array.isArray(updates.examinationRecords) && updates.examinationRecords.length > 0) {
        try {
          await supabase.from('exam_records').upsert(
            updates.examinationRecords.map(r => ({ ...r, school_id: schoolId })),
            { onConflict: 'id' }
          );
        } catch (e) {
          console.warn("Supabase exam_records upsert error:", e);
        }
      }

      if (updates.usalRecords && Array.isArray(updates.usalRecords) && updates.usalRecords.length > 0) {
        try {
          await supabase.from('usal_records').upsert(
            updates.usalRecords.map(u => ({ ...u, school_id: schoolId })),
            { onConflict: 'id' }
          );
        } catch (e) {
          console.warn("Supabase usal_records upsert error:", e);
        }
      }

      // 3. Save complete snapshot with UPSERT for durable state restoration across logins
      try {
        await saveSchoolData(schoolId, latestData);
      } catch (e) {
        console.warn("Firestore data save error:", e);
      }

      setSaveStatus('saved');
      setIsCloudSynced(true);
    } catch (e) {
      console.error("Error updating Supabase:", e);
      setSaveStatus('offline');
    }
  }, [userAccount]);

  // Auto-ensure USAL records exist for all registered exams
  useEffect(() => {
    if (data.exams && data.exams.length > 0 && data.students && data.students.length > 0) {
      const ensured = ensureUsalRecordsForAllExams(data.exams, data.students, data.teachers, data.usalRecords || []);
      if (ensured.length > (data.usalRecords || []).length) {
        setData(prev => ({ ...prev, usalRecords: ensured }));
        if (userAccount?.schoolId) {
          updateRemoteData({ usalRecords: ensured });
        }
      }
    }
  }, [data.exams, data.students.length, data.teachers.length]);

  // Release calculated results to Examination Records
  const handleReleaseResultsToExaminationRecords = useCallback(async (
    records: ExaminationRecord[],
    className: string,
    examName: string
  ) => {
    if (!userAccount?.schoolId || records.length === 0) return;
    const schoolId = userAccount.schoolId;

    const existing = data.examinationRecords || [];
    const map = new Map<string, ExaminationRecord>();
    existing.forEach(r => map.set(r.id, r));
    records.forEach(r => map.set(r.id, r));
    const merged = Array.from(map.values());

    const activityLogs = logActivity(
      'EXAM_UPDATED',
      'results',
      'Results Released to Examination Records',
      `Officially released ${records.length} examination records for ${className} (${examName}) to master ledger`
    );

    updateRemoteData({ examinationRecords: merged, activityLogs });

    // Push each record to Supabase exam_records table
    try {
      if (records && records.length > 0) {
        await supabase.from('exam_records').insert(records.map(rec => ({
          ...rec,
          school_id: schoolId
        })));
      }
    } catch (err) {
      console.warn("Could not push records to Supabase:", err);
    }
  }, [userAccount, data.examinationRecords, updateRemoteData]);

  const logActivity = useCallback((
    action: ActivityAction,
    category: ActivityCategory,
    title: string,
    description: string,
    details?: Record<string, any>
  ): ActivityLog[] => {
    const newEntry: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: userAccount?.id || user?.uid || 'user',
      userName: userAccount?.fullName || user?.displayName || 'Authorized User',
      userEmail: userAccount?.email || user?.email || '',
      userRole: userAccount?.role || 'ACADEMIC',
      action,
      category,
      title,
      description,
      details
    };

    const currentLogs = data.activityLogs || [];
    return [newEntry, ...currentLogs].slice(0, 300);
  }, [userAccount, user, data.activityLogs]);

  // Auth Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!userAccount) {
    return <AuthScreen />;
  }

  if (userAccount.schoolId === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <h1 className="text-xl font-bold mb-2">Account Pending Approval</h1>
          <p className="text-slate-600 mb-4">Your account for {userAccount.email} is waiting to be linked to a school. Please contact your school administrator.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Refresh Status</button>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Loading school database...</p>
        </div>
      </div>
    );
  }

  const handleUpdateStudents = (students: Student[]) => {
    const activityLogs = logActivity(
      'STUDENTS_BULK_UPDATE',
      'students',
      'Student Records Modified',
      `Synchronized student roster (${students.length} students enrolled)`
    );
    updateRemoteData({ students, activityLogs });
  };

  const handleAddStudent = async (student: Student) => {
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleAddStudent):", schoolId);
    try {
      await supabase.from('students').upsert({
        ...student,
        school_id: schoolId
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Error upserting student in Supabase:", e);
    }
    const activityLogs = logActivity(
      'STUDENT_ADDED',
      'students',
      'Student Enrolled',
      `Enrolled ${student.name} (${student.regNo || 'No Reg'}) in Form ${student.className}`
    );
    updateRemoteData({ students: [...data.students, student], activityLogs });
  };

  const handleBulkAddStudents = async (newStudents: Student[]) => {
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleBulkAddStudents):", schoolId);
    try {
      await supabase.from('students').upsert(
        newStudents.map(s => ({ ...s, school_id: schoolId })),
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn("Error bulk upserting students in Supabase:", e);
    }
    const activityLogs = logActivity(
      'STUDENTS_BULK_UPDATE',
      'students',
      'Students Bulk Enrolled',
      `Imported ${newStudents.length} students via CSV`
    );
    updateRemoteData({
      students: [...data.students, ...newStudents],
      activityLogs
    });
  };

  const handleUpdateUsers = async (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    if (!userAccount?.schoolId) return;
    try {
      const existingUserIds = new Set(newUsers.map(u => u.id));
      for (const oldU of users) {
        if (!existingUserIds.has(oldU.id)) {
          try {
            await supabase.from('users').delete().eq('id', oldU.id);
          } catch (e) {
            console.warn("Could not delete user doc in Supabase:", e);
          }
        }
      }
      for (const u of newUsers) {
        await supabase.from('users').insert({
          ...u,
          school_id: userAccount.schoolId,
          schoolId: userAccount.schoolId,
          updated_at: new Date().toISOString()
        });
      }
      const activityLogs = logActivity(
        'USER_ROLE_UPDATE',
        'security',
        'Staff Accounts Synchronized',
        `User accounts roster updated (${newUsers.length} active users)`
      );
      updateRemoteData({ activityLogs });
    } catch (e) {
      console.error("Error updating users in Supabase:", e);
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleUpdateStudent):", schoolId);
    try {
      await supabase.from('students').upsert({
        ...student,
        school_id: schoolId
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Error updating student doc in Supabase:", e);
    }
    const activityLogs = logActivity(
      'STUDENT_UPDATED',
      'students',
      'Student Record Edited',
      `Updated academic record/marks for ${student.name} (${student.regNo})`
    );
    updateRemoteData({
      students: data.students.map(s => (s.id === student.id ? student : s)),
      activityLogs
    });
  };

  const handleDeleteStudent = async (id: number) => {
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleDeleteStudent):", schoolId);
    try {
      await supabase.from('students').delete().eq('id', id).eq('school_id', schoolId);
    } catch (e) {
      console.warn("Error deleting student doc in Supabase:", e);
    }
    const target = data.students.find(s => s.id === id);
    const activityLogs = logActivity(
      'STUDENT_DELETED',
      'students',
      'Student Removed',
      `Removed student ${target?.name || `ID #${id}`} from school records`
    );
    updateRemoteData({
      students: data.students.filter(s => s.id !== id),
      activityLogs
    });
  };

  const handleBulkDeleteStudents = async (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleBulkDeleteStudents):", schoolId);
    const idSet = new Set(ids);
    const count = ids.length;
    try {
      await supabase.from('students').delete().in('id', ids).eq('school_id', schoolId);
    } catch (e) {
      console.warn("Error bulk deleting students in Supabase:", e);
    }
    const activityLogs = logActivity(
      'STUDENT_DELETED',
      'students',
      'Multiple Students Removed',
      `Bulk deleted ${count} student(s) from school records`
    );
    updateRemoteData({
      students: data.students.filter(s => !idSet.has(s.id)),
      activityLogs
    });
  };

  const handleAddTeacher = async (teacher: Teacher) => {
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleAddTeacher):", schoolId);
    try {
      await supabase.from('teachers').upsert({
        ...teacher,
        school_id: schoolId
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Error inserting teacher doc in Supabase:", e);
    }
    const activityLogs = logActivity(
      'TEACHER_ADDED',
      'teachers',
      'Staff Member Added',
      `Registered teacher ${teacher.name} (${teacher.subjects.join(', ')})`
    );
    updateRemoteData({
      teachers: [...data.teachers, teacher],
      selectedInvigilators: teacher.excludeInvigilation ? data.selectedInvigilators : [...data.selectedInvigilators, teacher.id],
      activityLogs
    });
  };

  const handleBulkAddTeachers = async (newTeachers: Teacher[]) => {
    if (!newTeachers || newTeachers.length === 0) return;
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleBulkAddTeachers):", schoolId);
    try {
      await supabase.from('teachers').upsert(
        newTeachers.map(t => ({
          ...t,
          school_id: schoolId
        })),
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn("Error inserting bulk teachers in Supabase:", e);
    }
    const activityLogs = logActivity(
      'TEACHER_BULK_ADDED',
      'teachers',
      'Multiple Teachers Registered',
      `Registered ${newTeachers.length} staff members in bulk`
    );
    const newInvigIds = newTeachers.filter(t => !t.excludeInvigilation).map(t => t.id);
    updateRemoteData({
      teachers: [...data.teachers, ...newTeachers],
      selectedInvigilators: [...data.selectedInvigilators, ...newInvigIds],
      activityLogs
    });
  };

  const handleUpdateTeacher = async (teacher: Teacher) => {
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleUpdateTeacher):", schoolId);
    try {
      await supabase.from('teachers').upsert({
        ...teacher,
        school_id: schoolId
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Error updating teacher doc in Supabase:", e);
    }
    const activityLogs = logActivity(
      'TEACHER_UPDATED',
      'teachers',
      'Staff Profile Modified',
      `Updated details for teacher ${teacher.name}`
    );
    updateRemoteData({
      teachers: data.teachers.map(t => (t.id === teacher.id ? teacher : t)),
      activityLogs
    });
  };

  const handleDeleteTeacher = async (id: number) => {
    const schoolId = userAccount?.schoolId || localStorage.getItem('currentSchoolId') || 'DEMO_SCHOOL';
    console.log("Current school_id (handleDeleteTeacher):", schoolId);
    try {
      await supabase.from('teachers').delete().eq('id', id).eq('school_id', schoolId);
    } catch (e) {
      console.warn("Error deleting teacher doc in Supabase:", e);
    }
    const target = data.teachers.find(t => t.id === id);
    const newInvigAssignments = { ...data.invigilationAssignments };
    Object.keys(newInvigAssignments).forEach(key => {
      if (newInvigAssignments[key] === id) {
        delete newInvigAssignments[key];
      }
    });

    const activityLogs = logActivity(
      'TEACHER_DELETED',
      'teachers',
      'Staff Member Removed',
      `Removed ${target?.name || `ID #${id}`} from faculty list`
    );

    updateRemoteData({
      teachers: data.teachers.filter(t => t.id !== id),
      selectedInvigilators: data.selectedInvigilators.filter(tid => tid !== id),
      timetableAssignments: data.timetableAssignments.map(a => (a.teacherId === id ? { ...a, teacherId: undefined } : a)),
      invigilationAssignments: newInvigAssignments,
      activityLogs
    });
  };

  const handleSaveEvaluation = (evaluation: TeacherEvaluation) => {
    const current = data.teacherEvaluations || [];
    const updated = [evaluation, ...current.filter(e => e.id !== evaluation.id)];
    const activityLogs = logActivity(
      'TEACHER_UPDATED',
      'teachers',
      'Teacher Evaluation Recorded',
      `Academic lesson evaluation completed for ${evaluation.teacherName}`
    );
    updateRemoteData({ teacherEvaluations: updated, activityLogs });
  };

  const handleDeleteEvaluation = (id: string) => {
    const current = data.teacherEvaluations || [];
    const updated = current.filter(e => e.id !== id);
    const activityLogs = logActivity(
      'TEACHER_UPDATED',
      'teachers',
      'Teacher Evaluation Removed',
      `Removed evaluation record #${id}`
    );
    updateRemoteData({ teacherEvaluations: updated, activityLogs });
  };

  const handleAddExam = (exam: Exam, session: InvigilationSession) => {
    const activityLogs = logActivity(
      'EXAM_ADDED',
      'exams',
      'Examination Scheduled',
      `Scheduled ${exam.name} for ${exam.className} on ${exam.date}`
    );
    // Auto-create USAL for each subject of registered exam
    const newUsals = generateUsalRecordsForExam(exam, data.students, data.teachers, data.usalRecords || []);
    const updatedUsals = [...(data.usalRecords || []), ...newUsals];

    updateRemoteData({
      exams: [...data.exams, exam],
      sessions: [...data.sessions, session],
      usalRecords: updatedUsals,
      activityLogs
    });
  };

  const handleSaveUsalRecord = (record: UsalRecord) => {
    const current = data.usalRecords || [];
    const exists = current.some(r => r.id === record.id);
    const updated = exists ? current.map(r => r.id === record.id ? record : r) : [...current, record];
    const activityLogs = logActivity(
      'EXAM_UPDATED',
      'results',
      'USAL Record Saved',
      `Saved USAL marksheet for ${record.subject} (${record.className} ${record.stream})`
    );
    updateRemoteData({ usalRecords: updated, activityLogs });
  };

  const handleDeleteExam = (id: number) => {
    const target = data.exams.find(e => e.id === id);
    const activityLogs = logActivity(
      'EXAM_DELETED',
      'exams',
      'Examination Cancelled',
      `Removed exam ${target?.name || `ID #${id}`}`
    );
    updateRemoteData({
      exams: data.exams.filter(e => e.id !== id),
      activityLogs
    });
  };

  const handleUpdateExam = (exam: Exam) => {
    const activityLogs = logActivity(
      'EXAM_UPDATED',
      'exams',
      'Examination Updated',
      `Updated examination ${exam.name} status to ${exam.status || 'Active'}`
    );
    updateRemoteData({
      exams: data.exams.map(e => e.id === exam.id ? exam : e),
      activityLogs
    });
  };

  const handleAddDisciplineRecord = (record: DisciplineRecord) => {
    const current = data.disciplineRecords || [];
    const activityLogs = logActivity(
      'DISCIPLINE_RECORD_ADDED',
      'discipline',
      'Discipline Record Logged',
      `Recorded ${record.category} for ${record.studentName} (${record.regNo}): ${record.title}`
    );
    updateRemoteData({
      disciplineRecords: [record, ...current],
      activityLogs
    });
  };

  const handleUpdateDisciplineRecord = (record: DisciplineRecord) => {
    const current = data.disciplineRecords || [];
    const activityLogs = logActivity(
      'DISCIPLINE_RECORD_UPDATED',
      'discipline',
      'Discipline Record Modified',
      `Updated ${record.studentName} (${record.regNo}) conduct status to ${record.status}`
    );
    updateRemoteData({
      disciplineRecords: current.map(r => r.id === record.id ? record : r),
      activityLogs
    });
  };

  const handleDeleteDisciplineRecord = (id: string) => {
    const current = data.disciplineRecords || [];
    const target = current.find(r => r.id === id);
    const activityLogs = logActivity(
      'DISCIPLINE_RECORD_DELETED',
      'discipline',
      'Discipline Record Removed',
      `Deleted record for ${target?.studentName || id}`
    );
    updateRemoteData({
      disciplineRecords: current.filter(r => r.id !== id),
      activityLogs
    });
  };

  const handleResetToDefaults = () => {
    if (window.confirm("Are you sure? This will overwrite your school database with defaults.")) {
      const activityLogs = logActivity(
        'SYSTEM_RESET',
        'settings',
        'Database Reset to Defaults',
        'Restored school data back to factory curriculum defaults'
      );
      updateRemoteData({
        ...DEFAULT_APP_DATA,
        activityLogs
      });
    }
  };

  const handleClearActivityLogs = () => {
    if (window.confirm("Are you sure you want to clear the audit activity log history?")) {
      const clearedLog: ActivityLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: userAccount?.id || 'admin',
        userName: userAccount?.fullName || 'Administrator',
        userEmail: userAccount?.email || '',
        userRole: userAccount?.role || 'HEADMASTER',
        action: 'SYSTEM_RESET',
        category: 'settings',
        title: 'Audit Trail Purged',
        description: `Audit log was cleared and reset by ${userAccount?.fullName || 'Administrator'}`
      };
      updateRemoteData({ activityLogs: [clearedLog] });
    }
  };

  const handleExportJsonBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `haby_edu_pro_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportJsonBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          const activityLogs = logActivity(
            'BACKUP_RESTORE',
            'settings',
            'Database Restored from File',
            'Imported full school database from external JSON backup'
          );
          const restored = { ...parsed, activityLogs };
          setData(restored);
          updateRemoteData(restored);
          alert('School database restored successfully from JSON backup!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to read JSON backup file: ' + err);
      }
    };
    reader.readAsText(file);
  };

  if (schoolStatus !== 'ACTIVE' && !userAccount.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-4">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-slate-600">
            The school profile for <strong>{data.schoolInfo.name}</strong> is currently <strong>{schoolStatus.toLowerCase()}</strong>. 
            Access to this system has been temporarily suspended by the global administrator.
          </p>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Contact Support</p>
            <p className="text-sm font-bold text-blue-600">habibuakida@gmail.com</p>
          </div>
          <button onClick={() => logout()} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm cursor-pointer hover:bg-slate-900 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf2f7] text-slate-800 font-sans relative overflow-x-hidden flex flex-col lg:flex-row">
      {/* Floating Ambient Bubbles with Beautiful Iridescent Colors */}
      <FloatingBubbles />

      {/* Mobile Sticky Top App Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0f2948] text-white px-3.5 py-2.5 flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="p-2 -ml-1 text-white hover:bg-white/10 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xs font-black text-white truncate tracking-tight">
              {data.schoolInfo.name || 'HABY EDU PRO'}
            </h1>
            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider truncate">
              {activeView}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[9px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
              <RotateCw className="w-2.5 h-2.5 animate-spin" />
              <span className="hidden xs:inline">Saving</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
              <Check className="w-2.5 h-2.5" />
              <span className="hidden xs:inline">Synced</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleForceRefreshSync}
            disabled={isSyncing}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-blue-200 rounded-lg transition text-xs cursor-pointer"
            title="Force Sync"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Responsive Vertical Side Navigation (Drawer on Mobile, Fixed Sidebar on Desktop) */}
      <Navigation
        activeView={activeView}
        schoolInfo={data.schoolInfo}
        saveStatus={saveStatus}
        onSelectView={view => {
          setActiveView(view);
          setIsMobileNavOpen(false);
        }}
        currentUser={userAccount}
        onLogout={() => {
          if (window.confirm("Are you sure you want to logout?")) {
            logout();
          }
        }}
        layout="vertical"
        isMobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area - Full 100% width on mobile, left-padded for sidebar on desktop */}
      <div className="flex-1 lg:pl-64 w-full p-3 sm:p-4 md:p-6 relative z-10 overflow-y-auto min-h-screen">
        {/* View Switcher */}
        <main>
          {activeView === 'dashboard' && (
            <DashboardView
              students={data.students}
              teachers={data.teachers}
              exams={data.exams}
              sessions={data.sessions}
              isCloudSynced={isCloudSynced}
              isSyncing={isSyncing}
              onForceRefreshSync={handleForceRefreshSync}
              syncToast={syncToast}
            />
          )}

          {activeView === 'students' && (
            <StudentsView
              students={data.students}
              schoolInfo={data.schoolInfo}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkDeleteStudents={handleBulkDeleteStudents}
              onBulkAddStudents={handleBulkAddStudents}
            />
          )}

          {activeView === 'teachers' && (
            <TeachersView
              teachers={data.teachers}
              onAddTeacher={handleAddTeacher}
              onBulkAddTeachers={handleBulkAddTeachers}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              teacherEvaluations={data.teacherEvaluations || []}
              onSaveEvaluation={handleSaveEvaluation}
              onDeleteEvaluation={handleDeleteEvaluation}
              streamSettings={data.streamSettings || []}
              timetableAssignments={data.timetableAssignments || []}
              onUpdateTimetableAssignments={assignments => updateRemoteData({ timetableAssignments: assignments })}
              periodSettings={data.periodSettings || []}
              schoolInfo={data.schoolInfo}
              currentUser={userAccount}
            />
          )}

          {activeView === 'results' && (
            <ResultsView
              students={data.students}
              resultsStatus={data.resultsStatus}
              schoolInfo={data.schoolInfo}
              onUpdateStudent={handleUpdateStudent}
              onUpdateStudents={handleUpdateStudents}
              onToggleResultsStatus={status => updateRemoteData({ resultsStatus: status })}
              currentUser={userAccount}
              onNavigateToAttendance={() => setActiveView('attendance')}
              exams={data.exams}
              examinationRecords={data.examinationRecords || []}
              onReleaseResultsToRecords={handleReleaseResultsToExaminationRecords}
              onAutoSaveExaminationRecords={examinationRecords => {
                const activityLogs = logActivity(
                  'EXAM_UPDATED',
                  'results',
                  'Auto-Saved Examination Records',
                  `Auto-saved ${examinationRecords.length} records after result calculation`
                );
                updateRemoteData({ examinationRecords, activityLogs });
              }}
              onNavigateToExamRecords={() => setActiveView('examrecords')}
              onNavigateToSms={() => setActiveView('sms')}
              usalRecords={data.usalRecords || []}
              onSaveUsalRecord={handleSaveUsalRecord}
              onNavigateToMarkEntry={(examName, className) => {
                setActiveView('markentry');
              }}
              teachers={data.teachers}
            />
          )}

          {activeView === 'examrecords' && (
            <ExaminationRecordsView
              students={data.students}
              examinationRecords={data.examinationRecords || []}
              promotionHistory={data.promotionHistory || []}
              transferHistory={data.transferHistory || []}
              schoolInfo={data.schoolInfo}
              onUpdateStudents={handleUpdateStudents}
              onUpdateExaminationRecords={examinationRecords => {
                const activityLogs = logActivity(
                  'EXAM_UPDATED',
                  'results',
                  'Examination Records Updated',
                  `Updated ${examinationRecords.length} student examination records`
                );
                updateRemoteData({ examinationRecords, activityLogs });
              }}
              onUpdatePromotionHistory={promotionHistory => {
                const activityLogs = logActivity(
                  'STUDENTS_BULK_UPDATE',
                  'students',
                  'Student Promotion History Updated',
                  `Logged promotion/graduation for students`
                );
                updateRemoteData({ promotionHistory, activityLogs });
              }}
              onUpdateTransferHistory={transferHistory => {
                const activityLogs = logActivity(
                  'STUDENT_UPDATED',
                  'students',
                  'Student Class/Stream Transfer Logged',
                  `Updated student transfer ledger`
                );
                updateRemoteData({ transferHistory, activityLogs });
              }}
              currentUserName={userAccount?.fullName || 'Academic Master'}
              onNavigateToSms={(examType, year) => {
                setSmsTargetExam({ examType, year });
                setActiveView('sms');
              }}
              onNavigateToNectaAnalyzer={() => setActiveView('nectaanalyzer')}
            />
          )}

          {activeView === 'nectaanalyzer' && (
            <NectaAnalyzer
              schoolId={userAccount?.schoolId || 'DEMO_SCHOOL'}
            />
          )}

          {activeView === 'sms' && (
            <SmsModule
              schoolId={userAccount?.schoolId || 'DEMO_SCHOOL'}
              schoolInfo={data.schoolInfo}
              initialExamType={smsTargetExam.examType || 'CSEE'}
              initialYear={smsTargetExam.year || '2026'}
              onNavigateToAnalyzer={() => setActiveView('nectaanalyzer')}
            />
          )}

          {activeView === 'schemes' && (
            <SchemeOfWorkView
              schoolInfo={data.schoolInfo}
              currentUser={userAccount}
              teachers={data.teachers}
              schemesOfWork={data.schemesOfWork || []}
              onSaveSchemeOfWork={(scheme) => {
                const existing = data.schemesOfWork || [];
                const updated = existing.some(s => s.id === scheme.id)
                  ? existing.map(s => s.id === scheme.id ? scheme : s)
                  : [scheme, ...existing];
                updateRemoteData({ schemesOfWork: updated });
              }}
              onNavigateToLessonPlan={(_subject, _className, _topic) => {
                setActiveView('lessonplans');
              }}
            />
          )}

          {activeView === 'lessonplans' && (
            <LessonPlanView
              schoolInfo={data.schoolInfo}
              currentUser={userAccount}
              teachers={data.teachers}
              savedPlans={data.lessonPlans || []}
              onSaveLessonPlan={(plan) => {
                const existing = data.lessonPlans || [];
                const updated = existing.some(p => p.id === plan.id)
                  ? existing.map(p => p.id === plan.id ? plan : p)
                  : [plan, ...existing];
                updateRemoteData({ lessonPlans: updated });
              }}
              onDeleteLessonPlan={(planId) => {
                const existing = data.lessonPlans || [];
                const updated = existing.filter(p => p.id !== planId);
                updateRemoteData({ lessonPlans: updated });
              }}
            />
          )}

          {activeView === 'attendance' && (
            <AttendanceView
              students={data.students}
              schoolInfo={data.schoolInfo}
              currentUser={userAccount}
              dailyAttendance={data.dailyAttendance || {}}
              onSaveDailyAttendance={(date, rollCallRecords) => {
                const currentDaily = data.dailyAttendance || {};
                const updatedDaily = {
                  ...currentDaily,
                  [date]: rollCallRecords
                };
                updateRemoteData({ dailyAttendance: updatedDaily });
              }}
              onUpdateStudent={handleUpdateStudent}
              onNavigateToResults={() => setActiveView('results')}
            />
          )}

          {activeView === 'discipline' && (
            <DisciplineView
              records={data.disciplineRecords || []}
              students={data.students}
              currentUser={userAccount}
              onAddRecord={handleAddDisciplineRecord}
              onUpdateRecord={handleUpdateDisciplineRecord}
              onDeleteRecord={handleDeleteDisciplineRecord}
            />
          )}

          {activeView === 'studentid' && (
            <StudentIDView
              students={data.students}
              schoolInfo={data.schoolInfo}
            />
          )}

          {activeView === 'markentry' && (
            <MarkEntryView
              students={data.students}
              teachers={data.teachers}
              exams={data.exams}
              timetableAssignments={data.timetableAssignments || []}
              invigilationSessions={data.sessions || []}
              invigilationAssignments={data.invigilationAssignments || {}}
              periodSettings={data.periodSettings || []}
              streamSettings={data.streamSettings || []}
              usalRecords={data.usalRecords || []}
              onSaveUsalRecord={handleSaveUsalRecord}
              currentUser={userAccount}
              schoolInfo={data.schoolInfo}
              onUpdateStudents={handleUpdateStudents}
            />
          )}

          {activeView === 'dailytracker' && (
            <DailyTeachingTrackerView
              currentUser={userAccount}
              schoolInfo={data.schoolInfo}
              timetableAssignments={data.timetableAssignments || []}
              periodSettings={data.periodSettings || []}
            />
          )}

          {activeView === 'evaluationanalysis' && (
            <EvaluationAnalysisView
              currentUser={userAccount}
              schoolInfo={data.schoolInfo}
              timetableAssignments={data.timetableAssignments || []}
              teachers={data.teachers}
            />
          )}

          {activeView === 'remedialtimetable' && (
            <RemedialTimetableSetup
              schoolId={userAccount?.schoolId || DEFAULT_PRIMARY_SCHOOL_ID}
              teachers={data.teachers}
            />
          )}

          {activeView === 'remedialdaily' && (
            <RemedialDailyTracker
              schoolId={userAccount?.schoolId || DEFAULT_PRIMARY_SCHOOL_ID}
              currentUser={userAccount}
            />
          )}

          {activeView === 'remedialanalyzer' && (
            <RemedialPaymentAnalyzer
              schoolId={userAccount?.schoolId || DEFAULT_PRIMARY_SCHOOL_ID}
              schoolInfo={data.schoolInfo}
            />
          )}

          {activeView === 'exams' && (
            <ExamsView
              exams={data.exams}
              onAddExam={handleAddExam}
              onUpdateExam={handleUpdateExam}
              onDeleteExam={handleDeleteExam}
              students={data.students}
              schoolInfo={data.schoolInfo}
            />
          )}

          {activeView === 'timetable' && (
            <TimetableContainer
              assignments={data.timetableAssignments}
              teachers={data.teachers}
              periodSettings={data.periodSettings}
              streamSettings={data.streamSettings}
              classTimetableReleased={data.classTimetableReleased}
              schoolName={data.schoolInfo.name}
              dayThemes={data.dayThemes}
              institutionalPolicy={data.institutionalPolicy}
              subjectPeriodAllocations={data.subjectPeriodAllocations || []}
              teacherAssignments={data.teacherAssignments || []}
              onUpdateAssignments={assignments => {
                const activityLogs = logActivity(
                  'TIMETABLE_UPDATE',
                  'timetable',
                  'Timetable Lesson Allocations Updated',
                  `Modified schedule assignments (${assignments.length} total lessons)`
                );
                updateRemoteData({ timetableAssignments: assignments, activityLogs });
              }}
              onUpdatePeriodSettings={periodSettings => {
                const activityLogs = logActivity(
                  'PERIOD_SETTINGS_UPDATE',
                  'timetable',
                  'Period Bell Schedule Updated',
                  `Updated school periods (${periodSettings.length} periods defined)`
                );
                updateRemoteData({ periodSettings, activityLogs });
              }}
              onUpdateStreamSettings={streamSettings => {
                const activityLogs = logActivity(
                  'STREAM_SETTINGS_UPDATE',
                  'timetable',
                  'Class Streams Structure Updated',
                  `Reconfigured academic streams and classrooms`
                );
                updateRemoteData({ streamSettings, activityLogs });
              }}
              onToggleClassRelease={cName => {
                updateRemoteData({
                  classTimetableReleased: {
                    ...data.classTimetableReleased,
                    [cName]: !data.classTimetableReleased[cName]
                  }
                });
              }}
              onUpdateDayThemes={dayThemes => updateRemoteData({ dayThemes })}
              onUpdateInstitutionalPolicy={institutionalPolicy => {
                const activityLogs = logActivity(
                  'TIMETABLE_UPDATE',
                  'timetable',
                  'Institutional Timetable Policies Updated',
                  `Saved periods per day, duration and conflict rules`
                );
                updateRemoteData({ institutionalPolicy, activityLogs });
              }}
              onUpdateSubjectPeriodAllocations={subjectPeriodAllocations => {
                const activityLogs = logActivity(
                  'TIMETABLE_UPDATE',
                  'timetable',
                  'Subject Period Allocations Updated',
                  `Configured periods per week across levels and streams`
                );
                updateRemoteData({ subjectPeriodAllocations, activityLogs });
              }}
              onUpdateTeacherAssignments={teacherAssignments => {
                const activityLogs = logActivity(
                  'TIMETABLE_UPDATE',
                  'timetable',
                  'Teacher Teaching Allocations Updated',
                  `Assigned faculty to levels, subjects, and streams`
                );
                updateRemoteData({ teacherAssignments, activityLogs });
              }}
            />
          )}

          {activeView === 'invigilation' && (
            <InvigilationContainer
              sessions={data.sessions}
              teachers={data.teachers}
              supervisors={data.supervisors}
              selectedInvigilators={data.selectedInvigilators}
              invigilationAssignments={data.invigilationAssignments}
              timetableReleased={data.timetableReleased}
              schoolInfo={data.schoolInfo}
              dayThemes={data.dayThemes}
              onUpdateSessions={sessions => updateRemoteData({ sessions })}
              onUpdateSupervisors={supervisors => updateRemoteData({ supervisors })}
              onUpdateSelectedInvigilators={selectedInvigilators => updateRemoteData({ selectedInvigilators })}
              onUpdateInvigilationAssignments={invigilationAssignments => {
                const activityLogs = logActivity(
                  'INVIGILATION_UPDATE',
                  'invigilation',
                  'Invigilation Duties Updated',
                  'Assigned exam room invigilators'
                );
                updateRemoteData({ invigilationAssignments, activityLogs });
              }}
              onToggleRelease={() => updateRemoteData({ timetableReleased: !data.timetableReleased })}
              onNavigateToSittingPlan={() => setActiveView('sittingplan')}
            />
          )}

          {activeView === 'sittingplan' && (
            <SittingPlan
              schoolId={userAccount?.schoolId || 'DEMO_SCHOOL'}
              schoolInfo={data.schoolInfo}
              onBack={() => setActiveView('invigilation')}
            />
          )}

          {activeView === 'finance' && (
            <SaasFinance
              schoolId={userAccount?.schoolId || 'DEMO_SCHOOL'}
              currentUser={userAccount as any}
              students={data.students}
            />
          )}

          {activeView === 'parentportal' && (
            <ParentPortalView onBackToMain={() => setActiveView('dashboard')} />
          )}

          {activeView === 'settings' && (
            <SettingsView
              schoolInfo={data.schoolInfo}
              onSaveSchoolInfo={schoolInfo => {
                const activityLogs = logActivity(
                  'SCHOOL_INFO_UPDATE',
                  'settings',
                  'School Identity Updated',
                  `Saved school metadata for ${schoolInfo.name}`
                );
                updateRemoteData({ schoolInfo, activityLogs });
              }}
              onResetToDefaults={handleResetToDefaults}
              periodSettings={data.periodSettings}
              onUpdatePeriodSettings={periodSettings => {
                const activityLogs = logActivity(
                  'PERIOD_SETTINGS_UPDATE',
                  'timetable',
                  'Period Settings Saved',
                  `Updated period duration and timings (${periodSettings.length} periods)`
                );
                updateRemoteData({ periodSettings, activityLogs });
              }}
              assignments={data.timetableAssignments}
              onUpdateAssignments={assignments => {
                const activityLogs = logActivity(
                  'TIMETABLE_UPDATE',
                  'timetable',
                  'Timetable Assignments Modified',
                  `Saved timetable configuration with ${assignments.length} assigned periods`
                );
                updateRemoteData({ timetableAssignments: assignments, activityLogs });
              }}
              dayThemes={data.dayThemes}
              teachers={data.teachers}
              onExportJson={handleExportJsonBackup}
              onImportJson={handleImportJsonBackup}
              users={users}
              onUpdateUsers={handleUpdateUsers}
              currentUser={userAccount}
              students={data.students}
              activityLogs={data.activityLogs || []}
              onClearActivityLogs={handleClearActivityLogs}
            />
          )}
        </main>

        {/* System Provider Footer */}
        <footer className="mt-12 pb-8 border-t border-slate-200 pt-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">System Provided & Managed By</p>
            <h3 className="text-sm font-black text-slate-900 uppercase">MWL HABIBU AKIDA</h3>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                habibuakida@gmail.com
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                +255 717 616 343
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                Software Developer & Academic Consultant
              </div>
            </div>
            <p className="text-[9px] text-slate-300 font-medium mt-4 uppercase">© 2026 HABY EDU PRO • Comprehensive School Management System</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
