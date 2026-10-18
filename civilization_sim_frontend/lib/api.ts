import type {
  ApprovalResult,
  BuildResult,
  BuildingType,
  ChatAnswer,
  CitizenDetail,
  MayorView,
  SimEvent,
  WorldSnapshot,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const GENERIC_ERROR_MESSAGE = "An unexpected error occurred. Please try again.";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: { message: string; code: string };
}

export class ApiError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...init,
    });
  } catch {
    throw new ApiError(GENERIC_ERROR_MESSAGE, "NETWORK_ERROR");
  }

  const body = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!response.ok || !body || body.success === false) {
    const message =
      body && body.success === false
        ? body.error.message
        : GENERIC_ERROR_MESSAGE;
    const code =
      body && body.success === false ? body.error.code : "REQUEST_FAILED";
    throw new ApiError(message, code);
  }

  return body.data;
}

export const api = {
  getWorld: () => request<WorldSnapshot>("/api/world"),
  getEvents: (limit = 50) => request<SimEvent[]>(`/api/events?limit=${limit}`),
  getMayor: () => request<MayorView>("/api/mayor"),
  approvePolicy: (policyId?: string) =>
    request<ApprovalResult>("/api/mayor/approve", {
      method: "POST",
      body: JSON.stringify(policyId ? { policyId } : {}),
    }),
  build: (type: BuildingType) =>
    request<BuildResult>("/api/building", {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  getCitizen: (id: string) =>
    request<CitizenDetail>(`/api/citizen/${encodeURIComponent(id)}`),
  ask: (question: string) =>
    request<ChatAnswer>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};

export const BUILDING_COSTS: Record<BuildingType, number> = {
  House: 15,
  Farm: 20,
  Market: 30,
};

export { API_URL };
