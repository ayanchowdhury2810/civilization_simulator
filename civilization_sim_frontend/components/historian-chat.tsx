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
          <li className="text-sm text-slate-400">
            Curious about your town? Ask anything — like why food is expensive.
          </li>
        ) : null}
        {messages.map((message) => (
          <li
            key={message.id}
            className={`rounded-2xl border px-3 py-2 text-sm leading-relaxed ${
              message.role === "user"
                ? "border-sky-200 bg-sky-50 text-slate-700"
                : "border-slate-100 bg-slate-50 text-slate-700"
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
          <li className="text-sm text-slate-400">Thinking… 🤔</li>
        ) : null}
        {error ? (
          <li className="text-sm text-rose-500">{error}</li>
        ) : null}
      </ul>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            disabled={loading}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 transition-colors enabled:hover:border-sky-300 enabled:hover:text-sky-600 disabled:opacity-50"
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
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          Ask
        </Button>
      </form>
    </Panel>
  );
}
