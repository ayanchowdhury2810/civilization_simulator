"use client";

import { useEffect, useState } from "react";
import { Panel } from "./ui/panel";
import { Button } from "./ui/button";
import { CitizenCard } from "./citizen-card";
import { BuildingCard } from "./building-card";
import { api } from "@/lib/api";
import { BUILDING_EMOJI } from "@/lib/labels";
import type { CitizenDetail, SelectedEntity, WorldSnapshot } from "@/lib/types";

function CitizenDetails({ id, tick }: { id: string; tick: number }) {
  const [citizen, setCitizen] = useState<CitizenDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getCitizen(id)
      .then((data) => {
        if (active) {
          setCitizen(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, tick]);

  if (error) return <p className="text-sm font-bold text-[#7a1d12]">{error}</p>;
  if (loading && !citizen)
    return <p className="text-sm text-[#4a4f57]">Loading…</p>;
  if (!citizen)
    return <p className="text-sm text-[#4a4f57]">Cannot find this person.</p>;
  return <CitizenCard citizen={citizen} />;
}

export function SelectedEntityPanel({
  selected,
  world,
  onClear,
}: {
  selected: SelectedEntity;
  world: WorldSnapshot | null;
  onClear: () => void;
}) {
  const building =
    selected?.kind === "building"
      ? (world?.buildings.find((item) => item.id === selected.id) ?? null)
      : null;

  return (
    <Panel
      title="Look Closer"
      actions={
        selected ? (
          <Button variant="ghost" onClick={onClear}>
            Close ✕
          </Button>
        ) : undefined
      }
    >
      {!selected ? (
        <p className="text-sm text-[#4a4f57]">
          Tap a person or a building in the town to see what they are doing.
        </p>
      ) : selected.kind === "building" ? (
        building ? (
          <BuildingCard building={building} />
        ) : (
          <p className="text-sm font-bold text-[#7a1d12]">
            {BUILDING_EMOJI["House"]} The building is gone.
          </p>
        )
      ) : (
        <CitizenDetails
          key={selected.id}
          id={selected.id}
          tick={world?.tick ?? 0}
        />
      )}
    </Panel>
  );
}
