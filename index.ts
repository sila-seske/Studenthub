// send-push: sends a Web Push message to every device a student has turned alerts on for.
// Deploy: Supabase > Edge Functions > Deploy a new function > name it "send-push" > paste this file.
// Turn OFF "Enforce JWT verification" for this function. The secrets are set under Edge Functions > Secrets.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:getstudenthub@gmail.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }
  const event = await req.json();
  const n = event?.record;
  if (!n?.user_id) return new Response("ignored", { status: 200 });

  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", n.user_id);
  if (error) return new Response(error.message, { status: 500 });

  const payload = JSON.stringify({
    title: n.title,
    body: n.body,
    url: n.kind === "message" ? "./index.html#messages" : "./index.html#alerts",
  });

  const expired: string[] = [];
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 86400, urgency: "normal" },
      );
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) expired.push(s.id); // the device has unsubscribed
    }
  }));
  if (expired.length) await admin.from("push_subscriptions").delete().in("id", expired);

  return new Response(JSON.stringify({ sent: (subs ?? []).length }), {
    headers: { "Content-Type": "application/json" },
  });
});
