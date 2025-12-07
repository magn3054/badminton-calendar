// Tournaments/generateRounds.js
/**
 * Generates Americano rounds:
 *  - Each player partners with every other player exactly once.
 *  - Total games = N*(N-1)/4.
 *  - Teams of 2 always vs. another team of 2 (no overlap).
 *
 * @param {Array} players - Array of player objects { uid, name, profilePic }
 * @returns {Array} rounds - Array of match objects:
 *   [{ round: 1, team1: [playerObj, playerObj], team2: [...]} , ...]
 */
export function generateRounds(players) {
    if (!players) return [];
    const n = players.length;
    // Only build rounds when we have an even number and at least 4.
    if (n < 4 || n % 2 !== 0) return [];

    // All possible 2-player teams
    const allTeams = [];
    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            allTeams.push([players[i], players[j]]);
        }
    }

    // We need to pair teams that have no overlapping players.
    // Build all possible matches (team vs team) with disjoint players.
    const allMatches = [];
    for (let a = 0; a < allTeams.length - 1; a++) {
        for (let b = a + 1; b < allTeams.length; b++) {
            const teamA = allTeams[a];
            const teamB = allTeams[b];
            // Check disjoint
            const idsA = teamA.map(p => p.uid);
            const idsB = teamB.map(p => p.uid);
            if (!idsA.some(id => idsB.includes(id))) {
                allMatches.push({
                    team1: teamA,
                    team2: teamB,
                    players: [...idsA, ...idsB]
                });
            }
        }
    }

    // Now pick matches so that each player partners with everyone exactly once.
    // Greedy approach: keep a map of "pair played already".
    const usedPairs = new Set();
    const selectedMatches = [];

    for (const m of allMatches) {
        const [p1, p2] = m.team1.map(p => p.uid);
        const [p3, p4] = m.team2.map(p => p.uid);

        // Each pair of teammates must be new
        const key1 = [p1, p2].sort().join("-");
        const key2 = [p3, p4].sort().join("-");

        if (!usedPairs.has(key1) && !usedPairs.has(key2)) {
            usedPairs.add(key1);
            usedPairs.add(key2);
            selectedMatches.push(m);
        }

        // Stop once we have the theoretical maximum
        if (selectedMatches.length === (n * (n - 1)) / 4) break;
    }

    // Pack matches into rounds so no player appears twice in the same round
    const rounds = [];
    let roundNumber = 1;
    const remaining = [...selectedMatches];

    while (remaining.length > 0) {
        const used = new Set();
        const thisRound = [];

        for (let i = 0; i < remaining.length;) {
            const match = remaining[i];
            const conflict = match.players.some(uid => used.has(uid));
            if (!conflict) {
                thisRound.push(match);
                match.players.forEach(uid => used.add(uid));
                remaining.splice(i, 1);
            } else {
                i++;
            }
        }

        for (const m of thisRound) {
            rounds.push({
                round: roundNumber,
                team1: m.team1,
                team2: m.team2
            });
        }
        roundNumber++;
    }

    return rounds;
}
