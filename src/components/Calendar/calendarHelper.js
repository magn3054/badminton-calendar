//Calendar/calendarHelper.js
// 0-based month everywhere in these helpers (Jan = 0, Dec = 11)
export const WEEKDAYS_DA = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

export function getDaysInMonth(year, monthIndex) {
  // day 0 of next month = last day of current month
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getFirstWeekdayOfMonth(year, monthIndex) {
  // JS getDay(): 0=Sun..6=Sat -> shift so 0=Mon..6=Sun
  const js = new Date(year, monthIndex, 1).getDay(); // 0..6
  return (js + 6) % 7; // 0=Mon
}

export function monthLabelDA(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString('da-DK', {
    month: 'long',
    year: 'numeric',
  });
}

export const MONTHS_DA = Array.from({ length: 12 }, (_, m) =>
  new Date(2000, m, 1).toLocaleDateString('da-DK', { month: 'long' })
);
