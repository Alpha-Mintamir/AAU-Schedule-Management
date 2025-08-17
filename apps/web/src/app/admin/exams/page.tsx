"use client";

import { useEffect, useState } from "react";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Batch = { id: string; department_id: string; entry_year: number; name: string };
type Course = { id: string; code: string; title: string };
type Exam = { id: string; course_id: string; exam_date: string; starts_at: string; ends_at: string; room?: string; code?: string; title?: string };

async function toJson<T>(resPromise: Promise<Response>): Promise<T> { const res = await resPromise; if (!res.ok) throw new Error(await res.text()); return res.json(); }

export default function ExamsPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");

  const [courseId, setCourseId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [startsAt, setStartsAt] = useState("09:00");
  const [endsAt, setEndsAt] = useState("11:00");
  const [room, setRoom] = useState("Main Hall");

  useEffect(() => { toJson<{ items: College[] }>(fetch("/api/structure/colleges")).then((d) => setColleges(d.items)); }, []);
  useEffect(() => {
    if (!collegeId) return setDepartments([]);
    toJson<{ items: Department[] }>(fetch(`/api/structure/departments?collegeId=${collegeId}`)).then((d) => setDepartments(d.items));
  }, [collegeId]);
  useEffect(() => {
    if (!departmentId) { setBatches([]); setCourses([]); return; }
    toJson<{ items: Batch[] }>(fetch(`/api/structure/batches?departmentId=${departmentId}`)).then((d) => setBatches(d.items));
    toJson<{ items: Course[] }>(fetch(`/api/courses?departmentId=${departmentId}`)).then((d) => setCourses(d.items));
  }, [departmentId]);
  useEffect(() => {
    if (!batchId) return setExams([]);
    toJson<{ items: Exam[] }>(fetch(`/api/exams?batchId=${batchId}`)).then((d) => setExams(d.items));
  }, [batchId]);

  async function addExam() {
    if (!batchId || !courseId || !examDate) return;
    await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, courseId, examDate, startsAt, endsAt, room }),
    }).then(toJson);
    const d = await toJson<{ items: Exam[] }>(fetch(`/api/exams?batchId=${batchId}`));
    setExams(d.items);
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Admin: Exams</h1>
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
      </div>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Create exam</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!departmentId}>
            <option value="">Course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
          </select>
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          <input type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          <input type="time" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          <input placeholder="Room" value={room} onChange={(e) => setRoom(e.target.value)} />
          <button onClick={addExam} disabled={!courseId || !examDate}>Add</button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Exams</h2>
        <ul>
          {exams.map((e) => (
            <li key={e.id}>{e.exam_date} {e.starts_at}-{e.ends_at} {e.room} — {e.code || e.course_id} {e.title}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}


