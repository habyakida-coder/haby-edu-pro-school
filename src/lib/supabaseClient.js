// Re-export supabase client and helpers for JS compatibility
export { 
  supabase, 
  default, 
  getCurrentSchoolId,
  isConfiguredWithRealSupabase,
  checkSupabaseHealth,
  toSupabaseStudent,
  fromSupabaseStudent,
  toSupabaseTeacher,
  fromSupabaseTeacher,
  toSupabaseExam,
  fromSupabaseExam,
  getAll, 
  insertRecord, 
  updateRecord, 
  deleteRecord, 
  createClient,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
  DEFAULT_PRIMARY_SCHOOL_ID
} from './supabaseClient.ts';
