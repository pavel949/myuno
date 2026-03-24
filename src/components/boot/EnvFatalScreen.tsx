/**
 * Shown when validatePublicEnv fails before React app mounts (e.g. missing VITE_* on Vercel).
 */
export function EnvFatalScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center p-6">
      <div className="max-w-lg rounded-2xl border border-[#1f2d45] bg-[#111827] p-8 shadow-xl">
        <h1 className="text-lg font-bold text-[#d4a843] mb-3">myUNO — configuration</h1>
        <p className="text-sm text-red-300 mb-4 font-mono break-words">{message}</p>
        <div className="text-sm text-slate-300 space-y-3">
          <p>
            <strong className="text-white">RU:</strong> В Vercel → Project → Settings → Environment Variables
            задайте <code className="text-amber-200/90">VITE_SUPABASE_URL</code> и{' '}
            <code className="text-amber-200/90">VITE_SUPABASE_PUBLISHABLE_KEY</code>, затем{' '}
            <strong>Redeploy</strong>.
          </p>
          <p>
            <strong className="text-white">EN:</strong> Set the same variables in Vercel, then redeploy the
            production build.
          </p>
          <p className="text-xs text-slate-500">
            See <code className="text-slate-400">docs/ENV.md</code> and{' '}
            <code className="text-slate-400">docs/VERCEL-SUPABASE-PRODUCTION-SETUP.md</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
