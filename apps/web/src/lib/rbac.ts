import { getPool } from '@/lib/pg';
import { supabaseAdmin } from '@/lib/supabase';

export type UserRole =
  | 'UNIVERSITY_ADMIN'
  | 'COLLEGE_ADMIN'
  | 'DEPARTMENT_ADMIN'
  | 'BATCH_ADMIN'
  | 'SECTION_REP';

export async function hasRole(userId: string, role: UserRole, scopeId?: string): Promise<boolean> {
  if (supabaseAdmin) {
    const q = supabaseAdmin
      .from('user_role_membership')
      .select('user_id')
      .eq('user_id', userId)
      .eq('role', role)
      .limit(1);
    const { data, error } = scopeId ? await q.eq('scope_id', scopeId) : await q.is('scope_id', null);
    if (error) return false;
    return (data || []).length > 0;
  }
  const pool = getPool();
  const { rows } = await pool.query(
    'select 1 from user_role_membership where user_id=$1 and role=$2 and coalesce(scope_id::text, \'\') = coalesce($3::text, \'\') limit 1',
    [userId, role, scopeId ?? null]
  );
  return rows.length > 0;
}

export async function requireUniversityAdmin(userId: string) {
  const ok = await hasRole(userId, 'UNIVERSITY_ADMIN');
  if (!ok) throw new Error('forbidden');
}

export async function requireCollegeAdmin(userId: string, collegeId: string) {
  const ok = (await hasRole(userId, 'UNIVERSITY_ADMIN')) || (await hasRole(userId, 'COLLEGE_ADMIN', collegeId));
  if (!ok) throw new Error('forbidden');
}

export async function requireDepartmentAdmin(userId: string, departmentId: string) {
  const ok = (await hasRole(userId, 'UNIVERSITY_ADMIN')) || (await hasRole(userId, 'DEPARTMENT_ADMIN', departmentId));
  if (!ok) throw new Error('forbidden');
}

export async function requireBatchAdmin(userId: string, batchId: string) {
  const ok = (await hasRole(userId, 'UNIVERSITY_ADMIN')) || (await hasRole(userId, 'BATCH_ADMIN', batchId));
  if (!ok) throw new Error('forbidden');
}

export async function requireSectionRepOrBatchAdmin(userId: string, sectionId: string, batchId: string) {
  const ok =
    (await hasRole(userId, 'UNIVERSITY_ADMIN')) ||
    (await hasRole(userId, 'SECTION_REP', sectionId)) ||
    (await hasRole(userId, 'BATCH_ADMIN', batchId));
  if (!ok) throw new Error('forbidden');
}


