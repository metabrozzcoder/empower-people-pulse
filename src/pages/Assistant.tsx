import { useEffect, useRef, useState } from "react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
const supabase = supabaseClient as any;
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Brain, Send, Link as LinkIcon, FileText, Image as ImageIcon, StickyNote,
  Plus, Trash2, Loader2, MessageSquarePlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type Kind = "bookmark" | "note" | "document" | "photo";
type Item = {
  id: string; kind: Kind; title: string; content: string | null;
  url: string | null; storage_path: string | null; tags: string[]; created_at: string;
};
type Thread = { id: string; title: string; created_at: string };
type Msg = { id: string; role: "user" | "assistant"; content: any; created_at: string };

const kindIcon: Record<Kind, any> = {
  bookmark: LinkIcon, note: StickyNote, document: FileText, photo: ImageIcon,
};

export default function Assistant() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<"all" | Kind>("all");
  const [search, setSearch] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);

  // capture inputs
  const [bookmarkUrl, setBookmarkUrl] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // chat
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const userId = currentUser?.id;

  const loadItems = async () => {
    if (!userId) return;
    setLoadingItems(true);
    const { data } = await supabase
      .from("assistant_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as Item[]);
    setLoadingItems(false);
  };

  const loadThreads = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("assistant_threads")
      .select("*")
      .order("created_at", { ascending: false });
    setThreads((data ?? []) as Thread[]);
    if (!activeThread && data && data.length) setActiveThread(data[0].id);
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from("assistant_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Msg[]);
  };

  useEffect(() => { loadItems(); loadThreads(); /* eslint-disable-next-line */ }, [userId]);
  useEffect(() => { if (activeThread) loadMessages(activeThread); }, [activeThread]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);

  const filtered = items.filter((it) => {
    if (tab !== "all" && it.kind !== tab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return it.title.toLowerCase().includes(q) || (it.content ?? "").toLowerCase().includes(q);
  });

  const addBookmark = async () => {
    if (!bookmarkUrl.trim() || !userId) return;
    let title = bookmarkUrl;
    try { title = new URL(bookmarkUrl).hostname; } catch { /* ignore */ }
    const { error } = await supabase.from("assistant_items").insert({
      user_id: userId, kind: "bookmark", title, url: bookmarkUrl,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setBookmarkUrl("");
    toast({ title: t("assistant.savedBookmark") });
    loadItems();
  };

  const addNote = async () => {
    if (!noteTitle.trim() || !userId) return;
    const { error } = await supabase.from("assistant_items").insert({
      user_id: userId, kind: "note", title: noteTitle, content: noteContent,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setNoteTitle(""); setNoteContent("");
    toast({ title: t("assistant.savedNote") });
    loadItems();
  };

  const uploadFile = async (file: File, kind: "document" | "photo") => {
    if (!userId) return;
    const bucket = kind === "photo" ? "assistant-photos" : "documents";
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
    if (upErr) return toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
    const { error } = await supabase.from("assistant_items").insert({
      user_id: userId, kind, title: file.name, storage_path: `${bucket}/${path}`,
      metadata: { size: file.size, type: file.type },
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: t("assistant.uploaded") });
    loadItems();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("assistant_items").delete().eq("id", id);
    loadItems();
  };

  const newThread = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("assistant_threads")
      .insert({ user_id: userId, title: t("assistant.newConversation") })
      .select("*").single();
    if (error) return;
    setThreads((p) => [data as Thread, ...p]);
    setActiveThread(data.id);
    setMessages([]);
  };

  const deleteThread = async (id: string) => {
    await supabase.from("assistant_threads").delete().eq("id", id);
    setThreads((p) => p.filter((x) => x.id !== id));
    if (activeThread === id) { setActiveThread(null); setMessages([]); }
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
      // Refresh items in case the assistant saved something
      loadItems();
    } catch (e: any) {
      toast({ title: "Error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 h-[calc(100vh-7rem)]">
      {/* LEFT: Library + capture */}
      <div className="flex flex-col gap-4 min-h-0">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">{t("assistant.title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t("assistant.subtitle")}</p>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">
            {t("assistant.capture")}
          </h2>
          <div className="flex gap-2">
            <Input
              placeholder={t("assistant.pasteUrl")}
              value={bookmarkUrl}
              onChange={(e) => setBookmarkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBookmark()}
            />
            <Button onClick={addBookmark}><LinkIcon className="h-4 w-4 mr-1" />{t("assistant.save")}</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-2">
              <Input placeholder={t("assistant.noteTitle")} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
              <Textarea rows={2} placeholder={t("assistant.noteContent")} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
              <Button size="sm" variant="secondary" onClick={addNote}>
                <StickyNote className="h-4 w-4 mr-1" />{t("assistant.saveNote")}
              </Button>
            </div>
            <div className="space-y-2">
              <input ref={fileRef} type="file" hidden onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "document")} />
              <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "photo")} />
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <FileText className="h-4 w-4 mr-1" />{t("assistant.uploadDoc")}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => photoRef.current?.click()}>
                <ImageIcon className="h-4 w-4 mr-1" />{t("assistant.uploadPhoto")}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="flex-1 flex flex-col p-4 min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <Input
              placeholder={t("assistant.searchLibrary")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="all">{t("assistant.all")} ({items.length})</TabsTrigger>
              <TabsTrigger value="bookmark">{t("assistant.bookmarks")}</TabsTrigger>
              <TabsTrigger value="note">{t("assistant.notes")}</TabsTrigger>
              <TabsTrigger value="document">{t("assistant.documents")}</TabsTrigger>
              <TabsTrigger value="photo">{t("assistant.photos")}</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="flex-1 min-h-0 mt-3">
              <ScrollArea className="h-full pr-2">
                {loadingItems ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : filtered.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">{t("assistant.empty")}</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filtered.map((it) => {
                      const Icon = kindIcon[it.kind];
                      return (
                        <Card key={it.id} className="p-3 group hover:shadow-md transition">
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{it.title}</div>
                              {it.url && (
                                <a href={it.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block">
                                  {it.url}
                                </a>
                              )}
                              {it.content && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{it.content}</div>}
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-[10px]">{it.kind}</Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(it.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 h-7 w-7"
                              onClick={() => deleteItem(it.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* RIGHT: Chat */}
      <Card className="flex flex-col min-h-0">
        <div className="p-3 border-b flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="font-semibold">{t("assistant.chatTitle")}</span>
          </div>
          <Button size="sm" variant="outline" onClick={newThread}>
            <MessageSquarePlus className="h-4 w-4 mr-1" />{t("assistant.newChat")}
          </Button>
        </div>
        {threads.length > 0 && (
          <ScrollArea className="border-b max-h-28">
            <div className="p-2 flex flex-wrap gap-1">
              {threads.map((th) => (
                <div
                  key={th.id}
                  className={`group flex items-center gap-1 rounded-md px-2 py-1 text-xs cursor-pointer ${
                    activeThread === th.id ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  }`}
                  onClick={() => setActiveThread(th.id)}
                >
                  <span className="truncate max-w-[140px]">{th.title}</span>
                  <Trash2
                    className="h-3 w-3 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); deleteThread(th.id); }}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <ScrollArea className="flex-1 p-3">
          {messages.length === 0 && !chatLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              {t("assistant.chatEmpty")}
            </div>
          )}
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="bg-primary text-primary-foreground rounded-2xl px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap">
                    {m.content?.text}
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content?.text}</div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> {t("assistant.thinking")}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>
        <div className="border-t p-2 flex gap-2">
          <Textarea
            rows={1}
            placeholder={t("assistant.askAnything")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            className="resize-none min-h-[40px] max-h-32"
          />
          <Button onClick={sendMessage} disabled={chatLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
