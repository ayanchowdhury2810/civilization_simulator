"use client";

import { Panel } from "./ui/panel";
import { Button } from "./ui/button";
import { BUILDING_COSTS } from "@/lib/api";
import {
  BUILDING_EMOJI,
  BUILDING_HELP,
  BUILDING_LABEL,
  policyBenefit,
  policyButtonLabel,
  policyPlainReason,
} from "@/lib/labels";
import type {
  BuildingType,
  MayorView,
  Policy,
  PolicyStatus,
  WorldSnapshot,
} from "@/lib/types";

const STATUS_TEXT: Record<PolicyStatus, string> = {
  pending: "Waiting",
  approved: "Done",
  ignored: "Skipped",
};

const STATUS_EMOJI: Record<PolicyStatus, string> = {
  pending: "⏳",
  approved: "✅",
  ignored: "➖",
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
    <Panel title="What Should We Do?" subtitle="The mayor has an idea for you">
      <div className="space-y-3">
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3">
          {policy ? (
            <div className="space-y-2">
              <p className="text-sm font-extrabold text-amber-900">
                💡 {policyPlainReason(policy.action)}
              </p>
              {policyBenefit(policy.action) ? (
                <p className="text-xs text-amber-700">
                  {policyBenefit(policy.action)}
                </p>
              ) : null}
              <Button
                variant="primary"
                disabled={busy === "approve"}
                onClick={() => onApprove(policy.id)}
                className="w-full"
              >
                {busy === "approve" ? "Doing it…" : policyButtonLabel(policy.action)}
              </Button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-amber-800">
              The mayor is thinking… 💭
            </p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-slate-500">
            🛠️ Build something ({gold} gold)
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
                  title={gold < cost ? `Need ${cost} gold` : BUILDING_HELP[type]}
                  className="flex-col gap-1 py-2.5"
                >
                  <span className="text-xl">{BUILDING_EMOJI[type]}</span>
                  <span className="text-xs">{BUILDING_LABEL[type]}</span>
                  <span className="text-xs text-amber-600">{cost} 🪙</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-slate-500">
            📜 Past ideas
          </p>
          <ul className="space-y-1">
            {(mayor?.recentPolicies ?? []).length === 0 ? (
              <li className="text-xs text-slate-400">Nothing yet.</li>
            ) : (
              (mayor?.recentPolicies ?? []).slice(0, 5).map((item: Policy) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5"
                >
                  <span className="truncate text-xs font-semibold text-slate-600">
                    {policyPlainReason(item.action)}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-slate-500">
                    {STATUS_EMOJI[item.status]} {STATUS_TEXT[item.status]}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
