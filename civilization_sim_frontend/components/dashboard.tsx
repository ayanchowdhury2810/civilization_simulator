"use client";

import { useCallback, useState } from "react";
import { ResourcePanel } from "./resource-panel";
import { WorldMap } from "./world-map";
import { HistorianChat } from "./historian-chat";
import { MayorPanel } from "./mayor-panel";
import { EventFeed } from "./event-feed";
import { SelectedEntityPanel } from "./selected-entity-panel";
import { Button } from "./ui/button";
import { api } from "@/lib/api";
import { useCivilization } from "@/lib/use-civilization";
import { BUILDING_LABEL } from "@/lib/labels";
import type { BuildingType, SelectedEntity } from "@/lib/types";

interface Notice {
  tone: "success" | "error";
  text: string;
}

export function Dashboard() {
  const { world, events, mayor, connected, error, refresh } = useCivilization();
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
            ? `Yay! You built a ${BUILDING_LABEL[result.building.type].toLowerCase()}!`
            : "Okay! The mayor did it.",
        });
        await refresh();
      } catch (err) {
        flash({
          tone: "error",
          text: err instanceof Error ? err.message : "That did not work.",
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
          text: `You built a ${BUILDING_LABEL[result.building.type].toLowerCase()}! 🎉`,
        });
        setSelected({ kind: "building", id: result.building.id });
        await refresh();
      } catch (err) {
        flash({
          tone: "error",
          text: err instanceof Error ? err.message : "That did not work.",
        });
      } finally {
        setBusy(null);
      }
    },
    [flash, refresh],
  );

  return (
    <div className="flex w-full flex-col lg:h-[100dvh]">
      <header className="mc-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-xl font-bold text-[#16181c]">
            🏰 My Little Town
          </h1>
          <p className="text-sm font-medium text-[#4a4f57]">
            You are the King! Help your people grow and stay happy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2b2b2b]">
            <span
              className={`h-2.5 w-2.5 border border-black/40 ${
                connected ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {connected ? "Live" : "Offline"}
          </span>
          <Button variant="secondary" onClick={() => void refresh()}>
            Refresh 🔄
          </Button>
        </div>
      </header>

      {notice ? (
        <div
          className={`mx-3 mt-3 border-2 px-3 py-2 text-sm font-bold ${
            notice.tone === "success"
              ? "border-[#3f7d2e] bg-[#a7d98f] text-[#12300a]"
              : "border-[#a5382c] bg-[#eaa79e] text-[#3d0f0a]"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {error ? (
        <div className="mx-3 mt-3 border-2 border-[#a5382c] bg-[#eaa79e] px-3 py-2 text-sm font-bold text-[#3d0f0a]">
          {error}
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[300px_minmax(0,1fr)_340px] lg:overflow-hidden">
        <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
          <ResourcePanel world={world} />
          <MayorPanel
            mayor={mayor}
            world={world}
            busy={busy}
            onApprove={handleApprove}
            onBuild={handleBuild}
          />
        </div>

        <div className="flex min-h-0 flex-col">
          <WorldMap world={world} selected={selected} onSelect={setSelected} />
        </div>

        <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
          <HistorianChat />
          <EventFeed events={events} onSelect={setSelected} />
          <SelectedEntityPanel
            selected={selected}
            world={world}
            onClear={() => setSelected(null)}
          />
        </div>
      </div>
    </div>
  );
}
