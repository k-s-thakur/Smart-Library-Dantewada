---
name: "Soft Linen"
description: "Warm linen canvas with abundant whitespace, gently rounded corners, and a single sage accent. Calm, airy, considered. Nothing shouts."
tags: [minimal, warm, light, premium]
colors:
  primary:   "#2A2823"
  secondary: "#8B8678"
  tertiary:  "#7A8B6F"
  neutral:   "#F6F2EA"
  surface:   "#FBF8F2"
typography:
  display: Fraunces
  body:    Inter
  mono:    "JetBrains Mono"
  scale:
    hero: "4.75rem / 1.05 / 400 / -0.025em"
    h1:   "2.75rem / 1.1 / 400 / -0.02em"
    h2:   "1.5rem / 1.3 / 500 / -0.01em"
    body: "1.0625rem / 1.65 / 400 / -0.005em"
radius:
  sm: 8px
  md: 12px
  lg: 18px
  pill: 9999px
shadows:
  card:   "0 1px 2px rgba(42, 40, 35, 0.04)"
  button: none
borders:
  card:    "1px solid rgba(42, 40, 35, 0.08)"
  divider: "rgba(42, 40, 35, 0.06)"
buttons:
  primary:
    background: #2A2823
    color: #F6F2EA
    border: 1px solid #2A2823
    shape: rounded
    padding: 13px 26px
    font: 500 / 0.9375rem / -0.005em
  secondary:
    background: #FBF8F2
    color: #2A2823
    border: 1px solid rgba(42, 40, 35, 0.14)
    shape: rounded
    padding: 13px 26px
    font: 500 / 0.9375rem / -0.005em
  outline:
    background: transparent
    color: #7A8B6F
    border: 1px solid #7A8B6F
    shape: rounded
    padding: 12px 24px
    font: 500 / 0.9375rem / -0.005em
  ghost:
    background: transparent
    color: #7A8B6F
    border: none
    shape: rounded
    padding: 11px 6px
    font: 500 / 0.9375rem / -0.005em
    hover: underline
charts:
  variant: line
  stroke_width: 1.75
  gridlines: false
  highlight: last
  dot_marker: true
  axis_color: "#8B8678"
  palette: ["#7A8B6F", "#2A2823", "#8B8678"]
fonts_url: "https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500;600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap"
dependencies: ["lucide-react"]
---

# Soft Linen

## AI Build Instructions

> **Read this section before writing any code.** The rules below
> are non-negotiable. Every value used in the UI must come from this
> file's frontmatter — never substitute, approximate, or invent new
> colors, fonts, radii, or shadows. If a value is missing, ask the
> user before adding one.

### 1 · Your role

You are building UI for a project that has adopted **Soft Linen** as its
design system. Treat `DESIGN.md` as the single source of truth.
Your job is to translate the user's product requirements into
components and pages that look like they were designed by the same
person who authored this file.

### 2 · Token compliance

- Pull every color, font family, radius, shadow, and spacing value
  from the frontmatter at the top of this file.
- Use semantic roles (e.g. `primary`, `accent`, `muted`) — never
  hard-code hex values that bypass the system.
- When a token can be expressed as a CSS variable, declare it once
  in your global stylesheet and reference it everywhere downstream.
- The Google Fonts `<link>` is provided in the Typography section.
  Add it to `<head>` before any component renders.

### 3 · Component recipes

Use these recipes verbatim when building the corresponding component.

#### Buttons

Four variants are defined. Pick one — never blend variants or invent a fifth.

- **Primary** — rounded shape, bg `#2A2823`, text `#F6F2EA`, border `1px solid #2A2823`, padding `13px 26px`, weight `500`.
- **Secondary** — rounded shape, bg `#FBF8F2`, text `#2A2823`, border `1px solid rgba(42, 40, 35, 0.14)`, padding `13px 26px`, weight `500`.
- **Outline** — rounded shape, text `#7A8B6F`, border `1px solid #7A8B6F`, padding `12px 24px`, weight `500`.
- **Ghost** — rounded shape, text `#7A8B6F`, padding `11px 6px`, weight `500`.

Reach for **primary** as the single dominant CTA per screen.
**Secondary** for the supporting action. **Outline** for tertiary
actions in toolbars. **Ghost** for inline links and table actions.

#### Cards

- Background: `#FBF8F2`
- Border: `1px solid rgba(42, 40, 35, 0.08)`
- Shadow: `0 1px 2px rgba(42, 40, 35, 0.04)`
- Radius: `radius.lg` (`18px`)
- Internal padding: `20px` for compact cards, `24–28px` for content cards.

#### Charts

- Bar/line variant: `line`
- No gridlines — let the bars/lines carry the data.
- Highlight strategy: `last` — emphasize a single bar/point per chart.
- Use the declared palette in order: `#7A8B6F`, `#2A2823`, `#8B8678`.

#### Typography pairings

- **Display (`Fraunces`)** — h1, h2, hero headlines, brand wordmarks.
- **Body (`Inter`)** — paragraphs, labels, button text, form inputs.
- **Mono (`JetBrains Mono`)** — code, eyebrows, metadata, numerals in tables.

### 4 · Hard constraints

Never do any of the following without explicit instruction from the user:

- Introduce a new color, font, radius, or shadow that isn't declared above.
- Mix this system with another (e.g. don't paste in Material or Bootstrap defaults).
- Use generic gradient defaults (purple→blue, peach→pink) — they break the system's voice.
- Reach for emoji icons. Use a consistent icon library and size icons in line with body type.
- Add motion that exceeds the system's restraint — keep transitions short (≤200ms) and subtle.

### 5 · Before you finish — verify

Run through this checklist for every screen you produce:

- [ ] Every color used appears in the Colors table above.
- [ ] Headlines use the display font; body copy uses the body font.
- [ ] Buttons match one of the declared variants exactly (shape, padding, weight).
- [ ] Border-radius values come from `radius.sm` / `radius.md` / `radius.lg` / `radius.pill`.
- [ ] Cards and dividers use the declared border + shadow tokens.
- [ ] No values were invented; if you needed something missing, you stopped and asked.

---

## Overview
Soft Linen is the visual language of a quiet morning — warm cream paper, abundant air, and a single quiet sage accent. The system is built around **whitespace as the primary material**: sections breathe at 160px+ vertical rhythm, body copy sits at 1.65 leading, and every surface is a half-shade away from the next. Nothing competes for attention because nothing needs to.

This is for product pages that want to feel slow on purpose — wellness brands, considered SaaS, slow-publishing journals, premium hospitality.

## Color
- **Charcoal #2A2823** — primary text. Warm enough to never read as cold black on linen.
- **Stone #8B8678** — captions, meta, axis labels.
- **Sage #7A8B6F** — the single accent. Outline buttons, ghost links, chart lines. Used **once or twice per screen**, never as a fill.
- **Linen #F6F2EA** — page canvas. Warm off-white.
- **Surface #FBF8F2** — card stock, a half-shade brighter than the page.

**No second accent exists.** Sage carries the entire chromatic load.

## Typography
- **Display: Fraunces** at 4.75rem / 400, -2.5% tracking. Warm modern serif with optical-size grace.
- **Body: Inter** at 1.0625rem with **1.65 leading**. The leading is non-negotiable.

| Role | Font | Size | Weight | Tracking |
|------|------|------|--------|----------|
| Hero | Fraunces | 4.75rem | 400 | -0.025em |
| H1 | Fraunces | 2.75rem | 400 | -0.02em |
| H2 | Inter | 1.5rem | 500 | -0.01em |
| Body | Inter | 1.0625rem | 400 | -0.005em / 1.65 |

## Whitespace Rhythm
Soft Linen is defined by its breathing room. Apply this rhythm:
- **Section gap: 160px** (mobile 96px) between major page sections.
- **Card padding: 32px–40px**. Never below 24px.
- **Heading-to-body gap: 24px** minimum.
- **Inter-paragraph: 16px**.

If a section feels comfortable, double its vertical padding. The system is built for over-spacing.

## Buttons
All four are gently rounded (12–18px), soft and round but never pill-shaped except for the optional pill variant.

- **Primary** — warm charcoal fill, linen label, no shadow. Quiet authority.
- **Secondary** — linen surface with a 14% stone hairline.
- **Outline** — transparent with a 1px sage border. The accent appears here.
- **Ghost** — bare sage label, hover underline.

**No drop shadows on buttons.** The form is the gesture.

## Cards
Surface tile, **1px stone border at 8%**, a single 1px shadow at 4%. Radius is **18px**. Cards never lift more than that hairline shadow — the page-flat read is the system.

## Charts & Data
A single 1.75px sage line over the linen canvas. **No gridlines, no fills.** A small sage dot at the latest reading. Axis labels in stone.

## Do's and Don'ts
- ✅ Whitespace is the material. Over-space; never crowd.
- ✅ Fraunces 400 for display — never 600+. Heavy weights kill the warmth.
- ✅ Sage appears once or twice per screen, never as a fill.
- ✅ 1.65 body leading minimum. Reading-first.
- ❌ No drop shadows beyond a 4% hairline.
- ❌ No second accent color. Sage is alone.
- ❌ No tight section padding. The breathing room IS the design.
- ❌ No pill buttons except for chrome — primary is gently rounded, not capsule.

---

## Tokens

> Generated from the same source the live preview renders from.
> Treat the values below as the contract — never substitute approximations.

### Colors

| Role      | Value |
|-----------|-------|
| primary   | `#2A2823` |
| secondary | `#8B8678` |
| tertiary  | `#7A8B6F` |
| neutral   | `#F6F2EA` |
| surface   | `#FBF8F2` |

### Typography

- **Display:** Fraunces
- **Body:** Inter
- **Mono:** JetBrains Mono

| Role | size / leading / weight / tracking |
|------|------------------------------------|
| Hero | 4.75rem / 1.05 / 400 / -0.025em |
| H1   | 2.75rem / 1.1 / 400 / -0.02em |
| H2   | 1.5rem / 1.3 / 500 / -0.01em |
| Body | 1.0625rem / 1.65 / 400 / -0.005em |

### Radius

- sm: `8px`
- md: `12px`
- lg: `18px`
- pill: `9999px`

### Shadows

- **card:** `0 1px 2px rgba(42, 40, 35, 0.04)`
- **button:** `none`

### Borders

- **card:** `1px solid rgba(42, 40, 35, 0.08)`
- **divider:** `rgba(42, 40, 35, 0.06)`

### Buttons

Four variants, each fully tokenized. The preview renders from these exact values.

#### Primary

| Property | Value |
|----------|-------|
| shape | `rounded` |
| background | `#2A2823` |
| color | `#F6F2EA` |
| border | `1px solid #2A2823` |
| padding | `13px 26px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |

#### Secondary

| Property | Value |
|----------|-------|
| shape | `rounded` |
| background | `#FBF8F2` |
| color | `#2A2823` |
| border | `1px solid rgba(42, 40, 35, 0.14)` |
| padding | `13px 26px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |

#### Outline

| Property | Value |
|----------|-------|
| shape | `rounded` |
| background | `transparent` |
| color | `#7A8B6F` |
| border | `1px solid #7A8B6F` |
| padding | `12px 24px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |

#### Ghost

| Property | Value |
|----------|-------|
| shape | `rounded` |
| background | `transparent` |
| color | `#7A8B6F` |
| border | `none` |
| padding | `11px 6px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |
| hoverHint | `underline` |

### Charts

| Property | Value |
|----------|-------|
| variant | `line` |
| strokeWidth | `1.75` |
| gridlines | `false` |
| highlight | `last` |
| dotMarker | `true` |
| axisColor | `#8B8678` |
| palette | `#7A8B6F`, `#2A2823`, `#8B8678` |

---

## Pro tokens

> Production-fidelity tokens. States, density, motion, elevation,
> content rules and a measured WCAG contract — derived from the
> resting tokens unless explicitly authored.

### States

#### Button

- **hover** — shadow: `0 8px 24px -10px rgba(122, 139, 111, 0.35)`, transform: `translateY(-1px)`, filter: `brightness(1.02)`
- **focus** — outline: `2px solid rgba(122, 139, 111, 0.4)`, outline-offset: `3px`
- **active** — transform: `translateY(0) scale(0.98)`
- **disabled** — opacity: `0.4`, filter: `saturate(0.5)`
- **loading** — opacity: `0.65`
- **selected** — bg: `rgba(122, 139, 111, 0.18)`, color: `#7A8B6F`

#### Input

- **hover** — bg: `rgba(122, 139, 111, 0.03)`, border: `1px solid rgba(122, 139, 111, 0.4)`
- **focus** — border: `1px solid rgba(122, 139, 111, 0.6)`, shadow: `0 0 0 4px rgba(122, 139, 111, 0.12)`
- **disabled** — opacity: `0.4`
- **error** — border: `1px solid rgba(244,114,182,0.7)`, shadow: `0 0 0 4px rgba(244,114,182,0.15)`

#### Card

- **hover** — shadow: `0 16px 40px -16px rgba(122, 139, 111, 0.3)`, transform: `translateY(-3px)`
- **selected** — bg: `rgba(122, 139, 111, 0.04)`, border: `1px solid rgba(122, 139, 111, 0.5)`
- **dragging** — transform: `scale(1.03) rotate(-0.8deg)`, opacity: `0.92`

#### Tab

- **hover** — bg: `rgba(122, 139, 111, 0.08)`, color: `#7A8B6F`
- **focus** — outline: `2px solid rgba(122, 139, 111, 0.4)`, outline-offset: `2px`
- **selected** — bg: `rgba(122, 139, 111, 0.16)`, color: `#7A8B6F`

### Density

| Mode | padding × | row × | body | radius × | Use for |
|------|-----------|-------|------|----------|---------|
| compact | 0.72 | 0.78 | 0.8125rem | 0.85 | Information-dense — tables, IDEs, dashboards |
| comfortable | 1 | 1 | 0.9375rem | — | Default — most product UI |
| spacious | 1.35 | 1.3 | 1rem | 1.15 | Editorial — marketing, long-form, settings |

### Motion

**Signature — Soft fade.** Long, gentle transitions with a symmetric easing curve. Motion is calming, never intrusive.

```css
transition: all 400ms cubic-bezier(0.45, 0.05, 0.55, 0.95);
```

| Token | Value |
|-------|-------|
| duration.instant | `120ms` |
| duration.fast | `240ms` |
| duration.base | `400ms` |
| duration.slow | `600ms` |
| easing.standard | `cubic-bezier(0.45, 0.05, 0.55, 0.95)` |
| easing.decelerate | `cubic-bezier(0.0, 0, 0.2, 1)` |
| easing.accelerate | `cubic-bezier(0.4, 0, 1, 1)` |
| easing.spring | `cubic-bezier(0.45, 1.4, 0.55, 1)` |

### Elevation

Five-level scale, system-specific recipe.

| Level | Shadow | Recipe |
|-------|--------|--------|
| level0 | `none` | Flat — the tone separates, not the shadow. |
| level1 | `0 2px 6px -2px rgba(122, 139, 111, 0.12)` | Soft tinted lift. |
| level2 | `0 8px 24px -10px rgba(122, 139, 111, 0.2)` | Floating card — pastel-tinted shadow. |
| level3 | `0 16px 48px -16px rgba(122, 139, 111, 0.28)` | Sheet — visible tinted glow. |
| level4 | `0 32px 80px -24px rgba(122, 139, 111, 0.4)` | Modal — tinted wash, scrim required. |

### Content

- **measure:** `64ch` (max line length for body prose)
- **paragraph spacing:** `1.35em`
- **list indent:** `1.5em`
- **list gap:** `0.6em`
- **link:** color `#7A8B6F`, underline `hover`
- **blockquote:** border `2px solid rgba(122, 139, 111, 0.5)`, padding `0.9em 1.2em`
- **code:** background `rgba(122, 139, 111, 0.1)`, color `#2A2823`

### Accessibility (WCAG 2.1)

**Overall:** AA-Large

| Pair | Ratio | Required | Grade | Suggested fix |
|------|-------|----------|-------|---------------|
| Body text on surface | 13.89:1 | AA | AAA | — |
| Body text on canvas | 13.19:1 | AA | AAA | — |
| Muted text on surface | 3.43:1 | AA | AA-Large | `#757165` → 4.6:1 (AA) |
| Accent on surface | 3.45:1 | AA-Large | AA-Large | — |
| Accent on canvas | 3.27:1 | AA-Large | AA-Large | — |
