"use client";

import { useEffect, useState } from "react";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Batch = { id: string; department_id: string; entry_year: number; name: string };
type Assignment = { id: string; course_id: string; instructor_id: string; code?: string; title?: string };
type Meeting = { id: string; weekday: number; starts_at: string; ends_at: string; room?: string; course_assignment_id: string; course_code?: string; course_title?: string; instructor_name?: string };

async function toJson<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function SchedulePage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [weekday, setWeekday] = useState<number>(1);
  const [startsAt, setStartsAt] = useState("09:00");
  const [endsAt, setEndsAt] = useState("10:30");
  const [room, setRoom] = useState("R101");

  useEffect(() => {
    toJson<{ items: College[] }>(fetch("/api/structure/colleges")).then((d) => setColleges(d.items));
  }, []);

  useEffect(() => {
    if (!collegeId) return setDepartments([]);
    toJson<{ items: Department[] }>(fetch(`/api/structure/departments?collegeId=${collegeId}`)).then((d) =>
      setDepartments(d.items)
    );
  }, [collegeId]);

  useEffect(() => {
    if (!departmentId) return setBatches([]);
    toJson<{ items: Batch[] }>(fetch(`/api/structure/batches?departmentId=${departmentId}`)).then((d) => setBatches(d.items));
  }, [departmentId]);

  useEffect(() => {
    if (!batchId) {
      setAssignments([]);
      setMeetings([]);
      return;
    }
    toJson<{ items: Assignment[] }>(fetch(`/api/course-assignments?batchId=${batchId}`)).then((d) => setAssignments(d.items));
    toJson<{ items: Meeting[] }>(fetch(`/api/schedule/base?batchId=${batchId}`)).then((d) => setMeetings(d.items));
  }, [batchId]);

  async function addMeeting() {
    if (!assignmentId) return;
    await fetch("/api/schedule/base", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": "f2a68b15-0000-4000-8000-000000000001" },
      body: JSON.stringify({ courseAssignmentId: assignmentId, weekday, startsAt, endsAt, room }),
    }).then(toJson);
    const d = await toJson<{ items: Meeting[] }>(fetch(`/api/schedule/base?batchId=${batchId}`));
    setMeetings(d.items);
  }

  function weekdayLabel(n: number) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][n] || `${n}`;
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Admin: Schedule (Base)</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
          <option value="">Select college</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!collegeId}>
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)} disabled={!departmentId}>
          <option value="">Select batch</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.entry_year})
            </option>
          ))}
        </select>
      </div>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Add class meeting</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)} disabled={!batchId}>
            <option value="">Course assignment</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.title}
              </option>
            ))}
          </select>
          <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {weekdayLabel(n)}
              </option>
            ))}
          </select>
          <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="time" />
          <input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} type="time" />
          <input placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
          <button onClick={addMeeting} disabled={!assignmentId}>Add</button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Meetings</h2>
        <ul>
          {meetings.map((m) => (
            <li key={m.id}>
              {weekdayLabel(m.weekday)} {m.starts_at}-{m.ends_at} {m.room} — {m.course_code} {m.course_title} ({m.instructor_name})
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}


