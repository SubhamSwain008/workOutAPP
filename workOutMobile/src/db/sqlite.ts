/**
 * Capacitor SQLite wrapper that works on both native (Android/iOS) and the
 * web (via jeep-sqlite + IndexedDB). All app code talks to this `db` helper
 * instead of importing the plugin directly.
 */
import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

const DB_NAME = "workout.db";
const DB_VERSION = 1;

let connection: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;
let initPromise: Promise<SQLiteDBConnection> | null = null;

async function ensureWebStore(): Promise<void> {
  if (Capacitor.getPlatform() !== "web") return;
  // jeep-sqlite needs a custom element mounted in the DOM.
  if (!document.querySelector("jeep-sqlite")) {
    const el = document.createElement("jeep-sqlite");
    document.body.appendChild(el);
    await customElements.whenDefined("jeep-sqlite");
  }
  await CapacitorSQLite.initWebStore();
}

async function open(): Promise<SQLiteDBConnection> {
  if (db) return db;
  await ensureWebStore();
  connection = connection ?? new SQLiteConnection(CapacitorSQLite);

  const isConn = (await connection.isConnection(DB_NAME, false)).result ?? false;
  db = isConn
    ? await connection.retrieveConnection(DB_NAME, false)
    : await connection.createConnection(DB_NAME, false, "no-encryption", DB_VERSION, false);

  await db.open();
  return db;
}

export function database(): Promise<SQLiteDBConnection> {
  if (!initPromise) initPromise = open();
  return initPromise;
}

export async function exec(sql: string): Promise<void> {
  const d = await database();
  await d.execute(sql);
}

export async function run(sql: string, values: unknown[] = []): Promise<void> {
  const d = await database();
  await d.run(sql, values as never);
}

export async function all<T = Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const d = await database();
  const result = await d.query(sql, values as never);
  return (result.values ?? []) as T[];
}

export async function first<T = Record<string, unknown>>(
  sql: string,
  values: unknown[] = [],
): Promise<T | null> {
  const rows = await all<T>(sql, values);
  return rows[0] ?? null;
}

export async function transaction(work: (tx: {
  run: (sql: string, values?: unknown[]) => Promise<void>;
}) => Promise<void>): Promise<void> {
  const d = await database();
  await d.execute("BEGIN");
  try {
    await work({
      run: async (sql, values = []) => {
        await d.run(sql, values as never);
      },
    });
    await d.execute("COMMIT");
  } catch (err) {
    await d.execute("ROLLBACK");
    throw err;
  }
}

export async function saveToStore(): Promise<void> {
  // jeep-sqlite persists in-browser DB to IndexedDB.
  if (Capacitor.getPlatform() === "web") {
    await CapacitorSQLite.saveToStore({ database: DB_NAME });
  }
}
