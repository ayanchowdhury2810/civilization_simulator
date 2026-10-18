import {
  MAYOR_EVAL_INTERVAL_MS,
  MAYOR_ID,
  PLAYER_ID,
} from "../../common/constants/index.js";
import { ConflictError } from "../../error/conflictError.js";
import { NotFoundError } from "../../error/notFoundError.js";
import { evaluateWorld } from "../../simulation/mayor.js";
import type { Building, Policy, PolicyAction } from "../../simulation/types.js";
import { loadWorldStateFromGraph, updateWorldState } from "../world/worldService.js";
import { buildInWorld } from "../building/buildingService.js";
import { persistBuilding } from "../building/buildingRepository.js";
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

export async function getMayorView(): Promise<MayorView> {
  let state = await loadWorldStateFromGraph();
  if (!policyMatchesWorld(state)) {
    await evaluateAndStore();
    state = await loadWorldStateFromGraph();
  }
  return {
    playerId: PLAYER_ID,
    mayorId: MAYOR_ID,
    currentPolicy: state.currentPolicy,
    recentPolicies: state.recentPolicies(20),
    loopRunning: isMayorLoopRunning(),
  };
}

export async function ensureCurrentPolicy(): Promise<Policy | null> {
  const state = await loadWorldStateFromGraph();
  return policyMatchesWorld(state) ? state.currentPolicy : evaluateAndStore();
}

function policyMatchesWorld(state: Awaited<ReturnType<typeof loadWorldStateFromGraph>>): boolean {
  const policy = state.currentPolicy;
  if (!policy || policy.status !== "pending") return false;
  const evaluation = evaluateWorld(state);
  return policy.action === evaluation.action && policy.reason === evaluation.reason;
}

export async function evaluateAndStore(): Promise<Policy> {
  return updateWorldState(async (state) => {
    if (state.currentPolicy?.status === "pending") {
      state.currentPolicy.status = "ignored";
      await persistPolicy(state.currentPolicy);
    }

    const evaluation = evaluateWorld(state);
    const policy = state.addPolicy({
      name: POLICY_NAMES[evaluation.action],
      action: evaluation.action,
      buildingType: evaluation.buildingType,
      reason: evaluation.reason,
      triggeredByEventId: evaluation.triggeredByEventId,
    });
    state.setCurrentPolicy(policy);
    state.addEvent({
      type: "PolicyProposed",
      message: `Mayor proposed "${policy.name}": ${policy.reason}`,
    });
    await persistPolicy(policy);
    return policy;
  });
}

export async function approvePolicy(policyId?: string): Promise<ApprovalResult> {
  const result = await updateWorldState(async (state) => {
    const policy = policyId
      ? state.policies.find((candidate) => candidate.id === policyId) ?? null
      : state.currentPolicy;

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
      building = buildInWorld(state, policy.buildingType as "Farm" | "House");
      await persistBuilding(building);
    }

    policy.status = "approved";
    policy.approvedTick = state.tick;
    state.addEvent({
      type: "PolicyApproved",
      message: building
        ? `King approved "${policy.name}" and built ${building.id}.`
        : `King approved "${policy.name}".`,
      buildingId: building?.id,
    });
    await persistApproval(policy, building?.id ?? null);
    state.setCurrentPolicy(null);
    return { policy, building, graphSynced: true };
  });

  if (result.policy.action !== "DoNothing") await evaluateAndStore();
  return result;
}

let loopHandle: NodeJS.Timeout | null = null;

export function startMayorLoop(intervalMs = MAYOR_EVAL_INTERVAL_MS): void {
  if (loopHandle) return;
  loopHandle = setInterval(() => {
    void evaluateAndStore().catch((error) => {
      console.error("[mayor] evaluation failed:", error);
    });
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
