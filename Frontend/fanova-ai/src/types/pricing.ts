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
