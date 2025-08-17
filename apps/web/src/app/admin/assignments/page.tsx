"use client";

import { useEffect, useMemo, useState } from "react";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Batch = { id: string; department_id: string; entry_year: number; name: string };
type Course = { id: string; code: string; title: string };
type Instructor = { id: string; user_id: string; full_name?: string; email?: string };
type Assignment = { id: string; batch_id: string; course_id: string; instructor_id: string; code?: string; title?: string };

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AssignmentsPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [instructorId, setInstructorId] = useState("");

  useEffect(() => {
    toJson<{ items: College[] }>(fetch("/api/structure/colleges")).then((d) => setColleges(d.items));
    toJson<{ items: Instructor[] }>(fetch("/api/instructors")).then((d) => setInstructors(d.items));
  }, []);

  useEffect(() => {
    if (!collegeId) return setDepartments([]);
    toJson<{ items: Department[] }>(fetch(`/api/structure/departments?collegeId=${collegeId}`)).then((d) =>
      setDepartments(d.items)
    );
  }, [collegeId]);

  useEffect(() => {
    if (!departmentId) {
      setBatches([]);
      setCourses([]);
      return;
    }
    toJson<{ items: Batch[] }>(fetch(`/api/structure/batches?departmentId=${departmentId}`)).then((d) => setBatches(d.items));
    toJson<{ items: Course[] }>(fetch(`/api/courses?departmentId=${departmentId}`)).then((d) => setCourses(d.items));
  }, [departmentId]);

  useEffect(() => {
    if (!batchId) return setAssignments([]);
    toJson<{ items: Assignment[] }>(fetch(`/api/course-assignments?batchId=${batchId}`)).then((d) => setAssignments(d.items));
  }, [batchId]);

  async function addAssignment() {
    if (!batchId || !courseId || !instructorId) return;
    await fetch("/api/course-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, courseId, instructorId }),
    }).then(toJson);
    const d = await toJson<{ items: Assignment[] }>(fetch(`/api/course-assignments?batchId=${batchId}`));
    setAssignments(d.items);
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Admin: Course Assignments</h1>

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
        <h2>Create Assignment</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!departmentId}>
            <option value="">Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
          <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
            <option value="">Instructor</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.full_name || i.email}
              </option>
            ))}
          </select>
          <button onClick={addAssignment} disabled={!batchId || !courseId || !instructorId}>
            Assign
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Assignments</h2>
        <ul>
          {assignments.map((a) => (
            <li key={a.id}>
              {courses.find((c) => c.id === a.course_id)?.code} — {courses.find((c) => c.id === a.course_id)?.title} → {instructors.find((i) => i.id === a.instructor_id)?.full_name || instructors.find((i) => i.id === a.instructor_id)?.email}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}


