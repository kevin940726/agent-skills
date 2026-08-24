---

name: web-app-design
description: Industry-standard guidelines for building modern web interfaces (based on Vercel Web Interface Guidelines)
license: MIT
---

## Interactions

- **Keyboard accessibility**: All flows keyboard-operable, follow WAI-ARIA patterns
- **Focus management**: Visible focus ring using `:focus-visible`, focus traps for modals
- **Hit targets**: Minimum 24px (44px mobile). Expand visual target < 24px to >= 24px
- **Mobile inputs**: Font size >= 16px to prevent iOS auto-zoom
- **Never disable**: Browser zoom, paste in inputs, hydration-safe inputs
- **Loading states**: 150-300ms show delay, 300-500ms minimum visible time
- **State in URL**: Persist filters, pagination, tabs in URL for shareable links
- **Optimistic updates**: Update UI immediately, reconcile on server response
- **Destructive actions**: Require confirmation or provide Undo
- **Touch**: `touch-action: manipulation` to prevent double-tap zoom
- **Deep-link**: Everything using state (filters, tabs, pagination)

## Animations

- **Honor reduced motion**: Respect `prefers-reduced-motion`
- **Implementation preference**: CSS > Web Animations API > JS libraries (e.g., motion)
- **GPU-accelerated**: Prioritize `transform`, `opacity`; avoid `width`, `height`, `top`, `left`
- **Never `transition: all`**: Explicitly list properties
- **Interruptible**: Cancelable by user input
- **Input-driven**: Animate in response to actions, avoid autoplay
- **Easing**: Fit to subject (size, distance, trigger)
- **SVG transforms**: Apply to `<g>` wrappers with `transform-box: fill-box`

## Layout

- **Optical alignment**: Adjust ±1px when perception beats geometry
- **Deliberate alignment**: Every element aligns intentionally (grid, baseline, edge)
- **Responsive**: Test on mobile, laptop, ultra-wide (zoom to 50% for ultra-wide)
- **Safe areas**: Use `env()` for notches and insets
- **No excessive scrollbars**: Fix overflow issues
- **Let browser size**: Prefer flex/grid over JS measuring

## Content

- **Inline help first**: Tooltips as last resort
- **Stable skeletons**: Match final content to avoid CLS
- **Accurate page titles**: Reflect current context
- **All states designed**: Empty, sparse, dense, error states
- **Typography**: Curly quotes (“ ”), avoid widows/orphans, tabular-nums for comparisons
- **Accessibility**: Color isn't enough - include text labels, icons have labels
- **Semantics first**: Prefer native elements before ARIA
- **Headings**: Hierarchical h1-h6 with skip link
- **Locale-aware**: Format dates, times, numbers for user's locale

## Forms

- **Enter submits**: Focus + Enter submits (last control if multiple)
- **Textarea**: Cmd/Ctrl+Enter submits, Enter adds new line
- **Labels**: Every control has label, clicking focuses control
- **Don't block typing**: Allow any input, show validation feedback
- **Error placement**: Next to field, focus first error on submit
- **Autocomplete**: Set autocomplete and meaningful name values
- **Placeholders**: End with ellipsis, set example value
- **Unsaved changes**: Warn before navigation

## Performance

- **Test matrix**: iOS Low Power Mode, macOS Safari
- **Layout work**: Batch reads/writes, avoid reflows/repaints
- **Network budget**: POST/PATCH/DELETE < 500ms
- **Large lists**: Virtualize with virtua or `content-visibility: auto`
- **Images**: Explicit dimensions to prevent CLS, lazy-load below fold
- **Fonts**: Subset with unicode-range, preload critical text
- **Expensive work**: Move to Web Workers

## Design Details

- **Layered shadows**: Mimic ambient + direct light (at least 2 layers)
- **Crisp borders**: Combine borders + shadows, semi-transparent for clarity
- **Nested radii**: Child radius <= parent radius
- **Hue consistency**: Tint borders/shadows/text toward same hue on non-neutral backgrounds
- **Contrast**: Prefer APCA over WCAG 2
- **Interactions increase contrast**: Hover/active/focus states
- **Theme color**: Set `<meta name="theme-color">` to match background

## Copywriting

- Active voice: "Install the CLI" not "The CLI will be installed"
- Title Case for headings/buttons, sentence case for marketing
- Use numerals: "8 deployments" not "eight deployments"
- Positive language: "Something went wrong—try again" not "Your deployment failed"
- Error messages guide exit: Tell user how to fix it
