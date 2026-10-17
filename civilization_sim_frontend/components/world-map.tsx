"use client";

import { useEffect, useRef } from "react";
import { Panel } from "./ui/panel";
import type { BuildingType, SelectedEntity, WorldSnapshot } from "@/lib/types";
import type { TownGame } from "@/lib/game/town-scene";
import { BUILDING_LABEL } from "@/lib/labels";

const BUILDING_ORDER: BuildingType[] = ["Farm", "House", "Market"];

const BUILDING_SWATCH: Record<BuildingType, string> = {
  Farm: "#7a9a3c",
  House: "#c79a63",
  Market: "#e24b4b",
};

export function WorldMap({
  world,
  selected,
  onSelect,
}: {
  world: WorldSnapshot | null;
  selected: SelectedEntity;
  onSelect: (entity: SelectedEntity) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<TownGame | null>(null);
  const worldRef = useRef<WorldSnapshot | null>(world);
  const selectedRef = useRef<SelectedEntity>(selected);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let game: TownGame | null = null;

    void import("@/lib/game/town-scene").then(({ createTownGame }) => {
      if (cancelled) return;
      game = createTownGame(host, {
        onSelect: (entity) => onSelectRef.current(entity),
      });
      gameRef.current = game;
      game.applyWorld(worldRef.current);
      game.setSelected(selectedRef.current);
    });

    return () => {
      cancelled = true;
      gameRef.current = null;
      game?.destroy();
      game = null;
    };
  }, []);

  useEffect(() => {
    worldRef.current = world;
    gameRef.current?.applyWorld(world);
  }, [world]);

  useEffect(() => {
    selectedRef.current = selected;
    gameRef.current?.setSelected(selected);
  }, [selected]);

  return (
    <Panel
      title="The Town"
      subtitle="Click a villager or a building to inspect it"
      actions={
        <div className="hidden items-center gap-3 text-xs font-bold uppercase tracking-wide text-stone-300 sm:flex">
          {BUILDING_ORDER.map((type) => (
            <span key={type} className="inline-flex items-center gap-1.5">
              <span
                className="h-3 w-3 border border-black/60"
                style={{ backgroundColor: BUILDING_SWATCH[type] }}
              />
              {BUILDING_LABEL[type]}
            </span>
          ))}
        </div>
      }
      bodyClassName="p-0"
      className="min-h-[380px] flex-1"
    >
      <div className="relative h-full min-h-[340px] w-full overflow-hidden bg-[#6bb7ff]">
        <div ref={hostRef} className="absolute inset-0" />

        {!world ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="mc-inset px-4 py-3 text-sm font-bold">
              Generating terrain…
            </p>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
