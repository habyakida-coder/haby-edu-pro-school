import { AppData, UserAccount } from '../types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_head',
    email: 'headmaster@school.edu',
    fullName: 'Dr. Habibu Akida',
    role: 'HEADMASTER',
    schoolId: 'DEMO_SCHOOL'
  },
  {
    id: 'usr_academic',
    email: 'academic@school.edu',
    fullName: 'David Mwakipesile',
    role: 'ACADEMIC',
    schoolId: 'DEMO_SCHOOL'
  },
  {
    id: 'usr_teacher',
    email: 'teacher@school.edu',
    fullName: 'Grace Mchome',
    role: 'TEACHER',
    schoolId: 'DEMO_SCHOOL'
  }
];

export const SUBJECT_LIST = [
  'English Language',
  'Kiswahili',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Geography',
  'History',
  'Civics',
  'Computer Studies',
  'Commerce',
  'Book Keeping',
  'Economics',
  'Agriculture',
  'Business Studies',
  'Islamic Religious Education',
  'Christian Religious Education',
  'Fine Art',
  'Home Economics',
  'Physical Education',
  'French',
  'Arabic',
  'German',
  'General Studies',
  'Advanced Mathematics',
  'Basic Applied Mathematics',
  'Accountancy',
  'Computer Science',
  'Divinity',
  'Historia Ya Tanzania Na Maadili',
  'Literature in English',
  'Elimu ya Dini ya Kiislamu',
  'Academic Communications',
  // Extra-curricular / special meal & activity periods
  'Religion',
  'Praying',
  'Prayer & Devotion',
  'Breakfast',
  'Lunch',
  'Environmental Day',
  'Sports and Games',
  'Debates',
  'Remedial Classes',
  'General Assembly',
  'Clubs & Societies',
  'Library & Private Study',
  'Weekly Test'
];

export const EXTRA_CURRICULAR_ACTIVITIES = [
  { id: 'weekly_test', name: 'Weekly Test', icon: 'FileCheck', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', cellBg: '#fff1f2' },
  { id: 'praying', name: 'Praying / Devotion', icon: 'Sparkles', color: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc', text: '#0369a1', cellBg: '#f0f9ff' },
  { id: 'religion', name: 'Religion', icon: 'BookMarked', color: '#4f46e5', bg: '#e0e7ff', border: '#a5b4fc', text: '#312e81', cellBg: '#eef2ff' },
  { id: 'breakfast', name: 'Breakfast', icon: 'Coffee', color: '#d97706', bg: '#fef3c7', border: '#fcd34d', text: '#78350f', cellBg: '#fef9c3' },
  { id: 'lunch', name: 'Lunch', icon: 'Utensils', color: '#ea580c', bg: '#ffedd5', border: '#fed7aa', text: '#7c2d12', cellBg: '#fff1e6' },
  { id: 'environmental', name: 'Environmental Day', icon: 'Trees', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', cellBg: '#ecfdf5' },
  { id: 'sports', name: 'Sports and Games', icon: 'Trophy', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', cellBg: '#fff7ed' },
  { id: 'debates', name: 'Debates & Public Speaking', icon: 'MessageSquare', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', text: '#5b21b6', cellBg: '#f5f3ff' },
  { id: 'remedial', name: 'Remedial Classes', icon: 'BookOpen', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', cellBg: '#eff6ff' },
  { id: 'assembly', name: 'General Assembly', icon: 'Users', color: '#4b5563', bg: '#f3f4f6', border: '#e5e7eb', text: '#1f2937', cellBg: '#f3f4f6' },
  { id: 'clubs', name: 'Clubs & Societies', icon: 'Sparkles', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', cellBg: '#fdf2f8' },
  { id: 'library', name: 'Library & Private Study', icon: 'Library', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', text: '#115e59', cellBg: '#f0fdfa' }
];

export const DEFAULT_CLASSES = [
  'Form 1',
  'Form 2',
  'Form 3',
  'Form 4',
  'Form 5',
  'Form 6'
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const DEFAULT_DAY_THEMES: Record<string, { name: string; bg: string; border: string; headerBg: string; text: string }> = {
  Monday: {
    name: 'Sky Blue',
    bg: '#f0f7ff',
    border: '#bae6fd',
    headerBg: '#0284c7',
    text: '#0369a1'
  },
  Tuesday: {
    name: 'Emerald Mint',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    headerBg: '#059669',
    text: '#047857'
  },
  Wednesday: {
    name: 'Warm Amber',
    bg: '#fffbeb',
    border: '#fde68a',
    headerBg: '#d97706',
    text: '#b45309'
  },
  Thursday: {
    name: 'Royal Purple',
    bg: '#faf5ff',
    border: '#e9d5ff',
    headerBg: '#7c3aed',
    text: '#6d28d9'
  },
  Friday: {
    name: 'Coral Rose',
    bg: '#fff1f2',
    border: '#fecdd3',
    headerBg: '#e11d48',
    text: '#be123c'
  },
  Saturday: {
    name: 'Slate Teal',
    bg: '#f0fdfa',
    border: '#99f6e4',
    headerBg: '#0d9488',
    text: '#0f766e'
  }
};

export const FORM_STREAM_THEMES: Record<string, { badgeBg: string; badgeText: string; border: string; lightBg: string; accent: string }> = {
  'Form 1': {
    badgeBg: '#10b981',
    badgeText: '#ffffff',
    border: '#34d399',
    lightBg: '#ecfdf5',
    accent: '#059669'
  },
  'Form 2': {
    badgeBg: '#3b82f6',
    badgeText: '#ffffff',
    border: '#60a5fa',
    lightBg: '#eff6ff',
    accent: '#2563eb'
  },
  'Form 3': {
    badgeBg: '#8b5cf6',
    badgeText: '#ffffff',
    border: '#a78bfa',
    lightBg: '#f5f3ff',
    accent: '#7c3aed'
  },
  'Form 4': {
    badgeBg: '#f97316',
    badgeText: '#ffffff',
    border: '#fb923c',
    lightBg: '#fff7ed',
    accent: '#ea580c'
  },
  'Form 5': {
    badgeBg: '#ec4899',
    badgeText: '#ffffff',
    border: '#f472b6',
    lightBg: '#fdf2f8',
    accent: '#db2777'
  },
  'Form 6': {
    badgeBg: '#06b6d4',
    badgeText: '#ffffff',
    border: '#22d3ee',
    lightBg: '#ecfeff',
    accent: '#0891b2'
  }
};

export const INVIGILATOR_COLORS = [
  { name: 'Sky', hex: '#0284c7', bg: '#e0f2fe', text: '#0369a1' },
  { name: 'Emerald', hex: '#059669', bg: '#d1fae5', text: '#065f46' },
  { name: 'Amber', hex: '#d97706', bg: '#fef3c7', text: '#92400e' },
  { name: 'Purple', hex: '#7c3aed', bg: '#ede9fe', text: '#5b21b6' },
  { name: 'Rose', hex: '#e11d48', bg: '#ffe4e6', text: '#9f1239' },
  { name: 'Teal', hex: '#0d9488', bg: '#ccfbf1', text: '#115e59' },
  { name: 'Indigo', hex: '#4f46e5', bg: '#e0e7ff', text: '#3730a3' },
  { name: 'Orange', hex: '#ea580c', bg: '#ffedd5', text: '#9a3412' },
  { name: 'Pink', hex: '#db2777', bg: '#fce7f3', text: '#9d174d' },
  { name: 'Cyan', hex: '#0891b2', bg: '#cffafe', text: '#155e75' }
];

export const STAFF_ROLES_LIST = [
  'Academic Master',
  'Academic Mistress',
  'Discipline Master',
  'Discipline Mistress',
  'Headmaster',
  'Headmistress',
  'Second Master',
  'Deputy Headmaster',
  'Examination Officer',
  'Head of Department (HOD) - Science',
  'Head of Department (HOD) - Mathematics',
  'Head of Department (HOD) - Languages',
  'Head of Department (HOD) - Arts & Social Studies',
  'Head of Department (HOD) - Business & ICT',
  'Class Teacher / Master',
  'Sports & Games Master',
  'Health, Sanitation & Environment Master',
  'Guidance & Counseling Master',
  'Patron / Matron (Boarding)',
  'Spiritual Patron (Chaplain / Imam)',
  'Library Master',
  'Subject Teacher'
];

export const INITIAL_TEACHERS = [
  { id: 101, name: 'Adelmarcy Mallya', initial: 'AM', subjects: ['Mathematics', 'Physics'], excludeInvigilation: false, color: '#0284c7', schoolRole: 'Academic Master', phone: '+255 754 112 233', email: 'a.mallya@school.ac.tz' },
  { id: 102, name: 'Baraka Mgimwa', initial: 'BM', subjects: ['English Language', 'Literature in English'], excludeInvigilation: false, color: '#059669', schoolRole: 'Discipline Master', phone: '+255 713 223 344', email: 'b.mgimwa@school.ac.tz' },
  { id: 103, name: 'Catherine Shirima', initial: 'CS', subjects: ['Biology', 'Chemistry'], excludeInvigilation: false, color: '#d97706', schoolRole: 'Head of Department (HOD) - Science', phone: '+255 784 334 455', email: 'c.shirima@school.ac.tz' },
  { id: 104, name: 'David Mwakipesile', initial: 'DM', subjects: ['Geography', 'History'], excludeInvigilation: false, color: '#7c3aed', schoolRole: 'Second Master', phone: '+255 762 445 566', email: 'd.mwakipesile@school.ac.tz' },
  { id: 105, name: 'Emmanuel Tarimo', initial: 'ET', subjects: ['Kiswahili', 'Civics'], excludeInvigilation: false, color: '#e11d48', schoolRole: 'Examination Officer', phone: '+255 655 556 677', email: 'e.tarimo@school.ac.tz' },
  { id: 106, name: 'Faraja Lyimo', initial: 'FL', subjects: ['Computer Studies', 'Mathematics'], excludeInvigilation: false, color: '#0d9488', schoolRole: 'Head of Department (HOD) - Business & ICT', phone: '+255 712 667 788', email: 'f.lyimo@school.ac.tz' },
  { id: 107, name: 'Grace Muro', initial: 'GM', subjects: ['Commerce', 'Book Keeping'], excludeInvigilation: false, color: '#4f46e5', schoolRole: 'Head of Department (HOD) - Arts & Social Studies', phone: '+255 789 778 899', email: 'g.muro@school.ac.tz' },
  { id: 108, name: 'Hamisi Juma', initial: 'HJ', subjects: ['Physical Education', 'Sports and Games'], excludeInvigilation: false, color: '#ea580c', schoolRole: 'Sports & Games Master', phone: '+255 765 889 900', email: 'h.juma@school.ac.tz' }
];

export const INITIAL_PERIOD_SETTINGS = [
  // Monday
  { id: 1, day: 'Monday', name: 'Period 1', start: '08:00', end: '08:40' },
  { id: 2, day: 'Monday', name: 'Period 2', start: '08:40', end: '09:20' },
  { id: 3, day: 'Monday', name: 'Period 3', start: '09:40', end: '10:20' },
  { id: 4, day: 'Monday', name: 'Period 4', start: '10:20', end: '11:00' },
  { id: 5, day: 'Monday', name: 'Period 5', start: '11:20', end: '12:00' },
  { id: 6, day: 'Monday', name: 'Period 6', start: '12:00', end: '12:40' },
  { id: 7, day: 'Monday', name: 'Period 7', start: '14:00', end: '14:40' },
  // Tuesday
  { id: 8, day: 'Tuesday', name: 'Period 1', start: '08:00', end: '08:40' },
  { id: 9, day: 'Tuesday', name: 'Period 2', start: '08:40', end: '09:20' },
  { id: 10, day: 'Tuesday', name: 'Period 3', start: '09:40', end: '10:20' },
  { id: 11, day: 'Tuesday', name: 'Period 4', start: '10:20', end: '11:00' },
  { id: 12, day: 'Tuesday', name: 'Period 5', start: '11:20', end: '12:00' },
  { id: 13, day: 'Tuesday', name: 'Period 6', start: '12:00', end: '12:40' },
  { id: 14, day: 'Tuesday', name: 'Period 7', start: '14:00', end: '14:40' },
  // Wednesday
  { id: 15, day: 'Wednesday', name: 'Period 1', start: '08:00', end: '08:40' },
  { id: 16, day: 'Wednesday', name: 'Period 2', start: '08:40', end: '09:20' },
  { id: 17, day: 'Wednesday', name: 'Period 3', start: '09:40', end: '10:20' },
  { id: 18, day: 'Wednesday', name: 'Period 4', start: '10:20', end: '11:00' },
  { id: 19, day: 'Wednesday', name: 'Period 5', start: '11:20', end: '12:00' },
  { id: 20, day: 'Wednesday', name: 'Period 6', start: '12:00', end: '12:40' },
  { id: 21, day: 'Wednesday', name: 'Period 7', start: '14:00', end: '15:30' }, // Sports & Games block
  // Thursday
  { id: 22, day: 'Thursday', name: 'Period 1', start: '08:00', end: '08:40' },
  { id: 23, day: 'Thursday', name: 'Period 2', start: '08:40', end: '09:20' },
  { id: 24, day: 'Thursday', name: 'Period 3', start: '09:40', end: '10:20' },
  { id: 25, day: 'Thursday', name: 'Period 4', start: '10:20', end: '11:00' },
  { id: 26, day: 'Thursday', name: 'Period 5', start: '11:20', end: '12:00' },
  { id: 27, day: 'Thursday', name: 'Period 6', start: '12:00', end: '12:40' },
  { id: 28, day: 'Thursday', name: 'Period 7', start: '14:00', end: '14:40' },
  // Friday
  { id: 29, day: 'Friday', name: 'Period 1', start: '08:00', end: '08:40' },
  { id: 30, day: 'Friday', name: 'Period 2', start: '08:40', end: '09:20' },
  { id: 31, day: 'Friday', name: 'Period 3', start: '09:40', end: '10:20' },
  { id: 32, day: 'Friday', name: 'Period 4', start: '10:20', end: '11:00' },
  { id: 33, day: 'Friday', name: 'Period 5', start: '11:20', end: '12:00' },
  { id: 34, day: 'Friday', name: 'Period 6', start: '12:00', end: '12:40' },
  { id: 35, day: 'Friday', name: 'Period 7', start: '14:00', end: '15:00' } // Environmental Day / Debates
];

export const INITIAL_STREAM_SETTINGS = [
  { id: 1, className: 'Form 1', level: 'CSEE' as const, streams: ['STREAM A', 'STREAM B'] },
  { id: 2, className: 'Form 2', level: 'CSEE' as const, streams: ['STREAM A', 'STREAM B'] },
  { id: 3, className: 'Form 3', level: 'CSEE' as const, streams: ['STREAM A', 'STREAM B'] },
  { id: 4, className: 'Form 4', level: 'CSEE' as const, streams: ['STREAM A', 'STREAM B'] },
  { id: 5, className: 'Form 5', level: 'ACSEE' as const, streams: ['PCM', 'PCB', 'HGE'] },
  { id: 6, className: 'Form 6', level: 'ACSEE' as const, streams: ['PCM', 'PCB', 'HKL'] }
];

export const INITIAL_TIMETABLE_ASSIGNMENTS = [
  // Form 1 STREAM A
  { id: 201, className: 'Form 1', stream: 'STREAM A', day: 'Monday', period: 'Period 1 (08:00-08:40)', teacherId: 101, subject: 'Mathematics' },
  { id: 202, className: 'Form 1', stream: 'STREAM A', day: 'Monday', period: 'Period 2 (08:40-09:20)', teacherId: 102, subject: 'English Language' },
  { id: 203, className: 'Form 1', stream: 'STREAM A', day: 'Monday', period: 'Period 3 (09:40-10:20)', teacherId: 103, subject: 'Biology' },
  { id: 204, className: 'Form 1', stream: 'STREAM A', day: 'Monday', period: 'Period 4 (10:20-11:00)', teacherId: 104, subject: 'Geography' },
  { id: 205, className: 'Form 1', stream: 'STREAM A', day: 'Monday', period: 'Period 5 (11:20-12:00)', teacherId: 105, subject: 'Kiswahili' },
  { id: 206, className: 'Form 1', stream: 'STREAM A', day: 'Monday', period: 'Period 6 (12:00-12:40)', teacherId: 106, subject: 'Computer Studies' },
  { id: 207, className: 'Form 1', stream: 'STREAM A', day: 'Monday', period: 'Period 7 (14:00-14:40)', teacherId: 101, subject: 'Remedial Classes', activityType: 'remedial' as const },

  // Form 1 STREAM B
  { id: 208, className: 'Form 1', stream: 'STREAM B', day: 'Monday', period: 'Period 1 (08:00-08:40)', teacherId: 102, subject: 'English Language' },
  { id: 209, className: 'Form 1', stream: 'STREAM B', day: 'Monday', period: 'Period 2 (08:40-09:20)', teacherId: 101, subject: 'Mathematics' },
  { id: 210, className: 'Form 1', stream: 'STREAM B', day: 'Monday', period: 'Period 3 (09:40-10:20)', teacherId: 105, subject: 'Kiswahili' },
  
  // Wednesday Extra-curricular (Sports & Games)
  { id: 211, className: 'Form 1', stream: 'STREAM A', day: 'Wednesday', period: 'Period 7 (14:00-15:30)', teacherId: 108, subject: 'Sports and Games', activityType: 'sports' as const },
  { id: 212, className: 'Form 1', stream: 'STREAM B', day: 'Wednesday', period: 'Period 7 (14:00-15:30)', teacherId: 108, subject: 'Sports and Games', activityType: 'sports' as const },

  // Friday Extra-curricular (Religion, Environmental Day & Debates)
  { id: 213, className: 'Form 1', stream: 'STREAM A', day: 'Friday', period: 'Period 5 (11:20-12:00)', subject: 'Religion', activityType: 'religion' as const, room: 'Chapel / Mosque / Hall' },
  { id: 214, className: 'Form 1', stream: 'STREAM B', day: 'Friday', period: 'Period 5 (11:20-12:00)', subject: 'Religion', activityType: 'religion' as const, room: 'Chapel / Mosque / Hall' },
  { id: 219, className: 'Form 1', stream: 'STREAM A', day: 'Friday', period: 'Period 7 (14:00-15:00)', teacherId: 104, subject: 'Environmental Day', activityType: 'environmental' as const, room: 'School Grounds' },
  { id: 220, className: 'Form 1', stream: 'STREAM B', day: 'Friday', period: 'Period 7 (14:00-15:00)', teacherId: 102, subject: 'Debates', activityType: 'debates' as const, room: 'Main Hall' },

  // Form 2 STREAM A
  { id: 215, className: 'Form 2', stream: 'STREAM A', day: 'Monday', period: 'Period 1 (08:00-08:40)', teacherId: 103, subject: 'Chemistry' },
  { id: 216, className: 'Form 2', stream: 'STREAM A', day: 'Monday', period: 'Period 2 (08:40-09:20)', teacherId: 104, subject: 'History' },
  { id: 217, className: 'Form 2', stream: 'STREAM A', day: 'Wednesday', period: 'Period 7 (14:00-15:30)', teacherId: 108, subject: 'Sports and Games', activityType: 'sports' as const },
  { id: 218, className: 'Form 2', stream: 'STREAM A', day: 'Friday', period: 'Period 7 (14:00-15:00)', teacherId: 104, subject: 'Environmental Day', activityType: 'environmental' as const },
  { id: 221, className: 'Form 2', stream: 'STREAM A', day: 'Friday', period: 'Period 5 (11:20-12:00)', subject: 'Religion', activityType: 'religion' as const, room: 'School Hall' },
  { id: 222, className: 'Form 1', stream: 'STREAM A', day: 'Friday', period: 'Period 6 (12:00-12:40)', teacherId: 101, subject: 'Weekly Test', activityType: 'weekly_test' as const, room: 'Exam Hall / Class 1A', customNote: 'Weekly evaluation test' }
];

export const INITIAL_STUDENTS = [
  {
    id: 1,
    regNo: 'S0001',
    name: 'Amina Selemani Juma',
    gender: 'Female' as const,
    className: 'Form 1',
    level: 'CSEE' as const,
    stream: 'STREAM A',
    dob: '2010-04-12',
    subjects: ['English Language', 'Kiswahili', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geography'],
    marks: {
      'English Language': 82,
      'Kiswahili': 88,
      'Mathematics': 76,
      'Physics': 72,
      'Chemistry': 79,
      'Biology': 85,
      'Literature in English': 74,
      'Elimu ya Dini ya Kiislamu': 90
    },
    total: 646,
    average: '80.8',
    division: 'I'
  },
  {
    id: 2,
    regNo: 'S0002',
    name: 'Kelvin Godfrey Mrema',
    gender: 'Male' as const,
    className: 'Form 1',
    level: 'CSEE' as const,
    stream: 'STREAM A',
    dob: '2010-08-25',
    subjects: ['English Language', 'Kiswahili', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Civics'],
    marks: {
      'English Language': 74,
      'Kiswahili': 80,
      'Mathematics': 86,
      'Physics': 82,
      'Chemistry': 84,
      'Biology': 78,
      'Literature in English': 70,
      'Elimu ya Dini ya Kiislamu': 75
    },
    total: 629,
    average: '78.6',
    division: 'I'
  },
  {
    id: 3,
    regNo: 'S0003',
    name: 'Zuhura Bakari Mwamba',
    gender: 'Female' as const,
    className: 'Form 2',
    level: 'CSEE' as const,
    stream: 'STREAM B',
    dob: '2009-02-18',
    subjects: ['English Language', 'Kiswahili', 'Mathematics', 'Geography', 'History', 'Civics'],
    marks: {
      'English Language': 68,
      'Kiswahili': 75,
      'Mathematics': 62,
      'Physics': 58,
      'Chemistry': 64,
      'Biology': 66,
      'Literature in English': 70,
      'Elimu ya Dini ya Kiislamu': 80
    },
    total: 543,
    average: '67.9',
    division: 'II'
  },
  {
    id: 4,
    regNo: 'S0004',
    name: 'Brian Josephat Shayo',
    gender: 'Male' as const,
    className: 'Form 1',
    level: 'CSEE' as const,
    stream: 'STREAM A',
    dob: '2010-06-14',
    subjects: ['English Language', 'Kiswahili', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geography'],
    marks: {
      'English Language': 86,
      'Kiswahili': 84,
      'Mathematics': 92,
      'Physics': 88,
      'Chemistry': 85,
      'Biology': 89,
      'Literature in English': 80,
      'Elimu ya Dini ya Kiislamu': 82
    },
    total: 686,
    average: '85.8',
    division: 'I'
  },
  {
    id: 5,
    regNo: 'S0005',
    name: 'Daniel Peter Mollel',
    gender: 'Male' as const,
    className: 'Form 1',
    level: 'CSEE' as const,
    stream: 'STREAM A',
    dob: '2010-11-03',
    subjects: ['English Language', 'Kiswahili', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Geography'],
    marks: {
      'English Language': 54,
      'Kiswahili': 62,
      'Mathematics': 48,
      'Physics': 50,
      'Chemistry': 52,
      'Biology': 56,
      'Literature in English': 49,
      'Elimu ya Dini ya Kiislamu': 58
    },
    total: 429,
    average: '53.6',
    division: 'III'
  },
  {
    id: 6,
    regNo: 'S0006',
    name: 'Mariam Hashim Msangi',
    gender: 'Female' as const,
    className: 'Form 1',
    level: 'CSEE' as const,
    stream: 'STREAM A',
    dob: '2010-09-17',
    subjects: ['English Language', 'Kiswahili', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Civics'],
    marks: {
      'English Language': 45,
      'Kiswahili': 48,
      'Mathematics': 38,
      'Physics': 40,
      'Chemistry': 42,
      'Biology': 44,
      'Literature in English': 42,
      'Elimu ya Dini ya Kiislamu': 50
    },
    total: 349,
    average: '43.6',
    division: 'IV'
  }
];

export const INITIAL_EXAMS = [
  { id: 1, name: 'Midterm I', type: 'Midterm I', level: 'CSEE' as const, className: 'All', date: '2026-03-15', status: 'Active' as const },
  { id: 2, name: 'Terminal', type: 'Terminal', level: 'CSEE' as const, className: 'All', date: '2026-06-20', status: 'Active' as const },
  { id: 3, name: 'Annual', type: 'Annual', level: 'CSEE' as const, className: 'All', date: '2026-11-15', status: 'Active' as const }
];

export const INITIAL_SESSIONS = [
  {
    id: 1,
    rawDate: '2026-10-15',
    date: '15 Oct 2026',
    day: 'Thursday',
    session: 'SESSION I',
    start: '08:00',
    end: '10:30',
    time: '08:00-10:30',
    subject: 'Mathematics',
    level: 'CSEE' as const,
    className: 'FORM ONE',
    stream: 'STREAM A',
    rooms: 3
  },
  {
    id: 2,
    rawDate: '2026-10-15',
    date: '15 Oct 2026',
    day: 'Thursday',
    session: 'SESSION II',
    start: '13:00',
    end: '15:30',
    time: '13:00-15:30',
    subject: 'English Language',
    level: 'CSEE' as const,
    className: 'FORM ONE',
    stream: 'STREAM B',
    rooms: 3
  },
  {
    id: 3,
    rawDate: '2026-10-16',
    date: '16 Oct 2026',
    day: 'Friday',
    session: 'SESSION I',
    start: '08:00',
    end: '11:00',
    time: '08:00-11:00',
    subject: 'Physics',
    level: 'CSEE' as const,
    className: 'FORM TWO',
    stream: 'STREAM A',
    rooms: 4
  }
];

export const INITIAL_SUPERVISORS = [
  { id: 1, teacherId: 101, name: 'Adelmarcy Mallya', initial: 'AM' },
  { id: 2, teacherId: 104, name: 'David Mwakipesile', initial: 'DM' }
];

export const DEFAULT_APP_DATA: AppData = {
  users: INITIAL_USERS,
  students: INITIAL_STUDENTS,
  teachers: INITIAL_TEACHERS,
  exams: INITIAL_EXAMS,
  periodSettings: INITIAL_PERIOD_SETTINGS,
  streamSettings: INITIAL_STREAM_SETTINGS,
  timetableAssignments: INITIAL_TIMETABLE_ASSIGNMENTS,
  sessions: INITIAL_SESSIONS,
  supervisors: INITIAL_SUPERVISORS,
  resultsStatus: 'active',
  selectedInvigilators: [101, 102, 103, 104, 105, 106, 107, 108],
  invigilationAssignments: {},
  timetableReleased: true,
  classTimetableReleased: {
    'Form 1': true,
    'Form 2': true,
    'Form 3': true,
    'Form 4': true,
    'Form 5': true,
    'Form 6': true
  },
  schoolInfo: {
    name: 'KIOMONI SECONDARY SCHOOL',
    schoolNumber: 'S.0123',
    address: 'P.O. Box 1234, Tanga, Tanzania',
    phone: '+255 754 000 111',
    email: 'info@kiomonisec.ac.tz',
    motto: 'Education for Development & Integrity',
    principal: 'Dr. H. Akida'
  },
  activityLogs: [
    {
      id: 'log_init_1',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      userId: 'usr_head',
      userName: 'Dr. Habibu Akida',
      userEmail: 'habibuakida@gmail.com',
      userRole: 'HEADMASTER',
      action: 'SYSTEM_RESET',
      category: 'settings',
      title: 'Academic Database Initialized',
      description: 'Initialized standard curriculum, official Tanzanian subject structures, and term timetable settings.'
    },
    {
      id: 'log_init_2',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      userId: 'usr_academic',
      userName: 'David Mwakipesile',
      userEmail: 'academic@school.edu',
      userRole: 'ACADEMIC',
      action: 'TIMETABLE_UPDATE',
      category: 'timetable',
      title: 'Form 1-4 Schedules Published',
      description: 'Completed teaching schedule allocations and assigned staff invigilation periods for term.'
    }
  ],
  disciplineRecords: [
    {
      id: 'disc_1',
      studentId: 1,
      studentName: 'Amina Juma Mohamed',
      regNo: 'S0001',
      className: 'Form 1',
      date: '2026-02-10',
      category: 'Merit',
      title: 'Academic Excellence & Leadership',
      description: 'Demonstrated outstanding peer tutoring and exemplary conduct in science club.',
      actionTaken: 'Commendation Certificate awarded by Academic Master',
      reportedBy: 'David Mwakipesile',
      status: 'Resolved'
    },
    {
      id: 'disc_2',
      studentId: 3,
      studentName: 'Kelvin Jackson Shirima',
      regNo: 'S0003',
      className: 'Form 1',
      date: '2026-02-14',
      category: 'Attendance',
      title: 'Late arrival to morning assembly',
      description: 'Arrived 25 minutes late after bell with no parent note.',
      actionTaken: 'Verbal warning and counseling with class teacher',
      reportedBy: 'Grace Mchome',
      status: 'Resolved'
    }
  ]
};
