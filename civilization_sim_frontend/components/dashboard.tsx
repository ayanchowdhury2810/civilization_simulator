"use client";

import { useCallback, useState } from "react";
import { ResourcePanel } from "./resource-panel";
import { WorldMap } from "./world-map";
import { HistorianChat } from "./historian-chat";
import { MayorPanel } from "./mayor-panel";
import { EventFeed } from "./event-feed";
import { SelectedEntityPanel } from "./selected-entity-panel";
import { TimelinePanel } from "./timeline-panel";
import { Button } from "./ui/button";
import { api } from "@/lib/api";
import { useCivilization } from "@/lib/use-civilization";
import type { BuildingType, SelectedEntity } from "@/lib/types";

interface Notice {
  tone: "success" | "error";
  text: string;
}

export function Dashboard() {
  const { world, events, mayor, connected, error, lastUpdated, refresh } =
    useCivilization();
  const [selected, setSelected] = useState<SelectedEntity>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const flash = useCallback((next: Notice) => {
    setNotice(next);
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const handleApprove = useCallback(
    async (policyId?: string) => {
      setBusy("approve");
      try {
        const result = await api.approvePolicy(policyId);
        flash({
          tone: "success",
          text: result.building
            ? `Approved "${result.policy.name}" — built ${result.building.id}.`
            : `Approved "${result.policy.name}".`,
        });
        await refresh();
      } catch (err) {
        flash({
          tone: "error",
          text: err instanceof Error ? err.message : "Approval failed.",
        });
      } finally {
        setBusy(null);
      }
    },
    [flash, refresh],
  );

  const handleBuild = useCallback(
    async (type: BuildingType) => {
      setBusy(`build:${type}`);
      try {
        const result = await api.build(type);
        flash({
          tone: "success",
          text: `Built ${result.building.type} (${result.building.id}).`,
        });
        setSelected({ kind: "building", id: result.building.id });
        await refresh();
      } catch (err) {
        flash({
          tone: "error",
          text: err instanceof Error ? err.message : "Build failed.",
        });
      } finally {
        setBusy(null);
      }
    },
    [flash, refresh],
  );

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 p-3 lg:p-4">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-zinc-100">
            AI Civilization Simulator
          </h1>
          <p className="text-[11px] text-zinc-500">
            You are the King. Approve the mayor, build, and watch the graph grow.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-400" : "bg-rose-500"
              }`}
            />
            {connected ? "live" : "offline"}
          </span>
          <span className="font-mono">
            {lastUpdated
              ? `updated ${new Date(lastUpdated).toLocaleTimeString()}`
              : "—"}
          </span>
          <Button variant="ghost" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>
      </header>

      {notice ? (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            notice.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/30 bg-rose-500/10 text-rose-200"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <ResourcePanel world={world} />
        </div>
        <div className="lg:col-span-6">
          <WorldMap world={world} selected={selected} onSelect={setSelected} />
        </div>
        <div className="lg:col-span-3">
          <HistorianChat />
        </div>

        <div className="lg:col-span-4">
          <MayorPanel
            mayor={mayor}
            world={world}
            busy={busy}
            onApprove={handleApprove}
            onBuild={handleBuild}
          />
        </div>
        <div className="lg:col-span-4">
          <EventFeed events={events} onSelect={setSelected} />
        </div>
        <div className="lg:col-span-4">
          <SelectedEntityPanel
            selected={selected}
            world={world}
            onClear={() => setSelected(null)}
          />
        </div>

        <div className="lg:col-span-12">
          <TimelinePanel events={events} />
        </div>
      </div>
    </div>
  );
}
