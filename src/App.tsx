import React, { useState, useEffect, useCallback } from 'react';
import { AppData, Student, Teacher, Exam, InvigilationSession, PeriodSetting, StreamSetting, TimetableAssignment, Supervisor, SchoolInfo, UserAccount, SchoolStatus, ActivityLog, ActivityAction, ActivityCategory, DisciplineRecord, TeacherEvaluation, UsalRecord, ExaminationRecord } from './types';
import { DEFAULT_APP_DATA } from './constants/defaults';
import { generateUsalRecordsForExam, ensureUsalRecordsForAllExams } from './utils/usalUtils';
import { Navigation, ActiveView } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { TeachersView } from './components/TeachersView';
import { ResultsView } from './components/ResultsView';
import { ExaminationRecordsView } from './components/ExaminationRecords/ExaminationRecordsView';
import { ExamsView } from './components/ExamsView';
import { TimetableContainer } from './components/Timetable/TimetableContainer';
import { InvigilationContainer } from './components/InvigilationContainer';
import { SettingsView } from './components/SettingsView';
import { AttendanceView } from './components/AttendanceView';
import { MarkEntryView } from './components/MarkEntryView';
import { StudentIDView } from './components/StudentIDView';
import { DisciplineView } from './components/DisciplineView';
import { LessonPlanView } from './components/LessonPlan/LessonPlanView';
import { FloatingBubbles } from './components/FloatingBubbles';
import { AuthScreen } from './components/auth/AuthScreen';
import { useAuth } from './context/AuthContext';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Loader2, Shield } from 'lucide-react';

export default function App() {
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

  // Sync with Firestore & Real-Time Single Source of Truth
  useEffect(() => {
    if (!userAccount?.schoolId || userAccount.schoolId === 'PENDING') {
      setDataLoading(false);
      return;
    }

    const schoolId = userAccount.schoolId;
    const schoolKey = `haby_school_data_${schoolId}`;

    const schoolRef = doc(db, 'schools', schoolId);
    const docRef = doc(db, 'schoolData', schoolId);
    const studentsCol = collection(db, 'schools', schoolId, 'students');
    const teachersCol = collection(db, 'schools', schoolId, 'teachers');
    const examsCol = collection(db, 'schools', schoolId, 'exams');
    const examRecordsCol = collection(db, 'schools', schoolId, 'examinationRecords');
    const usalRecordsCol = collection(db, 'schools', schoolId, 'usalRecords');
    const usersQuery = query(collection(db, 'users'), where('schoolId', '==', schoolId));

    // 1. Check School Status
    const unsubscribeStatus = onSnapshot(schoolRef, (snapshot) => {
      if (snapshot.exists()) {
        const sData = snapshot.data();
        setSchoolStatus(sData.status || 'ACTIVE');
      }
    }, (err) => console.warn("School status snapshot error:", err));

    // 2. Real-time Students subcollection listener (Single Source of Truth)
    const unsubscribeStudents = onSnapshot(studentsCol, (snapshot) => {
      if (!snapshot.empty) {
        const studentList: Student[] = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.data().id ?? (isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id))
        } as Student));
        setData(prev => ({ ...prev, students: studentList }));
        setIsCloudSynced(true);
        setDataLoading(false);
      }
    }, (err) => console.warn("Students subcollection snapshot error:", err));

    // 3. Real-time Teachers subcollection listener
    const unsubscribeTeachers = onSnapshot(teachersCol, (snapshot) => {
      if (!snapshot.empty) {
        const teacherList: Teacher[] = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.data().id ?? (isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id))
        } as Teacher));
        setData(prev => ({ ...prev, teachers: teacherList }));
        setIsCloudSynced(true);
      }
    }, (err) => console.warn("Teachers subcollection snapshot error:", err));

    // 4. Real-time Exams subcollection listener
    const unsubscribeExams = onSnapshot(examsCol, (snapshot) => {
      if (!snapshot.empty) {
        const examList: Exam[] = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.data().id ?? (isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id))
        } as Exam));
        setData(prev => ({ ...prev, exams: examList }));
      }
    }, (err) => console.warn("Exams subcollection snapshot error:", err));

    // 5. Real-time Examination Records subcollection listener
    const unsubscribeExamRecords = onSnapshot(examRecordsCol, (snapshot) => {
      if (!snapshot.empty) {
        const recList: ExaminationRecord[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as ExaminationRecord));
        setData(prev => ({ ...prev, examinationRecords: recList }));
      }
    }, (err) => console.warn("Exam records subcollection snapshot error:", err));

    // 6. Real-time USAL subcollection listener
    const unsubscribeUsals = onSnapshot(usalRecordsCol, (snapshot) => {
      if (!snapshot.empty) {
        const usalList: UsalRecord[] = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id
        } as UsalRecord));
        setData(prev => ({ ...prev, usalRecords: usalList }));
      }
    }, (err) => console.warn("USAL subcollection snapshot error:", err));

    // 7. Master schoolData document listener for metadata, settings & fallback
    const unsubscribeData = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data();
        setData(prev => {
          const merged: AppData = {
            ...prev,
            ...remoteData,
            // Prioritize the fullest student list between subcollection onSnapshot and remoteData
            students: prev.students.length >= (remoteData.students?.length || 0) && prev.students.length > 11
              ? prev.students 
              : ((remoteData.students && remoteData.students.length > 0) ? remoteData.students : prev.students),
            teachers: prev.teachers.length >= (remoteData.teachers?.length || 0) && prev.teachers.length > 0
              ? prev.teachers
              : ((remoteData.teachers && remoteData.teachers.length > 0) ? remoteData.teachers : prev.teachers),
            exams: prev.exams.length >= (remoteData.exams?.length || 0) && prev.exams.length > 0
              ? prev.exams
              : ((remoteData.exams && remoteData.exams.length > 0) ? remoteData.exams : prev.exams),
            examinationRecords: prev.examinationRecords && prev.examinationRecords.length > 0 
              ? prev.examinationRecords 
              : (remoteData.examinationRecords || prev.examinationRecords || []),
            usalRecords: prev.usalRecords && prev.usalRecords.length > 0
              ? prev.usalRecords
              : (remoteData.usalRecords || prev.usalRecords || []),
            schoolInfo: remoteData.schoolInfo || prev.schoolInfo,
            activityLogs: remoteData.activityLogs || prev.activityLogs || []
          };
          try {
            localStorage.setItem(schoolKey, JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
        setIsCloudSynced(true);
      } else {
        // Initialize doc if not exists
        setDoc(docRef, {
          schoolId: schoolId,
          ...DEFAULT_APP_DATA,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(e => console.warn("Init doc error:", e));
      }
      setDataLoading(false);
    }, (error) => {
      console.warn("Firestore snapshot error:", error);
      setDataLoading(false);
    });

    // 8. Users listener
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersList: UserAccount[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as UserAccount);
      });
      if (usersList.length > 0) {
        setUsers(usersList);
      }
    }, (err) => console.warn("Users snapshot error:", err));

    return () => {
      unsubscribeStatus();
      unsubscribeStudents();
      unsubscribeTeachers();
      unsubscribeExams();
      unsubscribeExamRecords();
      unsubscribeUsals();
      unsubscribeData();
      unsubscribeUsers();
    };
  }, [userAccount]);

  // Force Refresh & Sync button implementation
  const handleForceRefreshSync = async () => {
    if (!userAccount?.schoolId) return;
    setIsSyncing(true);
    try {
      const schoolKey = `haby_school_data_${userAccount.schoolId}`;
      localStorage.removeItem(schoolKey);

      // Re-fetch everything directly from Firestore server
      const [studentsSnap, teachersSnap, examsSnap, recsSnap, usalsSnap, schoolDataSnap] = await Promise.all([
        getDocs(collection(db, 'schools', userAccount.schoolId, 'students')),
        getDocs(collection(db, 'schools', userAccount.schoolId, 'teachers')),
        getDocs(collection(db, 'schools', userAccount.schoolId, 'exams')),
        getDocs(collection(db, 'schools', userAccount.schoolId, 'examinationRecords')),
        getDocs(collection(db, 'schools', userAccount.schoolId, 'usalRecords')),
        getDoc(doc(db, 'schoolData', userAccount.schoolId))
      ]);

      const fetchedStudents: Student[] = [];
      studentsSnap.forEach(d => fetchedStudents.push({ id: d.data().id ?? (isNaN(Number(d.id)) ? d.id : Number(d.id)), ...d.data() } as Student));

      const fetchedTeachers: Teacher[] = [];
      teachersSnap.forEach(d => fetchedTeachers.push({ id: d.data().id ?? (isNaN(Number(d.id)) ? d.id : Number(d.id)), ...d.data() } as Teacher));

      const fetchedExams: Exam[] = [];
      examsSnap.forEach(d => fetchedExams.push({ id: d.data().id ?? (isNaN(Number(d.id)) ? d.id : Number(d.id)), ...d.data() } as Exam));

      const fetchedRecs: ExaminationRecord[] = [];
      recsSnap.forEach(d => fetchedRecs.push({ id: d.id, ...d.data() } as ExaminationRecord));

      const fetchedUsals: UsalRecord[] = [];
      usalsSnap.forEach(d => fetchedUsals.push({ id: d.id, ...d.data() } as UsalRecord));

      const remoteData = schoolDataSnap.exists() ? schoolDataSnap.data() : {};

      const finalStudents = fetchedStudents.length > 0 ? fetchedStudents : (remoteData.students || []);
      const finalTeachers = fetchedTeachers.length > 0 ? fetchedTeachers : (remoteData.teachers || []);
      const finalExams = fetchedExams.length > 0 ? fetchedExams : (remoteData.exams || []);
      const finalRecs = fetchedRecs.length > 0 ? fetchedRecs : (remoteData.examinationRecords || []);
      const finalUsals = fetchedUsals.length > 0 ? fetchedUsals : (remoteData.usalRecords || []);

      setData(prev => ({
        ...prev,
        ...remoteData,
        students: finalStudents.length > 0 ? finalStudents : prev.students,
        teachers: finalTeachers.length > 0 ? finalTeachers : prev.teachers,
        exams: finalExams.length > 0 ? finalExams : prev.exams,
        examinationRecords: finalRecs,
        usalRecords: finalUsals
      }));

      setIsCloudSynced(true);
      const studentCount = finalStudents.length || 0;
      setSyncToast(`Cloud Sync Active: Loaded ${studentCount} students and ${finalTeachers.length} staff directly from Firestore.`);
      setTimeout(() => setSyncToast(null), 4500);
    } catch (err) {
      console.error("Force sync error:", err);
      setSyncToast("Sync completed from available cloud collections.");
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateRemoteData = useCallback(async (updates: Partial<AppData>) => {
    setSaveStatus('saving');
    // 1. Immediately update local state so changes persist in UI with zero delay
    setData(prev => {
      const next = { ...prev, ...updates };
      const schoolKey = `haby_school_data_${userAccount?.schoolId || 'DEFAULT_SCHOOL'}`;
      try {
        localStorage.setItem(schoolKey, JSON.stringify(next));
      } catch (err) {
        console.warn("Could not save to localStorage:", err);
      }
      return next;
    });

    if (!userAccount?.schoolId) {
      setSaveStatus('saved');
      return;
    }

    const schoolId = userAccount.schoolId;
    const docRef = doc(db, 'schoolData', schoolId);
    try {
      // 2. Sanitize undefined fields to prevent Firestore serialization errors
      const sanitized = JSON.parse(JSON.stringify(updates, (_key, value) => {
        return value === undefined ? null : value;
      }));
      await setDoc(docRef, {
        ...sanitized,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 3. Mirror subcollection writes when applicable
      if (updates.examinationRecords && Array.isArray(updates.examinationRecords)) {
        for (const rec of updates.examinationRecords) {
          if (rec.id) {
            await setDoc(doc(db, 'schools', schoolId, 'examinationRecords', rec.id), rec, { merge: true });
          }
        }
      }

      if (updates.usalRecords && Array.isArray(updates.usalRecords)) {
        for (const rec of updates.usalRecords) {
          if (rec.id) {
            await setDoc(doc(db, 'schools', schoolId, 'usalRecords', rec.id), rec, { merge: true });
          }
        }
      }

      setSaveStatus('saved');
    } catch (e) {
      console.error("Error updating Firestore:", e);
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

    // Push each record to schools/{schoolId}/examinationRecords
    try {
      for (const rec of records) {
        await setDoc(doc(db, 'schools', schoolId, 'examinationRecords', rec.id), rec, { merge: true });
      }
    } catch (err) {
      console.warn("Could not push records to Firestore subcollection:", err);
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

  const handleAddStudent = (student: Student) => {
    const activityLogs = logActivity(
      'STUDENT_ADDED',
      'students',
      'Student Enrolled',
      `Enrolled ${student.name} (${student.regNo || 'No Reg'}) in Form ${student.className}`
    );
    updateRemoteData({ students: [...data.students, student], activityLogs });
  };

  const handleBulkAddStudents = (newStudents: Student[]) => {
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
            await deleteDoc(doc(db, 'users', oldU.id));
          } catch (e) {
            console.warn("Could not delete user doc:", e);
          }
        }
      }
      for (const u of newUsers) {
        await setDoc(doc(db, 'users', u.id), {
          ...u,
          schoolId: userAccount.schoolId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      const activityLogs = logActivity(
        'USER_ROLE_UPDATE',
        'security',
        'Staff Accounts Synchronized',
        `User accounts roster updated (${newUsers.length} active users)`
      );
      updateRemoteData({ activityLogs });
    } catch (e) {
      console.error("Error updating users in Firestore:", e);
    }
  };

  const handleUpdateStudent = (student: Student) => {
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

  const handleDeleteStudent = (id: number) => {
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

  const handleBulkDeleteStudents = (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const count = ids.length;
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

  const handleAddTeacher = (teacher: Teacher) => {
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

  const handleUpdateTeacher = (teacher: Teacher) => {
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

  const handleDeleteTeacher = (id: number) => {
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
    <div className="min-h-screen bg-[#edf2f7] text-slate-800 p-3 sm:p-6 font-sans relative overflow-x-hidden">
      {/* Floating Ambient Bubbles with Beautiful Iridescent Colors */}
      <FloatingBubbles />

      <div className="max-w-[1550px] mx-auto relative z-10">
        {/* Navigation & Header */}
        <Navigation
          activeView={activeView}
          schoolInfo={data.schoolInfo}
          saveStatus={saveStatus}
          onSelectView={view => {
            if (userAccount?.role === 'TEACHER' && !['results', 'attendance', 'timetable', 'markentry', 'discipline', 'dashboard'].includes(view)) {
              setActiveView('timetable');
            } else {
              setActiveView(view);
            }
          }}
          currentUser={userAccount}
          onLogout={() => {
            if (window.confirm("Are you sure you want to logout?")) {
              logout();
            }
          }}
        />

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
            />
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
      </div>
    </div>
  );
}
