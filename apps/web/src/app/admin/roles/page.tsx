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

  useEffect(() => {
    // For dev: list from app_user via API (to be implemented) or use Supabase directly later
    fetch('/api/structure/colleges').then((r) => r.json()).then((d) => setColleges(d.items || []));
  }, []);

  return (
    <main style={{ padding: 24, display: 'grid', gap: 24 }}>
      <h1>Admin: Role Assignments</h1>
      <p>Coming soon: assign College/Department/Batch admins and Section Representatives with scope-aware RBAC.</p>
      <ul>
        {colleges.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </main>
  );
}


