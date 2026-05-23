import pg from "pg";

const { Pool, types } = pg;

// NUMERIC (oid 1700) returns as string by default — parse to JS number so the
// mobile client receives weights/heights as numbers, not "60".
types.setTypeParser(1700, (val) => (val === null ? null : Number(val)) as never);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as never);
}
