"use client";

import { useEffect, useState } from 'react';

type Item = { id: string; starts_at: string; ends_at: string; room?: string; course_code?: string; course_title?: string };

async function toJson<T>(p: Promise<Response>): Promise<T> { const r = await p; if (!r.ok) throw new Error(await r.text()); return r.json(); }

export default function TeachingTodayPage() {
  const [instructorId, setInstructorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    if (!instructorId) return setItems([]);
    try {
      const data = await toJson<{ items: Item[] }>(fetch(`/api/instructor/teaching-today?instructorId=${instructorId}&date=${date}`));
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    }
  }

  useEffect(() => { /* optionally auto-load if instructorId in query later */ }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Instructor: Teaching Today</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="Instructor ID" value={instructorId} onChange={(e) => setInstructorId(e.target.value)} style={{ width: 380 }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={load} disabled={!instructorId}>Load</button>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            {it.starts_at}-{it.ends_at} {it.room} — {it.course_code} {it.course_title}
          </li>
        ))}
      </ul>
    </main>
  );
}


