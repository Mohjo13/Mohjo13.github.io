# Parry Minigame: Game spec

Source of truth for the parry minigame. Copied from the Game spec section of the Parry Minigame Runbook.

One parry wins the fight. The enemy blinks, then swings; a tap inside the parry window staggers him, and three more taps finish him. Three missed parries lose.

## States (11, one win path, one loss loop)

| State | Note | Goes to |
|---|---|---|
| Idle | FIGHT! blinks | Intro (tap FIGHT!) |
| Intro | tap to skip | Wait |
| Wait | 0.8 to 2.0 s | Telegraph |
| Telegraph | enemy blinks | Swing |
| Swing | parry window | PARRY! (in window) / Hero hit (miss or no tap) |
| Hero hit | input locked | Wait (hearts left) / Lose (0 hearts) |
| PARRY! | hitstop, stagger | Combo |
| Combo | 3 taps, 3 hearts | Win |
| Win | reaction time ms | Restart |
| Lose | hero at 0 hearts | Restart |
| Restart | intro skipped | Wait |

Every hit on the hero loops back to Wait until his hearts run out; restart always skips the intro.

## Locked decisions

- **Scope:** a short, fun easter egg that shows off the Pizza to Hell parry. Feel and impact over difficulty. Art: code-drawn stick figures in a stick-fight style, hero black, enemy red with a great sword, on a light panel so the black hero reads.
- **Placement:** replaces the hero clip box. Idle state: hero and enemy face each other, a blinking FIGHT! button between them.
- **Input:** one action, attack. Tap or click inside the game area; Space or Enter on desktop. No block.
- **Early or late attack:** the hero can't reach the enemy. He freezes on the last frame of his swing, the enemy's swing lands, he loses a heart. Input is locked until the hit animation ends, then the loop resumes.
- **No attack:** the swing lands the same way.
- **Parry:** an attack inside the window. PARRY! text, hitstop, enemy staggers.
- **Finisher:** three taps, one combo hit each. Each hit removes one of the enemy's three hearts. The last hit plays in slow motion.
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
| Enemy jump-in | 0.8 s |
| Hero walk in + draw sword | 1.5 s |
| FIGHT! text | 0.6 s |
| Pause after FIGHT! | 1.0 s |
| Random wait before each swing | 0.8 to 2.0 s |
| Telegraph | 2 blinks over 0.7 s |
| Parry window | 220 ms: 150 ms before impact to 70 ms after |
| Hitstop on parry | 100 ms |
| Hero hurt animation (input locked) | 0.6 s |
| Final hit slow motion | 0.3x speed for 0.6 s |

The intro can be skipped with a tap and is skipped automatically on restart.
