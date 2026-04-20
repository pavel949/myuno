# Page templates — myUNO DS

Single source of truth for **page structure**. Every authenticated/role page must compose from these primitives — no ad-hoc containers, no hand-rolled headers.

```tsx
import {
  PageShell,
  PageHeader,
  PageTabs,
  PageSection,
  EmptyState,
  LoadingState,
} from '@/components/page';
```

## Anatomy

```
NavShell                ← provided by layout (TopBar / SideRail / BottomBar)
└── PageShell           ← width + responsive padding + bottom-nav clearance
    ├── PageHeader      ← title / subtitle / breadcrumbs / actions / back
    ├── PageTabs        ← optional sticky tabs
    ├── PageSection     ← optional grouped content blocks
    │   └── …content
    └── PageSection
        └── …content
```

## Examples

### Minimal dashboard

```tsx
export default function MyDashboard() {
  return (
    <PageShell>
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview"
        actions={[
          { label: 'New', icon: Plus, onClick: create, variant: 'primary' },
          { label: 'Export', icon: Download, onClick: exp, mobileHidden: true },
        ]}
      />
      <PageSection title="Recent activity" icon={Activity}>
        {items.length === 0 ? (
          <EmptyState icon={Inbox} title="No activity yet" />
        ) : (
          <ActivityList items={items} />
        )}
      </PageSection>
    </PageShell>
  );
}
```

### Tabs + skeleton

```tsx
const [tab, setTab] = useState<'overview' | 'reports'>('overview');

return (
  <PageShell width="wide">
    <PageHeader title="Analytics" showBack fallbackPath="/owner" />
    <PageTabs
      tabs={[
        { value: 'overview', label: 'Overview' },
        { value: 'reports',  label: 'Reports', badge: 3 },
      ]}
      value={tab}
      onChange={setTab}
    />
    {isLoading
      ? <LoadingState variant="skeleton" layout="cards" rows={6} />
      : <Content tab={tab} />}
  </PageShell>
);
```

## Width modes

| Mode      | Max-width  | Use for |
|-----------|------------|---------|
| `narrow`  | `max-w-3xl` | Forms, settings, single-column reads |
| `default` | `max-w-5xl` | Dashboards, lists |
| `wide`    | `max-w-7xl` | Tables, multi-column workspaces |
| `full`    | none        | Maps, canvas, custom layouts |

## Rules

1. ❌ **Never** add custom `px-*` / `py-*` to the outer page wrapper. Use `PageShell`.
2. ❌ **Never** hardcode hex colours. Use semantic tokens (`bg-card`, `text-muted-foreground`, …).
3. ❌ **Never** create per-page `SectionHeader`. Use `PageSection`.
4. ✅ All interactive elements ≥ `var(--touch-target)` (44 px).
5. ✅ Provide `LoadingState` and `EmptyState` for every async data view.
6. ✅ Keep `PageHeader.actions` ≤ 3 items; rest goes to overflow menu.

See [`docs/PAGE_TEMPLATES.md`](../../../docs/PAGE_TEMPLATES.md) for the full guide.
