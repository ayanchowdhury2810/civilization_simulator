"use client";

import { useMemo, useState } from "react";
import { Panel } from "./ui/panel";
import { eventEmoji, plainMessage } from "@/lib/labels";
import type { SelectedEntity, SimEvent } from "@/lib/types";

const FILTERS: { label: string; test: RegExp }[] = [
  { label: "All", test: /.*/ },
  { label: "Food", test: /shortage|yield|food|trade|boom/i },
  { label: "Jobs", test: /job|worker|merchant|farmer/i },
  { label: "People", test: /arriv|citizen|sick/i },
  { label: "Building", test: /built|approved|proposed|created/i },
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
      title="What's Happening"
      subtitle="The story of your town"
      actions={
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setFilter(item.label)}
              className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                filter === item.label
                  ? "bg-sky-500 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      bodyClassName="overflow-y-auto"
      className="max-h-[420px]"
    >
      <ul className="space-y-1.5">
        {filtered.length === 0 ? (
          <li className="text-sm text-slate-400">
            Nothing here yet. Wait and see what happens!
          </li>
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
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-left transition-colors enabled:hover:border-sky-200 enabled:hover:bg-sky-50 disabled:cursor-default"
                >
                  <span className="shrink-0 text-lg">
                    {eventEmoji(event.type)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-slate-700">
                    {plainMessage(event.message)}
                  </span>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-400">
                    Day {event.tick}
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
