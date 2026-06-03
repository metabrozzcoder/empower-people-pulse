import { useEffect, useRef, useState } from "react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
const supabase = supabaseClient as any;
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Loader2, MessageSquarePlus, Trash2, Sparkles, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type Thread = { id: string; title: string; created_at: string };
type Msg = { id: string; role: "user" | "assistant"; content: any; created_at: string };

export default function Assistant() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [typingId, setTypingId] = useState<string | null>(null);
  const [typingText, setTypingText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const userId = currentUser?.id;

  const loadThreads = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("assistant_threads")
      .select("*")
      .order("created_at", { ascending: false });
    setThreads((data ?? []) as Thread[]);
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from("assistant_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Msg[]);
  };

  useEffect(() => { loadThreads(); /* eslint-disable-next-line */ }, [userId]);
  useEffect(() => {
    if (activeThread) loadMessages(activeThread);
    else setMessages([]);
  }, [activeThread]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading, typingText]);

  const newThread = () => {
    setActiveThread(null);
    setMessages([]);
  };

  const deleteThread = async (id: string) => {
    if (!confirm(t("assistant.confirmDelete", "Delete this conversation?"))) return;
    await supabase.from("assistant_messages").delete().eq("thread_id", id);
    await supabase.from("assistant_threads").delete().eq("id", id);
    setThreads((p) => p.filter((x) => x.id !== id));
    if (activeThread === id) { setActiveThread(null); setMessages([]); }
  };

  const clearAll = async () => {
    if (!userId) return;
    if (!confirm(t("assistant.confirmClearAll", "Delete all conversations?"))) return;
    const ids = threads.map((t) => t.id);
    if (ids.length) {
      await supabase.from("assistant_messages").delete().in("thread_id", ids);
      await supabase.from("assistant_threads").delete().in("id", ids);
    }
    setThreads([]);
    setActiveThread(null);
    setMessages([]);
  };

  const startRename = (th: Thread, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(th.id);
    setEditingTitle(th.title);
  };

  const saveRename = async (id: string) => {
    const title = editingTitle.trim() || "Untitled";
    await supabase.from("assistant_threads").update({ title }).eq("id", id);
    setThreads((p) => p.map((x) => (x.id === id ? { ...x, title } : x)));
    setEditingId(null);
  };

  const animateTyping = (id: string, fullText: string) => {
    setTypingId(id);
    setTypingText("");
    let i = 0;
    const step = Math.max(1, Math.floor(fullText.length / 400));
    const interval = setInterval(() => {
      i += step;
      if (i >= fullText.length) {
        setTypingText(fullText);
        clearInterval(interval);
        setTimeout(() => { setTypingId(null); setTypingText(""); }, 50);
      } else {
        setTypingText(fullText.slice(0, i));
      }
    }, 15);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !userId) return;
    let threadId = activeThread;
    if (!threadId) {
      const { data } = await supabase
        .from("assistant_threads")
        .insert({ user_id: userId, title: text.slice(0, 60) })
        .select("*").single();
      if (!data) return;
      threadId = data.id;
      setThreads((p) => [data as Thread, ...p]);
      setActiveThread(threadId);
    }
    const userMsg: Msg = {
      id: crypto.randomUUID(), role: "user",
      content: { type: "text", text }, created_at: new Date().toISOString(),
    };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setChatLoading(true);
    await supabase.from("assistant_messages").insert({
      thread_id: threadId, user_id: userId, role: "user",
      content: { type: "text", text },
    });

    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content?.text ?? (typeof m.content === "string" ? m.content : ""),
    }));

    try {
      const { data, error } = await supabase.functions.invoke("assistant-chat", {
        body: { messages: history, threadId },
      });
      if (error) throw error;
      const reply = (data as any)?.reply ?? "";
      const aMsg: Msg = {
        id: crypto.randomUUID(), role: "assistant",
        content: { type: "text", text: reply }, created_at: new Date().toISOString(),
      };
      setMessages((p) => [...p, aMsg]);
      animateTyping(aMsg.id, reply);
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  const suggestions = [
    t("assistant.suggest1", "Write a professional email to a client"),
    t("assistant.suggest2", "Summarize a long article I'll paste"),
    t("assistant.suggest3", "Plan my week as an HR manager"),
    t("assistant.suggest4", "Explain a complex topic simply"),
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-0 h-[calc(100vh-7rem)] border rounded-lg overflow-hidden bg-card">
      {/* Sidebar */}
      <div className="border-r flex flex-col bg-muted/30 min-h-0">
        <div className="p-3 border-b space-y-2">
          <Button className="w-full" onClick={newThread}>
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            {t("assistant.newChat", "New chat")}
          </Button>
          {threads.length > 0 && (
            <Button variant="outline" size="sm" className="w-full" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              {t("assistant.clearAll", "Clear all")}
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {threads.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6">
                {t("assistant.noChats", "No conversations yet")}
              </div>
            )}
            {threads.map((th) => (
              <div
                key={th.id}
                onClick={() => editingId !== th.id && setActiveThread(th.id)}
                className={`group flex items-center gap-1 rounded-md px-2 py-2 text-sm cursor-pointer transition ${
                  activeThread === th.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                }`}
              >
                {editingId === th.id ? (
                  <>
                    <Input
                      autoFocus
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(th.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 text-sm flex-1"
                    />
                    <Check
                      className="h-3.5 w-3.5 hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); saveRename(th.id); }}
                    />
                    <X
                      className="h-3.5 w-3.5 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                    />
                  </>
                ) : (
                  <>
                    <span className="truncate flex-1">{th.title}</span>
                    <Pencil
                      className="h-3.5 w-3.5 opacity-60 hover:opacity-100 hover:text-primary"
                      onClick={(e) => startRename(th, e)}
                    />
                    <Trash2
                      className="h-3.5 w-3.5 opacity-60 hover:opacity-100 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteThread(th.id); }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex flex-col min-h-0">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold">{t("assistant.title", "AI Assistant")}</span>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto w-full px-4 py-6">
            {messages.length === 0 && !chatLoading ? (
              <div className="flex flex-col items-center justify-center text-center py-16 gap-6">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">
                    {t("assistant.greeting", "How can I help you today?")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("assistant.greetingSub", "Ask anything, get information, or have me do a task for you.")}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-left text-sm rounded-lg border p-3 hover:bg-accent transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m) => {
                  const isTyping = m.id === typingId;
                  const display = isTyping ? typingText : (m.content?.text ?? "");
                  return (
                    <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                      {m.role === "assistant" && (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Brain className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 max-w-[80%] whitespace-pre-wrap text-sm"
                            : "text-sm whitespace-pre-wrap leading-relaxed max-w-[85%]"
                        }
                      >
                        {display}
                        {isTyping && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary align-middle animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("assistant.thinking", "Thinking…")}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <Textarea
              rows={1}
              placeholder={t("assistant.askAnything", "Message AI Assistant…")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              className="resize-none min-h-[44px] max-h-40 rounded-2xl"
            />
            <Button onClick={sendMessage} disabled={chatLoading || !input.trim()} size="icon" className="h-11 w-11 rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t("assistant.disclaimer", "AI can make mistakes. Verify important info.")}
          </p>
        </div>
      </div>
    </div>
  );
}
