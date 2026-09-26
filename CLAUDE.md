# Project: mohjo13.github.io portfolio
Plain HTML/CSS/JS, no frameworks, hosted on GitHub Pages from main.
Files: index.html, assets/css/styles.css, assets/js/script.js, assets/js/easter-egg.js. Videos in assets/gifs/ (.webm), images in assets/images/.
Design source of truth: _notes/design-spec.md

## Workflow
- Always audit and propose a numbered plan first. Wait for my approval before editing.
- Work on the branch `redesign`. Never commit to or push main unless I say so.
- Commit after each approved chunk with a clear message.
- Never delete files. Move unused ones to _trash/.

## Positioning and copy
- Role: Junior Gameplay Developer & Technical Designer (Unity, C#, gameplay systems, level design).
- No em dashes or en dashes used as punctuation anywhere (site or code comments shown to users). Use commas, periods or colons.
- No AI-style phrasing: leverage, seamless, passionate, cutting-edge, delve, robust, elevate, journey.
- Short, readable sentences. Project card copy stays friendly, not jargon-heavy.

## Code conventions
- All colors are CSS variables in :root. No hard-coded hex values elsewhere.
- Respect prefers-reduced-motion.
- Videos: <video autoplay muted loop playsinline>, never <img>. Lazy-load with data-src. The default active tab uses src, not data-src. After setting src in JS, call .load() then .play().catch(() => {}).
- When editing, anchor on unique functional lines, not decorative comment headers.
