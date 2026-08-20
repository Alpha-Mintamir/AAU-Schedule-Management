import Link from "next/link";
import styles from "./page.module.css";

const features = [
  {
    title: "College structure",
    body: "Keep colleges, departments, batches, and sections organized in one place.",
  },
  {
    title: "Course catalog",
    body: "Add course codes, titles, and credit hours by department without spreadsheet chaos.",
  },
  {
    title: "Schedule updates",
    body: "Publish base timetables and send clear changes when rooms or times shift.",
  },
  {
    title: "Telegram delivery",
    body: "Push exam notices and schedule changes straight to the groups that need them.",
  },
];

export default function Home() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden />
          AAU Schedule
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link href="/admin">Admin</Link>
        </nav>
        <Link href="/admin" className={styles.headerCta}>
          Open admin
        </Link>
      </header>

      <main>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Addis Ababa University</p>
          <h1 className={styles.title}>
            Class schedules that stay clear when plans change.
          </h1>
          <p className={styles.lead}>
            Build your college structure, manage courses, and keep students and instructors
            informed without digging through chat threads.
          </p>
          <div className={styles.actions}>
            <Link href="/admin" className={styles.primary}>
              Manage structure
            </Link>
            <Link href="/admin/courses" className={styles.secondary}>
              View courses
            </Link>
          </div>

          <div className={styles.preview} aria-hidden>
            <div className={styles.previewBar}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.previewGrid}>
              <div className={styles.previewCard}>
                <small>Today</small>
                <strong>CS201 · Algorithms</strong>
                <p>Room B12 · 09:00 to 11:00</p>
              </div>
              <div className={styles.previewCard}>
                <small>Update</small>
                <strong>Room moved</strong>
                <p>MATH110 now in Hall 3</p>
              </div>
              <div className={styles.previewCard}>
                <small>Exam</small>
                <strong>PHYS102 Midterm</strong>
                <p>Sat · 14:00 · Lab 2</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Built for real campus ops</h2>
            <p>Practical tools for admins who need accurate schedules, not another flashy dashboard.</p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <article key={feature.title} className={styles.featureCard}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Three steps, then you are live</h2>
            <p>Start with structure, add courses, and publish what students need to see.</p>
          </div>
          <ol className={styles.steps}>
            <li>
              <span>01</span>
              <div>
                <h3>Set the structure</h3>
                <p>Create colleges, departments, batches, and sections.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Add the catalog</h3>
                <p>Enter course codes, titles, and credit hours by department.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Publish updates</h3>
                <p>Share timetable changes and exam notices where people already check.</p>
              </div>
            </li>
          </ol>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <strong>AAU Schedule</strong>
          <p>Timetables, courses, and section updates in one place.</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/admin">Structure</Link>
          <Link href="/admin/courses">Courses</Link>
        </div>
      </footer>
    </div>
  );
}
