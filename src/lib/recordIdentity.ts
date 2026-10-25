/** Route/DTO identity comparison only; never an authorization decision.
 * PostgreSQL emits canonical lowercase UUIDs. Other identifiers stay case-sensitive.
 */
const UUID_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function sameRecordId(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string' || !left || !right) return false;
  return left === right || (UUID_ID.test(left) && UUID_ID.test(right) && left.toLowerCase() === right.toLowerCase());
}
