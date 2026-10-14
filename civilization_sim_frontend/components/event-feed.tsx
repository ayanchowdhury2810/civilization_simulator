"use client";

import { useMemo, useState } from "react";
import { Panel } from "./ui/panel";
import { eventTone } from "@/lib/format";
import type { SelectedEntity, SimEvent } from "@/lib/types";

const FILTERS: { label: string; test: RegExp }[] = [
  { label: "All", test: /.*/ },
  { label: "Food", test: /shortage|yield|food|trade|boom/i },
  { label: "Jobs", test: /job|worker|merchant|farmer/i },
  { label: "People", test: /arriv|citizen|sick/i },
  { label: "Build", test: /built|approved|proposed/i },
];

export function EventFeed({
  events,
  onSelect,
}: {
  events: SimEvent[];
  onSelect: (entity: SelectedEntity) => void;
}) {
  const [filter, setFilter] = useState("All");
  const active = FILTERS.find((item) => item.label === filter) ?? FILTERS[0];

  const filtered = useMemo(
    () => events.filter((event) => active.test.test(event.type)),
    [events, active],
  );

  return (
    <Panel
      title="Event Feed"
      subtitle={`${filtered.length} events`}
      actions={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setFilter(item.label)}
              className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                filter === item.label
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      bodyClassName="overflow-y-auto"
      className="max-h-[360px]"
    >
      <ul className="space-y-1">
        {filtered.length === 0 ? (
          <li className="text-xs text-zinc-600">No events match this filter.</li>
        ) : (
          filtered.slice(0, 60).map((event) => {
            const entity: SelectedEntity = event.citizenId
              ? { kind: "citizen", id: event.citizenId }
              : event.buildingId
                ? { kind: "building", id: event.buildingId }
                : null;
            return (
              <li key={event.id}>
                <button
                  type="button"
                  disabled={!entity}
                  onClick={() => entity && onSelect(entity)}
                  className="flex w-full items-start gap-2 rounded-md border border-zinc-800/60 bg-zinc-950/40 px-2 py-1.5 text-left transition-colors enabled:hover:border-zinc-700 disabled:cursor-default"
                >
                  <span className="mt-0.5 shrink-0 rounded bg-zinc-800 px-1 font-mono text-[10px] text-zinc-400">
                    {event.tick}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-[11px] font-semibold ${eventTone(
                        event.type,
                      )}`}
                    >
                      {event.type}
                    </span>
                    <span className="block truncate text-[11px] text-zinc-400">
                      {event.message}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </Panel>
  );
}
