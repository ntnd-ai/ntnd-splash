# Designing the splash in Claude Design

The ntnd design system lives in **one** place — the **`ntnd ui`** design system in claude.ai/design (synced
from `ntnd-ai/ntnd-ui`). Every Claude Design **project auto-inherits it**, so ntnd's colours, type, and
components are already applied — no config needed.

## Edit the splash visually
1. claude.ai/design → **New project** (Prototype / From Template / Other).
2. It **auto-inherits** the `ntnd ui` design system.
3. Bring in the current UI: **web-capture** the live splash (it's on GitHub Pages), or point Claude at
   **`ntnd-ai/ntnd-splash`**.
4. Edit against the reference design system, then hand off back to this repo.

## Where things live
- Shared **tokens/components** → edit in `ntnd-ui` (the canonical design system), not here.
- The splash **page** (`index.html` + inline CSS) → edit here or in the project.
- `system/index.css` is the design-system bundle, **generated** from `ntnd-ui` (`sync-design-system.mjs`) —
  do not hand-edit it; it's overwritten on the next sync.
