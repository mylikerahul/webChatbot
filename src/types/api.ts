// API Request/Response Types

// Chat API
export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
}

export interface ChatApiResponse {
  success: boolean;
  response: string;
  products?: Array<{
    id: number;
    name: string;
    title: string;
    category: string;
    price: number;
    rating: number;
    image: string;
  }>;
  intent?: {
    type: string;
    category?: string;
    budget?: number;
  };
  timestamp: string;
}

// Products API
export interface ProductsRequest {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ProductsApiResponse {
  success: boolean;
  products: Array<{
    id: number;
    name: string;
    title: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    image: string;
    stock: number;
  }>;
  total: number;
  page?: number;
  totalPages?: number;
}

// Health Check API
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
  vectorDb?: 'available' | 'unavailable';
  uptime?: number;
}

// Error Response
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
  timestamp: string;
}