// Tournaments/generateRounds.js
/**
 * Americano rounds with fair handling of extras:
 * - Always returns a FLAT list of matches: { round, team1:[...], team2:[...], type }
 * - type: "2v2" | "1v1" | "1v2" | "sitout"
 * - No player overlap within the same round.
 * - For N % 4:
 *    0 → pure 2v2 Americano (3 rotations)
 *    1 → one player sits out each round (rotates)
 *    2 → extra 1v1 each round (players rotate through the 1v1)
 *    3 → extra 1v2 each round (who plays solo rotates)
 *
 * @param {Array<{uid:string,name:string,profilePic?:string}>} players
 * @returns {Array<{round:number, team1:Array, team2:Array, type:string}>}
 */
export function generateRounds(players) {
  if (!Array.isArray(players) || players.length < 4) return [];

  const n = players.length;
  const extras = n % 4;                  // 0..3
  const activePerRound = n - extras;     // divisible by 4
  if (activePerRound < 4) return [];

  const roster = [...players]; // keep order; shuffle here if desired

  // Round count: 3 for perfect 4k; else N to spread extras fairly
  const roundsCount = extras === 0 ? 3 : n;

  const matches = [];

  const americanoSet = (A, B, C, D) => ([
    { team1: [A, B], team2: [C, D], type: "2v2" },
    { team1: [A, C], team2: [B, D], type: "2v2" },
    { team1: [A, D], team2: [B, C], type: "2v2" },
  ]);

  for (let r = 0; r < roundsCount; r++) {
    // ---- choose extras (who are NOT in the 4n block this round) ----
    const sitOutIdxs = new Set();
    for (let k = 0; k < extras; k++) {
      sitOutIdxs.add((r * extras + k) % n);
    }

    // Active players this round (size = multiple of 4)
    const active = [];
    const extraPlayers = [];
    for (let i = 0; i < n; i++) {
      (sitOutIdxs.has(i) ? extraPlayers : active).push(roster[i]);
    }

    // ---- Make standard 2v2s for the active block, Americano variant = r % 3 ----
    const variant = r % 3;
    for (let i = 0; i < active.length; i += 4) {
      const group = active.slice(i, i + 4);
      if (group.length < 4) continue;
      const [A, B, C, D] = group;
      const set = americanoSet(A, B, C, D);
      const chosen = set[variant];
      matches.push({ round: r + 1, ...chosen });
    }

    // ---- Handle extras ----
    if (extras === 1) {
      // One sits out — include as a "sitout" pseudo-match so UI can show it.
      matches.push({
        round: r + 1,
        team1: [extraPlayers[0]],
        team2: [],
        type: "sitout",
      });
    } else if (extras === 2) {
      // Two players play a 1v1 (rotating pair)
      matches.push({
        round: r + 1,
        team1: [extraPlayers[0]],
        team2: [extraPlayers[1]],
        type: "1v1",
      });
    } else if (extras === 3) {
      // Three players: rotate who is solo
      const soloIndex = r % 3;
      const solo = extraPlayers[soloIndex];
      const partners = extraPlayers.filter((_, i) => i !== soloIndex);
      matches.push({
        round: r + 1,
        team1: [solo],
        team2: partners, // length 2
        type: "1v2",
      });
    }
  }

  return matches;
}
