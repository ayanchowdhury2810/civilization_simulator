import { env } from "../../config/env.js";
import { extractNodeProperties, graphQuery } from "../../config/falkordb.js";

export async function fetchCitizenFromGraph(
  id: string,
): Promise<Record<string, unknown> | null> {
  const { rows } = await graphQuery(
    env.FALKORDB_GRAPH,
    `MATCH (c:Citizen {id: $id}) RETURN c LIMIT 1`,
    { id },
  );
  if (rows.length === 0) return null;
  return extractNodeProperties(rows[0][0]);
}
