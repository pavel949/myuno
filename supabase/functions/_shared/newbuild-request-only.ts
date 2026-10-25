/**
 * Source-level containment until atomic hold ownership/project/payment contracts
 * and deployed RLS are independently verified. No environment switch bypass.
 * Removing this gate requires a separately reviewed activation change.
 */
export function newbuildRequestOnlyResponse(cors: Record<string, string>): Response {
  return new Response(JSON.stringify({
    success: false,
    reason: 'request_only',
    message: 'Newbuild reservations and payments are unavailable. Submit a project enquiry instead.',
    request_only: true,
  }), { status: 409, headers: { ...cors, 'Content-Type': 'application/json' } });
}
