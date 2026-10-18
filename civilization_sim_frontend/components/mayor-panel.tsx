"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel } from "./ui/panel";
import { Button } from "./ui/button";
import { api, BUILDING_COSTS } from "@/lib/api";
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
  MayorInvestigation,
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

const EVENT_LABELS: Record<string, string> = {
  FoodShortage: "Food shortage",
  FarmYieldLow: "Low farm output",
  FoodBought: "Food purchased",
  Trade: "Trade made",
  MarketBoom: "Busy market",
  WorkerLeftJob: "A worker left their job",
  CitizenArrived: "A new resident arrived",
  BuildingBuilt: "A building was built",
  CitizenSick: "A resident became ill",
};

function simpleEvidenceLabel(item: MayorInvestigation["evidence"][number]): string {
  if (item.kind === "event") return EVENT_LABELS[item.label] ?? item.label;
  if (item.kind === "relationship") {
    if (item.relationshipType === "CAUSED") return "Recorded cause link";
    if (item.relationshipType === "INVOLVED_IN") return "Connected town record";
    if (item.relationshipType === "TRIGGERED_BY") return "Event behind the suggestion";
    return "Town record connection";
  }
  if (item.label === "Food per citizen") return "Food for each resident";
  if (item.label === "Housing capacity") return "Homes available";
  if (item.label === "Average happiness") return "Residents’ happiness";
  if (item.label === "Persisted world snapshot") return "Saved town information";
  return item.label;
}

function simpleEvidenceDetail(item: MayorInvestigation["evidence"][number]): string {
  if (item.label === "Persisted world snapshot") {
    const snapshot = /tick (\d+): food ([\d.]+), population ([\d.]+)/.exec(item.detail);
    return snapshot
      ? `At town update ${snapshot[1]}, saved information showed ${snapshot[2]} food and ${snapshot[3]} residents.`
      : "A saved summary of the town was found.";
  }
  if (item.kind === "relationship") {
    if (item.relationshipType === "CAUSED") return "The town records explicitly connect two events by cause.";
    if (item.relationshipType === "INVOLVED_IN") return "The town records connect a resident or building with an event.";
    if (item.relationshipType === "TRIGGERED_BY") return "The Mayor linked this suggestion to a recorded event.";
    if (item.relationshipType === "CREATED") return "The Mayor saved this suggestion in the town records.";
    if (item.relationshipType === "APPROVED") return "The town records show this suggestion was approved.";
    if (item.relationshipType === "BUILT") return "The town records connect the player with a building.";
    return "A connection was found in the town records.";
  }
  return item.detail;
}

function evidenceSourceLabel(item: MayorInvestigation["evidence"][number]): string {
  if (item.provenance === "world_state") return "Current town information";
  if (item.provenance === "falkordb_record") return "Past town record";
  return "Mayor’s rule";
}

function qualityLabel(level: MayorInvestigation["evidenceQuality"]["level"]): string {
  if (level === "strong") return "A lot of supporting information";
  if (level === "moderate") return "Some supporting information";
  if (level === "none") return "No supporting information";
  return "A little supporting information";
}

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
  const investigationKey = policy ? `${policy.id}:${world?.tick ?? "unknown"}` : "none";
  const activeKey = useRef(investigationKey);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState<{ key: string; data: MayorInvestigation } | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const investigation = loaded?.key === investigationKey ? loaded.data : null;
  const visibleEvidence = investigation?.evidence.filter((item) => item.kind !== "entity") ?? [];
  const isLoading = loadingKey === investigationKey;
  const hasFailed = failedKey === investigationKey;

  useEffect(() => {
    activeKey.current = investigationKey;
  }, [investigationKey]);

  const fetchInvestigation = useCallback(async () => {
    if (!policy || (loaded?.key === investigationKey && !hasFailed)) return;
    const requestKey = investigationKey;
    setLoadingKey(requestKey);
    setFailedKey(null);
    try {
      const result = await api.getMayorInvestigation();
      if (activeKey.current === requestKey && result.recommendationId === policy.id) {
        setLoaded({ key: requestKey, data: result });
      }
    } catch {
      if (activeKey.current === requestKey) setFailedKey(requestKey);
    } finally {
      if (activeKey.current === requestKey) setLoadingKey(null);
    }
  }, [policy, investigationKey, loaded?.key, hasFailed]);

  const toggleInvestigation = () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    void fetchInvestigation();
  };

  useEffect(() => {
    if (expanded && policy && loaded?.key !== investigationKey && failedKey !== investigationKey && loadingKey !== investigationKey) {
      void Promise.resolve().then(fetchInvestigation);
    }
  }, [expanded, policy, loaded?.key, failedKey, loadingKey, investigationKey, fetchInvestigation]);

  return (
    <Panel title="What Should We Do?" subtitle="The mayor has an idea for you">
      <div className="space-y-3">
        <div className="border-2 border-[#a9832a] bg-[#e8c05a] p-3">
          {policy ? (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#3d2c07]">
                💡 {policyPlainReason(policy.action)}
              </p>
              {policyBenefit(policy.action) ? (
                <p className="text-xs font-semibold text-[#5c460f]">
                  {policyBenefit(policy.action)}
                </p>
              ) : null}
              <Button
                variant="ghost"
                aria-expanded={expanded}
                aria-controls="mayor-investigation"
                onClick={() => void toggleInvestigation()}
                className="w-full"
              >
                {expanded ? "Hide investigation" : "Why this recommendation?"}
              </Button>
              {expanded ? (
                <div id="mayor-investigation" className="space-y-2 border-2 border-amber-800/30 bg-amber-50 p-2 text-xs text-[#3d2c07]" aria-live="polite">
                  {isLoading ? <p>Investigating current graph evidence…</p> : null}
                  {hasFailed ? (
                    <div className="space-y-2">
                      <p>Investigation could not be loaded.</p>
                      <Button variant="secondary" onClick={() => void fetchInvestigation()}>Retry</Button>
                    </div>
                  ) : null}
                  {investigation ? (
                    <>
                      {investigation.status === "partial" ? <p className="font-bold">Some town information could not be checked.</p> : null}
                      {investigation.status === "unavailable" ? <p className="font-bold">Saved town records are unavailable right now.</p> : null}
                      <p className="font-bold">Finding: {investigation.finding.title}</p>
                      <p>{investigation.finding.summary}</p>
                      <p><span className="font-bold">The mayor suggests:</span> {investigation.recommendation.title}</p>
                      <div>
                        <p className="font-bold">What the mayor noticed</p>
                        {visibleEvidence.length ? (
                          <ul className="list-disc space-y-1 pl-4">
                            {visibleEvidence.map((item) => (
                              <li key={item.id}>
                                <span className="font-semibold">{simpleEvidenceLabel(item)}:</span> {simpleEvidenceDetail(item)} <span className="opacity-75">({evidenceSourceLabel(item)}{item.timestamp ? ` · ${new Date(item.timestamp).toLocaleString()}` : ""})</span>
                              </li>
                            ))}
                          </ul>
                        ) : <p>There are no matching town records yet.</p>}
                      </div>
                      <div>
                        <p className="font-bold">How much information supports this?</p>
                        <p>{qualityLabel(investigation.evidenceQuality.level)}. {investigation.status === "unavailable" ? "This explanation uses current town information only." : visibleEvidence.some((item) => item.kind === "event") ? "It uses current town information and matching past records." : "It is based mostly on current town information."}</p>
                      </div>
                      {investigation.limitations.length ? (
                        <div>
                          <p className="font-bold">What we don’t know</p>
                          <ul className="list-disc pl-4">{investigation.limitations.map((item, index) => {
                            let simple = "Some details are missing from the available town information.";
                            if (item.includes("CAUSED")) simple = "The records don’t confirm that one event caused another.";
                            else if (item.includes("No relevant persisted event")) simple = "There are no matching past events to review.";
                            else if (item.includes("Some FalkorDB")) simple = "Some saved town records could not be checked.";
                            else if (item.includes("No persisted World")) simple = "The saved town summary is missing, so current information is shown.";
                            else if (item.includes("FalkorDB evidence could not be retrieved")) simple = "Saved town records could not be reached, so this uses current town information.";
                            return <li key={`${index}-${item}`}>{simple}</li>;
                          })}</ul>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
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
            <p className="text-sm font-bold text-[#3d2c07]">
              The mayor is thinking… 💭
            </p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-[#2b2b2b]">
            🛠️ Build something (<span className="mc-num">{gold}</span> gold)
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
                  <span className="mc-num text-xs text-amber-800">{cost} 🪙</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-[#2b2b2b]">
            📜 Past ideas
          </p>
          <ul className="space-y-1">
            {(mayor?.recentPolicies ?? []).length === 0 ? (
              <li className="text-xs text-[#4a4f57]">Nothing yet.</li>
            ) : (
              (mayor?.recentPolicies ?? []).slice(0, 5).map((item: Policy) => (
                <li
                  key={item.id}
                  className="mc-inset flex items-center justify-between gap-2 px-2.5 py-1.5"
                >
                  <span className="truncate text-xs font-semibold">
                    {policyPlainReason(item.action)}
                  </span>
                  <span className="shrink-0 text-xs font-bold">
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
