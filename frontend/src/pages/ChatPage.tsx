import { useState, type FormEvent } from "react";
import { sendChat } from "../api/ai";
import { RequestError } from "../api/client";
import { Button, Card, ErrorBanner, Textarea } from "../components/ui/Field";

type Bubble = { role: "user" | "assistant"; content: string; toolsUsed?: string[] };

export function ChatPage() {
  const [messages, setMessages] = useState<Bubble[]>([
    {
      role: "assistant",
      content:
        "I can log meals, check or update goals, and summarize your week. Try “What did I eat this week?” or “Log 200g oatmeal for breakfast, 150 kcal.”",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next: Bubble[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const history = next
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));
      const result = await sendChat(history);
      setMessages([
        ...next,
        { role: "assistant", content: result.reply, toolsUsed: result.toolsUsed },
      ]);
    } catch (err) {
      setError(err instanceof RequestError ? err.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-4xl text-forest">Chat</h1>
        <p className="text-sm text-ink/55">
          Natural-language actions reuse the same goal, diary, and report services as the rest of the app.
        </p>
      </header>

      <Card className="space-y-4">
        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[42rem] rounded-2xl px-4 py-3 text-sm ${
                message.role === "user" ? "ml-auto bg-forest text-cream" : "bg-cream text-ink"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.toolsUsed && message.toolsUsed.length > 0 && (
                <p className="mt-2 text-xs text-ink/50">Used: {message.toolsUsed.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
        <ErrorBanner message={error} />
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={onSubmit}>
          <Textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about this week, or log a meal…"
            className="md:flex-1"
          />
          <Button type="submit" disabled={busy} className="md:self-end">
            {busy ? "Thinking…" : "Send"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
