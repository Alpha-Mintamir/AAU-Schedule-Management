"use client";

import { useEffect, useMemo, useState } from "react";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Batch = { id: string; department_id: string; entry_year: number; name: string };
type Section = { id: string; batch_id: string; name: string };

async function json<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AdminPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [newCollegeName, setNewCollegeName] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newBatchYear, setNewBatchYear] = useState<number>(new Date().getFullYear());
  const [newBatchName, setNewBatchName] = useState("" + new Date().getFullYear());
  const [newSectionName, setNewSectionName] = useState("A");

  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  useEffect(() => {
    json<{ items: College[] }>(fetch("/api/structure/colleges")).then((d) => setColleges(d.items));
  }, []);

  useEffect(() => {
    if (!selectedCollegeId) {
      setDepartments([]);
      setSelectedDepartmentId("");
      return;
    }
    json<{ items: Department[] }>(fetch(`/api/structure/departments?collegeId=${selectedCollegeId}`)).then((d) =>
      setDepartments(d.items)
    );
  }, [selectedCollegeId]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setBatches([]);
      setSelectedBatchId("");
      return;
    }
    json<{ items: Batch[] }>(fetch(`/api/structure/batches?departmentId=${selectedDepartmentId}`)).then((d) =>
      setBatches(d.items)
    );
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (!selectedBatchId) {
      setSections([]);
      return;
    }
    json<{ items: Section[] }>(fetch(`/api/structure/sections?batchId=${selectedBatchId}`)).then((d) => setSections(d.items));
  }, [selectedBatchId]);

  async function addCollege() {
    if (!newCollegeName.trim()) return;
    await fetch("/api/structure/colleges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCollegeName.trim() }),
    }).then(json);
    setNewCollegeName("");
    const d = await json<{ items: College[] }>(fetch("/api/structure/colleges"));
    setColleges(d.items);
  }

  async function addDepartment() {
    if (!selectedCollegeId || !newDepartmentName.trim()) return;
    await fetch("/api/structure/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collegeId: selectedCollegeId, name: newDepartmentName.trim() }),
    }).then(json);
    setNewDepartmentName("");
    const d = await json<{ items: Department[] }>(
      fetch(`/api/structure/departments?collegeId=${selectedCollegeId}`)
    );
    setDepartments(d.items);
  }

  async function addBatch() {
    if (!selectedDepartmentId || !newBatchName.trim() || !newBatchYear) return;
    await fetch("/api/structure/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: selectedDepartmentId, entryYear: newBatchYear, name: newBatchName.trim() }),
    }).then(json);
    setNewBatchName("");
    const d = await json<{ items: Batch[] }>(
      fetch(`/api/structure/batches?departmentId=${selectedDepartmentId}`)
    );
    setBatches(d.items);
  }

  async function addSection() {
    if (!selectedBatchId || !newSectionName.trim()) return;
    await fetch("/api/structure/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: selectedBatchId, name: newSectionName.trim() }),
    }).then(json);
    setNewSectionName("A");
    const d = await json<{ items: Section[] }>(fetch(`/api/structure/sections?batchId=${selectedBatchId}`));
    setSections(d.items);
  }

  const selectedCollege = useMemo(() => colleges.find((c) => c.id === selectedCollegeId), [colleges, selectedCollegeId]);
  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId),
    [departments, selectedDepartmentId]
  );
  const selectedBatch = useMemo(() => batches.find((b) => b.id === selectedBatchId), [batches, selectedBatchId]);

  return (
    <main style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Admin: Structure</h1>

      <nav style={{ display: "flex", gap: 12 }}>
        <a href="/admin/courses">Courses</a>
        <a href="/admin/assignments">Assignments</a>
        <a href="/admin/schedule">Schedule</a>
        <a href="/admin/overrides">Overrides</a>
        <a href="/admin/exams">Exams</a>
      </nav>

      <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <h2>Colleges</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="New college name"
            value={newCollegeName}
            onChange={(e) => setNewCollegeName(e.target.value)}
          />
          <button onClick={addCollege}>Add</button>
        </div>
        <ul>
          {colleges.map((c) => (
            <li key={c.id}>
              <button onClick={() => setSelectedCollegeId(c.id)} style={{ fontWeight: c.id === selectedCollegeId ? 700 : 400 }}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedCollege && (
        <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2>Departments in {selectedCollege.name}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="New department name"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
            />
            <button onClick={addDepartment}>Add</button>
          </div>
          <ul>
            {departments.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelectedDepartmentId(d.id)}
                  style={{ fontWeight: d.id === selectedDepartmentId ? 700 : 400 }}
                >
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedDepartment && (
        <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2>Batches in {selectedDepartment.name}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Entry year"
              type="number"
              value={newBatchYear}
              onChange={(e) => setNewBatchYear(Number(e.target.value))}
              style={{ width: 120 }}
            />
            <input
              placeholder="Batch name"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              style={{ width: 160 }}
            />
            <button onClick={addBatch}>Add</button>
          </div>
          <ul>
            {batches.map((b) => (
              <li key={b.id}>
                <button onClick={() => setSelectedBatchId(b.id)} style={{ fontWeight: b.id === selectedBatchId ? 700 : 400 }}>
                  {b.name} ({b.entry_year})
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedBatch && (
        <section style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h2>Sections in {selectedBatch.name}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Section name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              style={{ width: 120 }}
            />
            <button onClick={addSection}>Add</button>
          </div>
          <ul>
            {sections.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}


