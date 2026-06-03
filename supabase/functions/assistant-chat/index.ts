// AI Assistant chat edge function with tool calling over the user's saved items
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT = `You are Eclaire, a privacy-focused personal AI assistant.
You help the user manage and answer questions about their own saved items:
bookmarks, notes, documents, and photos.

Always use the available tools to search the user's library before answering
factual questions about what they have saved. When citing items, include
their title and (when relevant) the URL or id. Be concise and helpful. Reply in markdown.`;

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
    for (let step = 0; step < 6; step++) {
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
