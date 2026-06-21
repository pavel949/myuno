#!/usr/bin/env bash
#
# Migration baseline squash helper.
# See ./README.md for the full runbook and rationale.
#
# This script does only the SAFE, local-file part:
#   1. dumps the linked prod schema into a single baseline migration
#   2. dumps reference/seed data into supabase/seed.sql
#   3. archives the old migration files
#
# It deliberately does NOT run `supabase migration repair` against the remote —
# that step changes the prod migration-history table and must be done by a human
# after reviewing `supabase migration list`. The script prints the exact command
# to run next.
#
# Prereqs: supabase CLI installed, `supabase login`, and the project linked:
#   supabase link --project-ref hueotfhvvbxaijccmhnc
#
# Usage:
#   ./scripts/migration-squash/squash.sh                 # uses the linked project
#   BASE_TS=20260101000000 ./scripts/migration-squash/squash.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIG_DIR="$REPO_ROOT/supabase/migrations"
ARCHIVE_DIR="$REPO_ROOT/supabase/migrations_archive"
SEED_FILE="$REPO_ROOT/supabase/seed.sql"

# Baseline timestamp MUST be earlier than every existing migration so prod never
# tries to re-run it. Default sits before the earliest (20260109...).
BASE_TS="${BASE_TS:-20260101000000}"
BASELINE_FILE="$MIG_DIR/${BASE_TS}_baseline_schema.sql"

command -v supabase >/dev/null || { echo "ERROR: supabase CLI not found"; exit 1; }

echo "==> Confirming a project is linked"
supabase projects list >/dev/null 2>&1 || { echo "ERROR: run 'supabase login' first"; exit 1; }

# Safety: refuse to overwrite an existing baseline.
if [ -e "$BASELINE_FILE" ]; then
  echo "ERROR: $BASELINE_FILE already exists — pick a new BASE_TS or remove it."; exit 1
fi

echo "==> 1/3 Dumping prod SCHEMA -> $BASELINE_FILE"
supabase db dump --linked -f "$BASELINE_FILE"

echo "==> 2/3 Dumping prod reference DATA -> $SEED_FILE"
supabase db dump --linked --data-only --schema public -f "$SEED_FILE"

echo "==> 3/3 Archiving old migration files -> $ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR"
shopt -s nullglob
moved=0
for f in "$MIG_DIR"/*.sql; do
  [ "$f" = "$BASELINE_FILE" ] && continue
  git -C "$REPO_ROOT" mv "$f" "$ARCHIVE_DIR/" 2>/dev/null || mv "$f" "$ARCHIVE_DIR/"
  moved=$((moved+1))
done
echo "    archived $moved files; kept baseline + (any) newer files"

cat <<EOF

==> Local file changes done. NEXT (manual, against the remote):

    supabase migration list
    supabase migration repair --status applied ${BASE_TS}

Then verify a clean fresh apply:

    supabase db reset            # local (needs Docker)
    # or push a commit and confirm the PR's Supabase Preview -> Migrations is green

Review the diff before committing. Rollback = restore files from
supabase/migrations_archive/ and 'migration repair --status reverted ${BASE_TS}'.
EOF
