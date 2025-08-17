"use client";

import { useEffect, useState } from 'react';

type User = { id: string; email: string; full_name: string };
type College = { id: string; name: string };
type Department = { id: string; name: string; college_id: string };
type Batch = { id: string; name: string; department_id: string };

// Placeholder UI for assigning admins & reps. Backed by server endpoints to be added.
export default function RolesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('COLLEGE_ADMIN');
  const [scopeId, setScopeId] = useState('');

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then((d) => setUsers(d.items || []));
    fetch('/api/structure/colleges').then((r) => r.json()).then((d) => setColleges(d.items || []));
  }, []);

  useEffect(() => {
    if (!scopeId || role !== 'DEPARTMENT_ADMIN' && role !== 'BATCH_ADMIN') return;
    // Keep dependent lists handy
  }, [scopeId, role]);

  async function assign() {
    const payload: any = { userId: selectedUserId, role };
    if (role !== 'UNIVERSITY_ADMIN') payload.scopeId = scopeId;
    await fetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    alert('Role assigned');
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 24 }}>
      <h1>Admin: Role Assignments</h1>
      <div style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.full_name || u.email} — {u.email}</option>
          ))}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="UNIVERSITY_ADMIN">UNIVERSITY_ADMIN</option>
          <option value="COLLEGE_ADMIN">COLLEGE_ADMIN</option>
          <option value="DEPARTMENT_ADMIN">DEPARTMENT_ADMIN</option>
          <option value="BATCH_ADMIN">BATCH_ADMIN</option>
          <option value="SECTION_REP">SECTION_REP</option>
        </select>
        {/* Scope selector: reuse existing structure lists */}
        {role !== 'UNIVERSITY_ADMIN' && (
          <>
            <label>Scope ID (College/Department/Batch/Section)</label>
            <input placeholder="Scope UUID" value={scopeId} onChange={(e) => setScopeId(e.target.value)} />
          </>
        )}
        <button onClick={assign} disabled={!selectedUserId}>Assign</button>
      </div>
    </main>
  );
}


