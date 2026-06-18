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
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteRequestApiResponse {
  success: boolean;
  message?: string;
  data: QuoteRequestDto;
  errors?: string[];
}
