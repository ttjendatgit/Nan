// ─── Status ───────────────────────────────────────────────────────────────────

export type QuoteRequestStatus =
  | "New"
  | "Contacted"
  | "Quoted"
  | "Closed"
  | "Cancelled";

// ─── Public form input ────────────────────────────────────────────────────────

export interface CreateQuoteRequestInput {
  productId?: string;
  fullName: string;
  phone: string;
  email?: string;
  companyName?: string;
  quantity: number;
  neededDate?: string;
  useCase?: string;
  message?: string;
  /** IDs of selected ProductOption values. Backend re-validates and recalculates price server-side. */
  selectedOptionIds?: string[];
}

// ─── Structured option snapshot (immutable once the quote is submitted) ──────

export interface QuoteRequestOptionDto {
  id: string;
  productOptionId?: string;
  optionTypeSnapshot: string;
  optionNameSnapshot: string;
  optionValueSnapshot: string;
  priceAdjustmentTypeSnapshot: string;
  priceAdjustmentSnapshot: number;
  calculatedAmountSnapshot: number;
}

// ─── DTO (single quote) ───────────────────────────────────────────────────────

export interface QuoteRequestDto {
  id: string;
  productId?: string;
  productNameSnapshot?: string;
  categoryNameSnapshot?: string;
  fullName: string;
  phone: string;
  email?: string;
  companyName?: string;
  quantity: number;
  neededDate?: string;
  useCase?: string;
  message?: string;
  status: QuoteRequestStatus;

  // Pricing snapshot -- set server-side at submission time, never recomputed afterward.
  baseUnitPriceSnapshot?: number;
  calculatedUnitPriceSnapshot?: number;
  calculatedSubtotalSnapshot?: number;
  additionalFeesSnapshot?: number;
  discountAmountSnapshot?: number;
  calculatedTotalSnapshot?: number;
  appliedPricingRuleIdSnapshot?: string;
  currency: string;

  // Manual staff override -- additive, never overwrites the calculated snapshot above.
  manualAdjustment?: number;
  finalQuotedPrice?: number;
  internalNote?: string;

  options: QuoteRequestOptionDto[];

  createdAt: string;
  updatedAt: string;
}

export interface SetFinalQuotedPriceInput {
  finalQuotedPrice: number;
  manualAdjustment?: number;
  internalNote?: string;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface QuoteRequestApiResponse {
  success: boolean;
  message?: string;
  data: QuoteRequestDto;
  errors?: string[];
}

// ─── Admin list types ─────────────────────────────────────────────────────────

export interface QuoteRequestQueryParams {
  pageNumber?: number;
  pageSize?: number;
  status?: QuoteRequestStatus;
  search?: string;
}

export interface QuoteRequestListData {
  items: QuoteRequestDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface QuoteRequestListApiResponse {
  success: boolean;
  message?: string;
  data: QuoteRequestListData;
  errors?: string[];
}

export interface UpdateQuoteRequestStatusInput {
  status: QuoteRequestStatus;
}
