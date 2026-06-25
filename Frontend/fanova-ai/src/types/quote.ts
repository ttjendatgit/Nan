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
  createdAt: string;
  updatedAt: string;
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
