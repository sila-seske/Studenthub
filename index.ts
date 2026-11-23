// materials: lecturer uploads and removals, and student downloads for course materials.
// Files live in the private "course-files" bucket. Deploy with "Verify JWT" ON.
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "course-files";
const MAX_BYTES = 26214400;
const MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Sign in first" }, 401);
    const uid = userData.user.id;
    const body = await req.json();
    switch (body.action) {
      case "upload": return await upload(admin, uid, body);
      case "confirm": return await confirm(admin, uid, body);
      case "download": return await download(admin, uid, body);
      case "remove": return await remove(admin, uid, body);
      default: return json({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    return json({ error: String((err as Error).message ?? err).slice(0, 300) }, 500);
  }
});

async function isApprovedLecturer(admin: any, uid: string) {
  const { data } = await admin.from("profiles").select("role, lecturer_approved").eq("id", uid).maybeSingle();
  return data?.role === "lecturer" && data?.lecturer_approved === true;
}

async function upload(admin: any, uid: string, b: any) {
  if (!(await isApprovedLecturer(admin, uid))) return json({ error: "Only approved lecturers can upload" }, 403);
  const title = String(b.title ?? "").trim();
  const course = String(b.course ?? "").trim();
  const description = String(b.description ?? "").trim();
  const fileName = String(b.fileName ?? "").trim();
  const mime = String(b.mimeType ?? "");
  const size = Number(b.sizeBytes);
  if (title.length < 3 || title.length > 120) return json({ error: "Title must be 3 to 120 characters" }, 400);
  if (course.length < 2 || course.length > 40) return json({ error: "Course must be 2 to 40 characters" }, 400);
  if (description.length > 500) return json({ error: "Description is too long" }, 400);
  if (!fileName) return json({ error: "Choose a file" }, 400);
  if (!MIMES.has(mime)) return json({ error: "That file type is not allowed" }, 400);
  if (!Number.isInteger(size) || size < 1 || size > MAX_BYTES) return json({ error: "File must be 25 MB or smaller" }, 400);

  const id = crypto.randomUUID();
  const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-120) || "file";
  const path = `${uid}/${id}/${safeName}`;
  const { error: insErr } = await admin.from("course_materials").insert({
    id,
    uploader_id: uid,
    title,
    course,
    description: description || null,
    file_name: fileName.slice(0, 160),
    file_key: path,
    mime_type: mime,
    size_bytes: size,
    status: "pending",
  });
  if (insErr) return json({ error: "Could not save the material" }, 500);

  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    await admin.from("course_materials").delete().eq("id", id);
    return json({ error: "Could not prepare the upload" }, 500);
  }
  return json({ id, path, token: data.token });
}

async function confirm(admin: any, uid: string, b: any) {
  const id = String(b.id ?? "");
  const { data: row } = await admin
    .from("course_materials").select("id, file_key, size_bytes, status")
    .eq("id", id).eq("uploader_id", uid).maybeSingle();
  if (!row) return json({ error: "Upload not found" }, 404);
  if (row.status === "ready") return json({ ok: true });

  const { data: files, error } = await admin.storage.from(BUCKET).list(`${uid}/${id}`, { limit: 5 });
  if (error) return json({ error: "Could not check the upload" }, 500);
  const name = String(row.file_key).split("/").pop();
  const found = (files ?? []).find((f: any) => f.name === name);
  if (!found || Number(found.metadata?.size ?? 0) !== Number(row.size_bytes)) {
    return json({ error: "The file has not finished uploading" }, 409);
  }
  await admin.from("course_materials").update({ status: "ready", ready_at: new Date().toISOString() }).eq("id", id);
  return json({ ok: true });
}

async function download(admin: any, uid: string, b: any) {
  const id = String(b.id ?? "");
  const { data: row } = await admin
    .from("course_materials").select("file_key, file_name, status, uploader_id")
    .eq("id", id).maybeSingle();
  if (!row || (row.status !== "ready" && row.uploader_id !== uid)) return json({ error: "Material not found" }, 404);
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(row.file_key, 300, { download: row.file_name });
  if (error || !data) return json({ error: "Could not prepare the download" }, 500);
  return json({ url: data.signedUrl, expiresIn: 300 });
}

async function remove(admin: any, uid: string, b: any) {
  const id = String(b.id ?? "");
  const { data: row } = await admin
    .from("course_materials").select("file_key")
    .eq("id", id).eq("uploader_id", uid).maybeSingle();
  if (!row) return json({ error: "Material not found" }, 404);
  await admin.storage.from(BUCKET).remove([row.file_key]);
  await admin.from("course_materials").update({ status: "removed" }).eq("id", id);
  return json({ ok: true });
}
