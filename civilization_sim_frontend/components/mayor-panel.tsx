"use client";

import { Panel } from "./ui/panel";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { BUILDING_COSTS } from "@/lib/api";
import type {
  BuildingType,
  MayorView,
  Policy,
  PolicyAction,
  PolicyStatus,
  WorldSnapshot,
} from "@/lib/types";

const ACTION_TONE: Record<PolicyAction, "emerald" | "indigo" | "zinc"> = {
  BuildFarm: "emerald",
  BuildHouse: "indigo",
  DoNothing: "zinc",
};

const STATUS_TONE: Record<PolicyStatus, "amber" | "emerald" | "zinc"> = {
  pending: "amber",
  approved: "emerald",
  ignored: "zinc",
};

const BUILD_TYPES: BuildingType[] = ["Farm", "House", "Market"];

export function MayorPanel({
  mayor,
  world,
  busy,
  onApprove,
  onBuild,
}: {
  mayor: MayorView | null;
  world: WorldSnapshot | null;
  busy: string | null;
  onApprove: (policyId?: string) => void;
  onBuild: (type: BuildingType) => void;
}) {
  const policy = mayor?.currentPolicy ?? null;
  const gold = world?.resources.gold ?? 0;

  return (
    <Panel
      title="Mayor & King"
      subtitle={mayor?.loopRunning ? "Mayor evaluates every 2 minutes" : "Mayor idle"}
      actions={
        policy ? (
          <Badge tone={ACTION_TONE[policy.action]}>{policy.action}</Badge>
        ) : null
      }
      bodyClassName="space-y-3 overflow-y-auto"
    >
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
        {policy ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-100">
                {policy.name}
              </p>
              <span className="font-mono text-[10px] text-zinc-500">
                {policy.id}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              {policy.reason}
            </p>
            {policy.triggeredByEventId ? (
              <p className="font-mono text-[10px] text-zinc-600">
                triggered by {policy.triggeredByEventId}
              </p>
            ) : null}
            <Button
              variant="primary"
              disabled={busy === "approve"}
              onClick={() => onApprove(policy.id)}
              className="w-full"
            >
              {busy === "approve"
                ? "Approving…"
                : policy.action === "DoNothing"
                  ? "Acknowledge"
                  : `Approve & ${policy.name}`}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            No suggestion yet. The mayor will propose one shortly.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
          King&apos;s build actions · {gold} gold
        </p>
        <div className="grid grid-cols-3 gap-2">
          {BUILD_TYPES.map((type) => {
            const cost = BUILDING_COSTS[type];
            const disabled = gold < cost || busy === `build:${type}`;
            return (
              <Button
                key={type}
                variant="secondary"
                disabled={disabled}
                onClick={() => onBuild(type)}
                title={gold < cost ? `Need ${cost} gold` : `Build ${type}`}
                className="flex-col gap-0.5 py-2"
              >
                <span>{type}</span>
                <span className="font-mono text-[10px] text-amber-300">
                  {cost}g
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
          Policy history
        </p>
        <ul className="space-y-1">
          {(mayor?.recentPolicies ?? []).length === 0 ? (
            <li className="text-[11px] text-zinc-600">No policies yet.</li>
          ) : (
            (mayor?.recentPolicies ?? []).slice(0, 6).map((item: Policy) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-md border border-zinc-800/70 bg-zinc-950/40 px-2 py-1"
              >
                <span className="truncate text-[11px] text-zinc-300">
                  {item.name}
                </span>
                <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
              </li>
            ))
          )}
        </ul>
      </div>
    </Panel>
  );
}
