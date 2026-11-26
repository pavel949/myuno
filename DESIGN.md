# myUNO Design Bible v4

The single visual system for the myUNO App. Runtime values, locale fallbacks
and both themes live in [tokens.css](src/styles/tokens.css); utility classes
resolve to those variables through [Tailwind](tailwind.config.ts).

## Visual foundations

- A calm civic interface: navy (reference #0D2230), paper (#FDFBF7), and a
  restrained gold accent (#C59A45). Use semantic tokens instead of reference
  hex values. Pale gold is decorative on paper; use the darker gold ink
  for foreground/focus on light surfaces. Use gold on navy.
- Light is the default; dark uses navy surfaces and paper text. Keep the
  same component tree and distinguish errors, actions and statuses with text
  and other cues, not color alone.
- Outfit for display, Manrope for UI and Cyrillic display glyphs, IBM Plex
  Mono for numerics. Use Noto Sans Thai glyph fallback for Thai. Do not load
  another font in an individual page.
- Controls 4px (`rounded-sm`); cards and dialogs 8px (`rounded-md`); media
  12px (`rounded-lg`); pills only for explicit pill affordances. Use
  `rounded-none` for intentionally flush/square layouts. Legacy larger
  utility names resolve to the same 12px pending source migration.
- Use shared components and spacing tokens; keep visible keyboard focus,
  44px touch targets, meaningful empty/error states, and mobile-first
  overflow protection. No decorative glass, neon glow or background
  gradients. Use semantic status roles and give status badges a text label.

## Compatibility and rollout

Old token names such as `--brand-orange` now resolve to v4 values; they
are not a second palette. Remove obsolete aliases only after verifying all
uses, including utility classes and first-paint token dependencies.
The separately shipped standalone Bible remains historical until its URL,
asset references and rendering are migrated. No role, menu, routing or
data behavior is defined here.
