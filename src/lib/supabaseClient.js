// Re-export supabase client and helpers for JS compatibility
export { 
  supabase, 
  default, 
  getCurrentSchoolId,
  isConfiguredWithRealSupabase,
  getAll, 
  insertRecord, 
  updateRecord, 
  deleteRecord, 
  createClient 
} from './supabaseClient.ts';
