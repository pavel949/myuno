# Page Templates — myUNO

> **Required reading before creating any new page.**

The platform uses a small set of universal primitives that produce a consistent layout across mobile, tablet, and desktop for every role (guest, investor, owner/MC, vendor, admin).

All primitives live in [`src/components/page/`](../src/components/page/) and are exported from `@/components/page`.

## Why

- One look across 366+ pages
- Mobile / tablet / desktop padding handled in **one place** (`--page-padding-x`)
- Headers, tabs, empty/loading states are not re-invented per page
- Touch targets always ≥ 44 px
- Tablet (768–1023) gets a real layout, not "bigger mobile"

## Hierarchy

```
RouterOutlet
└── <NavShell role="…">         ← in layouts (provided automatically)
    └── Page component
        └── <PageShell>          ← outermost element of every page
            ├── <PageHeader />
            ├── <PageTabs />     ← optional
            ├── <PageSection />  ← repeat as needed
            └── <PageSection />
```

## Templates by role context

### Consumer (guest / investor / tourist / resident)
```tsx
<PageShell width="default">
  <PageHeader title="…" subtitle="…" />
  …content…
</PageShell>
```

### Workspace (owner / MC / vendor)
```tsx
<PageShell width="wide">
  <PageHeader
    title="…"
    breadcrumbs={[{ label: 'Workspace', href: '/mc' }, { label: 'Properties' }]}
    actions={[
      { label: 'New property', icon: Plus, onClick: create, variant: 'primary' },
      { label: 'Import', onClick: importCsv, mobileHidden: true },
    ]}
  />
  <PageTabs tabs={…} value={tab} onChange={setTab} />
  <PageSection title="…" icon={…}>…</PageSection>
</PageShell>
```

### Admin
```tsx
<PageShell width="wide">
  <PageHeader title="…" />
  <PageSection title="KPIs">…</PageSection>
  <PageSection title="Recent" action={{ label: 'View all', onClick: … }}>…</PageSection>
</PageShell>
```

## Width selection

| Width     | Use                                                        |
|-----------|------------------------------------------------------------|
| `narrow`  | Forms, settings, single-column reads (`max-w-3xl`)         |
| `default` | Most consumer dashboards (`max-w-5xl`)                     |
| `wide`    | Tables, workspaces, admin (`max-w-7xl`)                    |
| `full`    | Maps, canvas, hero landings (no max-width)                 |

## Responsive rules

`PageShell` already handles:
- **Mobile** (<768px): `--page-padding-x: 16px`, generous bottom-nav clearance
- **Tablet** (768–1023): `--page-padding-x: 24px`, no bottom-nav clearance
- **Desktop** (≥1024): `--page-padding-x: 32px`

If you need a per-breakpoint grid, use Tailwind: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

## Loading / Empty

Always render one of these states for any async data:

```tsx
{isLoading && <LoadingState variant="skeleton" layout="cards" rows={6} />}
{!isLoading && items.length === 0 && (
  <EmptyState icon={Inbox} title="Nothing here yet" description="…" action={…} />
)}
{!isLoading && items.length > 0 && <List items={items} />}
```

## Anti-patterns

- ❌ `<div className="container mx-auto px-4 py-8">` → use `<PageShell>`
- ❌ Hand-rolled `<h1>` + custom margin → use `<PageHeader title="…" />`
- ❌ `bg-[#0F1C2E]` / `text-[#EDF2FF]` → use semantic tokens (`bg-secondary`, `text-foreground`)
- ❌ Per-page `SectionHeader` component → use `<PageSection title="…" icon={…}>`
- ❌ Buttons / chips < 44 px on mobile → use `h-[var(--touch-target)]`

## Migration

When editing an existing page that has not yet been migrated:
1. Wrap content in `<PageShell>` (remove outer `container`/`PageContainer`).
2. Replace handwritten title block with `<PageHeader>`.
3. Replace ad-hoc empty / loading blocks with `<EmptyState>` / `<LoadingState>`.
4. Replace any `bg-[#…]` with semantic tokens.

See [`docs/DESIGN_TOKENS.md`](DESIGN_TOKENS.md) for the token reference.
