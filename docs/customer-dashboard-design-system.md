# Customer Dashboard Design System Extraction

Reference source reviewed:
- `app/templates/base.html`
- `app/static/css/brand.css`
- `app/templates/pages/section_page.html`

Requested but not visible in the recovered reference source:
- `app/templates/process/attendance.html`

Because `attendance.html` was not present in the accessible repo/history, no attendance-specific components or interactions were copied or inferred.

## Extracted Visual Language

The reference uses a restrained, premium glass interface with an airy light background, cool aqua/cyan/teal accents, disciplined rounded controls, and quiet enterprise spacing. The UI is not decorative-first; it relies on translucent panels, subtle highlights, blur, edge borders, and layered shadows.

## Tokens

Typography:
- Display: `Fraunces`
- Interface/body: `Space Grotesk`
- Body letter spacing is subtle and clean, roughly `0.01em`

Colors:
- Ink: `#06121a`
- Muted ink: `#162c3a`
- Ice surface RGB: `245, 250, 255`
- Accent: `#4ac7e8`
- Accent soft: `#b7f1ff`
- Accent strong: `#2e8fb0`
- Success/teal support: deep teal tones are used sparingly for confirmation and focus

Surfaces:
- Glass panels use translucent white/ice backgrounds.
- Nested surfaces increase perceived depth through stronger blur and shadow.
- Subtle radial and linear highlights are used instead of loud gradients.

Radius:
- Large panels: `22px`
- Cards: `18px`
- Controls and pills: `999px`

Shadows and Blur:
- Panel shadows are soft, layered, and cool-toned.
- Glass blur is approximately `12px`.
- Panels use border highlights and inset edge lines for definition.

Motion:
- Transitions are short and smooth.
- Reference easing resembles `cubic-bezier(0.2, 0.8, 0.2, 1)`.

## Component Patterns

Layout:
- App shell with ambient background layer.
- Left navigation rail.
- Header glass panel with title/search/actions.
- Main content sections built from repeatable panel/card blocks.

Components:
- `glass-panel` for primary containers.
- `stat-card` for KPI blocks.
- `feature-card` or card-like panels for operational content.
- `chip`/pill labels for metadata.
- `btn-primary`, `btn-secondary`, and ghost controls.
- Polished rounded inputs/search.
- Segmented controls for filtering.
- Table shell with calm row separation.

## Customer Portal Inference

The new customer dashboard applies the same visual language to customer-facing needs: invoices, orders, support, usage, and settings. No backend/admin workflow logic is reused. Data is static frontend-only placeholder content so the surface can be reviewed visually without changing the production maintenance system.
