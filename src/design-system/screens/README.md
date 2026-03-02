# myUNO DS2.0 — Phase 4: Screen Templates

## Integration Summary

DS2.0 pattern components are now integrated into live screens.

---

### Home Page (`Index.tsx`)

| Section | DS2.0 Component | Before |
|---------|----------------|--------|
| Solutions Gallery header | `SectionHeader` | Custom div+icon markup |
| Today's Events header | `SectionHeader` (with action) | Custom h3+button |
| Trust Banner | `Surface` variant=card | Manual bg-card + border + shadow |
| Products Section | `Surface` variant=page | Raw div |

### Discover Page (`Discover.tsx`)

| Section | DS2.0 Component | Before |
|---------|----------------|--------|
| Search sections | `SectionHeader` size=sm | Raw `<p>` uppercase labels |
| Support block | `Surface` variant=muted | Manual bg-muted/30 + border |

### Admin Dashboard (`AdminDashboard.tsx`)

| Section | DS2.0 Component | Before |
|---------|----------------|--------|
| Page header | `SectionHeader` size=lg + icon | Raw h1 + p |

---

## Screen Template Recipes

### Home Hub Template
```
AppLayout
├── ActiveSituationBanner
├── HeroBlock (Navy gradient, persona switcher)
├── QuickActionsGrid (4-col mobile, flex desktop)
├── YourDayFeed / TodayEventsFeed
│   └── SectionHeader (icon + action)
├── ProactiveConcierge
├── LifecycleSmartTip
├── HomeProductsSection
│   ├── QuickSolutionsGallery
│   │   └── SectionHeader (icon)
│   └── ProductSection (scroll)
└── Surface(card) → TrustBanner
```

### Discover Template
```
MiniAppLayout
├── DiscoverHero (PromoBanner pattern)
├── LifeSituationsGrid
│   └── SectionHeader (sm)
├── AllServicesGrid
│   └── SectionHeader (sm)
└── Surface(muted) → Support block
```

### Admin Dashboard Template
```
Page container (max-w-1536)
├── SectionHeader (lg, icon) + LaunchSwitch
├── AdminKPIGrid (KPICard × 4)
├── Grid(1/3 cols)
│   ├── AdminOperationalAlerts
│   ├── AdminRevenueBlock
│   └── AdminQuickActionsGrid
├── AdminAllVerticalsGrid
└── AdminActivityBlock
```

---

## Migration Checklist

When converting a screen to DS2.0:

1. **Headers** → Replace custom h2/h3+icon markup with `<SectionHeader>` 
2. **Cards** → Replace `bg-card border rounded-xl shadow-*` with `<Surface variant="card">`
3. **Muted containers** → Replace `bg-muted/30 border` with `<Surface variant="muted">`
4. **Scroll sections** → Wrap with `<ServiceHubSection>` for header+scroll pattern
5. **Promo banners** → Replace custom gradients with `<PromoBanner>`
6. **Category grids** → Replace manual icon grids with `<CategoryGrid>`

## Quality Gate

- ❌ No raw `bg-card border rounded-xl` in new code — use `Surface`
- ❌ No custom section header markup — use `SectionHeader`
- ❌ No hardcoded shadows — use elevation tokens
- ✅ All patterns import from `@/components/ds`
