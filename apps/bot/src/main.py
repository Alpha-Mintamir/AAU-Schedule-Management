import json
import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from dotenv import load_dotenv
from supabase import create_client, Client
from tzlocal import get_localzone_name
from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import Application, CommandHandler, ContextTypes


def create_supabase_client_optional() -> Optional[Client]:
    url = os.getenv("SUPABASE_URL")
    # Prefer service role key if available (server-side bot), else fallback to anon
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if not url or not key:
        return None
    return create_client(url, key)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    text = (
        "Welcome! Your account isn’t linked yet.\n\n"
        "Please log in on the web dashboard, open Profile → Link Telegram, and follow the steps."
    )
    await update.message.reply_text(text)


def _now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def claim_outbox_and_send(app: Application, supabase: Optional[Client]) -> None:
    if not supabase:
        return
    # Fetch pending notifications
    rows = (
        supabase.table("notification_outbox")
        .select("*")
        .is_("processed_at", None)
        .lte("not_before", _now_utc_iso())
        .limit(100)
        .execute()
        .data
    )

    for row in rows:
        kind: str = row.get("kind")
        payload: Dict[str, Any] = row.get("payload") or {}
        message: str = payload.get("text") or f"{kind}: {json.dumps(payload, ensure_ascii=False)}"
        chat_ids: List[int] = []

        user_id = row.get("user_id")
        section_id = row.get("section_id")
        instructor_id = row.get("instructor_id")

        # Direct user
        if user_id:
            links = (
                supabase.table("telegram_link")
                .select("chat_id")
                .eq("user_id", user_id)
                .execute()
                .data
            )
            chat_ids.extend([int(x["chat_id"]) for x in links])

        # Section recipients (students)
        if section_id:
            students = (
                supabase.table("student")
                .select("user_id")
                .eq("section_id", section_id)
                .execute()
                .data
            )
            student_user_ids = [s["user_id"] for s in students]
            if student_user_ids:
                links = (
                    supabase.table("telegram_link")
                    .select("chat_id,user_id")
                    .in_("user_id", student_user_ids)
                    .execute()
                    .data
                )
                chat_ids.extend([int(x["chat_id"]) for x in links])

        # Instructor recipient (map instructor → user)
        if instructor_id:
            inst = (
                supabase.table("instructor")
                .select("user_id")
                .eq("id", instructor_id)
                .single()
                .execute()
                .data
            )
            if inst and inst.get("user_id"):
                links = (
                    supabase.table("telegram_link")
                    .select("chat_id")
                    .eq("user_id", inst["user_id"])
                    .execute()
                    .data
                )
                chat_ids.extend([int(x["chat_id"]) for x in links])

        # Send messages
        for chat_id in {cid for cid in chat_ids if cid}:
            try:
                await app.bot.send_message(chat_id=chat_id, text=message, parse_mode=ParseMode.HTML)
            except Exception:
                # Do not fail the whole batch; continue
                pass

        # Mark processed
        supabase.table("notification_outbox").update({"processed_at": _now_utc_iso()}).eq("id", row["id"]).execute()


def main() -> None:
    load_dotenv()

    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise RuntimeError("Missing TELEGRAM_BOT_TOKEN in environment")
    _ = os.getenv("TIMEZONE") or get_localzone_name()
    supabase = create_supabase_client_optional()

    application = Application.builder().token(token).build()

    # Commands
    application.add_handler(CommandHandler("start", start))

    # Jobs: only schedule when Supabase is configured
    if supabase:
        application.job_queue.run_repeating(
            lambda ctx: claim_outbox_and_send(application, supabase), interval=15, first=5
        )
        # Keep a daily run that will pick up reminders via outbox
        application.job_queue.run_daily(
            lambda ctx: claim_outbox_and_send(application, supabase),
            time=datetime.strptime("06:30", "%H:%M").time(),
            days=(0, 1, 2, 3, 4, 5, 6),
            name="daily_reminders",
        )

    application.run_polling()


if __name__ == "__main__":
    main()


