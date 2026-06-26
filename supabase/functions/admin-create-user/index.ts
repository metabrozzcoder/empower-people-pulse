import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    let { email, password, name, username, role, phone, department, position } = body ?? {};
    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    // Password is optional — generate a random one if missing
    if (!password) {
      password = crypto.randomUUID().replace(/-/g, "") + "Aa1!";
    }
    // Transliterate Cyrillic → Latin so generated usernames/emails are readable
    const translit = (s: string) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
        ў:"u",қ:"q",ғ:"g",ҳ:"h",
      };
      return s.toLowerCase().split("").map((ch) => map[ch] ?? ch).join("");
    };
    const slugify = (s: string) => translit(String(s || "")).replace(/[^a-z0-9]+/g, "").slice(0, 24);

    // Auto-generate username from name if not provided
    if (!username) {
      const base = slugify(name) || "user";
      username = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    }
    // Email is optional — synthesize a placeholder so Supabase Auth accepts the user
    let syntheticEmail = false;
    if (!email) {
      const slug = slugify(username) || slugify(name) || "user";
      email = `${slug}.${crypto.randomUUID().slice(0, 8)}@noemail.local`;
      syntheticEmail = true;
    }
    const allowedRoles = ["admin", "hr", "employee", "guest", "shooting_moderator", "director", "tech_supply", "driver", "accountant"];
    const validRole = allowedRoles.includes(role) ? role : "guest";

    let uid: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, username, synthetic_email: syntheticEmail },
    });

    if (createErr || !created?.user) {
      const msg = createErr?.message ?? "";
      const alreadyExists = /already|registered|exists/i.test(msg);
      if (alreadyExists) {
        // Find existing user by email and reuse
        let page = 1;
        while (page <= 20 && !uid) {
          const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
          if (listErr) break;
          const match = list.users.find((u) => (u.email ?? "").toLowerCase() === String(email).toLowerCase());
          if (match) { uid = match.id; break; }
          if (list.users.length < 200) break;
          page++;
        }
        if (!uid) {
          return new Response(JSON.stringify({ error: "Email already registered but user not found" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Update password to the provided one
        await admin.auth.admin.updateUserById(uid, { password, user_metadata: { name, username } });
      } else {
        return new Response(JSON.stringify({ error: msg || "Failed to create user" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      uid = created.user.id;
    }
    // Update profile (trigger created it with defaults).
    await admin.from("profiles").update({ name, phone, department, position, username }).eq("id", uid);
    // Store the generated password in an admin-only table so admins can retrieve it later.
    await admin.from("admin_user_credentials").upsert({ user_id: uid, generated_password: password });
    // Replace default 'guest' role with chosen role
    await admin.from("user_roles").delete().eq("user_id", uid);
    await admin.from("user_roles").insert({ user_id: uid, role: validRole });

    return new Response(JSON.stringify({ user: { id: uid }, id: uid, email, name, role: validRole }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
