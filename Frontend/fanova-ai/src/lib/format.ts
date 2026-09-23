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

/** File size formatting for the Media Library (bytes -> "245 KB" / "1.2 MB"). */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}
