"use client";

import { useRef, useState } from "react";
import { Panel } from "./ui/panel";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "helper";
  text: string;
  source?: "llm" | "graph";
}

const SUGGESTIONS = [
  "Why is food expensive?",
  "Why is everyone happy?",
  "What did the mayor do?",
  "Why did more people come?",
];

export function HistorianChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((current) => [
      ...current,
      { id: `u_${Date.now()}`, role: "user", text: trimmed },
    ]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const answer = await api.ask(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: `h_${Date.now()}`,
          role: "helper",
          text: answer.answer,
          source: answer.source,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No answer right now.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    }
  }

  return (
    <Panel
      title="Ask About Your Town"
      subtitle="Type a question and get an answer"
      bodyClassName="flex flex-col gap-2 overflow-hidden"
      className="max-h-[480px]"
    >
      <ul
        ref={listRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
      >
        {messages.length === 0 ? (
          <li className="text-sm text-[#4a4f57]">
            Curious about your town? Ask anything — like why food is expensive.
          </li>
        ) : null}
        {messages.map((message) => (
          <li
            key={message.id}
            className={`border-2 px-3 py-2 text-sm leading-relaxed ${
              message.role === "user"
                ? "border-[#3a5f80] bg-[#aac6e0] text-[#0e1c2a]"
                : "border-[#3a3a3a] bg-[#8b8b8b] text-[#16181c]"
            }`}
          >
            {message.role === "helper" && message.source ? (
              <div className="mb-1">
                <Badge
                  tone={message.source === "llm" ? "emerald" : "amber"}
                >
                  {message.source === "llm" ? "🤖 Helper" : "📖 Town Book"}
                </Badge>
              </div>
            ) : null}
            {message.text}
          </li>
        ))}
        {loading ? (
          <li className="text-sm text-[#4a4f57]">Thinking… 🤔</li>
        ) : null}
        {error ? (
          <li className="text-sm font-bold text-[#7a1d12]">{error}</li>
        ) : null}
      </ul>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            disabled={loading}
            className="mc-btn px-2.5 py-1 text-xs font-bold disabled:opacity-60"
          >
            {prompt}
          </button>
        ))}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(input);
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question…"
          maxLength={500}
          className="mc-inset min-w-0 flex-1 px-3 py-2 text-sm outline-none placeholder:text-[#4a4f57]"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          Ask
        </Button>
      </form>
    </Panel>
  );
}
