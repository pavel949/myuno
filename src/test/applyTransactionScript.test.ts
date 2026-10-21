import { describe, expect, it, vi } from 'vitest';
import { applyTransactionScript } from './applyTransactionScript';

function fixture() {
  const connection = { unsafe: vi.fn().mockResolvedValue([]), release: vi.fn() };
  const sql = { reserve: vi.fn().mockResolvedValue(connection) };
  return { connection, sql };
}

describe('transaction-wrapped PostgreSQL fixture scripts', () => {
  it('executes the entire unchanged script on a reserved connection and releases it', async () => {
    const { connection, sql } = fixture();
    const source = 'BEGIN; CREATE TABLE fixture(id integer); COMMIT;';
    await applyTransactionScript(sql, source);
    expect(sql.reserve).toHaveBeenCalledOnce();
    expect(connection.unsafe.mock.calls).toEqual([[source]]);
    expect(connection.release).toHaveBeenCalledOnce();
    expect(connection.release.mock.invocationCallOrder[0]).toBeGreaterThan(connection.unsafe.mock.invocationCallOrder[0]);
  });

  it('rolls back a failed script on the same connection before releasing it', async () => {
    const { connection, sql } = fixture();
    const error = new Error('synthetic SQL failure');
    connection.unsafe.mockRejectedValueOnce(error);
    await expect(applyTransactionScript(sql, 'BEGIN; invalid; COMMIT;')).rejects.toBe(error);
    expect(connection.unsafe.mock.calls).toEqual([['BEGIN; invalid; COMMIT;'], ['ROLLBACK']]);
    expect(connection.release).toHaveBeenCalledOnce();
    expect(connection.release.mock.invocationCallOrder[0]).toBeGreaterThan(connection.unsafe.mock.invocationCallOrder[1]);
  });

  it('still releases and preserves the original failure if rollback cannot run', async () => {
    const { connection, sql } = fixture();
    const error = new Error('connection lost during script');
    connection.unsafe.mockRejectedValueOnce(error).mockRejectedValueOnce(new Error('connection closed'));
    await expect(applyTransactionScript(sql, 'BEGIN; invalid; COMMIT;')).rejects.toBe(error);
    expect(connection.release).toHaveBeenCalledOnce();
  });

  it('propagates reservation failure without trying to use a nonexistent connection', async () => {
    const { connection, sql } = fixture();
    const error = new Error('reservation failed');
    sql.reserve.mockRejectedValueOnce(error);
    await expect(applyTransactionScript(sql, 'BEGIN; COMMIT;')).rejects.toBe(error);
    expect(connection.unsafe).not.toHaveBeenCalled();
    expect(connection.release).not.toHaveBeenCalled();
  });
});
