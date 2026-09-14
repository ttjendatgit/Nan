/**
 * Single source of truth for the backend's fixed OptionType enum -> Vietnamese
 * display label. Used by the admin options editor, the public configurator,
 * and the admin quote detail breakdown -- previously duplicated in each.
 *
 * The raw enum value (e.g. "DeliverySpeed") is never shown to an admin or
 * customer; only optionTypeLabel()'s output is.
 */
export const OPTION_TYPES = [
  "Size",
  "Material",
  "PrintingSide",
  "ColorOption",
  "Finishing",
  "Lamination",
  "Cutting",
  "Folding",
  "SpecialEffect",
  "DeliverySpeed",
] as const;

export const OPTION_TYPE_LABELS: Record<string, string> = {
  Size: "Kích thước",
  Material: "Chất liệu",
  PrintingSide: "Số mặt in",
  ColorOption: "Màu sắc",
  Finishing: "Hoàn thiện",
  Lamination: "Cán màng",
  Cutting: "Cắt",
  Folding: "Gấp",
  SpecialEffect: "Hiệu ứng đặc biệt",
  DeliverySpeed: "Tốc độ giao hàng",
};

/** Falls back to the raw enum value for forward-compat if a new OptionType is ever added server-side without a label here. */
export function optionTypeLabel(optionType: string): string {
  return OPTION_TYPE_LABELS[optionType] ?? optionType;
}
