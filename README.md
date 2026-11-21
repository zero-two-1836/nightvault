# Nightvault

A top-down stealth game set in a museum after closing time. You are a thief
working the night shift nobody hired you for: slip past the guards, lift every
gem on the floor, and reach the exit before anyone raises the alarm. Three
heists, nine guards, one rule — if they see you, you are done.

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

1. **The Gallery** — open halls, long sightlines, three guards learning
   their routes. A gentle introduction to staying unseen.
2. **The Vault Floor** — tighter rooms and crossing patrols around the
   vault corridor. Timing and shadow carpets carry this one.
3. **The Rooftop Garden** — hedges, planters and moonlight. The guards are
   quicker here, and the last gem is always the worst guarded.

## Building

The game itself is plain ES modules on a canvas — no dependencies, no build
step: `game/src/` holds the levels, vision, guards, player, input, audio,
render and main loop, and `game/index.html` runs it as-is.

For the competition entry, `main.ts` (Node, standard library only) assembles
the submission dossier — the game plus the four screenshots in
`screenshots/` — through the kit's vendored builder. `serve.ts` serves the
game locally for testing.

## License

MIT — see `LICENSE`.
