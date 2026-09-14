/**
 * Single source of truth for VND display formatting across the app. Currency
 * is always "đồng" today (backend Currency field defaults to "VND"), so this
 * intentionally does not take a currency code parameter yet -- add one only
 * when a second currency actually ships.
 */
export function formatVnd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("vi-VN")} ₫`;
}
