import pg from "pg";
import { e2eDatabaseUrl } from "./env";

export async function queryE2eDb<Row extends pg.QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const client = new pg.Client({ connectionString: e2eDatabaseUrl() });
  await client.connect();
  try {
    const result = await client.query<Row>(sql, params);
    return result.rows;
  } finally {
    await client.end();
  }
}
