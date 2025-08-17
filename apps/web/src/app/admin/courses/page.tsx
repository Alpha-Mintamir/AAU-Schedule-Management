"use client";

import { useEffect, useState } from "react";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Course = { id: string; department_id: string; code: string; title: string; credit_hours: number };

async function toJson<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function CoursesPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [code, setCode] = useState("CS101");
  const [title, setTitle] = useState("Intro to CS");
  const [creditHours, setCreditHours] = useState(3);

  useEffect(() => {
    toJson<{ items: College[] }>(fetch("/api/structure/colleges")).then((d) => setColleges(d.items));
  }, []);

  useEffect(() => {
    if (!collegeId) {
      setDepartments([]);
      setDepartmentId("");
      return;
    }
    toJson<{ items: Department[] }>(fetch(`/api/structure/departments?collegeId=${collegeId}`)).then((d) =>
      setDepartments(d.items)
    );
  }, [collegeId]);

  useEffect(() => {
    if (!departmentId) {
      setCourses([]);
      return;
    }
    toJson<{ items: Course[] }>(fetch(`/api/courses?departmentId=${departmentId}`)).then((d) => setCourses(d.items));
  }, [departmentId]);

  async function addCourse() {
    if (!departmentId || !code.trim() || !title.trim()) return;
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId, code: code.trim(), title: title.trim(), creditHours }),
    }).then(toJson);
    const d = await toJson<{ items: Course[] }>(fetch(`/api/courses?departmentId=${departmentId}`));
    setCourses(d.items);
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Admin: Courses</h1>

      <div style={{ display: "flex", gap: 12 }}>
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
      </div>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Create Course</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: 240 }} />
          <input
            placeholder="Credits"
            type="number"
            value={creditHours}
            onChange={(e) => setCreditHours(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <button onClick={addCourse} disabled={!departmentId}>
            Add
          </button>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Courses</h2>
        <ul>
          {courses.map((c) => (
            <li key={c.id}>
              {c.code} — {c.title} ({c.credit_hours})
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}


