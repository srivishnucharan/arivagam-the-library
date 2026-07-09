// Supabase Edge Function: welcome-email
// Called from the React app immediately after a librarian activates a member.
//
// Deploy:
//   supabase functions deploy welcome-email
//
// Secrets needed (set once):
//   supabase secrets set RESEND_API_KEY=re_xxxx
//   supabase secrets set SUPABASE_URL=https://your-project.supabase.co
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const body = await req.json().catch(() => ({}));

    // ── Resolve member & settings from DB ──────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Fetch member row
    const memberId: string = body.memberId ?? "";
    const { data: userRow } = await supabase
      .from("users")
      .select("id, full_name, email, membership_id, plan, joined_at")
      .eq("id", memberId)
      .maybeSingle();

    // Fetch settings (library info + plans)
    const { data: settingsRow } = await supabase
      .from("fee_settings")
      .select("settings_json")
      .limit(1)
      .maybeSingle();

    const settings   = settingsRow?.settings_json ? JSON.parse(settingsRow.settings_json) : {};
    const library    = settings.library  || {};
    const plans: Record<string, { name: string; cost: number; borrowLimit: number }> =
      Object.fromEntries((settings.plans || []).map((p: any) => [p.id, p]));

    // Resolve values — prefer DB row, fall back to body payload
    const memberName    = userRow?.full_name           ?? body.memberName    ?? "Member";
    const email         = userRow?.email               ?? body.email         ?? "";
    const membershipId  = userRow?.membership_id       ?? body.membershipId  ?? memberId;
    const planId        = userRow?.plan                ?? body.planId        ?? "";
    const plan          = plans[planId];
    const planName      = plan?.name                   ?? body.planName      ?? "Standard";
    const planCost      = plan?.cost                   ?? body.planCost      ?? 0;
    const borrowLimit   = plan?.borrowLimit            ?? body.borrowLimit   ?? 2;
    const joinedAt      = userRow?.joined_at?.split("T")[0] ?? body.joinedAt ?? new Date().toISOString().split("T")[0];
    const libraryName   = library.name    || body.libraryName    || "The Library";
    const libraryPhone  = library.phone   || body.libraryPhone   || "";
    const libraryEmail  = library.email   || body.libraryEmail   || "";
    const libraryAddr   = library.address || body.libraryAddress || "";

    // First renewal due = joined + 1 month
    const renewalDate = new Date(joinedAt);
    renewalDate.setMonth(renewalDate.getMonth() + 1);
    const renewalDueStr = renewalDate.toISOString().split("T")[0];
    const renewalMonthLabel = renewalDate.toLocaleString("en-IN", { month: "long", year: "numeric" });

    if (!email) {
      return new Response(JSON.stringify({ error: "No email address" }), { status: 400, headers: corsHeaders });
    }

    const firstName = memberName.split(" ")[0];

    // ── Email HTML ─────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f7f0;font-family:'Segoe UI',system-ui,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:28px 32px;text-align:center">
      <div style="width:56px;height:56px;background:rgba(245,197,24,.2);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
        <span style="font-size:26px">📚</span>
      </div>
      <h1 style="margin:0;color:#F5C518;font-size:20px;font-weight:900">${libraryName}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:12px;letter-spacing:.5px;text-transform:uppercase">Welcome to the Family</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">
      <p style="margin:0 0 18px;font-size:15px;color:#1A1714">Hi <strong>${firstName}</strong> 👋</p>
      <p style="margin:0 0 20px;font-size:13px;color:#6B6456;line-height:1.7">
        Your membership at <strong>${libraryName}</strong> is now <strong style="color:#1B4332">active</strong>.
        You're all set to borrow books and explore our collection!
      </p>

      <!-- Membership card -->
      <div style="background:#f0faf4;border:1px solid #52B78840;border-radius:12px;padding:18px 20px;margin-bottom:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:11px;font-weight:700;color:#6B6456;text-transform:uppercase;letter-spacing:.5px">Membership ID</span>
          <span style="font-size:15px;font-weight:900;color:#1B4332;font-family:monospace">${membershipId}</span>
        </div>
        <div style="border-top:1px solid #52B78830;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>
            <div style="font-size:11px;color:#6B6456;font-weight:600">Plan</div>
            <div style="font-size:13px;font-weight:700;color:#1A1714;margin-top:2px">${planName}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6456;font-weight:600">Monthly Fee</div>
            <div style="font-size:13px;font-weight:700;color:#1A1714;margin-top:2px">₹${planCost.toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6456;font-weight:600">Borrow Limit</div>
            <div style="font-size:13px;font-weight:700;color:#1A1714;margin-top:2px">${borrowLimit} book${borrowLimit !== 1 ? "s" : ""} at a time</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B6456;font-weight:600">First Renewal</div>
            <div style="font-size:13px;font-weight:700;color:#E67E22;margin-top:2px">${renewalDueStr}</div>
          </div>
        </div>
      </div>

      <p style="margin:0 0 6px;font-size:13px;color:#6B6456;line-height:1.6">
        Visit us to collect your membership card and borrow your first book. Your renewal of
        <strong>₹${planCost.toLocaleString("en-IN")}</strong> is due by <strong>${renewalDueStr}</strong> (${renewalMonthLabel}).
      </p>
      ${libraryPhone ? `<p style="margin:12px 0 0;font-size:13px;color:#6B6456">Questions? Reach us at <strong>${libraryPhone}</strong>${libraryEmail ? ` or <strong>${libraryEmail}</strong>` : ""}.</p>` : ""}
    </div>

    <!-- Footer -->
    <div style="background:#f9f7f0;padding:14px 32px;text-align:center;border-top:1px solid #EDE9DC">
      <p style="margin:0;font-size:11px;color:#C8C2A8">${libraryName}${libraryAddr ? ` · ${libraryAddr}` : ""}</p>
    </div>
  </div>
</body>
</html>`;

    // ── Send via Resend ────────────────────────────────────────────────────
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${libraryName} <onboarding@resend.dev>`,
        to: [email],
        subject: `Welcome to ${libraryName} — Membership Activated 🎉`,
        html,
      }),
    });

    const data = await res.json();
    return new Response(
      JSON.stringify({ ok: res.ok, email, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Unknown error" }), { status: 500, headers: corsHeaders });
  }
});
