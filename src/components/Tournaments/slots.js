// Tournaments/slots.js 
export function groupAvailabilityByHour(availRows) {
  // returns: { [date]: { [hour:number]: Array<{uid,name}> } }
  const map = {};
  for (const row of availRows) {
    const { date, uid, name, startTime, endTime } = row;
    if (!date || !startTime || !endTime) continue;

    const start = parseInt(startTime.split(":")[0], 10);
    const end = parseInt(endTime.split(":")[0], 10);

    for (let h = start; h < end; h++) {
      map[date] ??= {};
      map[date][h] ??= [];
      // ensure uniqueness per hour
      if (!map[date][h].some(p => p.uid === uid)) {
        map[date][h].push({ uid, name });
      }
    }
  }
  return map;
}
