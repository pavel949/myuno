#!/usr/bin/env bash
# Verify that Lovable security fixes from 2026-06-18 survived the WIP→main merge.
# Usage: bash scripts/verify-main-sync.sh
set -u

declare -a ENTRIES=(
  "b4e3e86a36e2a64917694f82dd7a79b6870d43d3eb935939d01ed941d60a2e56  supabase/migrations/20260617074038_27a6700f-c7e6-4ae5-bbc2-072a3cecea93.sql"
  "8e692481ac3565c01a216dd9374d0a12309089fe4c96afda229ae0610488c906  supabase/functions/ai-financial-advisor/index.ts"
  "77bc56c0a60286d73ca26a7125bccfbf5d4bb1fe7f56887c7735caa51cf602fb  supabase/functions/send-email/index.ts"
  "7abb27835777602033bdb99c554fefb7c94fcd7275a60f00347905d7d13f2eba  supabase/functions/submit-web-form/index.ts"
  "9625a3a7c6007f1af59fe846af60359ddc986ea9ffb5799ddf44c13dd9b54897  supabase/functions/magnet-submit/index.ts"
  "70cfdaa1002788ab8a357f544136a036bb7e8d355bb4434b6c19721fe8859705  supabase/functions/whatsapp-incoming-webhook/index.ts"
  "0cf74287e5506ba74df436914f0b8898a94bad45660a99dd22f3ae245f8e1904  src/components/owner/financial-planning/AIAdvisorPanel.tsx"
  "6d7d8f8ec473cbe7cbf539222f53db5809ade13fc6b060d5484acf31b632c24d  src/components/map/MapSearchBox.tsx"
)

FAIL=0
for line in "${ENTRIES[@]}"; do
  expected="${line%% *}"
  file="${line##* }"
  if [[ ! -f "$file" ]]; then
    echo "MISSING  $file"
    FAIL=1
    continue
  fi
  actual=$(sha256sum "$file" | awk '{print $1}')
  if [[ "$actual" == "$expected" ]]; then
    echo "OK       $file"
  else
    echo "MISMATCH $file"
    echo "  expected: $expected"
    echo "  actual:   $actual"
    FAIL=1
  fi
done

if [[ $FAIL -eq 0 ]]; then
  echo ""
  echo "✅ All Lovable 2026-06-18 fixes are present in main."
  exit 0
else
  echo ""
  echo "❌ Some files differ — Lovable fixes may have been overwritten by the merge."
  echo "   Re-apply the missing/changed files from docs/handoff/2026-06-18-lovable-on-main.md"
  exit 1
fi
