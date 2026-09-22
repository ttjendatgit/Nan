// Mirrors the backend PriceBreakdownDto (Backend/.../DTOs/Pricing/PriceBreakdownDto.cs).
// The backend is the sole pricing authority -- this type only describes what it returns,
// nothing here is ever computed independently on the frontend.

export interface PriceAdjustmentLine {
  optionId: string;
  optionType: string;
  name: string;
  type: string;
  /** Raw per-unit or per-order amount (not multiplied by quantity). */
  amount: number;
  /** amount * quantity for a unit adjustment; equal to amount for an order adjustment. */
  total: number;
}

export interface PriceBreakdownOption {
  optionId: string;
  optionType: string;
  optionName: string;
  optionValue: string;
  priceAdjustmentType: string;
  additionalPrice: number;
}

export interface PriceBreakdown {
  productId: string;
  productName: string;
  quantity: number;
  baseUnitPrice: number;
  unitAdjustments: PriceAdjustmentLine[];
  orderAdjustments: PriceAdjustmentLine[];
  optionsAdditionalPerUnit: number;
  unitPrice: number;
  subtotal: number;
  additionalCost: number;
  discountPercent: number;
  discountAmount: number;
  orderAdjustmentsTotal: number;
  estimatedPrice: number;
  calculatedTotal: number;
  currency: string;
  appliedPricingRuleId?: string;
  selectedOptions: PriceBreakdownOption[];
}

export interface CalculatePriceInput {
  productId: string;
  quantity: number;
  selectedOptionIds: string[];
}

// ─── Pricing rules (admin) ────────────────────────────────────────────────────
// Mirrors the backend PricingRule entity/DTOs (Backend/.../DTOs/Pricing/PricingRuleDto.cs)
// exactly -- one rule always belongs to exactly one product. Material/Size/PrintingSide
// are free-text on the backend, but matched case-insensitively against that SAME
// product's assigned OptionDefinition values (OptionType Material/Size/PrintingSide), so
// the admin UI only ever lets staff pick from that product's actual assigned values --
// null/empty means "matches any value for this dimension".

export interface PricingRule {
  id: string;
  productId: string;
  material?: string | null;
  size?: string | null;
  minQuantity: number;
  maxQuantity?: number | null;
  printingSide?: string | null;
  /** Replaces the product's own base price when this rule matches -- not additive. */
  baseUnitPrice: number;
  /** Added once per order when this rule matches -- not multiplied by quantity. */
  additionalCost: number;
  /** Percent discount (0-100) applied to the subtotal when this rule matches. */
  discountPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePricingRuleInput {
  productId: string;
  material?: string | null;
  size?: string | null;
  minQuantity: number;
  maxQuantity?: number | null;
  printingSide?: string | null;
  baseUnitPrice: number;
  additionalCost: number;
  discountPercent: number;
  isActive?: boolean;
}

/** ProductId cannot be changed on an existing rule -- not part of the backend's UpdatePricingRuleRequest. */
export interface UpdatePricingRuleInput {
  material?: string | null;
  size?: string | null;
  minQuantity: number;
  maxQuantity?: number | null;
  printingSide?: string | null;
  baseUnitPrice: number;
  additionalCost: number;
  discountPercent: number;
  isActive: boolean;
}
