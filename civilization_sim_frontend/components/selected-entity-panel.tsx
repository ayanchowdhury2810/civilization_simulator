"use client";

import { useEffect, useState } from "react";
import { Panel } from "./ui/panel";
import { Button } from "./ui/button";
import { CitizenCard } from "./citizen-card";
import { BuildingCard } from "./building-card";
import { api } from "@/lib/api";
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

  if (error) return <p className="text-xs text-rose-300">{error}</p>;
  if (loading && !citizen)
    return <p className="text-xs text-zinc-500">Loading citizen…</p>;
  if (!citizen)
    return <p className="text-xs text-zinc-500">Citizen not found.</p>;
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
      title="Selected Entity"
      actions={
        selected ? (
          <Button variant="ghost" onClick={onClear}>
            Clear
          </Button>
        ) : undefined
      }
    >
      {!selected ? (
        <p className="text-xs text-zinc-500">
          Nothing selected. Click a citizen or building on the map to inspect it.
        </p>
      ) : selected.kind === "building" ? (
        building ? (
          <BuildingCard building={building} />
        ) : (
          <p className="text-xs text-rose-300">Building not found.</p>
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
