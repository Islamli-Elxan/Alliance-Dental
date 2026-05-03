import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";

export const CLINIC_TIMEZONE = "Asia/Baku";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPriceAzn(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${value.toFixed(0)} ₼`;
}

export function formatDateTimeBaku(date: Date, pattern = "dd.MM.yyyy HH:mm"): string {
  return formatInTimeZone(date, CLINIC_TIMEZONE, pattern);
}

export function formatTimeBaku(date: Date): string {
  return formatInTimeZone(date, CLINIC_TIMEZONE, "HH:mm");
}

export function formatDateBaku(date: Date): string {
  return formatInTimeZone(date, CLINIC_TIMEZONE, "dd.MM.yyyy");
}

export const AZ_WEEKDAYS_SHORT = ["B.", "B.E.", "Ç.A.", "Ç.", "C.A.", "C.", "Ş."];
export const AZ_WEEKDAYS_FULL = [
  "Bazar",
  "Bazar ertəsi",
  "Çərşənbə axşamı",
  "Çərşənbə",
  "Cümə axşamı",
  "Cümə",
  "Şənbə",
];
export const AZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

export function azWeekdayShort(date: Date): string {
  const day = parseInt(formatInTimeZone(date, CLINIC_TIMEZONE, "i"), 10);
  return AZ_WEEKDAYS_SHORT[day % 7] ?? "";
}

export function azDateLong(date: Date): string {
  const day = formatInTimeZone(date, CLINIC_TIMEZONE, "d");
  const monthIndex = parseInt(formatInTimeZone(date, CLINIC_TIMEZONE, "M"), 10) - 1;
  const year = formatInTimeZone(date, CLINIC_TIMEZONE, "yyyy");
  return `${day} ${AZ_MONTHS[monthIndex] ?? ""} ${year}`;
}

export function azDateTimeLong(date: Date): string {
  const time = formatTimeBaku(date);
  return `${azDateLong(date)}, ${time}`;
}

