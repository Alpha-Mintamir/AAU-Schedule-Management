"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import styles from "@/components/admin.module.css";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Course = { id: string; department_id: string; code: string; title: string; credit_hours: number };

async function toJson<T>(res: Response | Promise<Response>): Promise<T> {
  const resolved = await res;
  if (!resolved.ok) throw new Error(await resolved.text());
  return resolved.json();
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
    toJson<{ items: Course[] }>(fetch(`/api/courses?departmentId=${departmentId}`)).then((d) =>
      setCourses(d.items)
    );
  }, [departmentId]);

  async function addCourse() {
    if (!departmentId || !code.trim() || !title.trim()) return;
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departmentId,
        code: code.trim(),
        title: title.trim(),
        creditHours,
      }),
    }).then(toJson);
    const d = await toJson<{ items: Course[] }>(fetch(`/api/courses?departmentId=${departmentId}`));
    setCourses(d.items);
  }

  return (
    <AdminShell
      title="Courses"
      description="Create and browse courses by college and department."
    >
      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Filters</h2>
            <span>Pick a department first</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.filters}>
              <div className={styles.field}>
                <label htmlFor="college">College</label>
                <select
                  id="college"
                  className={styles.select}
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                >
                  <option value="">Select college</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  className={styles.select}
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={!collegeId}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Create course</h2>
            <span>Code, title, credits</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ width: 120 }}
              />
              <input
                className={styles.input}
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <input
                className={styles.input}
                placeholder="Credits"
                type="number"
                value={creditHours}
                onChange={(e) => setCreditHours(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <button
                className={styles.button}
                onClick={addCourse}
                disabled={!departmentId}
                type="button"
              >
                Add course
              </button>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Course list</h2>
            <span>{courses.length} shown</span>
          </div>
          <div className={styles.cardBody}>
            {!departmentId ? (
              <p className={styles.empty}>Select a department to see its courses.</p>
            ) : courses.length === 0 ? (
              <p className={styles.empty}>No courses in this department yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td className={styles.code}>{c.code}</td>
                      <td>{c.title}</td>
                      <td>{c.credit_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
