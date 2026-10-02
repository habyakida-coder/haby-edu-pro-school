/**
 * Supabase & Firebase Firestore Unified Storage Client
 * 
 * Provides standard interface:
 * supabase.from('students').select().eq('school_id', currentSchoolId)
 * supabase.from('exam_records').select().eq('school_id', currentSchoolId)
 * supabase.from('parents').select().eq('school_id', currentSchoolId)
 * supabase.from('sms_wallet').select().eq('school_id', currentSchoolId)
 * supabase.from('sms_logs').select().eq('school_id', currentSchoolId)
 * supabase.from('users').select().eq('id', userId)
 * 
 * Backed by Firestore with full multi-tenant school_id isolation and permanent persistence.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

export interface DatabaseRecord {
  id?: string | number;
  school_id?: string;
  schoolId?: string;
  [key: string]: any;
}

class QueryBuilder {
  private collectionName: string;
  private filters: { field: string; op: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in'; value: any }[] = [];
  private isSingle = false;
  private selectedFields: string[] | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  select(fields?: string) {
    if (fields && fields !== '*') {
      this.selectedFields = fields.split(',').map(f => f.trim());
    }
    return this;
  }

  eq(field: string, value: any) {
    // Map school_id or schoolId appropriately
    this.filters.push({ field, op: '==', value });
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async then(resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (err) {
      if (reject) reject(err);
      else resolve({ data: null, error: err });
    }
  }

  async execute(): Promise<{ data: any; error: any }> {
    try {
      const colRef = collection(db, this.collectionName);
      let q = query(colRef);

      // Extract school_id filter if present for targeted logging & queries
      const schoolFilter = this.filters.find(f => f.field === 'school_id' || f.field === 'schoolId');
      if (schoolFilter) {
        console.log(`[SupabaseClient] Fetching from '${this.collectionName}' | Current school_id:`, schoolFilter.value);
      }

      // If querying sms_wallet for a school
      if (this.collectionName === 'sms_wallet' && schoolFilter) {
        const walletDocRef = doc(db, 'sms_wallet', String(schoolFilter.value));
        const walletSnap = await getDoc(walletDocRef);
        if (walletSnap.exists()) {
          const wData = { id: walletSnap.id, school_id: String(schoolFilter.value), ...walletSnap.data() };
          return { data: this.isSingle ? wData : [wData], error: null };
        } else {
          // Auto-initialize wallet with 100 free SMS credits for the school
          const initialWallet = {
            id: String(schoolFilter.value),
            school_id: String(schoolFilter.value),
            balance: 100,
            updated_at: new Date().toISOString()
          };
          await setDoc(walletDocRef, initialWallet, { merge: true });
          return { data: this.isSingle ? initialWallet : [initialWallet], error: null };
        }
      }

      // If querying users by id
      const idFilter = this.filters.find(f => f.field === 'id');
      if (idFilter && this.collectionName === 'users') {
        const docSnap = await getDoc(doc(db, 'users', String(idFilter.value)));
        if (docSnap.exists()) {
          const uData = { id: docSnap.id, ...docSnap.data() };
          return { data: this.isSingle ? uData : [uData], error: null };
        } else {
          return { data: this.isSingle ? null : [], error: null };
        }
      }

      for (const f of this.filters) {
        if (f.field === 'school_id' || f.field === 'schoolId') {
          // Handled comprehensively below
        } else {
          q = query(q, where(f.field, '==', f.value));
        }
      }

      let results: any[] = [];
      const seenIds = new Set<string>();

      if (schoolFilter) {
        const sVal = String(schoolFilter.value);

        // 1. Query top-level collection by school_id
        try {
          const q1 = query(colRef, where('school_id', '==', sVal));
          const s1 = await getDocs(q1);
          s1.forEach(d => {
            const rawId = d.data().id ? String(d.data().id) : d.id.replace(`${sVal}_`, '');
            seenIds.add(rawId);
            seenIds.add(d.id);
            results.push({ id: rawId, ...d.data(), school_id: sVal, schoolId: sVal });
          });
        } catch (e) {}

        // 2. Query top-level collection by schoolId
        try {
          const q2 = query(colRef, where('schoolId', '==', sVal));
          const s2 = await getDocs(q2);
          s2.forEach(d => {
            const rawId = d.data().id ? String(d.data().id) : d.id.replace(`${sVal}_`, '');
            if (!seenIds.has(rawId) && !seenIds.has(d.id)) {
              seenIds.add(rawId);
              seenIds.add(d.id);
              results.push({ id: rawId, ...d.data(), school_id: sVal, schoolId: sVal });
            }
          });
        } catch (e) {}

        // 3. Query subcollection under schools/{schoolId}/{collectionName}
        const subColName = this.collectionName === 'exam_records' ? 'examinationRecords' : this.collectionName;
        try {
          const subColRef = collection(db, 'schools', sVal, subColName);
          const subSnap = await getDocs(subColRef);
          subSnap.forEach(d => {
            const rawId = d.data().id ? String(d.data().id) : d.id;
            if (!seenIds.has(rawId) && !seenIds.has(`${sVal}_${rawId}`)) {
              seenIds.add(rawId);
              results.push({ id: rawId, ...d.data(), school_id: sVal, schoolId: sVal });
            }
          });
        } catch (e) {}

        // 4. Query master schoolData document as ultimate fallback if still empty
        if (results.length === 0) {
          try {
            const sDoc = await getDoc(doc(db, 'schoolData', sVal));
            if (sDoc.exists()) {
              const sData = sDoc.data();
              if (this.collectionName === 'students' && Array.isArray(sData.students)) {
                results = sData.students.map((st: any) => ({ ...st, school_id: sVal, schoolId: sVal }));
              } else if (this.collectionName === 'exam_records' && Array.isArray(sData.examinationRecords)) {
                results = sData.examinationRecords.map((r: any) => ({ ...r, school_id: sVal, schoolId: sVal }));
              } else if (this.collectionName === 'parents' && Array.isArray(sData.parents)) {
                results = sData.parents.map((p: any) => ({ ...p, school_id: sVal, schoolId: sVal }));
              } else if (this.collectionName === 'teachers' && Array.isArray(sData.teachers)) {
                results = sData.teachers.map((t: any) => ({ ...t, school_id: sVal, schoolId: sVal }));
              }
            }
          } catch (e) {}
        }
      } else {
        const snap = await getDocs(q);
        snap.forEach(d => {
          results.push({ id: d.id, ...d.data() });
        });
      }

      // If single requested
      if (this.isSingle) {
        return { data: results.length > 0 ? results[0] : null, error: null };
      }

      return { data: results, error: null };
    } catch (error: any) {
      console.error(`[SupabaseClient] Error fetching from ${this.collectionName}:`, error);
      return { data: null, error };
    }
  }

  async insert(recordOrRecords: DatabaseRecord | DatabaseRecord[]) {
    try {
      const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
      const inserted: any[] = [];

      for (const rec of records) {
       const schoolId = rec.school_id || rec.schoolId || (typeof window !== 'undefined' ? (localStorage.getItem('currentSchoolId') || localStorage.getItem('school_id') || localStorage.getItem('schoolId') || sessionStorage.getItem('currentSchoolId') || sessionStorage.getItem('school_id') || '') : '');
        console.log(`[SupabaseClient] Saving to '${this.collectionName}' | Current school_id:`, schoolId);

        const recId = rec.id ? String(rec.id) : (this.collectionName === 'sms_wallet' ? schoolId : `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
        const payload: DatabaseRecord = {
          ...rec,
          id: recId,
          school_id: schoolId,
          schoolId: schoolId,
          updated_at: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // If sms_wallet, save directly to sms_wallet/{schoolId}
        if (this.collectionName === 'sms_wallet') {
          await setDoc(doc(db, 'sms_wallet', schoolId), payload, { merge: true });
        } else {
          // 1. Write to top-level collection e.g. /students/{id} or /{schoolId}_{id}
          const topDocId = `${schoolId}_${recId}`;
          await setDoc(doc(db, this.collectionName, topDocId), payload, { merge: true });

          // 2. Also mirror into subcollection schools/{schoolId}/{collectionName}/{recId} for dual-layer durability
          const subColName = this.collectionName === 'exam_records' ? 'examinationRecords' : this.collectionName;
          await setDoc(doc(db, 'schools', schoolId, subColName, recId), payload, { merge: true });
        }

        inserted.push(payload);
      }

      const resultObj = { data: Array.isArray(recordOrRecords) ? inserted : inserted[0], error: null };
      return {
        ...resultObj,
        select: () => Promise.resolve(resultObj),
        then: (resolve: (val: any) => void, reject?: (reason: any) => void) => Promise.resolve(resultObj).then(resolve, reject)
      };
    } catch (error: any) {
      console.error(`[SupabaseClient] Insert error in ${this.collectionName}:`, error);
      const errObj = { data: null, error };
      return {
        ...errObj,
        select: () => Promise.resolve(errObj),
        then: (resolve: (val: any) => void, reject?: (reason: any) => void) => Promise.resolve(errObj).then(resolve, reject)
      };
    }
  }

  update(updates: DatabaseRecord) {
    const executeUpdate = async (overrideField?: string, overrideVal?: any): Promise<{ data: any; error: any }> => {
      try {
        if (overrideField && overrideVal !== undefined) {
          this.filters.push({ field: overrideField, op: '==', value: overrideVal });
        }
        const schoolFilter = this.filters.find(f => f.field === 'school_id' || f.field === 'schoolId');
        const idFilter = this.filters.find(f => f.field === 'id');

        const id = idFilter ? String(idFilter.value) : (updates.id ? String(updates.id) : null);
        const schoolId = schoolFilter 
          ? String(schoolFilter.value) 
          : (updates.school_id || updates.schoolId || (typeof window !== 'undefined' ? sessionStorage.getItem('haby_school_id') : null) || 'DEMO_SCHOOL');

        if (id) {
          console.log(`[SupabaseClient] Updating in '${this.collectionName}' (ID: ${id}) | Current school_id:`, schoolId);

          const payload: DatabaseRecord = {
            ...updates,
            id,
            school_id: schoolId,
            schoolId: schoolId,
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Top level
          await setDoc(doc(db, this.collectionName, `${schoolId}_${id}`), payload, { merge: true });
          // Subcollection
          const subColName = this.collectionName === 'exam_records' ? 'examinationRecords' : this.collectionName;
          await setDoc(doc(db, 'schools', schoolId, subColName, id), payload, { merge: true });

          const res = { data: payload, error: null };
          return res;
        }

        return { data: null, error: new Error('ID filter required for update') };
      } catch (error: any) {
        console.error(`[SupabaseClient] Update error in ${this.collectionName}:`, error);
        return { data: null, error };
      }
    };

    return {
      eq: (field: string, value: any) => {
        return executeUpdate(field, value);
      },
      match: (criteria: Record<string, any>) => {
        const idVal = criteria.id;
        const schoolVal = criteria.school_id || criteria.schoolId;
        if (schoolVal) this.filters.push({ field: 'school_id', op: '==', value: schoolVal });
        return executeUpdate('id', idVal);
      },
      select: () => executeUpdate(),
      then: (resolve: (value: { data: any; error: any }) => void, reject?: (reason: any) => void) => {
        return executeUpdate().then(resolve, reject);
      }
    };
  }

  delete() {
    const executeDelete = async (overrideField?: string, overrideVal?: any): Promise<{ data: boolean | null; error: any }> => {
      try {
        if (overrideField && overrideVal !== undefined) {
          this.filters.push({ field: overrideField, op: '==', value: overrideVal });
        }
        const schoolFilter = this.filters.find(f => f.field === 'school_id' || f.field === 'schoolId');
        const idFilter = this.filters.find(f => f.field === 'id');

        if (idFilter) {
          const id = String(idFilter.value);
          const schoolId = schoolFilter 
            ? String(schoolFilter.value) 
            : (typeof window !== 'undefined' ? sessionStorage.getItem('haby_school_id') : null) || 'DEMO_SCHOOL';
          console.log(`[SupabaseClient] Deleting from '${this.collectionName}' (ID: ${id}) | Current school_id:`, schoolId);

          await deleteDoc(doc(db, this.collectionName, `${schoolId}_${id}`));
          const subColName = this.collectionName === 'exam_records' ? 'examinationRecords' : this.collectionName;
          await deleteDoc(doc(db, 'schools', schoolId, subColName, id));

          return { data: true, error: null };
        }

        return { data: null, error: new Error('ID filter required for delete') };
      } catch (error: any) {
        console.error(`[SupabaseClient] Delete error in ${this.collectionName}:`, error);
        return { data: null, error };
      }
    };

    return {
      eq: (field: string, value: any) => {
        return executeDelete(field, value);
      },
      match: (criteria: Record<string, any>) => {
        const idVal = criteria.id;
        const schoolVal = criteria.school_id || criteria.schoolId;
        if (schoolVal) this.filters.push({ field: 'school_id', op: '==', value: schoolVal });
        return executeDelete('id', idVal);
      },
      then: (resolve: (value: { data: boolean | null; error: any }) => void, reject?: (reason: any) => void) => {
        return executeDelete().then(resolve, reject);
      }
    };
  }
}

export const supabase = {
  from(tableName: string) {
    return new QueryBuilder(tableName);
  },
  auth: {
    get user() {
      const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('haby_demo_user') : null;
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {}
      }
      const schoolId = typeof window !== 'undefined' ? (sessionStorage.getItem('haby_school_id') || localStorage.getItem('haby_school_id')) : null;
      return schoolId ? { school_id: schoolId, schoolId } : null;
    },
    getUser: async () => {
      const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('haby_demo_user') : null;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return { data: { user }, error: null };
        } catch {}
      }
      const schoolId = typeof window !== 'undefined' ? (sessionStorage.getItem('haby_school_id') || localStorage.getItem('haby_school_id')) : null;
      return { data: { user: schoolId ? { school_id: schoolId, schoolId } : null }, error: null };
    },
    getSession: async () => {
      const userStr = typeof window !== 'undefined' ? sessionStorage.getItem('haby_demo_user') : null;
      const schoolId = typeof window !== 'undefined' ? (sessionStorage.getItem('haby_school_id') || localStorage.getItem('haby_school_id')) : null;
      return { data: { session: { school_id: schoolId, user: userStr ? JSON.parse(userStr) : null } }, error: null };
    }
  }
};

export default supabase;
