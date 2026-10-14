"use client";

import { useRef, useState } from "react";
import { Panel } from "./ui/panel";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { api } from "@/lib/api";
import type { ChatAnswer } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "historian";
  text: string;
  source?: "llm" | "graph";
  context?: ChatAnswer["context"];
}

const SUGGESTIONS = [
  "Why is food expensive?",
  "Why is happiness changing?",
  "What has the mayor done recently?",
  "Why did the population grow?",
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
          role: "historian",
          text: answer.answer,
          source: answer.source,
          context: answer.context,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The historian is silent.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    }
  }

  return (
    <Panel
      title="Historian"
      subtitle="GraphRAG — ask the world anything"
      actions={<Badge tone="sky">GraphRAG</Badge>}
      bodyClassName="flex flex-col gap-2 overflow-hidden"
      className="max-h-[480px]"
    >
      <ul
        ref={listRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
      >
        {messages.length === 0 ? (
          <li className="text-[11px] text-zinc-500">
            Ask why the civilization changed. The historian reads the FalkorDB
            event graph and explains cause chains.
          </li>
        ) : null}
        {messages.map((message) => (
          <li
            key={message.id}
            className={`rounded-lg border px-2.5 py-2 text-[11px] leading-relaxed ${
              message.role === "user"
                ? "border-zinc-700 bg-zinc-800/60 text-zinc-100"
                : "border-zinc-800 bg-zinc-950/60 text-zinc-300"
            }`}
          >
            {message.role === "historian" && message.source ? (
              <div className="mb-1 flex items-center gap-2">
                <Badge tone={message.source === "llm" ? "emerald" : "amber"}>
                  {message.source === "llm" ? "Gemini" : "Graph"}
                </Badge>
                {message.context ? (
                  <span className="font-mono text-[10px] text-zinc-600">
                    tick {message.context.tick} · pop{" "}
                    {message.context.population} · price{" "}
                    {message.context.foodPrice}
                  </span>
                ) : null}
              </div>
            ) : null}
            {message.text}
          </li>
        ))}
        {loading ? (
          <li className="text-[11px] text-zinc-500">The historian consults the graph…</li>
        ) : null}
        {error ? (
          <li className="text-[11px] text-rose-300">{error}</li>
        ) : null}
      </ul>

      <div className="flex flex-wrap gap-1">
        {SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => ask(prompt)}
            disabled={loading}
            className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400 transition-colors enabled:hover:border-zinc-600 enabled:hover:text-zinc-200 disabled:opacity-50"
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
          placeholder="Ask the historian…"
          maxLength={500}
          className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          Ask
        </Button>
      </form>
    </Panel>
  );
}
