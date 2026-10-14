import {
  MAYOR_EVAL_INTERVAL_MS,
  MAYOR_ID,
  PLAYER_ID,
} from "../../common/constants/index.js";
import { ConflictError } from "../../error/conflictError.js";
import { NotFoundError } from "../../error/notFoundError.js";
import { evaluateWorld } from "../../simulation/mayor.js";
import type { Building, Policy, PolicyAction } from "../../simulation/types.js";
import { worldState } from "../../simulation/worldState.js";
import { build } from "../building/buildingService.js";
import { persistApproval, persistPolicy } from "./mayorRepository.js";

const POLICY_NAMES: Record<PolicyAction, string> = {
  BuildFarm: "Build Farm",
  BuildHouse: "Build House",
  DoNothing: "Do Nothing",
};

export interface MayorView {
  playerId: string;
  mayorId: string;
  currentPolicy: Policy | null;
  recentPolicies: Policy[];
  loopRunning: boolean;
}

export interface ApprovalResult {
  policy: Policy;
  building: Building | null;
  graphSynced: boolean;
}

export function getMayorView(): MayorView {
  ensureCurrentPolicy();
  return {
    playerId: PLAYER_ID,
    mayorId: MAYOR_ID,
    currentPolicy: worldState.currentPolicy,
    recentPolicies: worldState.recentPolicies(20),
    loopRunning: isMayorLoopRunning(),
  };
}

export function ensureCurrentPolicy(): Policy | null {
  if (worldState.currentPolicy) return worldState.currentPolicy;
  return evaluateAndStore();
}

export function evaluateAndStore(): Policy {
  if (worldState.currentPolicy?.status === "pending") {
    worldState.currentPolicy.status = "ignored";
  }

  const evaluation = evaluateWorld(worldState);
  const policy = worldState.addPolicy({
    name: POLICY_NAMES[evaluation.action],
    action: evaluation.action,
    buildingType: evaluation.buildingType,
    reason: evaluation.reason,
    triggeredByEventId: evaluation.triggeredByEventId,
  });
  worldState.setCurrentPolicy(policy);

  worldState.addEvent({
    type: "PolicyProposed",
    message: `Mayor proposed "${policy.name}": ${policy.reason}`,
  });

  void persistPolicy(policy).catch(() => {
    /* graph sync is best-effort; the simulation continues in memory only */
  });

  return policy;
}

export async function approvePolicy(
  policyId?: string,
): Promise<ApprovalResult> {
  const policy = policyId
    ? (worldState.policies.find((candidate) => candidate.id === policyId) ??
      null)
    : ensureCurrentPolicy();

  if (!policy) {
    throw new NotFoundError(
      policyId
        ? `Policy ${policyId} not found`
        : "No mayor suggestion is available to approve",
    );
  }
  if (policy.status !== "pending") {
    throw new ConflictError(`Policy ${policy.id} is already ${policy.status}`);
  }

  let building: Building | null = null;
  if (policy.action === "BuildFarm" || policy.action === "BuildHouse") {
    const result = await build(policy.buildingType as "Farm" | "House");
    building = result.building;
  }

  policy.status = "approved";
  policy.approvedTick = worldState.tick;

  worldState.addEvent({
    type: "PolicyApproved",
    message: building
      ? `King approved "${policy.name}" and built ${building.id}.`
      : `King approved "${policy.name}".`,
    buildingId: building?.id,
  });

  let graphSynced = true;
  try {
    await persistApproval(policy, building?.id ?? null);
  } catch {
    graphSynced = false;
  }

  worldState.setCurrentPolicy(null);
  if (policy.action !== "DoNothing") {
    ensureCurrentPolicy();
  }

  return { policy, building, graphSynced };
}

let loopHandle: NodeJS.Timeout | null = null;

export function startMayorLoop(intervalMs = MAYOR_EVAL_INTERVAL_MS): void {
  if (loopHandle) return;
  loopHandle = setInterval(() => {
    try {
      evaluateAndStore();
    } catch (error) {
      console.error("[mayor] evaluation failed:", error);
    }
  }, intervalMs);
  console.log(`[mayor] evaluation loop started (${intervalMs}ms)`);
}

export function stopMayorLoop(): void {
  if (loopHandle) {
    clearInterval(loopHandle);
    loopHandle = null;
    console.log("[mayor] evaluation loop stopped");
  }
}

export function isMayorLoopRunning(): boolean {
  return loopHandle !== null;
}
