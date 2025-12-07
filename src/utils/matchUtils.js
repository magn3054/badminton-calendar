// utils/matchUtils.js
import { auth } from "../firebase"; 

export function findMatches(availability) {
  const grouped = {};
  availability.forEach(a => {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  });

  const matches = {};
  for (let date in grouped) {
    const slots = grouped[date];
    const hourMap = {}; // hour -> array of user names

    slots.forEach(s => {
      let start = parseInt(s.startTime.split(":")[0]);
      let end = parseInt(s.endTime.split(":")[0]);
      for (let h = start; h < end; h++) {
        if (!hourMap[h]) hourMap[h] = [];
        const currentUser = auth.currentUser.uid === s.uid ? "Dig" : s.name;
        hourMap[h].push(currentUser);
      }
    });

    // Only keep hours with 4+ players
    matches[date] = {};
    for (let hour in hourMap) {
      if (hourMap[hour].length >= 4) {
        matches[date][hour] = hourMap[hour];
      }
    }
  }

  return matches;
}
