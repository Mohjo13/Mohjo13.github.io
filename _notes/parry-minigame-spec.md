# Parry Minigame: Game spec

Source of truth for the parry minigame. Copied from the Game spec section of the Parry Minigame Runbook.

One parry wins the fight. The enemy blinks, then swings; a tap inside the parry window staggers him, and three more taps finish him. Three missed parries lose.

## States (11, one win path, one loss loop)

| State | Note | Goes to |
|---|---|---|
| Idle | empty box, caption, FIGHT! blinks | Intro (tap FIGHT!) |
| Intro | storyboard frames 1 to 8, tap to skip | Wait |
| Wait | 0.8 to 2.0 s | Telegraph |
| Telegraph | enemy blinks | Swing |
| Swing | parry window | PARRY! (in window) / Hero hit (miss or no tap) |
| Hero hit | input locked | Wait (hearts left) / Lose (0 hearts) |
| PARRY! | hitstop, stagger | Combo |
| Combo | 3 taps (A1, A2, A3 jump finisher), 3 hearts | Win |
| Win | reaction time ms | Restart |
| Lose | hero at 0 hearts | Restart |
| Restart | intro skipped | Wait |

Every hit on the hero loops back to Wait until his hearts run out; restart always skips the intro.

## Locked decisions

- **Scope:** a short, fun easter egg that shows off the Pizza to Hell parry. Feel and impact over difficulty. Art: code-drawn stick figures in a stick-fight style, hero black with a Ryu-style headband (two tails that trail his movement), enemy red and horned with a great sword, on a light panel so the black hero reads.
- **Placement:** replaces the hero clip box, with no frame (no border, inset or panel), so the fighters appear out of nowhere. Idle: an empty box with the caption and a blinking FIGHT! button; no floor, no fighters. (Changed 7 Oct 2026, see Storyboard v2.)
- **Input:** one action, attack. Tap or click inside the game area; Space or Enter on desktop. No block.
- **Early or late attack:** the hero can't reach the enemy. He freezes on the last frame of his swing, the enemy's swing lands, he loses a heart. Input is locked until the hit animation ends, then the loop resumes.
- **No attack:** the swing lands the same way.
- **Parry:** an attack inside the window. PARRY! text, hitstop, enemy staggers.
- **Finisher:** three taps, one combo attack each (A1, A2, A3, see Storyboard v2). Each removes one enemy heart. The A3 air strike plays in slow motion.
- **Hearts:** hero 3, enemy 3. Hero at 0 shows the loss screen with restart.
- **Telegraph:** the enemy blinks on and off (visibility, not colour), never faster than 3 blinks per second.
- **Difficulty:** no speed changes. Only the wait before each swing is random.
- **Win screen:** parry reaction time in ms, restart, link to the Systems section.
- **Sound:** reuses Pizza to Hell sounds, starts after FIGHT!, has a mute toggle.
- **Left out:** haptics, block, speed ramp, feints.

## Starting timings

All in one CONFIG object, tuned later.

| Beat | Starting value |
|---|---|
| Button burst + fade | 0.45 s |
| Floor draws (from 0.15 s) | 0.5 s |
| Hero walk-in (from 0.55 s) | 1.5 s |
| Enemy front flip (from 1.15 s) | 0.8 s |
| Both draw, hearts fill (from 2.15 s) | 1 heart per 0.14 s |
| FIGHT! text (at 2.9 s) | 0.6 s |
| Pause after FIGHT! | 0.7 s |
| Random wait before each swing | 0.8 to 2.0 s |
| Telegraph | 2 blinks over 0.7 s |
| Parry window | 220 ms: 150 ms before impact to 70 ms after |
| Hitstop on parry | 100 ms |
| Hero hurt animation (input locked) | 0.6 s |
| Final hit slow motion | 0.3x speed for 0.6 s |

The intro can be skipped with a tap and is skipped automatically on restart.

## Open questions: decisions (5 Oct 2026)

- **Combat clip:** dropped from the hero. The same clip (`pth-combat.webm`) already plays in Systems > Pizza to Hell > Combat, so nothing is lost.
- **Mobile placement:** the game keeps the clip's slot, below the stats, at the same 16:9 box. Not hidden.
- **Enemy hearts:** yes, the three hearts are the three combo hits. One parry still wins.
- **Label:** yes. Idle shows "Playable · Pizza to Hell parry" in the existing media-caption style; it hides once the fight starts. The "Tap · Space" hint was removed (7 Oct 2026).
- **Screen shake and hit sparks:** yes, small. Shake is off under prefers-reduced-motion; sparks stay.
- **Stagger timeout:** none. The enemy waits staggered until the combo finishes.
- **Whiff during Wait:** the enemy skips the rest of the wait and goes straight to Telegraph, so a whiff is punished without a long frozen pause.
- **Hit timing:** a missed parry lands when the parry window closes (impact + 70 ms), so a late tap inside the window still counts.
- **Art:** simple stick figures, all pose data in one POSES table, no image files.

## Sounds (assets/audio/parry/, mono mp3, ~71 KB total)

| Beat | File | Source |
|---|---|---|
| Enemy swing | swing.mp3 | WeaponWoosh |
| Parry | parry.mp3 | Parry |
| Combo hits 1 to 3 | hit.mp3 (pitch rises per hit) | HitFlesh |
| Final hit | final.mp3 | FireAfterHit |
| Hero hurt | hit.mp3 (pitched down) | HitFlesh |
| UI click, hero steps | step.mp3 | SoftStep |
| Enemy jump-in | jump.mp3 | DodgeStart |

Source WAVs moved to `_trash/parry-wav/`.

## Storyboard v2 (7 Oct 2026)

From the hand-drawn "Parry game frame by frame" board. `<=>` on the board means "at the same time". "END" (frame 20) only marks the end; it is not shown.

| Frames | Beat |
|---|---|
| 1 | Idle: caption + blinking FIGHT!. On click, lines burst outward like rays and the button fades. |
| 2 | Floor draws left to right. |
| 3 | Hero walks in from the left, sword sheathed. |
| 4 | Enemy (horned, great sword on his back) front-flips in from the right. |
| 5 | Enemy lands in front of the hero. |
| 6 + 7 | Same time: both draw and take fighting stances; hearts pop in one at a time in the box's top corners (centred on its top edge, in line with the stats' top border), hero left to right, enemy right to left. |
| 8 | FIGHT! |
| 9 | PARRY! (unchanged loop before it). |
| 10 to 11 | A1: both hands take the sword to his back, then an open one-hand sweep, free arm out. |
| 12 to 14 | A2: two-hand thrust (hit), the swing carries over his head to the left, ends sword horizontal behind. |
| 15 to 17 | A3: crouch, low jump with a 360 spin; the spin's last half-turn is a horizontal slash at the enemy's head height, free arm up, back knee kicked back, front knee forward; the level sweep follows through the way the spin turned, across his body and out behind him, blade up and back (a huge broadsword sweep). Big finisher, slow motion. |
| 18 | Landing pose, sword still behind him; enemy falls flat on his back, dead, legs straight; his sword flies out of his hands and sticks upright in the floor at his chest. |
| 19 | Win pose: hand on hip, sword resting on the shoulder. |
| 21 to 22 | Result card as before (parry ms, one parry three hits), Restart, link to Pizza to Hell systems. Loss card: "Cut down", then Restart with the hint beside it, no link. Both cards sit above the fighters' heads. |

Enemy hit reactions differ per attack (A1 knocked back, A2 doubled over). Loss path unchanged. Tap-to-skip unchanged; restart skips the intro.
