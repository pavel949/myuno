import type postgres from 'postgres';

/** Execute an unchanged BEGIN/COMMIT fixture script on one reserved connection. */
export async function applyTransactionScript(sql: Pick<postgres.Sql, 'reserve'>, source: string): Promise<void> {
  const connection = await sql.reserve();
  try {
    await connection.unsafe(source);
  } catch (error) {
    // A failed multi-statement script can leave an aborted transaction behind.
    // Clean it up before returning the connection to the concurrent test pool.
    try {
      await connection.unsafe('ROLLBACK');
    } catch {
      // Preserve the original SQL error if the connection itself has failed.
    }
    throw error;
  } finally {
    connection.release();
  }
}
