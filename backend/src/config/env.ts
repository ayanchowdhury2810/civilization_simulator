import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  FALKORDB_HOST: z.string().default("localhost"),
  FALKORDB_PORT: z.coerce.number().int().positive().default(6379),
  FALKORDB_USERNAME: z.string().optional().default(""),
  FALKORDB_PASSWORD: z.string().optional().default(""),
  FALKORDB_GRAPH: z.string().default("civilization"),

  TICK_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  AUTO_TICK: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v !== "false" && v !== "0"),

  MAYOR_INTERVAL_MS: z.coerce.number().int().positive().default(120000),
  AUTO_MAYOR: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v !== "false" && v !== "0"),

  GEMINI_API_KEY: z.string().optional().default(""),
  LLM_MODEL: z.string().optional().default("gemini-2.0-flash"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = parsed.data;
