import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 500 });

  const today = new Date().toISOString().slice(0, 10);

  // Distinct sections that have students
  const secRes = await supabaseAdmin.from('student').select('section_id').not('section_id', 'is', null);
  if (secRes.error) return NextResponse.json({ error: secRes.error.message }, { status: 500 });
  const sectionIds = Array.from(new Set((secRes.data || []).map((s: any) => s.section_id))).filter(Boolean);

  let inserted = 0;

  for (const sectionId of sectionIds) {
    // Compute effective schedule for section for today
    const dateDow = new Date(today).getDay();
    const sectionRes = await supabaseAdmin.from('section').select('batch_id').eq('id', sectionId).single();
    if (sectionRes.error) continue;
    const batchId = sectionRes.data?.batch_id as string;
    const caIds = (await supabaseAdmin.from('course_assignment').select('id').eq('batch_id', batchId)).data?.map((r: any) => r.id) || [];
    if (caIds.length === 0) continue;
    const baseRes = await supabaseAdmin
      .from('class_meeting')
      .select('id, weekday, starts_at, ends_at, room, course_assignment_id')
      .eq('weekday', dateDow)
      .in('course_assignment_id', caIds)
      .order('starts_at');
    if (baseRes.error) continue;
    const base = baseRes.data || [];
    const meetingIds = base.map((b: any) => b.id);
    const ovRes = await supabaseAdmin
      .from('section_schedule_override')
      .select('id, class_meeting_id, action, reason, new_weekday, new_starts_at, new_ends_at, new_room, new_date, created_at')
      .eq('section_id', sectionId)
      .in('class_meeting_id', meetingIds)
      .lte('effective_from', today);
    if (ovRes.error) continue;
    const latestByMeeting = new Map<string, any>();
    for (const ov of ovRes.data || []) {
      const prev = latestByMeeting.get(ov.class_meeting_id);
      if (!prev || new Date(ov.created_at).getTime() > new Date(prev.created_at).getTime()) {
        latestByMeeting.set(ov.class_meeting_id, ov);
      }
    }
    const effective = base
      .map((b: any) => {
        const ov = latestByMeeting.get(b.id);
        if (!ov) return b;
        if (ov.action === 'CANCEL') return null;
        const next = { ...b };
        if (ov.new_room) next.room = ov.new_room;
        if (ov.action === 'RESCHEDULE') {
          if (ov.new_starts_at) next.starts_at = ov.new_starts_at;
          if (ov.new_ends_at) next.ends_at = ov.new_ends_at;
          if (ov.new_weekday !== null && ov.new_weekday !== undefined) next.weekday = ov.new_weekday;
          if (ov.new_date) {
            const ovDate = new Date(ov.new_date as string).toISOString().slice(0, 10);
            if (ovDate !== today) return null;
          }
        }
        return next;
      })
      .filter(Boolean)
      .filter((m: any) => m.weekday === dateDow);

    if (effective.length === 0) continue;

    // Build simple text
    const lines = effective.map((m: any) => `${m.starts_at}-${m.ends_at} ${m.room || ''}`.trim());
    const text = `Today\'s classes:\n` + lines.join('\n');

    const { error: outErr } = await supabaseAdmin.from('notification_outbox').insert({
      kind: 'DAILY_CLASS_REMINDER',
      section_id: sectionId,
      payload: { text },
      not_before: new Date().toISOString(),
    });
    if (!outErr) inserted += 1;
  }

  return NextResponse.json({ ok: true, sectionsQueued: inserted });
}


