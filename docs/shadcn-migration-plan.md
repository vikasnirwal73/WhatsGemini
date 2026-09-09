# Migrating to shadcn/ui — Phased Plan

This is a planning document only. Nothing in this file should be executed automatically —
each phase below is meant to be picked up and done as its own piece of work, checked in,
and verified before moving to the next one.

## Why this migration is lower-risk than it sounds

The app already speaks most of shadcn's dialect:

- `src/utils/cn.ts` is already `clsx` + `tailwind-merge` — the exact `cn()` shadcn generates.
- `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip` are
  already dependencies, already wrapped in `src/components/ui/Dialog.tsx`,
  `DropdownMenu.tsx`, `Tooltip.tsx` — following the same "thin wrapper over Radix" shape
  shadcn components use.
- Colors are already CSS custom properties (`--color-primary`, `--color-text-main`, etc.,
  as `R G B` triples) consumed via `rgb(var(--x) / <alpha-value>)` in `tailwind.config.js`,
  with light values in `:root` and dark overrides in `.dark` (`src/index.css`). shadcn's
  default template uses the identical pattern, just with `hsl()` and different variable
  names.

What's missing is: a dedicated tokens file (this ticket's second ask), `class-variance-
authority` for variant-driven components, a `Button` component (the app currently has
none — every button is a hand-styled `<button>`), and the shadcn-canonical variable names
(`--background`, `--foreground`, `--card`, `--primary`, `--border`, etc.) that
CLI-generated component source expects out of the box.

**Guiding principle for every phase below: additive first, rename later (optional).**
`bg-panel`, `text-ink`, `border-line` etc. are used across ~29 files today. Renaming them
in one pass would be a large, high-risk, purely mechanical diff for no functional gain. So
instead of renaming the app's existing tokens to match shadcn's naming, we **add shadcn's
expected variable names as aliases onto the same values**. Existing code keeps working
untouched; new/replaced components get the names they expect. A full rename becomes an
optional final-polish phase, not a blocking one.

**Framework note:** this is a Create React App (`react-scripts`) project, which isn't one
of the shadcn CLI's first-class supported targets (Next.js/Vite/Remix/Astro/Laravel/
Gatsby). `npx shadcn@latest init` may not detect the project correctly. Plan accordingly
(see Phase 0) — the fallback is shadcn's own documented "Manual" installation path, which
is just: hand-write `components.json`, then `npx shadcn@latest add <component>` to pull
component source files (or copy them from ui.shadcn.com by hand if `add` also fails to
detect the framework).

---

## Phase 0 — Tooling baseline ✅ Done

Goal was: get the CLI (or manual fallback) working and the core dependency added, with
zero visual or behavioral change to the app.

**Correction (found during Phase 4):** this doc originally claimed a real `@/` alias
worked via plain `tsconfig.json` `paths`, verified by a passing build. That build's
success was misleading — it later broke, and reading CRA's actual webpack config
(`node_modules/react-scripts/config/modules.js`) confirmed why: **webpack never reads
`tsconfig.json`'s `paths` field at all.** `tsc --noEmit` respects `paths` (so
type-checking silently passed), but the real bundler doesn't, so it's not reliable to
depend on. What webpack *does* support natively, confirmed straight from that source
file: when `baseUrl` resolves to the project root, CRA wires up exactly one hardcoded
alias, `src` → `<project>/src` — meaning the only genuinely-working absolute-import
convention is prefixed imports like `"src/utils/cn"`, not a `@/` alias. Fixed by
removing the non-functional `paths` entry and switching every pulled component's import
to the `src/...` form. A real `@/` alias is still possible later via `craco` (see the
original alternative below) if the `src/...` prefix becomes annoying — just wasn't free
after all.

What shipped:
1. `class-variance-authority` added as a dependency.
2. `tsconfig.json`: `"baseUrl": "."` (+ `"ignoreDeprecations": "6.0"`, since TS 6 flags
   bare `baseUrl` as deprecated otherwise) — no `paths` field, since it doesn't affect
   webpack and would be misleading to keep. This alone makes `src/...`-prefixed imports
   resolve in both `tsc` and the real `react-scripts build`, verified directly by a
   clean cold-cache build, not assumed.
3. `components.json` hand-written at the repo root (CLI auto-detection wasn't trusted
   given CRA isn't a first-class target), using `src/...`-prefixed aliases matching
   what actually resolves:
   ```jsonc
   {
     "style": "new-york",
     "rsc": false,
     "tsx": true,
     "tailwind": {
       "config": "tailwind.config.js",
       "css": "src/index.css",
       "baseColor": "neutral",
       "cssVariables": true,
       "prefix": ""
     },
     "aliases": {
       "components": "src/components",
       "utils": "src/utils/cn",
       "ui": "src/components/ui",
       "lib": "src/utils",
       "hooks": "src/hooks"
     }
   }
   ```
4. Sanity check: `npx shadcn@latest add button --yes` — worked against this CRA
   project with the hand-written `components.json`. `src/components/ui/button.tsx`
   now exists, imports `cn` via `src/utils/cn`, matching what the CLI generates
   directly from `components.json`'s aliases (no manual import fixup needed, just not
   the `@/`-prefixed form originally claimed).
5. Verified: `tsc --noEmit` and a cold-cache `npm run build` (real webpack build, not
   just typechecking) both clean.

**Practical effect on later phases:** every future `npx shadcn@latest add <name>` can be
run as-is — pulled source will already use the working `src/...` import form directly,
no manual fixup step. Phases 3+ below reflect this.

## Phase 1 — Extract design tokens into their own CSS file ✅ Done

Goal was: satisfy the "tokens in a separate `.css` file" requirement, with zero visual
change. **Scope ended up merging in Phase 2's bridge work too**, at the user's request
(wanted both the app's own tokens and shadcn's canonical/default tokens present
together, from the start, with multi-theme in mind) — so what's described here is what
actually shipped, not the original narrower draft.

What shipped:
1. `src/styles/tokens.css` created, containing the app's original `--color-*` variables
   (moved verbatim, `:root` = light, `.dark` = dark — zero value changes, confirmed
   byte-identical in the compiled CSS).
2. In the same file, shadcn-canonical variable names (`--background`, `--foreground`,
   `--card`(+`-foreground`), `--popover`(+`-foreground`), `--primary`(+`-foreground`),
   `--secondary`(+`-foreground`), `--muted`(+`-foreground`), `--accent`(+`-foreground`),
   `--destructive`(+`-foreground`), `--border`, `--input`, `--ring`, `--radius`) added
   as a **bridge layer**, under the same `:root`/`.dark`, each aliased via `var(--color-x)`
   to the matching app color — so shadcn components look native immediately once pulled
   in later.
3. **Multi-theme scaffolding** (the "prepared for multiple themes" ask): a dormant
   `[data-theme="shadcn-default"]` block (+ `.dark` variant) holding shadcn's own literal
   stock "Neutral" theme values (converted from their published `hsl()` triples to this
   file's `rgb()` convention). Nothing sets `data-theme` anywhere yet — it's scaffolding,
   documented in the file's header comment, for whenever an actual theme switcher gets
   built: add more themes the same way, as more `[data-theme="name"]` blocks.
4. `src/index.css` now just `@import "./styles/tokens.css";` before the `@tailwind`
   directives; everything else (scrollbar/range-input styling, `.h-dvh` helpers) stayed
   put.
5. `tailwind.config.js` extended with the new shadcn-canonical color keys, **and** the
   pre-existing `primary`/`secondary`/`accent` keys repointed to resolve through the new
   bridge variables instead of `--color-*` directly (identical value today, but now
   theme-reactive once a switcher exists). One deliberate call: this app's `accent` has
   historically meant "same brand color as primary," colliding with shadcn's meaning
   ("neutral hover surface") — verified via grep that no existing class
   (`bg-accent`/`text-accent`/etc.) is used anywhere in the codebase, so repointing it was
   safe. Also added the `--radius`-derived `borderRadius.lg/md/sm` scale.
6. Verified: `tsc --noEmit` and `npm run build` clean; compiled CSS output diffed to
   confirm `--color-*` values are unchanged and the bridge/dormant-theme values compiled
   correctly.

## Phase 2 — Bridge tokens ✅ Done (merged into Phase 1 above)

Everything originally scoped here (the bridge aliases, the new `tailwind.config.js`
color keys, `borderRadius` scale) shipped as part of Phase 1 — see above. The one item
that didn't fit there and was finished separately:

- Added the `tailwindcss-animate` plugin (`npm i -D tailwindcss-animate`, registered in
  `plugins: []` in `tailwind.config.js`). Verified via clean `tsc`/`build`; its utility
  classes (`animate-in`, `accordion-down`, etc.) don't appear in the compiled CSS yet —
  expected, since Tailwind's JIT only emits classes actually referenced somewhere, and
  nothing uses them until Phase 3 pulls in components like Accordion/Select that do.

## Phase 3 — Pull in core shadcn primitives ✅ Done

Goal was: get shadcn's component source into `src/components/ui/`, without wiring them
up anywhere yet.

What shipped: `input`, `textarea`, `label`, `select`, `switch`, `slider`, `separator`,
`card`, `badge` all pulled via one batched `npx shadcn@latest add <names...>` call (on
top of `button` from Phase 0) — `src/components/ui/` now has 10 shadcn primitive files.
None are wired into any existing page/component yet, per plan.

- Icon swap: only `select.tsx` imported `lucide-react` (`Check`, `ChevronDown`,
  `ChevronUp`) — swapped for `FaCheck`/`FaChevronDown`/`FaChevronUp` from `react-icons/fa`
  (already the app's icon library elsewhere). `lucide-react` was never added as a
  dependency, so no cleanup needed there. No other pulled file imported an icon.
- New Radix packages landed automatically via the CLI's own install step:
  `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-separator`,
  `@radix-ui/react-slider`, `@radix-ui/react-switch` (`@radix-ui/react-slot`, for
  `button`'s `asChild`, landed back in Phase 0).
- Verified: `tsc --noEmit` and `npm run build` (real webpack build) both clean. The
  compiled CSS now actually contains `tailwindcss-animate`'s utility classes
  (`animate-in`, `fade-in-0`, `zoom-in-95`, etc., confirmed via grep on the build
  output) — `select.tsx`'s open/close animation classes are the first real consumer,
  which is why they showed up as unused/dormant back in Phase 2.

## Phase 4 — Replace the hand-rolled primitives that have a direct shadcn equivalent ✅ Done

Goal was: swap implementations behind the same call sites so callers barely change.
**Achieved literally zero call-site changes** — every one of the 9 files importing
`TextInput`/`TextArea`/`FieldLabel`/`Slider` from `FormControls.tsx`, and all 4 files
using `ToggleSwitch`, needed no edits at all.

What shipped:
- `src/components/ui/input.tsx` / `textarea.tsx`: restyled from shadcn's stock terse
  className to this app's existing `fieldBase` look (`rounded-xl`, `bg-panel2`,
  `border-line`, `focus:border-primary`, etc.) — kept shadcn's cleaner
  `React.ComponentProps<"input">` typing and structure, but the app's own established
  visual language, so the swap isn't a jarring mid-migration style mismatch against the
  rest of the still-unmigrated app.
- `src/components/ui/label.tsx`: added `block text-ink` to `labelVariants` for visual
  parity with the original `FieldLabel`'s bare `<label>` (shadcn's default has no
  explicit color/display).
- `src/components/ui/switch.tsx`: one fix — thumb changed from shadcn's default
  `bg-background` to `bg-white`. The original `ToggleSwitch` always used a literal white
  thumb; `bg-background` would resolve to the app's dark near-black background in dark
  mode, making the thumb nearly invisible against the track. Track colors
  (`bg-primary`/`bg-input`) already matched the original (`bg-primary`/`bg-line`)
  exactly via the Phase 1 token bridge, no change needed there.
- `src/components/ui/FormControls.tsx` rewritten: `TextInput`/`TextArea` are now direct
  aliases of the (restyled) shadcn `Input`/`Textarea` (`export const TextInput = Input`).
  `FieldLabel` now renders shadcn's `Label` internally (same `children`/`hint`/`className`
  props, `htmlFor` added for future use). `Slider` is now a thin adapter around shadcn's
  array-valued Radix `Slider` (`value={[value]}`, `onValueChange={([v]) => onChange(v)}`)
  keeping the existing single-number API. `Select` **left untouched** — per this phase's
  own lower-priority/skippable call, native `<select>` still used app-wide.
- `src/components/ToggleSwitch.tsx` rewritten to render shadcn's `Switch` internally
  (`onCheckedChange` ↔ existing `onChange`), keeping the exact same
  `checked`/`onChange`/`disabled`/`label`/`title`/`className` public API.
- `src/components/ui/Dialog.tsx`, `DropdownMenu.tsx`, `Tooltip.tsx` — left as-is, per
  this phase's own recommendation (already Radix-based with Framer Motion animation
  already built; re-pulling shadcn's versions would just mean redoing that work).
- Dead code cleanup: removed the now-unused native `input[type="range"]` thumb styling
  from `src/index.css` (the old `Slider` was its only consumer).
- **Also found and fixed a real bug from Phase 0** while working through this phase —
  see the correction note under Phase 0 above (the `@/` import alias never actually
  worked via webpack; switched to the `src/...` convention that does).
- Verified: `tsc --noEmit` and a cold-cache `npm run build` both clean.

**Visually verified** in a running browser session (separately from this session) -
confirmed good.

## Phase 5 — Adopt `Button` everywhere ✅ Done

Goal was: replace hand-styled `<button className="...">` elements with `<Button
variant=... size=...>`, page by page (~40 `<button>` elements found across the app in
the initial audit).

**Variant set finalized** (`src/components/ui/button.tsx`), based on an audit of actual
button styles across Settings/Character/Chat/Sidebar/Header/modals:
- `default` (primary green CTA) — kept shadcn's structure but swapped the stock
  `hover:bg-primary/90` opacity-fade for `hover:bg-primary-hover`, the app's own
  purpose-built per-theme hover color (a real designed color, not a generic fade).
- `secondary` — the app's own purple brand color (`bg-secondary`), already bridged to
  the correct value via Phase 1; hover swapped to `hover:bg-secondary-hover` for the
  same reason as `default`.
- `panel` (new, custom) — `bg-panel2 text-ink hover:bg-line`, the app's actual most
  common "less prominent than primary" neutral button style. Distinct from shadcn's
  stock `secondary` (which this app's `secondary` already means something else -
  brand purple, not neutral gray) and from `outline` (no border here, filled).
- `gradient` (new, custom) — `bg-gemini-logo text-onAccent shadow-lg shadow-primary/20
  hover:brightness-105`, the recurring gradient CTA (Sidebar's "New Chat", Character
  editor's "Create Character"/"Try a sample character").
- `destructive`, `outline`, `ghost`, `link` — kept as shadcn's stock behavior for now;
  `ghost` covers most of the bare icon-only buttons seen.
- Base `rounded-md` → `rounded-lg` (matches the app's actual button corner radius
  everywhere sampled); `lg` size padding adjusted from stock `px-8` to `px-4`/`h-11` to
  match the app's actual large-CTA padding instead of shadcn's wider stock default.

**Migrated, in order:** `SettingsPage.tsx` → `CharacterPage.tsx` →
`ChatWindow.tsx`/`MessageInput.tsx` (`ChatPage.tsx` itself had zero raw `<button>`s -
it delegates to these) → `Modal.tsx`/`ImageSettingsModal.tsx`
(`KeyboardShortcutsModal.tsx` had none) → `Sidebar.tsx`/`Header.tsx`.

**Every `<button>` across all 10 files migrated except 3, left deliberately as plain
`<button>`s** because they're not standard action buttons:
- `SettingsPage.tsx`'s accordion section header/trigger (`renderAccordion`) — complex
  icon+title+subtitle+chevron layout, a better fit for Phase 6's Accordion adoption.
- `CharacterPage.tsx`'s accent-color swatch picker — a small color swatch with an
  inline dynamic gradient `style`, not a labeled/iconed action.
- `CharacterPage.tsx`'s "Add Image" dashed-border upload dropzone — a bespoke
  drag-and-drop-style widget, not a semantic button variant candidate.

**Notable per-instance decisions**, since not every button matched a variant 1:1:
- Toggle-style buttons with active/inactive conditional styling (`MessageInput.tsx`'s
  image/mic toggles, `Sidebar.tsx`'s pin toggle) kept their original `cn(...)` ternary
  className logic, layered on `variant="ghost"` (the most neutral base) with explicit
  `hover:bg-*` overrides added where needed to stop `ghost`'s own default hover
  background from showing through alongside the custom conditional colors.
- `Sidebar.tsx`/`Header.tsx`'s bordered icon buttons kept their existing shared
  `iconBtnClass`/`iconBtnActiveClass`/`iconBtnDangerClass` constants, applied as
  `className` on top of `variant="outline" size="icon"`.
- Solid-color icon/link buttons (remove-image badge, forget-memory-fact, stop
  generating, "Refresh Models") mapped to `destructive`/`ghost`/`link` variants with
  `h-auto w-auto` + padding overrides, since their original sizing didn't match
  Button's fixed `size` scale.
- Buttons passed as a Radix `asChild`/`trigger` target (`DialogClose`, `DropdownMenu`
  triggers) work as `<Button>` directly - Radix clones its own props onto whatever
  single child element is passed, and `Button` forwards them like any other prop.

Verified: `tsc --noEmit` and a cold-cache `npm run build` both clean.

**Visually verified in a browser (2026-09-08, dark mode)**, via the Chrome extension
against the local dev server: Settings (accordion buttons, `Export Full Backup`/
`Restore Backup` default/panel variants), Character page (swatch picker and `Add Image`
dropzone left as plain elements as intended, `Chat`/edit/kebab buttons on character
cards, the `gradient` variant's exact classes confirmed via computed style on `Create
Character`), Chat (`Copy`/`Regenerate`/`Speak`/`Edit` link-style actions, header icon
row), the message composer's image/settings toggle buttons (confirmed both off-state
`bg-panel2` and active-state `border-primary bg-primary/10 text-primary`), and
`ImageSettingsModal` (Switch/Select/Textarea render correctly, close button works).
Header's responsive split also confirmed live: full icon row at desktop widths,
collapsing into the `More options` dropdown below the `md` breakpoint, exactly per
`Header.tsx`'s `hidden md:flex` / `md:hidden` branches.

**Not re-verified in light mode this pass** — the running instance's theme is pinned to
dark (clicking "Toggle theme" didn't flip `document.documentElement`'s class in this
session; worth a quick manual look separately, since it's `ThemeContext`/pre-existing
infra, not something Phase 5 touched). Since every Button variant is built on the same
token classes (`bg-primary`, `bg-panel2`, `bg-secondary`, `bg-gemini-logo`, etc.)
already confirmed theme-reactive in Phase 1, light mode is expected to follow, but
hasn't been eyeballed directly.

**Unrelated pre-existing issues noticed along the way** (both outside migration scope,
fixed/checked separately from the phase itself):
- A React console warning ("Encountered two children with the same key") for a
  duplicate model id in the model picker — traced to `SettingsPage.tsx`'s `fetchModels`
  (not a Phase 5 regression; that `<select>` is native/untouched per Phase 4's own
  note). Root cause: Google's live models API can list the same model under more than
  one resource name that both simplify to the same value once `"models/"` is stripped
  - there's no static duplicate in this codebase's own data. **Fixed**: added a
  dedupe-by-value filter after the existing map/filter chain.
- "Toggle theme" appeared not to flip `document.documentElement`'s class in that test
  session. Inspected `src/contexts/ThemeContext.tsx` and `App.tsx` - the
  `DARK`/`LIGHT` constants, `ThemeProvider` wiring, and the `classList.toggle(...)`
  logic all look correct, and neither file was touched anywhere in this migration.
  **Not changed** - no reproducible bug found on inspection, so this reads as a
  one-off testing artifact rather than a real regression; worth a plain retest rather
  than a speculative fix.

## Phase 6 — Opportunistic bigger-component adoption ✅ Done (1 of 4 items - the rest deliberately skipped)

Lower priority, meant to be done only where it clearly removes bespoke code rather than
just reshuffling it. Evaluated all 4 candidates from the original draft; only one
qualified.

**Done: `SettingsPage.tsx`'s hand-rolled `renderAccordion` → shadcn `Accordion`.** This
was a genuine win, not just reshuffling: the old version hand-managed open/close state,
manual chevron rotation, and a conditional-render show/hide with no animation. Radix
Accordion (`@radix-ui/react-accordion`, pulled via `npx shadcn@latest add accordion`)
handles all of that natively.
- `src/components/ui/accordion.tsx` restyled the same way Phase 4's primitives were -
  kept Radix's structure but swapped shadcn's stock className for the app's actual
  existing accordion-card look (`bg-panel rounded-2xl border`, icon-square +
  title/subtitle trigger layout, `border-t` divider before content) - and swapped the
  `lucide-react` `ChevronDown` import for `react-icons/fa`'s `FaChevronDown`, same
  reasoning as Phase 3's icon swap.
- `SettingsPage.tsx`'s `renderAccordion` helper **kept its exact original call
  signature** (`renderAccordion(id, icon, title, subtitle, children)`), so all 6 call
  sites (Profile/Text/Image/Chat/Safety/Data sections) needed zero changes - only the
  helper's internal implementation changed, from a hand-rolled div/button/conditional to
  `<AccordionItem>`/`<AccordionTrigger>`/`<AccordionContent>`. The existing
  `openSection` state now drives Radix's `value`/`onValueChange` directly
  (`type="single" collapsible`, matching the old "only one section open, click the open
  one again to close it" behavior exactly); the old manual `toggleSection` function was
  deleted as no longer needed.
- Fixed a bug the CLI's own auto-merge introduced into `tailwind.config.js`
  (`darkMode: ['class', 'class']`, duplicated) while adding the accordion keyframes/
  animation - rewrote the file cleanly rather than leaving the CLI's broken merge in
  place.
- Verified: `tsc --noEmit` and a cold-cache `npm run build` both clean; confirmed the
  `animate-accordion-down`/`-up` utilities (dormant since Phase 2/3) now actually
  compile into the CSS output, since this is their first real consumer.

**Skipped, with reasoning** (all three fail this phase's own "clearly removes bespoke
code, not just reshuffling" bar):
- `Toast.tsx` → `sonner`: the existing custom Toast already works and isn't missing
  anything a swap would fix - no clear win, just a different dependency for the same
  behavior.
- `CharacterAvatar.tsx` → shadcn `Avatar`: checked the actual implementation - it never
  renders a real `<img>` at all, it's *always* initials over a dynamic per-character
  gradient (computed inline via `style`, with size-derived font/radius scaling).
  shadcn's Avatar's entire value-add is image-loading-with-fallback, which this
  component has no use for; swapping would be pure reshuffling with a net loss (losing
  the dynamic inline-style scaling shadcn's fixed size variants don't replicate as
  cleanly) for zero behavioral gain.
- Panel-container divs → `Card`: the phase's own draft already called this "purely
  cosmetic, not urgent" - by its own stated bar this is exactly the "just reshuffling"
  case to skip.

## Phase 7 — Cleanup and optional full token rename ✅ Done, including the optional rename

**Note:** Phases 0-6 had never actually been committed on this branch before this
session started (`ui/to-shadcn-ui` was sitting at the same commit as `main`, with all
of that work as uncommitted changes) — committed as one commit at the start of this
session, since splitting it into after-the-fact phase-by-phase commits from a single
working tree diff would've been artificial.

What shipped:
1. **Dead-code sweep**: checked `FormControls.tsx`/`ToggleSwitch.tsx` (the two files
   most rewritten in Phase 4) for leftover pre-migration code — clean, nothing left
   over. Confirmed via a `CI=true npm run build`, which fails/warns on unused
   vars/imports under CRA's built-in ESLint config — zero warnings.
2. Re-ran `npx tsc --noEmit` and a cold-cache `npm run build` — both clean.
3. **Full click-through**, both themes, via the Chrome extension against the local dev
   server: Sidebar/Header/theme toggle, ChatWindow + MessageInput (incl. the image/
   settings toggle buttons' active state), Settings (all 6 accordion sections expanded
   — Text Generation Model's Slider/Select, Chat Interface Settings' textarea/delete
   buttons, Safety Settings' selects, Data & Import/Export's default/panel/secondary
   Button variants), Character page (accent swatches, Add Image dropzone, gradient
   Create Character button, character cards), and ImageSettingsModal (Switch/Select/
   Textarea, close button). The dark-mode-only theme-toggle concern noted at the end of
   Phase 5 didn't reproduce — toggling flipped the whole app correctly in both
   directions this session, so that was a one-off testing artifact as suspected, not a
   real bug.
4. **Found and fixed one real bug** during the click-through (unrelated to the
   migration itself, same class as the one fixed in Phase 5): `ImageSettingsModal.tsx`'s
   effect that merges a custom image model from `localStorage` into `imageModelList`
   checked `imageModelList.find(...)` against a closured value in its dependency array;
   React 18 StrictMode's double-invoked mount effect appended the same stored model
   twice, producing a duplicate `<option key>` and a console error. Fixed by switching
   to a functional `setState` update (`prev.some(...)` check) with an empty dependency
   array, confirmed clean via console after a full reload.

**Optional full token rename — done, user opted in.** Every app-specific Tailwind color
class with an exact 1:1 bridge equivalent (same underlying CSS variable) was mechanically
renamed to its shadcn-canonical name, across all 35 files that used one:

- `bg-panel` → `bg-card`, `border-panel` → `border-card`
- `bg-panel2` → `bg-muted`
- `bg-panel3` → `bg-accent`
- `text-ink` → `text-foreground`, `bg-ink` → `bg-foreground`, `fill-ink` →
  `fill-foreground`
- `text-ink-muted` → `text-muted-foreground`
- `border-line` → `border-border`, `divide-line` → `divide-border`, `bg-line` →
  `bg-border`
- `bg-app` → `bg-background`, `text-app` → `text-background`

Value-preserving by construction (each renamed class already resolved to the exact
bridge variable it's now named after) — verified via `tsc --noEmit`, a clean
zero-ESLint-warning `npm run build`, a grep pass confirming no leftover old-name usages,
and a live-browser before/after screenshot comparison across Chat/Settings/Character in
both themes.

**Deliberately left untouched** (no shadcn-canonical counterpart, so renaming would be
lossy rather than mechanical): `text-ink-faint`/`bg-ink-faint` (shadcn has no third
"faint" text tier beyond foreground/muted-foreground), `bg-hover` (a hover surface
distinct from `--accent`), `bg-chat`, `bubble-*`, `accent-2`, `primary-hover`/
`secondary-hover`, `onAccent`/`onSecondary`.

`tailwind.config.js` had its now-fully-unused `panel`/`panel2`/`panel3`/`ink.DEFAULT`+
`muted`/`line`/`app` color keys removed (along with their already-dead `app-light`/
`app-dark`/`panel-light`/`panel-dark` compat sub-keys, confirmed unused via grep before
deleting) — only `ink.faint`/`hover`/`chat`/`bubble`/etc. remain as app-specific keys
with no shadcn equivalent. The Phase 1/2 bridge *variables* in `tokens.css` stay in
place (they're what makes the rename value-identical), just with their consumers now
using shadcn's names directly instead of the app-specific aliases.

One real bug found and fixed along the way, unrelated to the rename itself (during the
mandatory click-through, before the rename started) — see item 4 above.

## Phase 8 — Broader component adoption ✅ Done

A follow-up pass, requested explicitly rather than following this doc's own
"clear-win-only" bar from Phase 6: adopt shadcn/ui components more broadly across the
app, including revisiting all three of Phase 6's skips and completing the Button sweep
in the files Phase 5 never reached.

**New primitives pulled**: `avatar`, `checkbox`, `alert-dialog` (`npx shadcn@latest add`
— the CLI's own install step also pulled `sonner` + its `next-themes` peer dep as a
fourth item), each restyled the same way every earlier primitive was — kept Radix's
structure, swapped stock classNames for the app's existing look, swapped `lucide-react`
icons for `react-icons/fa` (`checkbox.tsx`'s check mark). `alert-dialog.tsx`'s
`AlertDialogAction`/`AlertDialogCancel` reuse this app's own `buttonVariants` from
`button.tsx` (that's what the CLI generates by default for this component) — extended
`AlertDialogAction` to actually accept a `variant`/`size` prop pass-through, since the
stock generated file hardcoded `buttonVariants()` with no way to ask for `destructive`.

**Phase 6 skips, revisited:**
- **Toast → sonner.** `src/components/Toast.tsx` (custom Framer Motion toast +
  `ToastContainer`) deleted outright — its only consumer was `SettingsPage.tsx`
  (`toasts` state, `addToast`/`removeToast`, ~30 lines of plumbing), now just
  `toast.success(...)`/`toast.error(...)` calls from `sonner` at each existing call
  site. `<Toaster position="bottom-right" />` mounted once in `App.tsx` inside
  `ThemeProvider`. **Found and fixed a real wiring bug in the CLI's own generated
  `sonner.tsx`**: it calls `next-themes`' `useTheme()`, but this app has never used
  `next-themes` — it has its own `ThemeContext` (`.dark` class on `<html>`, see
  `src/contexts/ThemeContext.tsx`) — so the stock file would've always fallen back to
  `theme: "system"` and never actually tracked the app's real dark/light state. Swapped
  to `useContext(ThemeContext)` instead and removed the now-unused `next-themes`
  dependency (`yarn remove`). Success/error toasts explicitly recolored to this app's
  own `bg-primary`/`bg-destructive` (sonner's default is a subtle bordered-white toast
  with a colored icon, not the app's original loud-colored-toast convention) so the
  swap doesn't read as a style regression.
- **`CharacterAvatar` → shadcn `Avatar`.** Now wraps `Avatar`/`AvatarFallback` (no
  `AvatarImage` — this component never renders a real image, always initials-over-
  gradient, unchanged from Phase 6's own finding). The non-standard sizing — radius at
  `0.32 × size` rather than a full circle, font size at `0.4 × size` — is preserved
  exactly via inline styles on both `Avatar` and `AvatarFallback`, overriding Radix's
  default `rounded-full`.
- **Panel-container divs → `Card`.** Applied wherever a plain `bg-card rounded-* border
  border-border` wrapper div existed as a self-contained panel (not app chrome like
  `Header`/`Sidebar`, which stay raw elements): `Login.tsx`'s auth card,
  `CharacterPage.tsx`'s create/edit form panel and each character grid card,
  `ChatWindow.tsx`'s empty-conversation panel, `InitialMessages.tsx`'s per-message
  editor card, `ServiceWorkerUpdater.tsx`'s update banner.

**Badge wired up** (pulled in Phase 3, never used until now): the character
"relationship" tag (e.g. "Mentor", "Employee") — previously plain colored text — is now
a `<Badge variant="outline">` chip, at both places it renders (`CharacterPage.tsx`'s
character grid, `ChatWindow.tsx`'s empty-conversation panel).

**Checkbox**: pulled and restyled, but genuinely unwired — audited the whole app for
checkbox-shaped UI (multi-select lists, "select all" flows, terms-agreement) and found
none; every existing boolean toggle already correctly uses `Switch` (instant-effect
settings) or `Select`, not a form-submission checkbox. Left additive-only, available for
whenever a real multi-select/list-selection UI gets built, rather than forced into a
fake use case.

**Button sweep completion.** Phase 5's sweep only ever touched the files reachable from
its own file-by-file walk (`SettingsPage`/`CharacterPage`/`ChatWindow`/`MessageInput`/
`Modal`/`ImageSettingsModal`/`Sidebar`/`Header`) and missed 12 more files with raw
`<button>`s: `App.tsx`, `NotFound.tsx`, `Login.tsx`, `CharacterGalleryPage.tsx`
(lightbox close/prev/next), `ErrorBoundary.tsx`, `chat/MarkdownRenderer.tsx` (code-block
copy button), `chat/ChatMessage.tsx` (8 buttons — sibling-variant prev/next/delete pill,
the `⋮` dropdown trigger, and the Copy/Regenerate/Speak/Edit action row — the biggest
single gap, since this file wasn't in Phase 5's own file list at all),
`InitialMessages.tsx`, `BackupReminderBanner.tsx`, `ServiceWorkerUpdater.tsx`,
`settings/ImageGenerationSettings.tsx`, `settings/TextModelSettings.tsx`. All converted
to `<Button variant=... size=...>` using the same finalized variant set from Phase 5 (no
new variants needed). `ModalContext.tsx`'s confirm/alert dialog buttons were replaced by
the `AlertDialog` swap above rather than converted in place. `CharacterPage.tsx`'s 2
deliberate non-Button exceptions from Phase 5 (accent-swatch picker, Add Image dropzone)
are still exactly that — confirmed via a final `<button\b` grep across `src/` turning up
only those two.

Verified via `tsc --noEmit`, a cold-cache zero-warning `npm run build`, and a live
Chrome pass confirming: the `AlertDialog` opens/closes correctly (delete-character
confirmation, both Cancel and the underlying promise-resolution path checked via DOM
query since screenshot capture was flaky this session), the `sonner` `Toaster` mounts
and a triggered toast renders with the correct green success color/text (confirmed via
computed styles when screenshots wouldn't cooperate), `Badge` role tags and the new
`Card` panels render correctly in dark mode, and no new console errors.

## Phase 9 — Full stock shadcn/ui look, colors preserved ✅ Done

A follow-up pass, requested explicitly, that reverses the "preserve the app's bespoke
look" call every earlier phase made on purpose: restyle every component back to
shadcn's literal stock ("new-york") geometry - radii, shadows, spacing, variant sets -
while keeping only this app's own color tokens (the `--color-*` → shadcn-canonical
bridge from Phase 1, untouched). Also replaces the three hand-kept Radix+Framer-Motion
wrappers (`Dialog.tsx`/`DropdownMenu.tsx`/`Tooltip.tsx`) with shadcn's own generated
files, and claims the last few hand-rolled UI blocks app-wide.

**Primitives restyled to literal stock**: `button.tsx` (`rounded-lg`→`rounded-md`;
dropped the custom `gradient` CTA variant entirely, mapping its ~5 call sites to
`default`; kept the `panel` variant - no stock equivalent exists since this app's
`secondary` is already brand-purple - but switched its hover to stock's opacity-fade
convention), `card.tsx` (`rounded-xl`→`rounded-lg`; restored `CardTitle`'s stock
`text-2xl`), `accordion.tsx` (item/trigger/content all back to stock's bare
`border-b` / `py-4 justify-between` / `pb-4 pt-0` - the old card-per-item look is gone),
`alert-dialog.tsx` (stock overlay/content colors, `sm:rounded-lg`, `shadow-lg`,
`max-w-lg`), `checkbox.tsx`, `input.tsx`/`textarea.tsx` (+ `FormControls.tsx`'s
`fieldBase`, which mirrors them), `label.tsx`, `sonner.tsx`, and `CharacterAvatar.tsx`
(dropped the inline squircle `borderRadius` override, now a plain stock circle).
`badge.tsx`/`avatar.tsx`/`separator.tsx`/`slider.tsx`/`switch.tsx`/`select.tsx` were
already stock, untouched. Every other non-stock `rounded-2xl`/`rounded-xl`/`shadow-2xl`/
`shadow-xl` override sitting on a `Card`/`Button`/panel elsewhere in the app (Login,
ServiceWorkerUpdater, ChatWindow's empty-state card, Sidebar list rows, MessageInput,
CharacterPage, CharacterGalleryPage, InitialMessages) was swept to match, **except**
chat-bubble tail shapes (`rounded-2xl rounded-bl-[5px]`-style), which are a deliberate
messaging-app affordance, not a shadcn concern.

**`Dialog`/`DropdownMenu`/`Tooltip` replaced with shadcn's real generated files**
(`npx shadcn@latest add dialog dropdown-menu tooltip`, same icon-library swap
convention as every earlier phase - `lucide-react` isn't a dependency here, so
`X`/`Check`/`ChevronRight`/`Circle` became `react-icons/fa` equivalents). Dropped Framer
Motion for these three - Radix's own `data-[state=open]:animate-in` Tailwind animation
(already proven elsewhere via Select/Accordion) is the literal-stock way to animate, one
less pattern to maintain. `DialogContent` keeps a small `size` prop
(`"default"|"lg"|"full"`) as a thin addition on top of stock, since this app genuinely
needs 3 dialog sizes (edit-message modal, two fullscreen image viewers) that stock's
single fixed size doesn't cover; no built-in close button is rendered since every call
site already supplies its own explicit `DialogClose`. All 7 call sites migrated to
shadcn's real compositional API (`Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/
`DialogTitle`/`DialogClose`, `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/
`DropdownMenuItem`/`DropdownMenuSeparator`, `Tooltip`/`TooltipTrigger`/`TooltipContent`):
`App.tsx` (`TooltipProvider`), `Modal.tsx` (generic wrapper, same public props),
`ChatWindow.tsx` (edit-message dialog + fullscreen image viewer),
`CharacterGalleryPage.tsx` (fullscreen viewer), `Header.tsx` (desktop tooltip row +
mobile "more" dropdown, still fully data-driven off `HeaderAction[]`),
`chat/ChatMessage.tsx` (per-message dropdown), `CharacterPage.tsx` (per-character-card
dropdown, `Delete` styled via `text-destructive` className instead of a custom `danger`
prop, since stock `DropdownMenuItem` has none). Old capitalized `Dialog.tsx`/
`DropdownMenu.tsx`/`Tooltip.tsx` deleted; the new files are lowercase
(`dialog.tsx`/`dropdown-menu.tsx`/`tooltip.tsx`), matching shadcn's own naming
convention - required a two-step `git mv` since `Dialog.tsx`↔`dialog.tsx` collide on
macOS's case-insensitive filesystem.

**Remaining hand-rolled UI claimed**: pulled `alert` and `table` (new primitives, not
in the repo before this phase). `BackupReminderBanner.tsx` → `Alert`/`AlertDescription`
(kept its full-bleed top-bar shape via a className override, since it's a dismissible
announcement bar, not a boxed alert - stock's `[&>svg]` absolute-positioning rule doesn't
apply since the icon is wrapped in a plain `span`). `ChatMessage.tsx`'s
compression-summary block and `settings/ImageGenerationSettings.tsx`'s save-folder row →
`Card`/`CardContent`. `ErrorBoundary.tsx`'s fallback → `Card`, recolored from hardcoded
`red-*`/`dark:` classes to this app's real `destructive` tokens (now theme-reactive).
`MarkdownRenderer.tsx`'s hand-styled `<table>` renderer → `Table`/`TableHeader`/
`TableBody`/`TableRow`/`TableHead`/`TableCell` (added `thead`/`tbody`/`tr` overrides
that didn't exist before, alongside the existing `table`/`th`/`td` ones), keeping the
existing user-message-bubble color variant via conditional `className`s.
`Sidebar.tsx`'s hand-styled search box → the existing `Input` component with an
absolutely-positioned icon overlay (the standard shadcn search-input idiom), replacing
a hand-rolled bordered flex row that duplicated `Input`'s own styling.
`ChatPage.tsx`'s inline raw error text → `Alert variant="destructive"` (kept inline/
persistent rather than routed through `sonner`, which this app reserves for transient
toasts). Left alone, confirmed still the only 2 deliberate exceptions via a final
`<button\b` grep: `CharacterPage.tsx`'s accent-swatch picker and "Add Image" dropzone.

One real lint fix needed along the way: shadcn's stock `alert.tsx` defines `AlertTitle`
as a bare `<h5 {...props} />`, which trips `jsx-a11y/heading-has-content` under this
repo's strict `CI=true` build (the rule can't see that content arrives via
`props.children` at each call site) - silenced with a targeted
`eslint-disable-next-line` comment, the same class of pre-existing-tooling friction
noted in earlier phases (e.g. Phase 6's `tailwind.config.js` merge bug).

Verified: `tsc --noEmit` and a `CI=true npm run build` both clean; a live Chrome pass
(both themes) covering Header tooltips + mobile dropdown, Sidebar search/New Chat
(now `default` variant)/panel buttons, ChatWindow's edit-message dialog (header/body/
footer regions render flush, no stray stock `p-6` padding) and per-message dropdown,
Settings' accordion (icon+title+subtitle trigger layout re-verified after reverting to
stock's bare `py-4` trigger - fixed by adding `gap-3`/`text-left` at the call site rather
than clawing back the removed bespoke padding), Characters page (circular avatar, card
dropdown, `AlertDialog` delete confirmation in stock styling), and no new console
errors.

---

## Suggested execution order / sizing

Each phase above is meant to be its own session/PR. Rough sizing:

| Phase | Risk | Size | Status |
|---|---|---|---|
| 0 - Tooling baseline | Low | Small | ✅ Done |
| 1 - Extract tokens.css (+ Phase 2's bridge, merged in) | Very low | Small | ✅ Done |
| 2 - Bridge token aliases | Low | Small | ✅ Done (merged into 1) |
| 3 - Pull primitive source | Low | Medium | ✅ Done |
| 4 - Swap FormControls/ToggleSwitch/Slider | Medium | Medium | ✅ Done, visually verified |
| 5 - Button sweep | Low risk per-page, high total effort | Large (split by page) | ✅ Done, visually verified |
| 6 - Accordion/Toast/Avatar/Card | Low, optional | Medium | ✅ Done (Accordion only - Toast/Avatar/Card deliberately skipped, see Phase 6) |
| 7 - Cleanup + optional rename | Low, optional | Small–Large depending on rename | ✅ Done, including the optional rename |
| 8 - Broader component adoption (Toast/Avatar/Card revisit, Badge, button-sweep gaps) | Low-Medium | Large | ✅ Done |
| 9 - Full stock shadcn/ui look, colors preserved | Medium-High | Large | ✅ Done |

The migration is complete end-to-end, including the fully optional full token rename,
a broader Phase 8 adoption pass, and Phase 9's reversal to shadcn's literal stock look -
nothing left on the plan. `Checkbox` is pulled and available but intentionally unwired
(no checkbox-shaped UI exists in the app yet).
