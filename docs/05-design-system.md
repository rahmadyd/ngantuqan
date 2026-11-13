# 05 — UI/UX Design System

> Phase 1 deliverable. Creative/playful direction with strict, art-directed rules. The spec (§3) supplies the palette and typefaces; everything below turns those into a buildable system.

## 5.1 Design principles

| # | Principle | Operational rule |
|---|---|---|
| 1 | **Colour is punctuation, not wallpaper** | One accent colour per viewport region. A page never shows all four accents competing. |
| 2 | **Ink is always dark** | The three warm/bright accents (secondary, coral, mint) carry `#20243A` text. Only primary carries white text. |
| 3 | **Whitespace is structural** | Section spacing uses the scale, not arbitrary margins. Generous by default; tight only inside cards. |
| 4 | **Asymmetry with intent** | Offset grids are used where the composition needs rhythm; every offset has a visible alignment edge so it reads as designed, not broken. |
| 5 | **Motion explains, never decorates** | Movement is limited to entrance, state change, and feedback. Nothing loops, nothing parallaxes gratuitously. |
| 6 | **No dead affordances** | Every button, chip, tab, and link performs a real action or navigates to a real route. |
| 7 | **Consistency over novelty** | One radius scale, one shadow scale, one spacing scale, one type scale. The playful layer lives in composition and shape, not in inconsistent metrics. |

## 5.2 Brand identity — ngantuqan

**Studio name: `ngantuqan`** (supplied by the client; spec §1 forbids inventing a name, so this is the authoritative value).

### Wordmark

The repository contains **no logo asset** (`*.svg` / `*.png` search returned nothing). The wordmark is therefore **typographic by default**, and an uploaded logo image replaces it when supplied via Admin → Settings (§5.J). Both paths render the same `<Logo>` component, so swapping is zero-code.

**Lockup**: `ngantuqan` set in **Fredoka 600** (the display face — a rounded, warm, playful grotesque that matches the creative-studio tone), lowercase throughout, tracking `-0.03em`, followed by a single **coral dot** as a full stop.

```
ngantuqan.
```

| Element | Spec |
|---|---|
| Typeface | Fredoka, weight 600 |
| Case | lowercase, always — never `Ngantuqan` or `NGANTUQAN` |
| Tracking | `-0.03em` |
| Colour | `--text` on `--background`; `--background` on the dark footer/CTA panel |
| Terminal dot | `--coral`, 0.18em diameter, baseline-aligned, sits 0.06em after the final `n` |
| Header size | 22px desktop / 20px mobile |
| Footer size | 20px |
| Minimum size | 16px — below this the dot disappears into the `n` and the mark stops working |
| Clear space | 0.5 × cap-height on all sides |
| Alt text | `ngantuqan` (the name is the content; the dot is decorative) |

**Rules**
- The name is **never translated, transliterated, shortened, or pluralised**. "Our studio" / "the team" appear in prose, but the mark itself always reads `ngantuqan`.
- The terminal dot is **not** a period in a sentence. It is part of the mark. It never appears detached from the wordmark.
- The dot is the only permitted ornament. No gradient, no outline, no secondary glyph.
- On the dark footer/CTA panel the wordmark inverts to `--background` and the dot stays `--coral` (contrast 2.78:1 against `#20243A` — it is a **decorative** element with no informational role, and the mark's legibility is carried by the word itself at 15.27:1). It is marked `aria-hidden`.

**Logo image override.** When `studio.logo_url` is set in `site_settings`, the `<Logo>` component renders the image at the same optical height (22px header / 20px footer) with the wordmark as the accessible name. The typographic dot is suppressed when an image mark is present — a raster mark with a vector dot reads as a mistake.

### Favicon & social image

| Asset | Source | Spec |
|---|---|---|
| Favicon | `src/app/icon.svg` | Single lowercase `n` in Fredoka-style rounded form, `--primary` fill on `--background` |
| OG image | `src/app/opengraph-image.tsx` (dynamic, `ImageResponse`) | Wordmark on `--background` with one coral dot and the tagline; 1200×630 |
| Apple touch icon | `src/app/apple-icon.tsx` | Wordmark on `--primary`, 180×180 |

The OG image is generated at build time from `site_settings`, so it updates when the tagline changes — no static asset to maintain.

### Voice

| Aspect | Direction |
|---|---|
| Register | Confident and warm. First person plural ("we design", "we built"). Never corporate passive ("solutions are provided"). |
| Sentence length | Short. One idea per sentence, most under 14 words. |
| Headlines | Declarative, slightly bold. "Design that feels like you." — not "Our Comprehensive Design Services" |
| Avoid | Buzzwords (synergy, leverage, solution, ecosystem, innovative), exclamation marks, emoji, ALL CAPS emphasis, "we're not just a design studio — we're a creative partner" constructions. |
| Numbers | Concrete where possible ("48 hours", "3 revisions"), never vague ("fast turnaround", "affordable"). |
| Error copy | Plain and non-technical. "That file is larger than 4 MB. Try a smaller one." — never a stack trace or an error code. |

### Tagline

A tagline is **not** yet supplied. The seed value is the descriptive, non-promotional default `"Creative Design Studio & Digital Marketplace"` (lifted from the spec's own §1 title, so it asserts nothing false). It is fully editable in Admin → Settings and appears in the hero eyebrow, the footer, the OG image, and email headers. **Replace it with the real tagline before launch** — flagged in `08-technical-conflicts.md`.

### Etymology note — needs client confirmation

`ngantuqan` is Javanese. The Krama (polite) register commonly applies an `-an` suffix, and Krama also hardens `t` → `q`; both rules together would turn `ngantuk` ("to welcome, to receive a guest") into `ngantuqan` — a fitting reading for a studio that receives client briefs. **This is an inference from the morphology, not a confirmed etymology**, and it is not written anywhere in the product. The `/about` brand story is authored by the client in Admin → Website Content; the build ships a neutral placeholder story, never an invented origin narrative. Flagged for confirmation in `08-technical-conflicts.md`.

## 5.3 Colour tokens

Defined once in `src/app/globals.css` as CSS custom properties, mapped into Tailwind v4 via `@theme inline`. Values are stored as **hex** (the spec's source format) and mirrored as **OKLCH** for `color-mix()`/alpha work that Tailwind v4 performs natively.

```css
:root {
  /* Brand */
  --primary:      #4263EB;  /* oklch(0.5566 0.2082 268.35) */
  --secondary:    #FFE66D;  /* oklch(0.9224 0.1427  97.78) */
  --coral:        #FF6B6B;  /* oklch(0.7116 0.1812  22.84) */
  --mint:         #8CE6C0;  /* oklch(0.8578 0.1026 165.31) */
  --background:   #FFFDF7;  /* oklch(0.9939 0.0082  91.48) */
  --text:         #20243A;  /* oklch(0.2675 0.0415 275.37) */

  /* Semantic derivatives */
  --surface:          #FFFFFF;
  --surface-sunken:   #F7F5EF;
  --surface-tint:     #F2F4FD;  /* primary @ 8% */
  --border:           #E7E3D8;
  --border-strong:    #D6D1C2;
  --muted:            #585A69;  /* text @ 25% toward bg */
  --muted-foreground: #6E707C;  /* text @ 35% toward bg */

  /* Status */
  --success: #1F9D6B;
  --warning: #B26A00;
  --danger:  #D64545;
  --info:    #4263EB;

  /* On-colour ink */
  --on-primary:   #FFFFFF;
  --on-secondary: #20243A;
  --on-coral:     #20243A;
  --on-mint:      #20243A;
}
```

### Contrast audit (WCAG 2.1, computed against the actual hex values)

| Pair | Ratio | Normal text AA (4.5) | Large text AA (3.0) | UI/graphic (3.0) |
|---|---|---|---|---|
| text `#20243A` on background `#FFFDF7` | **15.02** | ✅ | ✅ | ✅ |
| text on surface `#FFFFFF` | 15.27 | ✅ | ✅ | ✅ |
| text on muted `#6E707C` | 4.83 | ✅ | ✅ | ✅ |
| text on sunken `#F7F5EF` | 13.72 | ✅ | ✅ | ✅ |
| text on primary tint `#F2F4FD` | 13.92 | ✅ | ✅ | ✅ |
| **white on primary** `#4263EB` | **4.98** | ✅ | ✅ | ✅ |
| **text on secondary** `#FFE66D` | **12.21** | ✅ | ✅ | ✅ |
| **text on coral** `#FF6B6B` | **5.50** | ✅ | ✅ | ✅ |
| **text on mint** `#8CE6C0` | **10.32** | ✅ | ✅ | ✅ |
| white on coral | 2.78 | ❌ | ❌ | ❌ |
| white on mint | 1.48 | ❌ | ❌ | ❌ |
| coral on background | 2.73 | ❌ | ❌ | ❌ |
| mint on background | 1.45 | ❌ | ❌ | ❌ |
| secondary on background | 1.23 | ❌ | ❌ | ❌ |

### Enforced usage rules (derived from the audit)

1. **Primary is the only accent that carries white text.** It is the only colour used as a filled button background with white label.
2. **Coral, mint, and secondary are surfaces with dark ink.** They are used as backgrounds, borders, underlines, stickers, badges, and blob shapes — never as a text colour on the cream background, and never with white text on top.
3. **Accent colours as text** are permitted only at the `dark` variant of the same hue (e.g. `--coral-ink: #B23A3A`), because the pure accents fail 4.5:1 on cream. Where a coloured *text* is needed, use `--text` with a coloured underline/border instead.
4. **Focus ring** uses `--text` at 3px with a 2px cream offset — visible on every surface including the bright accents.
5. Every interactive element's boundary hits 3:1 against its background.

### Accent allocation map

| Region | Accent | Rationale |
|---|---|---|
| Hero | primary | Single strongest CTA |
| Selected Works | none (neutral cards) + primary accents | Work must not compete with CTA |
| Services Overview | secondary (rotating per card: secondary / mint / coral / primary / mint) | The one place multiple accents appear — but never two on the same card |
| Studio Introduction | mint blob (decorative, non-interactive) | Softens the editorial text block |
| Digital Products Preview | coral price badge | Draws the eye to price |
| Why Work With Us | none | Text-forward |
| Testimonials | secondary quote marks | Warm, editorial |
| CTA Section | primary on dark `#20243A` panel | Maximum contrast at the decision point |
| Footer | text-coloured on `#20243A` | Closure |

## 5.4 Typography

Loaded with `next/font/google`, exposed as CSS variables, referenced through Tailwind's `font-*` tokens. `display: 'swap'`, subset `latin`.

```css
--font-display: var(--font-fredoka);      /* Fredoka — headings */
--font-body:    var(--font-inter);        /* Inter — body */
--font-label:   var(--font-space-grotesk);/* Space Grotesk — labels, eyebrows, nav */
```

### Type scale

Fluid, `clamp()`-based, with a 1.25 (major third) ratio at desktop.

| Token | Size (mobile → desktop) | Line height | Tracking | Family | Weight | Use |
|---|---|---|---|---|---|---|
| `display-xl` | 44 → 84px | 1.02 | -0.03em | Fredoka | 600 | Hero headline only |
| `display-lg` | 36 → 60px | 1.05 | -0.025em | Fredoka | 600 | Page titles, CTA headline |
| `display-md` | 30 → 44px | 1.1 | -0.02em | Fredoka | 600 | Section headlines |
| `display-sm` | 24 → 32px | 1.15 | -0.015em | Fredoka | 600 | Card titles, project titles |
| `title` | 20 → 24px | 1.25 | -0.01em | Fredoka | 500 | Sub-section headings, list titles |
| `body-lg` | 17 → 18px | 1.6 | 0 | Inter | 400 | Lead paragraphs, intros |
| `body` | 16px | 1.65 | 0 | Inter | 400 | Default body |
| `body-sm` | 14px | 1.6 | 0 | Inter | 400 | Secondary copy, captions |
| `label` | 13px | 1.4 | 0.06em | Space Grotesk | 500 | Eyebrows, nav, tags, buttons |
| `label-sm` | 11px | 1.3 | 0.08em | Space Grotesk | 500 | Overlines, table headers (uppercase) |
| `price` | 22 → 28px | 1.1 | -0.01em | Fredoka | 600 | Prices |

### Typography rules

- **Fredoka is display-only.** Never used for body copy, form labels, or dense UI. Its rounded forms carry the personality; overusing it would exhaust it.
- **Space Grotesk** is the connective tissue: navigation, eyebrows, buttons, tags, badges, table headers, stat labels. Its slight mechanical feel pairs with Inter's neutrality to keep Fredoka distinctive.
- **Inter** for all reading matter. `font-feature-settings: 'cv11', 'ss01'` for the nicer `a` and `l`.
- **Eyebrow labels** are uppercase, `--label-sm`, 0.08em tracking, and always paired with a coloured rule or dot. This is the recurring signature of the visual identity.
- **Measure**: body paragraphs capped at `68ch`. Lead paragraphs at `58ch`.
- **Balance**: hero and section headlines use `text-wrap: balance`; body copy uses `text-wrap: pretty`.
- **No all-caps body copy.** All-caps is reserved for `--label-sm` eyebrows.

## 5.5 Spacing scale

Tailwind v4 default rem scale, restricted to these steps. Nothing else is used.

| Token | Value | Typical use |
|---|---|---|
| `space-3xs` | 0.25rem / 4px | Icon-to-label gap |
| `space-2xs` | 0.5rem / 8px | Tight inline gaps, badge padding |
| `space-xs` | 0.75rem / 12px | Label-to-value |
| `space-sm` | 1rem / 16px | Card internal gaps, list rows |
| `space-md` | 1.5rem / 24px | Between form fields, card padding (sm) |
| `space-lg` | 2rem / 32px | Card padding (md), grid gaps |
| `space-xl` | 3rem / 48px | Between blocks inside a section |
| `space-2xl` | 4rem / 64px | Small-section rhythm |
| `space-3xl` | 6rem / 96px | **Section padding (desktop)** |
| `space-4xl` | 8rem / 128px | Hero vertical rhythm, major breaks |

Mobile section padding is `space-2xl` (4rem); desktop is `space-3xl` (6rem). `space-4xl` is reserved for the hero and the final CTA only.

## 5.6 Layout & grid

| Breakpoint | Tailwind | Columns | Gutter | Outer margin | Container max |
|---|---|---|---|---|---|
| Mobile | `< 640px` | 4 | 16px | 20px | full |
| Small tablet | `≥ 640px` | 8 | 20px | 32px | full |
| Tablet | `≥ 768px` | 8 | 24px | 40px | 768px |
| Laptop | `≥ 1024px` | 12 | 24px | 48px | 1024px |
| Desktop | `≥ 1280px` | 12 | 32px | 64px | 1200px |
| Wide | `≥ 1536px` | 12 | 32px | auto | 1320px |

**Container**: `max-w-[1320px] mx-auto px-5 md:px-10 lg:px-12 xl:px-16`.

**Editorial grid**: 12 columns, asymmetric spans by default — e.g. hero text spans 7, visual spans 5 offset by 1; portfolio cards span 7/5 in an offset row rather than a uniform 3-up. Where a uniform grid is used (shop catalogue, admin tables), the card is fully consistent.

**Avoid horizontal overflow**: `overflow-x-hidden` on the root, `min-w-0` on all flex/grid children, `max-w-full` on media, and `break-words` on user-supplied strings (product titles, customer messages).

## 5.7 Radii, borders, shadows

| Token | Value | Use |
|---|---|---|
| `rounded-sm` | 8px | Chips, small badges, inputs |
| `rounded-md` | 12px | Buttons, small cards, selects |
| `rounded-lg` | 20px | **Default card radius** |
| `rounded-xl` | 28px | Feature panels, large media frames |
| `rounded-2xl` | 36px | Hero blobs, oversized stickers |
| `rounded-full` | 9999px | Pills, avatars, dots, icon buttons |

**Borders**: 1px solid `--border` by default. A "playful" border treatment uses `2px` solid `--text` on a small subset of accent cards (the Services Overview, testimonial quotes) — never on form controls, tables, or dense UI.

**Shadows** — minimal, warm-tinted, never neutral grey:

| Token | Value | Use |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(32,36,58,0.05)` | Hairline lift on inputs |
| `shadow-sm` | `0 2px 8px rgba(32,36,58,0.06)` | Cards at rest |
| `shadow-md` | `0 8px 24px rgba(32,36,58,0.08)` | Hover on cards, dropdowns |
| `shadow-lg` | `0 18px 48px rgba(32,36,58,0.12)` | Dialogs, mobile nav sheet |
| `shadow-blob` | `0 20px 60px rgba(67,99,235,0.18)` | Primary-tinted hero blob only |

No shadows on text, icons, badges, or table rows.

## 5.8 Motion

**Implemented with CSS.** The rules below are the rules the site follows — the durations, the easing, and the limits are all in `src/app/globals.css` as custom properties and keyframes. A JavaScript animation library was specified in §2 and installed, but the build ended up with no entrance animation that needed one, so the dependency was removed rather than left in the bundle for nothing.

| Token | Duration | Easing | Use |
|---|---|---|---|
| `dur-instant` | 80ms | `ease-out` | Press feedback, focus ring |
| `dur-fast` | 150ms | `ease-out` | Hover, colour changes |
| `dur-base` | 250ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Card lift, accordion |
| `dur-slow` | 450ms | `cubic-bezier(0.22, 1, 0.36, 1)` | Section entrance |
| `dur-reveal` | 700ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Hero/stagger reveal |

**Rules**
- Transform + opacity only. Animating `width`, `height`, `top`, or `filter` is forbidden on scroll-triggered elements.
- Entrance reveals use a 12px translate + fade, staggered 60ms per child, max 6 children per group.
- `prefers-reduced-motion: reduce` → all transforms collapse to 0, durations drop to `dur-instant`. Implemented as a global CSS override in `src/app/globals.css`.
- No parallax, no autoplaying loops, no scroll-jacking, no animated backgrounds.

## 5.9 Iconography

Lucide, `stroke-width: 1.75`, `size: 20` default / `16` inline / `24` in feature slots. Icons always pair with a text label in navigation and buttons. Icon-only buttons require an `aria-label`. Decorative icons are `aria-hidden`.

## 5.10 Image treatment

| Context | Aspect | Radius | Object fit |
|---|---|---|---|
| Portfolio card | 4/3 | `rounded-lg` | `cover` |
| Portfolio featured | 16/10 | `rounded-xl` | `cover` |
| Service cover | 3/2 | `rounded-lg` | `cover` |
| Product preview | 1/1 | `rounded-lg` | `cover` |
| Hero visual | 4/5 | `rounded-2xl` | `cover` |
| Project gallery | 3/2 | `rounded-lg` | `cover` |
| Avatar | 1/1 | `rounded-full` | `cover` |

Every image is `next/image` with a `sizes` attribute matched to its grid span, `alt` from the admin-provided alt text (falling back to the title), and lazy loading except the hero LCP image (`priority`).

## 5.11 Component states (mandatory for every interactive element)

| State | Required treatment |
|---|---|
| Default | Defined per component |
| Hover | Visible change — colour, 2px lift, or border. Not opacity alone on text |
| Focus-visible | 3px `--text` ring, 2px offset, never removed |
| Active / pressed | 1px down-translate or 4% darkening |
| Loading | Spinner or skeleton matching final dimensions; label text preserved to prevent layout shift; `aria-busy="true"` |
| Disabled | 45% opacity, `cursor-not-allowed`, `aria-disabled` |
| Empty | Icon + title + one-line explanation + a real action button. Never a bare "No data" |
| Error | Inline message below the field, `role="alert"`, red hairline border, `aria-describedby` wired to the input |
| Success | Confirmation panel with the outcome, a reference number, and the next step |
| Destructive | Confirmation dialog naming the exact item; action button uses `--danger` |

## 5.12 Forms

- Labels always visible above fields (no placeholder-as-label). Placeholders show format examples only.
- Required fields marked with an asterisk plus `aria-required`; the asterisk is `aria-hidden` and described in the legend text.
- Inline validation on blur, re-validated on submit; the first invalid field receives focus.
- Server errors render in a form-level alert with `role="alert"`; field errors map back to their fields.
- Submit buttons show a spinner and disable during submission. Double submission is prevented server-side by an idempotency check.
- File inputs show the accepted formats and maximum size before the picker opens.
- Textareas have a character counter that turns `--warning` at 90% of the limit.

## 5.13 Navigation behaviour

| Viewport | Behaviour |
|---|---|
| Desktop `≥ 1024px` | Horizontal nav, logo left, links centre-left, CTA button right. Sticky with a blur-free solid cream background and a bottom hairline that appears on scroll. |
| Tablet `768–1023px` | Logo + CTA + hamburger. Nav collapses into a full-height slide-in panel from the right. |
| Mobile `< 768px` | Logo + hamburger. Panel contains links, the CTA, socials, and email. Focus is trapped while open; `Escape` closes; body scroll is locked. |

Active route is marked with `aria-current="page"` and a coloured underline/dot. The mobile panel closes on route change.

## 5.14 Admin surface rules

The admin is a working tool, not a public showcase. It gets **no** decorative blobs, no stickers, no oversized display type, and no motion beyond 150ms. It uses the same tokens but a denser scale:

- Body text 14px, table rows 40px, card radius `rounded-md`.
- Dense grids, visible borders instead of shadows.
- Status badges use the muted semantic palette, not the brand accents.
- Charts are the only place colour accents appear, and they use a restrained 5-colour series derived from the brand palette.
- Destructive actions always confirm. Bulk actions always show an affected-count summary.

## 5.15 Semantic colour usage map (admin status badges)

| Status | Badge style |
|---|---|
| `NEW_INQUIRY`, `NEW`, `PENDING` | Neutral surface + `--text` text + `--info` dot |
| `CONTACTED`, `IN_PROGRESS`, `QUOTED` | `--surface-tint` + `--primary` text |
| `WAITING_FOR_PAYMENT`, `REVISION` | `#FFF6E0` + `--warning` text |
| `COMPLETED`, `PAID`, `RESOLVED`, `PUBLISHED` | `#E7F7F0` + `--success` text |
| `CANCELLED`, `FAILED`, `SPAM`, `UNPUBLISHED` | `#FDECEC` + `--danger` text |

## 5.16 Accessibility checklist (applied per screen)

- [ ] One `<h1>`; heading levels never skip.
- [ ] Landmarks: `header`, `nav`, `main`, `footer`; `aria-label` on multiple `nav`s.
- [ ] Skip-to-content link, visible on focus.
- [ ] Every interactive element keyboard-reachable with a visible focus ring.
- [ ] All images have meaningful `alt` (or `alt=""` when decorative).
- [ ] Icon-only controls have `aria-label`.
- [ ] Form labels associated via `htmlFor`/`id`; errors via `aria-describedby`.
- [ ] Dialogs: focus trapped, `Escape` closes, focus returns to the trigger.
- [ ] Toasts: `role="status"` (polite) for success, `role="alert"` for errors.
- [ ] Colour is never the sole signal — status badges include a text label.
- [ ] Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI boundaries (audited above).
- [ ] `prefers-reduced-motion` honoured.
- [ ] Touch targets ≥ 44×44px on mobile.
- [ ] Dynamic route changes announce via a live region.
