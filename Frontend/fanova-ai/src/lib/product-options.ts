/**
 * Phase 1 static product-option config for the public product detail page.
 *
 * This is a frontend-only reference dataset (no backend option tables yet).
 * All price deltas are indicative add-ons for quote-support purposes only --
 * never final pricing. See ProductOptionSelector for the UI that consumes it.
 */

export interface ProductOptionValue {
  id: string;
  label: string;
  /** Reference add-on per unit, in VND. Omit or 0 when the option carries no extra cost. */
  priceDelta?: number;
  /** Overrides priceDelta when the given size group value id is selected. */
  deltaBySize?: Record<string, number>;
}

export interface ProductOptionGroup {
  id: string;
  title: string;
  required: boolean;
  multiSelect: boolean;
  values: ProductOptionValue[];
}

export const PRODUCT_OPTION_GROUPS: ProductOptionGroup[] = [
  {
    id: "size",
    title: "Kích thước",
    required: true,
    multiSelect: false,
    values: [
      { id: "21x38", label: "21cm x 38cm" },
      { id: "22x40", label: "22cm x 40cm" },
      { id: "23x42", label: "23cm x 42cm" },
      { id: "27x50", label: "27cm x 50cm" },
    ],
  },
  {
    id: "material",
    title: "Chất liệu",
    required: true,
    multiSelect: false,
    values: [
      { id: "polyester", label: "Vải Polyeste" },
      { id: "phi-bong", label: "Vải phi bóng", priceDelta: 10000, deltaBySize: { "22x40": 8000 } },
      { id: "giay-fo", label: "Giấy Fo" },
      { id: "giay-my-thuat", label: "Giấy Mỹ thuật", priceDelta: 3000 },
    ],
  },
  {
    id: "printSides",
    title: "Số mặt in",
    required: true,
    multiSelect: false,
    values: [
      { id: "one-side", label: "In 1 mặt" },
      { id: "two-side", label: "In thêm mặt sau", priceDelta: 5000, deltaBySize: { "21x38": 4000 } },
    ],
  },
  {
    id: "backSide",
    title: "Mặt sau",
    required: false,
    multiSelect: false,
    values: [
      { id: "plain-white", label: "Trắng trơn" },
      { id: "similar-color", label: "Màu gần giống mặt trước", priceDelta: 2000 },
      { id: "fabric-back", label: "Dán thêm vải mặt sau" },
    ],
  },
  {
    id: "ribType",
    title: "Loại nan",
    required: true,
    multiSelect: false,
    values: [
      { id: "bamboo-normal", label: "Nan tre thường" },
      { id: "bamboo-fine", label: "Nan tre mịn / đẹp", priceDelta: 12000 },
      { id: "bamboo-pattern", label: "Nan hoa văn" },
      { id: "wood", label: "Nan gỗ" },
      { id: "plastic-fold", label: "Nan nhựa xếp" },
    ],
  },
  {
    id: "logoAccessories",
    title: "Logo & phụ kiện",
    required: false,
    multiSelect: true,
    values: [
      { id: "engrave-logo", label: "Khắc logo nan bìa", priceDelta: 5000 },
      { id: "print-logo", label: "In logo nan bìa", priceDelta: 10000 },
      { id: "tassel", label: "Gắn tua rua", priceDelta: 4000 },
    ],
  },
];

export const DEFAULT_QUANTITY_FALLBACK = 100;

export const REQUIRED_GROUP_IDS = PRODUCT_OPTION_GROUPS.filter((g) => g.required).map((g) => g.id);

/** Selected value ids keyed by group id. Single-select groups hold at most one id. */
export type SelectedOptions = Record<string, string[]>;

export function formatCurrency(value: number): string {
  return `${value.toLocaleString("vi-VN")} ₫`;
}

/** Resolves a value's reference delta for the currently selected size, falling back to its flat priceDelta. */
export function resolveDelta(value: ProductOptionValue, sizeId: string | undefined): number {
  const bySize = sizeId ? value.deltaBySize?.[sizeId] : undefined;
  return bySize ?? value.priceDelta ?? 0;
}

/** Every selected value that carries a non-zero reference add-on, resolved for the current size. */
export function calculateAddOns(
  selected: SelectedOptions,
): { group: ProductOptionGroup; value: ProductOptionValue; delta: number }[] {
  const sizeSelection = selected.size?.[0];
  const addOns: { group: ProductOptionGroup; value: ProductOptionValue; delta: number }[] = [];

  for (const group of PRODUCT_OPTION_GROUPS) {
    const selectedIds = selected[group.id] ?? [];
    for (const valueId of selectedIds) {
      const value = group.values.find((v) => v.id === valueId);
      if (!value) continue;
      const delta = resolveDelta(value, sizeSelection);
      if (delta > 0) addOns.push({ group, value, delta });
    }
  }

  return addOns;
}

/** Reference unit price = base price + sum of selected add-on deltas. Only meaningful when basePrice > 0. */
export function calculateUnitPrice(basePrice: number, selected: SelectedOptions): number {
  return basePrice + calculateAddOns(selected).reduce((sum, a) => sum + a.delta, 0);
}

function labelsFor(group: ProductOptionGroup, selected: SelectedOptions): string {
  const ids = selected[group.id] ?? [];
  if (ids.length === 0) return "Chưa chọn";
  return ids
    .map((id) => group.values.find((v) => v.id === id)?.label)
    .filter((label): label is string => Boolean(label))
    .join(", ");
}

/** Builds the exact quote-request summary text appended to the message/note field. */
export function buildOptionSummaryText(params: {
  productName: string;
  quantity: number;
  selected: SelectedOptions;
  basePrice: number;
}): string {
  const { productName, quantity, selected, basePrice } = params;
  const groupById = Object.fromEntries(PRODUCT_OPTION_GROUPS.map((g) => [g.id, g]));

  const hasPrice = basePrice > 0;
  const unitPrice = hasPrice ? calculateUnitPrice(basePrice, selected) : 0;
  const subtotal = hasPrice ? unitPrice * quantity : 0;

  return [
    `Sản phẩm: ${productName}`,
    `Số lượng: ${quantity}`,
    `Kích thước: ${labelsFor(groupById.size, selected)}`,
    `Chất liệu: ${labelsFor(groupById.material, selected)}`,
    `Số mặt in: ${labelsFor(groupById.printSides, selected)}`,
    `Mặt sau: ${labelsFor(groupById.backSide, selected)}`,
    `Loại nan: ${labelsFor(groupById.ribType, selected)}`,
    `Logo & phụ kiện: ${labelsFor(groupById.logoAccessories, selected)}`,
    `Giá tham khảo/cái: ${hasPrice ? formatCurrency(unitPrice) : "Cần báo giá"}`,
    `Tạm tính tham khảo: ${hasPrice ? formatCurrency(subtotal) : "Cần báo giá"}`,
    `Lưu ý: Giá hiển thị chỉ mang tính tham khảo. Vui lòng liên hệ để nhận báo giá chính xác.`,
  ].join("\n");
}
