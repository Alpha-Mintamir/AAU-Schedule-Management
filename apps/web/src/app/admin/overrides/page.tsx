"use client";

import { useEffect, useState } from "react";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Batch = { id: string; department_id: string; entry_year: number; name: string };
type Section = { id: string; batch_id: string; name: string };
type Meeting = { id: string; weekday: number; starts_at: string; ends_at: string; room?: string; course_assignment_id: string; course_code?: string; course_title?: string; instructor_name?: string };

async function toJson<T>(res: Response): Promise<T> { if (!res.ok) throw new Error(await res.text()); return res.json(); }

export default function OverridesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [classMeetingId, setClassMeetingId] = useState("");
  const [action, setAction] = useState<"RESCHEDULE" | "ROOM_CHANGE" | "CANCEL">("ROOM_CHANGE");
  const [reason, setReason] = useState("Room maintenance");
  const [newRoom, setNewRoom] = useState("R202");
  const [newStartsAt, setNewStartsAt] = useState("10:00");
  const [newEndsAt, setNewEndsAt] = useState("11:30");
  const [newWeekday, setNewWeekday] = useState<number | "">("");

  useEffect(() => { toJson<{ items: College[] }>(fetch("/api/structure/colleges")).then((d) => setColleges(d.items)); }, []);

  useEffect(() => {
    if (!collegeId) return setDepartments([]);
    toJson<{ items: Department[] }>(fetch(`/api/structure/departments?collegeId=${collegeId}`)).then((d) => setDepartments(d.items));
  }, [collegeId]);

  useEffect(() => {
    if (!departmentId) return setBatches([]);
    toJson<{ items: Batch[] }>(fetch(`/api/structure/batches?departmentId=${departmentId}`)).then((d) => setBatches(d.items));
  }, [departmentId]);

  useEffect(() => {
    if (!batchId) { setSections([]); setMeetings([]); return; }
    toJson<{ items: Section[] }>(fetch(`/api/structure/sections?batchId=${batchId}`)).then((d) => setSections(d.items));
    toJson<{ items: Meeting[] }>(fetch(`/api/schedule/base?batchId=${batchId}`)).then((d) => setMeetings(d.items));
  }, [batchId]);

  async function submitOverride() {
    if (!sectionId || !classMeetingId || !reason.trim()) return;
    const payload: any = { sectionId, classMeetingId, action, reason };
    if (action === "ROOM_CHANGE") payload.newRoom = newRoom;
    if (action === "RESCHEDULE") {
      if (newWeekday !== "") payload.newWeekday = Number(newWeekday);
      payload.newStartsAt = newStartsAt; payload.newEndsAt = newEndsAt; payload.newRoom = newRoom;
    }
    await fetch("/api/schedule/override", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-actor-id": "f2a68b15-0000-4000-8000-000000000001" },
      body: JSON.stringify(payload),
    }).then(toJson);
    alert("Override submitted");
  }

  function weekdayLabel(n: number) { return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][n] || `${n}`; }

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Admin: Section Overrides</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
          <option value="">Select college</option>
          {colleges.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!collegeId}>
          <option value="">Select department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={batchId} onChange={(e) => setBatchId(e.target.value)} disabled={!departmentId}>
          <option value="">Select batch</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.entry_year})</option>)}
        </select>
        <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!batchId}>
          <option value="">Select section</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Create override</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={classMeetingId} onChange={(e) => setClassMeetingId(e.target.value)} disabled={!batchId}>
            <option value="">Class meeting</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>{weekdayLabel(m.weekday)} {m.starts_at}-{m.ends_at} {m.course_code}</option>
            ))}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value as any)}>
            <option value="ROOM_CHANGE">Room change</option>
            <option value="RESCHEDULE">Reschedule</option>
            <option value="CANCEL">Cancel</option>
          </select>
          {action !== "CANCEL" && (
            <>
              <input placeholder="Room" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} />
            </>
          )}
          {action === "RESCHEDULE" && (
            <>
              <select value={newWeekday} onChange={(e) => setNewWeekday(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">Same weekday</option>
                {[0,1,2,3,4,5,6].map((n)=> <option key={n} value={n}>{weekdayLabel(n)}</option>)}
              </select>
              <input type="time" value={newStartsAt} onChange={(e) => setNewStartsAt(e.target.value)} />
              <input type="time" value={newEndsAt} onChange={(e) => setNewEndsAt(e.target.value)} />
            </>
          )}
          <input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: 260 }} />
          <button onClick={submitOverride} disabled={!sectionId || !classMeetingId}>Submit</button>
        </div>
      </section>
    </main>
  );
}


