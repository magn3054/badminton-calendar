// Tournaments/tournamentId.js (new)
export const makeTournamentId = (date, hour, switchIndex = 0) =>
  `${date}__${String(hour).padStart(2, "0")}__${switchIndex}`;
