[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/zero-two-1836/nightvault/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/zero-two-1836/nightvault/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Nightvault

A top-down stealth game set in a museum after closing time. You are a thief
working the night shift nobody hired you for: slip past the guards, stay out
of the cameras' sweeping gaze, lift every gem on the floor, and reach the
exit before anyone raises the alarm. Three heists, nine guards, five
cameras, one rule — if they see you, you are done.

## How to play

Open `game/index.html` in a browser and press a key to start.

| Input | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift (hold) | Run — faster, but noisy |
| Mouse click | Toss a coin to lure a guard |
| M | Mute / unmute |

Steal every gem in the level, then step on the exit. Get caught and the
heist restarts; clear all three levels to win the night.

## Mechanics

- **Vision cones.** Every guard projects a cone of sight, computed with a
  grid raycast, so walls, cases and furniture block line of sight for real.
  Ducking behind solid cover genuinely hides you.
- **Detection meter.** Each guard fills an individual meter based on how
  close you are, how lit your tile is and whether you are moving. A little
  attention makes a guard *suspicious* — he leaves his patrol to investigate.
  A full meter starts a *chase*: he runs to your last seen position, keeps
  looking for a while, then calms down and returns to patrol.
- **Security cameras.** Ceiling domes sweep a cold cyan gaze back and forth
  on fixed clocks you can learn to the second. Stand in the beam and its own
  meter fills — slower in shadow, not at all deep in a hedge — and the beam
  turns violet, then magenta. Fill it and the alarm trips: every guard on
  the floor hears exactly where you are standing and comes to look. Slip
  out and the meter drains, so a camera is a timing puzzle, never a wall:
  cross behind its sweep, or cross fast and take the suspicion.
- **Cover.** Shadow carpets and rooftop hedges dim you and slow detection to
  a crawl; solid objects break line of sight completely.
- **Noise.** Running is loud. Guards turn toward sounds even when they
  cannot see the source — useful, and dangerous.
- **Coin lure.** Click anywhere to toss a coin. The clang pulls nearby
  guards to that spot for a few seconds. Coins are limited per level, so
  spend them like you stole them. (You did.)
- **Sound.** Every effect — footsteps, coin clang, alarm sting, the soft
  chime of a pocketed gem — is synthesized live with WebAudio. No audio
  files. Press M to mute.

## Levels

1. **The Gallery** — open halls, long sightlines, two guards learning
   their routes, and one camera sweeping the central hall. A gentle
   introduction to staying unseen.
2. **The Vault Floor** — tighter rooms, crossing patrols and two cameras
   around the vault corridor — one over the crossing band, one watching
   the exit room. Timing and shadow carpets carry this one.
3. **The Rooftop Garden** — hedges, planters and moonlight under two more
   cameras. The guards are quicker here, and the last gem is always the
   worst guarded.

## Building

The game itself is plain ES modules on a canvas — no dependencies, no build
step: `game/src/` holds the levels, vision, guards, cameras, player, input,
audio, render and main loop, and `game/index.html` runs it as-is.

For the competition entry, `main.ts` (Node, standard library only) assembles
the submission dossier — the game plus the four screenshots in
`screenshots/` — through the kit's vendored builder. `serve.ts` serves the
game locally for testing.

## License

MIT — see `LICENSE`.
