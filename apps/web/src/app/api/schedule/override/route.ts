import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const bodySchema = z.object({
  sectionId: z.string().uuid(),
  classMeetingId: z.string().uuid(),
  action: z.enum(['RESCHEDULE', 'ROOM_CHANGE', 'CANCEL']),
  reason: z.string().min(3),
  // Use regex date validation to avoid z.string().date() which requires zod-date
  newDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  newWeekday: z.number().int().min(0).max(6).optional(),
  newStartsAt: z.string().optional(),
  newEndsAt: z.string().optional(),
  newRoom: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  // TODO: derive actor_id from session
  const actorId = req.headers.get('x-actor-id');
  if (!actorId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    await client.query('begin');

    const insertOverride = `
      insert into section_schedule_override (
        section_id, class_meeting_id, action, reason,
        new_date, new_weekday, new_starts_at, new_ends_at, new_room,
        created_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning id
    `;

    const { rows: overrideRows } = await client.query(insertOverride, [
      body.sectionId,
      body.classMeetingId,
      body.action,
      body.reason,
      body.newDate ?? null,
      body.newWeekday ?? null,
      body.newStartsAt ?? null,
      body.newEndsAt ?? null,
      body.newRoom ?? null,
      actorId,
    ]);

    const details = {
      overrideId: overrideRows[0].id,
      ...body,
    };

    await client.query(
      `insert into schedule_change_log (actor_id, section_id, course_assignment_id, action, reason, details)
       select $1, $2, cm.course_assignment_id, $3, $4, $5::jsonb
       from class_meeting cm where cm.id = $6`,
      [actorId, body.sectionId, body.action, body.reason, JSON.stringify(details), body.classMeetingId]
    );

    // Enqueue notifications to section students and instructor
    await client.query(
      `insert into notification_outbox (kind, section_id, instructor_id, payload, not_before)
       select 'SECTION_CHANGE', $1, ca.instructor_id, $2::jsonb, now()
       from class_meeting cm
       join course_assignment ca on ca.id = cm.course_assignment_id
       where cm.id = $3`,
      [
        body.sectionId,
        JSON.stringify({ text: `Schedule updated: ${body.action} — ${body.reason}` }),
        body.classMeetingId,
      ]
    );

    await client.query('commit');
    return NextResponse.json({ ok: true, id: overrideRows[0].id });
  } catch {
    await client.query('rollback');
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  } finally {
    client.release();
  }
}


