import { Redis } from "ioredis";
import { env } from "./env.js";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      host: env.FALKORDB_HOST,
      port: env.FALKORDB_PORT,
      username: env.FALKORDB_USERNAME || undefined,
      password: env.FALKORDB_PASSWORD || undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: (times: number) => Math.min(times * 2000, 10000),
    });

    client.on("error", (err: Error) => {
      if (env.NODE_ENV !== "test") {
        console.error(`[falkordb] connection error: ${err.message}`);
      }
    });

    client.on("connect", () => {
      console.log(
        `[falkordb] connected to ${env.FALKORDB_HOST}:${env.FALKORDB_PORT}`,
      );
    });
  }
  return client;
}

export interface GraphResult {
  rows: unknown[][];
  columns: string[];
}

export async function graphQuery(
  graph: string,
  query: string,
  params: Record<string, unknown> = {},
): Promise<GraphResult> {
  const redis = getRedis();
  const paramEntries = Object.entries(params);
  const paramPrefix =
    paramEntries.length > 0
      ? `CYPHER ${paramEntries
          .map(([k, v]) => `${k}=${formatParamValue(v)}`)
          .join(" ")} `
      : "";

  const reply = (await redis.call(
    "GRAPH.QUERY",
    graph,
    `${paramPrefix}${query}`,
  )) as [string[], unknown[][], ...unknown[]];

  return {
    columns: (reply[0] as string[]) ?? [],
    rows: (reply[1] as unknown[][]) ?? [],
  };
}

function pairsToObject(pairs: unknown[][]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const pair of pairs) {
    if (Array.isArray(pair) && pair.length >= 2) {
      result[String(pair[0])] = pair[1];
    }
  }
  return result;
}

export function extractNodeProperties(
  value: unknown,
): Record<string, unknown> | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    const propertiesEntry = value.find(
      (entry) =>
        Array.isArray(entry) &&
        entry[0] === "properties" &&
        Array.isArray(entry[1]),
    );
    if (!propertiesEntry) return null;
    return pairsToObject((propertiesEntry as unknown[][])[1] as unknown[][]);
  }

  if (typeof value === "object" && "properties" in value) {
    const properties = (value as { properties: unknown }).properties;
    if (Array.isArray(properties)) {
      return pairsToObject(properties as unknown[][]);
    }
    if (properties && typeof properties === "object") {
      return properties as Record<string, unknown>;
    }
  }

  return null;
}

function formatParamValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return `'${String(value).replace(/'/g, "\\'")}'`;
}

export async function pingFalkorDB(): Promise<boolean> {
  try {
    await getRedis().ping();
    return true;
  } catch {
    return false;
  }
}

export async function closeFalkorDB(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
