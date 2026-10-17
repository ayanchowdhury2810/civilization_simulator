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
              className={`border-2 px-2 py-0.5 text-xs font-bold transition-colors ${
                filter === item.label
                  ? "border-[#14161a] bg-[#3f7d2e] text-white"
                  : "border-[#5b5b5b] bg-[#d4d4d4] text-[#2b2b2b] hover:bg-[#c6c6c6]"
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
          <li className="text-sm text-[#4a4f57]">
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
                  className="mc-inset flex w-full items-center gap-2 px-2.5 py-2 text-left transition-[filter] enabled:hover:brightness-110 disabled:cursor-default"
                >
                  <span className="shrink-0 text-lg">
                    {eventEmoji(event.type)}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {plainMessage(event.message)}
                  </span>
                  <span className="shrink-0 border-2 border-[#5b5b5b] bg-[#c6c6c6] px-2 py-0.5 text-xs font-bold text-[#2b2b2b]">
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
