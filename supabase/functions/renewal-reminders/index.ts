// Supabase Edge Function: renewal-reminders
// Runs daily via pg_cron. Sends:
//   • Reminder email  — exactly N days before renewal (N = library.renewalReminderDays, default 5)
//   • Overdue email   — exactly 1 day after renewal date (the morning after it lapses)
//
// Setup:
//   1. supabase functions deploy renewal-reminders
//   2. Set secrets:
//        supabase secrets set RESEND_API_KEY=re_xxxx
//        supabase secrets set SUPABASE_URL=https://your-project.supabase.co
//        supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
//   3. Schedule in Supabase Dashboard → Database → Extensions → pg_cron:
//        select cron.schedule('renewal-reminders', '0 8 * * *',
//          $$select net.http_post(
//            url := 'https://your-project.supabase.co/functions/v1/renewal-reminders',
//            headers := '{"Authorization":"Bearer YOUR_ANON_KEY"}'::jsonb,
//            body := '{}'::jsonb
//          )$$
//        );

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Shared Resend sender ───────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string, fromName: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [to],
      subject,
      html,
    }),
  });
}

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Fetch settings ────────────────────────────────────────────────────────
  const { data: settingsRow } = await supabase
    .from("fee_settings")
    .select("settings_json")
    .limit(1)
    .maybeSingle();

  const settings  = settingsRow?.settings_json ? JSON.parse(settingsRow.settings_json) : {};
  const plans: Record<string, { name: string; cost: number; borrowLimit: number }> =
    Object.fromEntries((settings.plans || []).map((p: any) => [p.id, p]));
  const library      = settings.library || {};
  const libraryUpi   = library.upiId    || "";
  const libraryName  = library.name     || "The Library";
  const libraryPhone = library.phone    || "";
  const libraryEmail = library.email    || "";
  const libraryAddr  = library.address  || "";
  const reminderDays = library.renewalReminderDays || 5;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // ── Fetch active members with a plan ──────────────────────────────────────
  const { data: members, error: membersErr } = await supabase
    .from("users")
    .select("id, full_name, email, membership_id, plan, plan_renewed_at, joined_at")
    .eq("role", "member")
    .eq("status", "active")
    .not("plan", "is", null);

  if (membersErr) {
    return new Response(JSON.stringify({ error: membersErr.message }), { status: 500 });
  }

  const reminders: string[] = [];
  const overdues:  string[] = [];

  for (const member of members || []) {
    const base = member.plan_renewed_at || member.joined_at;
    if (!base) continue;

    const renewalDate = new Date(base);
    renewalDate.setMonth(renewalDate.getMonth() + 1);
    renewalDate.setHours(0, 0, 0, 0);

    // positive = days until renewal, negative = days past due
    const diffDays = Math.ceil((renewalDate.getTime() - todayDate.getTime()) / 86400000);

    const plan = plans[member.plan];
    if (!plan) continue;

    const membershipId  = member.membership_id || member.id;
    const firstName     = member.full_name.split(" ")[0];
    const renewalStr    = renewalDate.toISOString().split("T")[0];
    const monthLabel    = renewalDate.toLocaleString("en-IN", { month: "short" }) + "-" + String(renewalDate.getFullYear()).slice(2);
    const displayMonth  = renewalDate.toLocaleString("en-IN", { month: "long" }) + " " + renewalDate.getFullYear();

    const upiLink = libraryUpi
      ? `upi://pay?pa=${encodeURIComponent(libraryUpi)}&pn=${encodeURIComponent(libraryName)}&am=${plan.cost}&tn=${encodeURIComponent(monthLabel + " Renewal")}&cu=INR`
      : null;

    // ════════════════════════════════════════════════════════════════════════
    // CASE 1 — REMINDER (exactly N days before due)
    // ════════════════════════════════════════════════════════════════════════
    if (diffDays === reminderDays) {
      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f0;font-family:'Segoe UI',system-ui,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:24px 32px;text-align:center">
    <p style="margin:0 0 4px;font-size:22px">🔔</p>
    <h1 style="margin:0;color:#F5C518;font-size:19px;font-weight:900">${libraryName}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:12px;text-transform:uppercase;letter-spacing:.5px">Renewal Reminder</p>
  </div>

  <!-- Body -->
  <div style="padding:26px 32px">
    <p style="margin:0 0 14px;font-size:15px;color:#1A1714">Hi <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 18px;font-size:13px;color:#6B6456;line-height:1.7">
      Your <strong>${plan.name}</strong> membership (ID: <code style="font-size:12px;color:#1B4332">${membershipId}</code>)
      is due for renewal in <strong style="color:#E67E22">${reminderDays} days</strong> — on <strong>${renewalStr}</strong> (${displayMonth}).
    </p>

    <!-- Plan box -->
    <div style="background:#f0faf4;border:1px solid #52B78840;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:13px;font-weight:700;color:#1A1714">${plan.name}</div>
        <div style="font-size:11px;color:#6B6456;margin-top:3px">Up to ${plan.borrowLimit} book${plan.borrowLimit !== 1 ? "s" : ""} at a time</div>
      </div>
      <div style="font-size:16px;font-weight:900;color:#1B4332">₹${plan.cost}<span style="font-size:11px;font-weight:400;color:#6B6456">/mo</span></div>
    </div>

    ${upiLink ? `<div style="text-align:center;margin-bottom:18px">
      <a href="${upiLink}" style="display:inline-block;padding:12px 26px;background:#1B4332;color:#F5C518;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none">Pay ₹${plan.cost} via UPI →</a>
      <p style="margin:8px 0 0;font-size:11px;color:#6B6456">Opens your UPI app · amount pre-filled</p>
    </div>` : ""}

    <p style="margin:0;font-size:12px;color:#6B6456">
      Visit us in person or pay via UPI. If you've already paid, please ignore this.${libraryPhone ? `<br>Help: <strong>${libraryPhone}</strong>` : ""}
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f9f7f0;padding:12px 32px;text-align:center;border-top:1px solid #EDE9DC">
    <p style="margin:0;font-size:11px;color:#C8C2A8">${libraryName}${libraryAddr ? ` · ${libraryAddr}` : ""}</p>
  </div>
</div>
</body></html>`;

      const res = await sendEmail(member.email, `Renew in ${reminderDays} days — ${plan.name} · ${libraryName}`, html, libraryName);
      reminders.push(`${member.full_name} (${member.email}): ${res.ok ? "reminder sent" : "failed"}`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CASE 2 — OVERDUE (exactly 1 day after due date)
    // ════════════════════════════════════════════════════════════════════════
    if (diffDays === -1) {
      const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f0;font-family:'Segoe UI',system-ui,sans-serif">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

  <!-- Header — red accent for urgency -->
  <div style="background:linear-gradient(135deg,#922B21,#C0392B);padding:24px 32px;text-align:center">
    <p style="margin:0 0 4px;font-size:22px">⚠️</p>
    <h1 style="margin:0;color:#fff;font-size:19px;font-weight:900">${libraryName}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:12px;text-transform:uppercase;letter-spacing:.5px">Membership Overdue</p>
  </div>

  <!-- Body -->
  <div style="padding:26px 32px">
    <p style="margin:0 0 14px;font-size:15px;color:#1A1714">Hi <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 18px;font-size:13px;color:#6B6456;line-height:1.7">
      Your <strong>${plan.name}</strong> membership (ID: <code style="font-size:12px;color:#922B21">${membershipId}</code>)
      was due on <strong style="color:#C0392B">${renewalStr}</strong> and is now <strong style="color:#C0392B">overdue</strong>.
      Borrowing access may be paused until renewal is confirmed.
    </p>

    <!-- Plan box -->
    <div style="background:#FADBD8;border:1px solid #C0392B40;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:13px;font-weight:700;color:#1A1714">${plan.name}</div>
        <div style="font-size:11px;color:#922B21;margin-top:3px">Due: ${renewalStr} · 1 day overdue</div>
      </div>
      <div style="font-size:16px;font-weight:900;color:#C0392B">₹${plan.cost}<span style="font-size:11px;font-weight:400;color:#922B21">/mo</span></div>
    </div>

    ${upiLink ? `<div style="text-align:center;margin-bottom:18px">
      <a href="${upiLink}" style="display:inline-block;padding:12px 26px;background:#C0392B;color:#fff;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none">Pay ₹${plan.cost} Now →</a>
      <p style="margin:8px 0 0;font-size:11px;color:#6B6456">Opens your UPI app · amount pre-filled</p>
    </div>` : ""}

    <p style="margin:0;font-size:12px;color:#6B6456">
      Please renew at the earliest to continue borrowing without interruption.${libraryPhone ? `<br>Contact us: <strong>${libraryPhone}</strong>${libraryEmail ? ` · ${libraryEmail}` : ""}` : ""}
    </p>
  </div>

  <!-- Footer -->
  <div style="background:#f9f7f0;padding:12px 32px;text-align:center;border-top:1px solid #EDE9DC">
    <p style="margin:0;font-size:11px;color:#C8C2A8">${libraryName}${libraryAddr ? ` · ${libraryAddr}` : ""}</p>
  </div>
</div>
</body></html>`;

      const res = await sendEmail(member.email, `⚠️ Membership overdue — please renew · ${libraryName}`, html, libraryName);
      overdues.push(`${member.full_name} (${member.email}): ${res.ok ? "overdue sent" : "failed"}`);
    }
  }

  return new Response(
    JSON.stringify({
      reminders_sent: reminders.length,
      overdues_sent:  overdues.length,
      reminders,
      overdues,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
