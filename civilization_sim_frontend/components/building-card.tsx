import { Badge } from "./ui/badge";
import type { Building } from "@/lib/types";

export function BuildingCard({ building }: { building: Building }) {
  const occupancy = building.type === "House" ? building.workerIds.length : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">
            {building.type}
          </p>
          <p className="font-mono text-[11px] text-zinc-500">{building.id}</p>
        </div>
        <Badge tone="indigo">{building.type}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
          <dt className="text-zinc-500">Workers</dt>
          <dd className="font-mono text-sm text-zinc-100">
            {building.workerIds.length}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
          <dt className="text-zinc-500">Capacity</dt>
          <dd className="font-mono text-sm text-zinc-100">
            {occupancy !== null ? building.capacity : "—"}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
          <dt className="text-zinc-500">Food / worker</dt>
          <dd className="font-mono text-sm text-zinc-100">
            {building.foodPerWorkerTick}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
          <dt className="text-zinc-500">Position</dt>
          <dd className="font-mono text-sm text-zinc-100">
            {building.x},{building.y}
          </dd>
        </div>
      </dl>

      {building.workerIds.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {building.workerIds.map((workerId) => (
            <Badge key={workerId} tone="emerald">
              {workerId}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-zinc-500">No assigned workers.</p>
      )}
    </div>
  );
}
