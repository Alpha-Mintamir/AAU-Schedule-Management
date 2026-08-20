"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import styles from "@/components/admin.module.css";

type College = { id: string; name: string };
type Department = { id: string; college_id: string; name: string };
type Batch = { id: string; department_id: string; entry_year: number; name: string };
type Section = { id: string; batch_id: string; name: string };

async function json<T>(res: Response | Promise<Response>): Promise<T> {
  const resolved = await res;
  if (!resolved.ok) throw new Error(await resolved.text());
  return resolved.json();
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
    json<{ items: Section[] }>(fetch(`/api/structure/sections?batchId=${selectedBatchId}`)).then((d) =>
      setSections(d.items)
    );
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
      body: JSON.stringify({
        departmentId: selectedDepartmentId,
        entryYear: newBatchYear,
        name: newBatchName.trim(),
      }),
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

  const selectedCollege = useMemo(
    () => colleges.find((c) => c.id === selectedCollegeId),
    [colleges, selectedCollegeId]
  );
  const selectedDepartment = useMemo(
    () => departments.find((d) => d.id === selectedDepartmentId),
    [departments, selectedDepartmentId]
  );
  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId),
    [batches, selectedBatchId]
  );

  return (
    <AdminShell
      title="Structure"
      description="Set up colleges, departments, batches, and sections in order."
    >
      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Colleges</h2>
            <span>{colleges.length} total</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="College name"
                value={newCollegeName}
                onChange={(e) => setNewCollegeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCollege()}
                style={{ flex: 1, minWidth: 180 }}
              />
              <button className={styles.button} onClick={addCollege} type="button">
                Add college
              </button>
            </div>
            {colleges.length === 0 ? (
              <p className={styles.empty}>No colleges yet. Add one to get started.</p>
            ) : (
              <ul className={styles.list}>
                {colleges.map((c) => (
                  <li key={c.id} className={styles.listItem}>
                    <button
                      type="button"
                      className={`${styles.listButton} ${
                        c.id === selectedCollegeId ? styles.listButtonActive : ""
                      }`}
                      onClick={() => setSelectedCollegeId(c.id)}
                    >
                      <span>{c.name}</span>
                      <span className={styles.meta}>Select</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {selectedCollege && (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Departments in {selectedCollege.name}</h2>
              <span>{departments.length} total</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  placeholder="Department name"
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDepartment()}
                  style={{ flex: 1, minWidth: 180 }}
                />
                <button className={styles.button} onClick={addDepartment} type="button">
                  Add department
                </button>
              </div>
              {departments.length === 0 ? (
                <p className={styles.empty}>No departments in this college yet.</p>
              ) : (
                <ul className={styles.list}>
                  {departments.map((d) => (
                    <li key={d.id} className={styles.listItem}>
                      <button
                        type="button"
                        className={`${styles.listButton} ${
                          d.id === selectedDepartmentId ? styles.listButtonActive : ""
                        }`}
                        onClick={() => setSelectedDepartmentId(d.id)}
                      >
                        <span>{d.name}</span>
                        <span className={styles.meta}>Select</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {selectedDepartment && (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Batches in {selectedDepartment.name}</h2>
              <span>{batches.length} total</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  placeholder="Entry year"
                  type="number"
                  value={newBatchYear}
                  onChange={(e) => setNewBatchYear(Number(e.target.value))}
                  style={{ width: 120 }}
                />
                <input
                  className={styles.input}
                  placeholder="Batch name"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBatch()}
                  style={{ width: 160 }}
                />
                <button className={styles.button} onClick={addBatch} type="button">
                  Add batch
                </button>
              </div>
              {batches.length === 0 ? (
                <p className={styles.empty}>No batches in this department yet.</p>
              ) : (
                <ul className={styles.list}>
                  {batches.map((b) => (
                    <li key={b.id} className={styles.listItem}>
                      <button
                        type="button"
                        className={`${styles.listButton} ${
                          b.id === selectedBatchId ? styles.listButtonActive : ""
                        }`}
                        onClick={() => setSelectedBatchId(b.id)}
                      >
                        <span>
                          {b.name} <span className={styles.meta}>({b.entry_year})</span>
                        </span>
                        <span className={styles.meta}>Select</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {selectedBatch && (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Sections in {selectedBatch.name}</h2>
              <span>{sections.length} total</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  placeholder="Section name"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSection()}
                  style={{ width: 140 }}
                />
                <button className={styles.button} onClick={addSection} type="button">
                  Add section
                </button>
              </div>
              {sections.length === 0 ? (
                <p className={styles.empty}>No sections in this batch yet.</p>
              ) : (
                <ul className={styles.list}>
                  {sections.map((s) => (
                    <li key={s.id} className={styles.listItem}>
                      <div className={styles.listButton} style={{ cursor: "default" }}>
                        <span>{s.name}</span>
                        <span className={styles.meta}>Section</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </AdminShell>
  );
}
