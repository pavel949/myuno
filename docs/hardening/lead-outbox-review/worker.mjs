// Reference core, NOT wired to a deployed Edge function. No credentials in this module.
// authorize must verify the dedicated scheduler secret, not any logged-in user JWT.
// openStore must be called only after authorization; its methods use the SQL RPCs.
export function createWorker({ authorize, openStore, readContacts, send, timeoutMs = 8000 }) {
  return async function handle(req) {
    const reply = (status, value) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
    if (req.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
    let admitted = false;
    try { admitted = await authorize(req); } catch { /* fail closed */ }
    if (!admitted) return reply(401, { error: 'unauthorized' });
    // Do not accept client-selected source IDs or notification content even on scheduler path.
    // Scheduler calls carry no body at all. Do not buffer unbounded input or
    // hang on a streaming body; cancellation also rejects whitespace payloads.
    if (req.body !== null) {
      try { void req.body.cancel().catch(() => {}); } catch { /* no privileged work on read failure */ }
      return reply(400, { error: 'body_not_allowed' });
    }
    try {
      const store = await openStore();
      const contacts = await readContacts(); // strict configured MyUNO contacts only; throws on failed read
      const jobs = await store.claim();
      const counts = { accepted: 0, rejected: 0, uncertain: 0, blocked: 0, uncommitted: 0 };
      await Promise.all(jobs.map(async job => {
        const target = job.channel === 'email' ? contacts.emails : job.channel === 'whatsapp' ? contacts.whatsapp : null;
        let outcome = 'blocked', reference = null;
        if (target && (!Array.isArray(target) || target.length > 0) && send[job.channel]) {
          const controller = new AbortController();
          let timer;
          try {
            const result = await Promise.race([
              send[job.channel]({ lead: job.lead, target, signal: controller.signal, idempotencyKey: `consultation:${job.job_id}` }),
              new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs); }),
            ]);
            // Adapter must affirm a provider reference, or an explicitly documented
            // pre-acceptance rejection. Arbitrary HTTP errors are NOT definite rejection.
            if (result?.accepted === true && typeof result.reference === 'string' && result.reference.trim() && result.reference.length <= 200) {
              outcome = 'accepted'; reference = result.reference;
            } else if (result?.definitelyNotAccepted === true) outcome = 'rejected';
            else outcome = 'uncertain';
          } catch { outcome = 'uncertain'; } finally { clearTimeout(timer); }
        }
        try {
          const committed = await store.finish(job.job_id, job.token, outcome, reference);
          if (committed) counts[outcome]++; else counts.uncommitted++;
        } catch { counts.uncommitted++; }
      }));
      // Acceptance is never delivery. No PII, payloads, secrets or provider errors returned.
      return reply(counts.uncommitted ? 503 : 200, { counts });
    } catch { return reply(503, { error: 'worker_unavailable' }); }
  };
}
