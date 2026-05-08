import {
  addDays,
  format,
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
} from "date-fns"
import type { SprintDay } from "@/server"

export const SPRINT_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

const DAY_LABELS_ES: Record<SprintDay, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
}

const DAY_SHORT_ES: Record<SprintDay, string> = {
  mon: "Lun",
  tue: "Mar",
  wed: "Mié",
  thu: "Jue",
  fri: "Vie",
  sat: "Sáb",
  sun: "Dom",
}

// JS getDay: 0=Sun..6=Sat. Map to our enum.
const JS_DAY_TO_KEY: Record<number, SprintDay> = {
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
  0: "sun",
}

export function dayOfWeekKey(date: Date): SprintDay {
  return JS_DAY_TO_KEY[date.getDay()]
}

export function dayLabel(day: SprintDay): string {
  return DAY_LABELS_ES[day]
}

export function dayShortLabel(day: SprintDay): string {
  return DAY_SHORT_ES[day]
}

// Monday of the ISO week containing `date`, in local TZ.
export function mondayOfWeek(date: Date): Date {
  return startOfISOWeek(date)
}

// YYYY-MM-DD for storage. Operates in local TZ; the `start_date` column is a
// pure date (no timezone).
export function toIsoDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// Parse a YYYY-MM-DD string from the DB into a local-TZ Date at midnight.
export function fromIsoDateString(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split("-").map(Number)
  return new Date(y, (m ?? 1) - 1, d)
}

export function formatSprintDefaultName(startDate: Date): string {
  const week = getISOWeek(startDate)
  const year = getISOWeekYear(startDate)
  return `Semana ${week} · ${year}`
}

export function formatSprintRange(startDate: Date): string {
  const end = addDays(startDate, 6)
  // ej: "9 mar – 15 mar"
  return `${format(startDate, "d MMM")} – ${format(end, "d MMM")}`
}

export function daysOfSprint(
  startDate: Date
): Array<{ key: SprintDay; date: Date }> {
  return SPRINT_DAY_KEYS.map((key, i) => ({
    key,
    date: addDays(startDate, i),
  }))
}

// Sprint name: stored override if set, otherwise computed default.
export function displaySprintName(
  sprint: { name: string | null; startDate: string }
): string {
  if (sprint.name && sprint.name.trim().length > 0) return sprint.name
  return formatSprintDefaultName(fromIsoDateString(sprint.startDate))
}
