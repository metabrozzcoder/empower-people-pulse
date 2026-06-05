// AI Assistant chat edge function with tool calling over the user's saved items
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are ARK, the in-app AI assistant for an HRMS workspace.
You answer questions like ChatGPT AND take real actions for the signed-in user via tools.

Capabilities:
- People: search_people, list_people_all, create_user (admin), update_person (admin),
  delete_person (admin), assign_role (admin), list_roles.
- Tasks: create_task, list_tasks, update_task, delete_task. To assign by name,
  call search_people first to get the user id, then create_task with assignee_id.
- Reminders: create_reminder for the current user.
- Documents: list_documents, create_document (send to an approver),
  send_uploaded_document (forward a document previously saved to the assistant
  library to a specific person as approver), update_document, delete_document.
- Library: search_items, list_recent, save_note, save_bookmark.
- Profile: get_my_profile, update_my_profile.

Rules:
- Always use a tool for actionable requests instead of just describing how.
- Resolve people via search_people; never invent user ids.
- Confirm each action briefly (who, what, when) after the tool returns ok.
- If a tool returns an error (e.g. permission), explain the cause plainly
  (e.g. "you need admin role for this") instead of pretending it worked.
- If info is ambiguous, ask one short clarifying question first.

Use markdown when it helps readability.`;

const tools = [
  {
    type: "function",
    function: {
      name: "search_items",
      description: "Full-text search the user's saved items (bookmarks, notes, documents, photos).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          kind: { type: "string", enum: ["bookmark", "note", "document", "photo"], description: "Optional filter by item kind" },
          limit: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent",
      description: "List the user's most recently saved items.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["bookmark", "note", "document", "photo"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_note",
      description: "Save a quick note for the user.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_bookmark",
      description: "Save a bookmark URL for the user.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          note: { type: "string" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_people",
      description: "Search for people in the workspace by name, email, position, or department. Returns user_id values you can use as assignee_id.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name, email, position, or department keyword" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task, optionally assigned to a specific person (use search_people first to get assignee_id).",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          assignee_id: { type: "string", description: "UUID of the assignee user" },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List tasks. By default, tasks assigned to or created by the current user.",
      parameters: {
        type: "object",
        properties: {
          scope: { type: "string", enum: ["mine", "assigned_to_me", "created_by_me", "all"], description: "Default 'mine'" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update an existing task's status, assignee, due date, or priority.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          status: { type: "string", enum: ["todo", "in_progress", "done"] },
          assignee_id: { type: "string" },
          due_date: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_reminder",
      description: "Create a reminder for the current user.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD" },
          time: { type: "string", description: "HH:MM" },
        },
        required: ["title", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_profile",
      description: "Get the current user's profile.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "update_my_profile",
      description: "Update fields on the current user's own profile.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          position: { type: "string" },
          department: { type: "string" },
          organization: { type: "string" },
          preferred_language: { type: "string", enum: ["en", "ru", "uz"] },
        },
      },
    },
  },
];

async function runTool(name: string, args: any, supabase: any, userId: string) {
  if (name === "search_items") {
    const q = String(args.query || "").trim();
    let query = supabase
      .from("assistant_items")
      .select("id,kind,title,content,url,tags,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(Math.min(args.limit ?? 10, 25));
    if (args.kind) query = query.eq("kind", args.kind);
    if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%,url.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { items: data ?? [] };
  }
  if (name === "list_recent") {
    let query = supabase
      .from("assistant_items")
      .select("id,kind,title,url,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(Math.min(args.limit ?? 10, 25));
    if (args.kind) query = query.eq("kind", args.kind);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { items: data ?? [] };
  }
  if (name === "save_note") {
    const { data, error } = await supabase
      .from("assistant_items")
      .insert({ user_id: userId, kind: "note", title: args.title, content: args.content })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { ok: true, id: data.id };
  }
  if (name === "save_bookmark") {
    const { data, error } = await supabase
      .from("assistant_items")
      .insert({
        user_id: userId,
        kind: "bookmark",
        title: args.title || args.url,
        url: args.url,
        content: args.note ?? null,
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { ok: true, id: data.id };
  }
  if (name === "search_people") {
    const q = String(args.query || "").trim();
    const limit = Math.min(args.limit ?? 10, 25);
    let query = supabase
      .from("profiles")
      .select("id,name,email,phone,position,department,organization")
      .limit(limit);
    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,position.ilike.%${q}%,department.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { people: data ?? [] };
  }
  if (name === "create_task") {
    const payload: any = {
      title: args.title,
      description: args.description ?? null,
      created_by: userId,
      assignee_id: args.assignee_id ?? null,
      due_date: args.due_date ?? null,
      priority: args.priority ?? "medium",
      status: args.status ?? "todo",
    };
    const { data, error } = await supabase.from("tasks").insert(payload).select("id,title,assignee_id,due_date,status,priority").single();
    if (error) return { error: error.message };
    return { ok: true, task: data };
  }
  if (name === "list_tasks") {
    const scope = args.scope ?? "mine";
    let query = supabase
      .from("tasks")
      .select("id,title,status,priority,due_date,assignee_id,created_by,created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(args.limit ?? 20, 50));
    if (scope === "assigned_to_me") query = query.eq("assignee_id", userId);
    else if (scope === "created_by_me") query = query.eq("created_by", userId);
    else if (scope === "mine") query = query.or(`assignee_id.eq.${userId},created_by.eq.${userId}`);
    if (args.status) query = query.eq("status", args.status);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { tasks: data ?? [] };
  }
  if (name === "update_task") {
    const patch: any = {};
    for (const k of ["status", "assignee_id", "due_date", "priority", "title", "description"]) {
      if (args[k] !== undefined) patch[k] = args[k];
    }
    const { data, error } = await supabase.from("tasks").update(patch).eq("id", args.task_id).select("id,title,status,assignee_id,due_date,priority").single();
    if (error) return { error: error.message };
    return { ok: true, task: data };
  }
  if (name === "create_reminder") {
    const { data, error } = await supabase.from("reminders").insert({
      user_id: userId,
      title: args.title,
      description: args.description ?? null,
      date: args.date,
      time: args.time ?? null,
    }).select("id,title,date,time").single();
    if (error) return { error: error.message };
    return { ok: true, reminder: data };
  }
  if (name === "get_my_profile") {
    const { data, error } = await supabase.from("profiles").select("id,name,email,phone,position,department,organization,preferred_language").eq("id", userId).single();
    if (error) return { error: error.message };
    return { profile: data };
  }
  if (name === "update_my_profile") {
    const patch: any = {};
    for (const k of ["name", "phone", "position", "department", "organization", "preferred_language"]) {
      if (args[k] !== undefined) patch[k] = args[k];
    }
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select("id,name,phone,position,department,organization,preferred_language").single();
    if (error) return { error: error.message };
    return { ok: true, profile: data };
  }
  return { error: `Unknown tool ${name}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { messages, threadId } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const convo: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Tool-calling loop (non-streaming for simplicity)
    for (let step = 0; step < 10; step++) {
      const r = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: MODEL, messages: convo, tools, tool_choice: "auto" }),
      });
      if (!r.ok) {
        const t = await r.text();
        return new Response(JSON.stringify({ error: `AI ${r.status}: ${t}` }), {
          status: r.status === 429 || r.status === 402 ? r.status : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await r.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) break;
      convo.push(msg);

      const calls = msg.tool_calls ?? [];
      if (!calls.length) {
        // Persist assistant message if a threadId was provided
        if (threadId && typeof msg.content === "string") {
          await supabase.from("assistant_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "assistant",
            content: { type: "text", text: msg.content },
          });
        }
        return new Response(JSON.stringify({ reply: msg.content ?? "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (const call of calls) {
        let args: any = {};
        try { args = JSON.parse(call.function?.arguments ?? "{}"); } catch { /* ignore */ }
        const result = await runTool(call.function?.name, args, supabase, userId);
        convo.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    return new Response(JSON.stringify({ reply: "(no response)" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
