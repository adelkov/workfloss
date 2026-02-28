import { useRef, useEffect, useState, useCallback, useMemo, type FormEvent, type ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Send, Bot, User, Loader2, BrainCircuit, Check, X, Paperclip, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageParts } from "@/components/message-parts";
import { isRenderable } from "@/components/message-parts-utils";

const ACCEPTED_FILE_TYPES = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.csv";

interface ChatWindowProps {
  documentId: Id<"documents">;
  threadId: string;
}

export function ChatWindow({ documentId, threadId }: ChatWindowProps) {
  const { results, status, loadMore } = useUIMessages(
    api.features.chat.listMessages,
    { threadId },
    { initialNumItems: 50 },
  );
  const sendMessage = useMutation(api.features.chat.sendMessage);
  const generateUploadUrl = useMutation(api.features.chat.generateUploadUrl);
  const pendingMemories = useQuery(api.features.memory.getPendingMemories, {
    threadId,
  });
  const confirmMemory = useMutation(api.features.memory.confirmMemory);
  const rejectMemory = useMutation(api.features.memory.rejectMemory);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedStorageId, setUploadedStorageId] = useState<Id<"_storage"> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = results;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setUploadedStorageId(storageId);
    } catch {
      setSelectedFile(null);
      setUploadedStorageId(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [generateUploadUrl]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadedStorageId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const fileArgs = uploadedStorageId && selectedFile
      ? { storageId: uploadedStorageId, fileName: selectedFile.name, mimeType: selectedFile.type }
      : {};

    setInput("");
    clearFile();
    setSending(true);
    try {
      await sendMessage({ documentId, prompt: text, ...fileArgs });
    } finally {
      setSending(false);
    }
  };

  const isAgentTyping =
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";

  const lastAssistantKey = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].key;
    }
    return null;
  }, [messages]);

  const handleWidgetSelect = useCallback(
    async (label: string) => {
      if (sending) return;
      setSending(true);
      try {
        await sendMessage({ documentId, prompt: label });
      } finally {
        setSending(false);
      }
    },
    [sending, sendMessage, documentId],
  );

  return (
    <div className="flex h-full flex-col border-r">
      <div className="border-b px-4 py-2">
        <span className="text-sm font-medium">Chat</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {status === "LoadingFirstPage" ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Bot className="h-8 w-8" />
            <p>Send a message to start editing your document.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {status === "CanLoadMore" && (
              <button
                onClick={() => loadMore(20)}
                className="mx-auto block text-xs text-muted-foreground hover:underline"
              >
                Load earlier messages
              </button>
            )}
            {messages.map((msg) => {
              const parts = (msg.parts ?? []) as Array<Record<string, unknown>>;
              const renderable = parts.filter(isRenderable);
              if (renderable.length === 0 && !msg.text) return null;

              let attachedFileName: string | null = null;
              let displayText = msg.text;
              if (msg.role === "user" && msg.text?.startsWith("📎 ")) {
                const newlineIdx = msg.text.indexOf("\n");
                if (newlineIdx !== -1) {
                  attachedFileName = msg.text.slice(2, newlineIdx).trim();
                  displayText = msg.text.slice(newlineIdx + 1);
                }
              }

              return (
                <div
                  key={msg.key}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role !== "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {attachedFileName ? (
                      <>
                        <span className="mb-1.5 inline-flex items-center gap-1 rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[11px] font-medium">
                          <Paperclip className="h-3 w-3" />
                          {attachedFileName}
                        </span>
                        <div>{displayText}</div>
                      </>
                    ) : renderable.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <MessageParts
                          parts={renderable}
                          disabled={msg.key !== lastAssistantKey || sending}
                          onWidgetSelect={handleWidgetSelect}
                        />
                      </div>
                    ) : (
                      <div>{displayText}</div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
            {pendingMemories?.map((memory) => (
              <div
                key={memory._id}
                className="mx-auto w-full max-w-[90%] rounded-lg border border-border bg-card p-3"
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Save to memory?
                </div>
                <p className="mb-1 text-sm">"{memory.content}"</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  {memory.category.replace("_", " ")}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rejectMemory({ memoryId: memory._id })}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => confirmMemory({ memoryId: memory._id })}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
            {(sending || isAgentTyping) && (
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t">
        {selectedFile && (
          <div className="flex items-center gap-2 px-3 pt-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3 shrink-0" />
              {selectedFile.name}
              {uploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <button type="button" onClick={clearFile} className="ml-0.5 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={sending || uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || uploading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
