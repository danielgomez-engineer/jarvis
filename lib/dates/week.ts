//=====JV-1: DAYS AND WEEKS FOR THE BOARD=====
// A day is always a "YYYY-MM-DD" string, like the dueDate the API receives.
// The math is done in UTC so the time zone can never move a day to the next one.

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Today in the person's own time zone (not UTC: at 8 p.m. in Colombia it's already tomorrow in UTC)
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(day: string, amount: number): string {
  return formatDay(new Date(parseDay(day).getTime() + amount * DAY_MS));
}

// The week starts on Monday (spec 4.2). getUTCDay(): 0 = Sunday … 6 = Saturday
export function startOfWeek(day: string): string {
  const weekday = parseDay(day).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  return addDays(day, -daysSinceMonday);
}

export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

const weekdayFormat = new Intl.DateTimeFormat("es", { weekday: "short", timeZone: "UTC" });
const dayMonthFormat = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" });

// "2026-10-28" → "mié 28"
export function formatDayLabel(day: string): string {
  const date = parseDay(day);
  return `${weekdayFormat.format(date)} ${date.getUTCDate()}`;
}

// "2026-10-26" → "26 oct – 1 nov"
export function formatWeekRange(weekStart: string): string {
  return `${dayMonthFormat.format(parseDay(weekStart))} – ${dayMonthFormat.format(parseDay(addDays(weekStart, 6)))}`;
}
