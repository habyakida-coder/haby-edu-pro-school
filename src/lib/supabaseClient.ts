import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase (compatible with Vite, Next.js, and Node.js)
const rawUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  '';

const rawKey = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  '';

export const isConfiguredWithRealSupabase = Boolean(
  rawUrl && 
  rawKey && 
  rawUrl.startsWith('http') && 
  !rawUrl.includes('placeholder')
);

// Fallback so createClient never throws "supabaseUrl is required" if env is not yet injected
const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseKey = rawKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJub25lIn0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
export { createClient };

// Helper ya school_id - Super Admin arudi undefined
export const getCurrentSchoolId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const role = localStorage.getItem('user_role') || sessionStorage.getItem('user_role');
  if (role === 'super_admin' || role === 'superadmin') return undefined;
  return (
    localStorage.getItem('currentSchoolId') ||
    localStorage.getItem('schoolId') ||
    sessionStorage.getItem('schoolId') ||
    sessionStorage.getItem('haby_school_id') ||
    undefined
  );
};

// Helper CRUD Functions with automatic school_id multi-tenancy
export async function getAll(table: string, schoolId?: string, isSuperAdmin: boolean = false) {
  const effectiveSchoolId = isSuperAdmin ? undefined : (schoolId || getCurrentSchoolId());
  let query = supabase.from(table).select('*');
  if (effectiveSchoolId) {
    query = query.eq('school_id', effectiveSchoolId);
  }
  return await query;
}

export async function insertRecord(table: string, data: any) {
  const schoolId = getCurrentSchoolId();
  const payload = (schoolId && !Array.isArray(data) && !data.school_id)
    ? { ...data, school_id: schoolId }
    : data;
  return await supabase.from(table).insert(payload);
}

export async function updateRecord(table: string, id: string | number, data: any) {
  return await supabase.from(table).update(data).eq('id', id);
}

export async function deleteRecord(table: string, id: string | number) {
  return await supabase.from(table).delete().eq('id', id);
}
