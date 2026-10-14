"use client";

import { useMemo } from "react";
import { Panel } from "./ui/panel";
import { eventTone } from "@/lib/format";
import type { SimEvent } from "@/lib/types";

export function TimelinePanel({ events }: { events: SimEvent[] }) {
  const groups = useMemo(() => {
    const byTick = new Map<number, SimEvent[]>();
    for (const event of events) {
      const bucket = byTick.get(event.tick);
      if (bucket) bucket.push(event);
      else byTick.set(event.tick, [event]);
    }
    return [...byTick.entries()]
      .sort((a, b) => b[0] - a[0])
      .slice(0, 24);
  }, [events]);

  return (
    <Panel
      title="Timeline"
      subtitle="History grouped by tick, newest first"
      bodyClassName="overflow-x-auto"
    >
      {groups.length === 0 ? (
        <p className="text-xs text-zinc-600">History will appear here.</p>
      ) : (
        <div className="flex gap-3">
          {groups.map(([tick, tickEvents]) => (
            <div
              key={tick}
              className="min-w-[200px] shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2"
            >
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                Tick {tick}
              </p>
              <ul className="space-y-1">
                {tickEvents.slice(0, 8).map((event) => (
                  <li key={event.id} className="text-[11px] leading-snug">
                    <span className={`font-semibold ${eventTone(event.type)}`}>
                      {event.type}
                    </span>
                    <span className="block truncate text-zinc-500">
                      {event.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
