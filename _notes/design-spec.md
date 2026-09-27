# DESIGN SPEC: Direction C "Paper", accent #FF6A3D
# This file is the working source of truth. Board names ("C · ...") refer to the original design artifact.
# Rule: no em dashes or en dashes anywhere. Use commas, periods, colons, or the middle dot (·).

## 1. Fonts (replace the current Rajdhani link block in <head>)
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap">
# Keep the existing async preload pattern (media="print" onload) if preferred.
# Update <meta name="theme-color" content="#F1EEE7">.

## 2. CSS variables (:root, the only place hex values may appear)
:root {
  /* Surfaces */
  --paper: #F1EEE7;          /* page background */
  --paper-2: #E8E4DA;        /* sunken panels, photo placeholder */
  --ink: #17171A;            /* text, dark panels, contact section */
  --line: #D6D1C6;           /* hairlines on paper */
  --line-strong: #BDB7AA;    /* inactive tab borders */
  --line-dark: #34343A;      /* hairlines on ink */

  /* Text */
  --text: #17171A;
  --text-body: #45433F;      /* paragraphs, 8.5:1 */
  --text-muted: #55534E;     /* captions, mono labels, 6.6:1 */
  --text-on-ink: #F1EEE7;
  --text-on-ink-muted: #A9A69E;

  /* Accent */
  --accent: #FF6A3D;         /* fills, underlines, dots, text on ink ONLY */
  --accent-ink: #B8411C;     /* accent-coloured TEXT on paper (section numbers, 25,000+) */
  --on-accent: #17171A;      /* text on accent fills. Never white. */

  /* Type */
  --font-display: 'Bricolage Grotesque', 'Arial Narrow', sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --fs-hero: clamp(64px, 10.5vw, 150px);   /* 800, lh 0.86, ls -0.035em */
  --fs-h2: clamp(40px, 5vw, 64px);         /* 800, lh 0.95, ls -0.03em */
  --fs-h3: clamp(32px, 4vw, 56px);         /* project titles, 800 */
  --fs-h3-sys: clamp(28px, 3vw, 40px);     /* systems title, 600 */
  --fs-lead: clamp(28px, 3vw, 44px);       /* About lead, 600, lh 1.08 */
  --fs-contact: clamp(56px, 8vw, 112px);   /* 800, lh 0.9 */
  --fs-body: 17px;                          /* lh 1.65 */
  --fs-small: 15px;
  --fs-caption: 13px;
  --fs-label: 12px;                         /* mono, uppercase, ls 0.1em */

  /* Spacing scale */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 20px;
  --sp-6: 24px; --sp-8: 32px; --sp-10: 40px; --sp-12: 48px; --sp-16: 64px;
  --sp-18: 72px; --sp-30: 120px;
  --gutter: 72px;            /* page side padding desktop; 24px under 700px */
  --section-y: 120px;        /* section top/bottom padding; 72px under 700px */
  --content-max: 1296px;     /* 1440 minus 2 x 72 */
  --control-h: 52px;         /* primary buttons */
  --tab-h: 44px;             /* tabs, small buttons, min touch target */

  /* Radius: everything is square in this direction */
  --radius: 0px;
}

## 3. Global rules
- body: background var(--paper), color var(--text), font var(--font-body) 17px/1.65.
- Links: color var(--text), no underline; hover color var(--accent-ink) on paper, var(--accent) on ink.
- Buttons:
  .btn-primary: height 52px, padding 0 24px, background var(--accent), color var(--on-accent), 700 16px.
  .btn-outline: height 52px, padding 0 24px, 1px solid var(--ink), transparent, 500 16px.
  .btn-text: 500 16px, border-bottom 1px solid var(--ink), padding-bottom 2px.
- Mono label: var(--font-mono) 12px, uppercase, letter-spacing 0.1em, color var(--text-muted).
- Section header (every section except Hero and Contact):
  flex, space-between, align flex-end, padding-bottom 32px, border-bottom 1px var(--line), margin-bottom 48 to 64px.
  Left: mono number ("02") in var(--accent-ink) 13px + h2 (var(--fs-h2)), baseline aligned, gap 20px.
  Right: one short line of body text, max-width 420px, color var(--text-body).
- Video/media panels: background var(--ink), padding 20px, no radius. Mono caption top-left in var(--text-on-ink), small meta bottom-left in var(--text-on-ink-muted).
- No gradients, no glows, no box shadows, no grid overlay, no emoji. Remove hero-glow, hero-grid, eyebrow pulse, text-shadow.
- Shooting-star easter egg: disable for launch (remove or comment out the script include). Post-launch it gets restyled or replaced.
- Keep the prefers-reduced-motion block. Any reveal animation: opacity + 12px translateY, 400ms, ease-out, no stagger over 3 items.
- Breakpoints: 900px (grids go 1 column), 700px (gutter 24px, section-y 72px, nav collapses to CV button + 44px burger).

## 4. Sections, in this order: Hero, Technical Systems, Projects, About, Skills, Contact
Nav links: Systems, Projects, About, Contact, then "CV ↓" (ink fill, paper text, mono 13px, 44px high).
Nav bar: 88px high, border-bottom 1px var(--line). Logo "MP" in display 800 22px + "." in var(--accent).

### 01 Hero (#hero), boards "C · Paper" and "C · Mobile hero"
- Full viewport minus nav, content vertically centred, gap 36px.
- Eyebrow: DM Sans 500 12 to 18px, uppercase, ls 0.12em, var(--text-muted): "Stockholm, Sweden · Open to junior roles".
- Name: h1 var(--fs-hero), "Mohsen Parchami", one line on desktop, wraps to two on mobile.
- Below name: 3-column grid (1fr 1fr 1.25fr, gap 48px):
  col 1: role "Junior Gameplay Developer & Technical Designer" (display 600, 28px), intro "I build combat systems, editor tools and levels in Unity and C#.", buttons "See the systems" (primary, #systems) + "Download CV" (outline).
  col 2: proof stack with hairlines: "25,000+" display 800 44px in var(--accent-ink) + "copies sold of Murmurs of the Mist on Steam"; "Pizza to Hell" 28px + "combat, parry and editor tooling, in development".
  col 3: ink media panel 280px tall with pth-combat.webm (autoplay muted loop playsinline, poster pizza-to-hell.png, src not data-src). Caption "Pizza to Hell · Combat", meta "Unity 6 · C#".
- Mobile (390px): stack order eyebrow, name 64px, role 21px, intro, proof row (34px number), video 16:9, then two full-width 52px buttons pinned to the bottom of the first screen.

### 02 Technical Systems (#systems), board "C · 02 Technical Systems"
- Header right text: "Systems I designed and built, shown in motion. Pick a project, then a system."
- Row under header: project picker left, tabs right (space-between).
  Picker: two text buttons, display font 26px, order "Murmurs of the Mist" | "Pizza to Hell". Active: 800, ink, 4px bottom border var(--accent), aria-pressed="true". Inactive: 600, var(--text-muted), transparent border.
  Tabs: 44px buttons, padding 0 20px. Active: ink fill, paper text, 700. Inactive: 1px var(--line-strong), transparent, 400. role="tab", aria-selected.
- Default on load: Pizza to Hell, Combat (its video uses src; all others data-src).
- Panel: grid 1.55fr 1fr, gap 48px. Left: ink media panel, 16:9 (460px tall at 1440). Right: mono counter "01 / 04" in var(--accent-ink), h3 (var(--fs-h3-sys), 600), description, then hairline + mono "Built with" + stack line 15px 500.
- Keep initSystemsPicker, loadVideo() and arrow-key navigation. Only restyle.
- Under 900px: picker on its own row, tabs become a horizontal scroll row (overflow-x auto, no wrap), media above text.
- Copy:
  Murmurs / Camera: "Camera System" · Unity · C# · "A dynamic camera that shifts angle to build tension and point the player at threats. Smooth transitions keep the flow cinematic, and each level tunes the behaviour to its own layout and pacing."
  Murmurs / Movement: "Movement Mechanics" · Unity · C# · "Fast, responsive traversal with a directional dash for repositioning, clearing gaps and keeping momentum under pressure. Speed, timing and cooldown are all exposed for tuning."
  Murmurs / Shaders: "Shaders" · Unity · Shaders · "Cooldown feedback drawn by shaders instead of UI, reflective and refractive materials that distort what sits behind them, and ripples that react as the player moves through liquid."
  Murmurs / Lighting: "Lights and Post Production" · Unity · Post-processing · "Lighting that carries the mood through controlled light, shadow and colour. Grading, exposure and bloom add depth and atmosphere."
  Pizza to Hell / Combat: "Combat System" · Unity 6 · C# · ScriptableObjects · "Data-driven melee with light and heavy attacks, combos and dodge. Every attack is a ScriptableObject, so timing windows, hitbox phases and animation are tuned without code. Input buffering keeps combos responsive mid-animation."
  Pizza to Hell / Parry: "Parry System" · C# · Enemy AI states · Particles · "A timing-based parry with spark feedback that knocks the enemy into a stagger state. The parry window lives in data, so designers tune startup and recovery per weapon."
  Pizza to Hell / Editor Tool: "Custom Editor Tool" · Unity EditorWindow · Gizmos · "A custom Unity window for authoring weapons and attacks. Drag phase markers on a timeline, preview hitbox gizmos live in the scene and tune combo sequences without writing code."
  Pizza to Hell / VFX: "Streak HUD and Shaders" · HLSL · TextMesh Pro SDF · "A combo streak HUD where attack icons fly into a row and combo names dissolve out, using a dissolve shader written in HLSL. The panel glow is hand-written too, since HDRP blocks Shader Graph on Canvas."

### 03 Projects (#projects), board "C · 03 Projects"
- Header right text: "Shipped and in development."
- Two <article> rows separated by a 1px var(--line) rule, gap 64px. No card borders or backgrounds.
- Murmurs: grid 1.15fr 1fr (media left). Pizza to Hell: grid 1fr 1.15fr (media right).
- Media: ink panel 460px tall, image object-fit cover. Badge top-left, 32px, mono 12px uppercase:
  Murmurs "Live on Steam": var(--accent) fill, var(--on-accent) text.
  Pizza to Hell "In development": paper fill, ink text, 8px square accent dot.
- Info column, gap 20px: mono meta line, h3 (var(--fs-h3), 800), description, mono "My part" + list with hairline rows (padding 9px 0, no bullets), actions row.
- Murmurs of the Mist:
  meta "Unity · Final semester · Team project"
  stat "25,000+" 40px var(--accent-ink) + "copies sold on Steam"
  text "A final-semester game made with a team of developers and artists. Shipped and playable on Steam."
  My part: Level design and layout · Core chase sequence, from concept to implementation · Voice-over and sound integration · Lighting and post-processing · VFX and shader work
  actions: "View on Steam ↗" (primary) + "See its systems →" (text, #systems)
- Pizza to Hell:
  meta "Unity 6 HDRP · PSX look · Team project"
  text "A PSX-inspired melee combat game. Combat is fully data-driven: every attack, combo and weapon is a ScriptableObject, so new content needs no code."
  My part: Combat and combo system architecture · Editor tooling: visual timeline, hitbox gizmos, weapon authoring · Parry system and enemy AI states · Streak HUD and custom HLSL shaders
  actions: "Watch the combat clips →" (primary, #systems) + "View on GitHub ↗" (outline)
- "More work" row (replaces the old More Work cards): mono label, then 3-column grid (gap 32px). Each item is one link with 2px ink top border, padding-top 14px, gap 8px: title display 600 24px + ↗, mono meta 12px muted, one line 15px var(--text-body). No images, no tags.
  Monopoly AI · C# · Solo · "Full Monopoly with a Minimax AI opponent. Game state, rules and decision logic kept in separate classes." (github.com/Mohjo13/Monopoly)
  Cannoneer · MonoGame · Solo · "A 2D physics game. Projectile trajectories, collision response and game feel built from scratch." (github.com/Mohjo13/Cannonier)
  Streets of Belonging · Unity · Team project · "A narrative game made with a team. I owned UI and UX and wove story beats into play." (github.com/Mohjo13/streets-of-belonging)
  A 4th slot is reserved for Godot work once it is ready to publish.
- Remove all tag--violet.
- Under 900px: each article stacks media first, then info. More work goes 1 column.

### 04 About (#about), board "C · 04 About"
- Grid 360px 1fr, gap 72px. Left: photo guy.webp 4:5 (width/height attributes set) + mono caption "Mohsen Parchami · Stockholm".
- Right, gap 32px:
  lead: "From HVAC engineer to gameplay programmer." (var(--fs-lead), 600)
  body 19px: "Before games, I worked as an HVAC engineer, designing complex building systems in CAD. That job taught me structured thinking and a systematic approach to projects, and it's still how I approach gameplay."
  timeline: 3 equal columns, each 2px top border ink (last one var(--accent)), mono label, bold line, small line:
    Before / HVAC engineer / Building systems in CAD and MagiCAD
    Now / Game Design and Scripting / Södertörn University, Stockholm
    2026 (var(--accent-ink)) / Graduating / Open to junior gameplay and technical design roles
  "How I work" block: ink panel, padding 40px, gap 24px. Mono label "How I work" in var(--accent).
    Text 20px/1.55 paper: "I design the systems and the architecture, and write the specs. AI tools keep the workflow efficient. I review, iterate and integrate the code in Unity or Godot, then tune and test until the design feels right."
    Then 3 boxes (1px var(--line-dark), padding 20px), mono numbers all in var(--accent), titles display 600 20px:
    01 · "Design, architecture, specs"
    02 · "Review, iterate, integrate"
    03 · "Tune and test until it feels right"
- Remove the Zelda quote block and the icon link row (links live in Contact).
- Under 900px: photo max-width 260px above text; timeline and step boxes go 1 column.

### 05 Skills (#skills), board "C · 05 Skills"
- Header right text: "Unity and C# first, design close behind."
- 4 columns (repeat(4, minmax(0, 1fr)), gap 32px). Each column: 2px ink top border, mono heading + two-digit item count in var(--accent-ink), then rows (padding 12px 0, hairline bottom): name 19px 500 left, mono 12px tag right.
- Groups (name: tag):
  Gameplay programming: Unity: Engine · C#: Language · Godot / GDScript: Engine, scripting · Combat systems: Gameplay · Editor tooling: Unity Editor · OO architecture: Patterns · Unreal Engine: Basics
  Design: Game design: Gameplay feel · Level design: Layout, pacing · Narrative design: Story beats · UI / UX design: Interface
  Visual and audio: VFX and shaders: HLSL · Lighting and post-FX: Mood · Sound and voice-over: Integration
  Workflow: Git / GitHub: Version control · Claude Code: AI workflow · MCP tooling: Automation · CAD, MagiCAD: From engineering
- No icons. Under 900px: 2 columns. Under 420px: 1 column.

### 06 Contact (#contact, <footer>), board "C · 06 Contact"
- Full ink section, text var(--text-on-ink). Padding 120px top, gutter sides, 48px bottom.
- Mono "06" in var(--accent) + mono "Contact" muted. h2 "Let's build something." var(--fs-contact).
- Grid 1fr 1.3fr, gap 72px.
  Left: "Open to internships and junior roles in the Swedish games industry. Stockholm or remote." 20px var(--text-on-ink-muted) + "Email me" primary button (mailto).
  Right: link rows, min-height 64px, 1px var(--line-dark) top borders (last row also bottom): mono label (120px wide) | value 20px | arrow.
    Email | Mohsen.parchami@gmail.com | ↗
    LinkedIn | Mohsen Parchami | ↗
    GitHub | Mohjo13 | ↗
    CV | Download PDF | ↓
- Bottom bar: hairline top, 14px muted: 8px accent square + "Available for internships and junior roles · Stockholm or remote" left, "© <year> Mohsen Parchami · Built with GitHub Pages" right.
- Under 700px: heading wraps, grid 1 column, bottom bar stacks.

## 5. Contrast guardrails (check before commit)
- Never white or paper text on var(--accent). Always var(--on-accent).
- Never var(--accent) as text on var(--paper). Use var(--accent-ink).
- var(--accent) as text is allowed only on var(--ink).
