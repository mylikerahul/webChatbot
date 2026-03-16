// types/index.ts

// ✅ PriceRange - Extracted as standalone export
export interface PriceRange {
  min: number;
  max: number;
}

// ✅ IntentType - Extracted as standalone export
export type IntentType =
  | 'greeting'
  | 'product_search'
  | 'product_detail'
  | 'recommendation'
  | 'price_query'
  | 'comparison'
  | 'general';

// Product Interface
export interface Product {
  id: number;
  name: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  rating: number | null;
  image: string | null;
  stock: number;
  created_at?: Date;
  mrp?: number;
  reviewCount?: number;
  image_url?: string;
}

// Chat Message Interface
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

// Query Intent Interface - ✅ SINGLE SOURCE OF TRUTH
export interface QueryIntent {
  type: IntentType;           // ✅ Uses exported IntentType
  category?: string;
  priceRange?: PriceRange;    // ✅ Uses exported PriceRange
  rating?: number;
  keywords: string[];
  budget?: number;
  productName?: string;
  context?: {
    lastProductMentioned?: string;
  };
}

// User Profile Interface
export interface UserProfile {
  sessionId: string;
  preferredCategory?: string;
  avgBudget?: number;
  searchCount: Record<string, number>;
  lastIntent?: QueryIntent;
  totalSearches: number;
  createdAt: Date;
  lastActiveAt: Date;
}

// Product Query Result Interface
export interface ProductQueryResult {
  products: Product[];
  summary: string;
  count: number;
  intent?: QueryIntent;
}

// Chat Response Interface
export interface ChatResponse {
  success: boolean;
  response: string;
  products?: Product[];
  intent?: QueryIntent;
  timestamp: string;
}

// Vector Search Result
export interface VectorSearchResult {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  similarity: number;
  inVector?: boolean;
}

// Database Config
export interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

// Server Config
export interface ServerConfig {
  port: number;
  host: string;
}

// API Response Generic
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Product Filter Options
export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  searchQuery?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'name';
  limit?: number;
  offset?: number;
}

// Conversation Context
export interface ConversationContext {
  userId?: string;
  sessionId: string;
  messages: ChatMessage[];
  lastIntent?: QueryIntent;
  lastProducts?: Product[];
  createdAt: Date;
  updatedAt: Date;
}

// Embedding Interface
export interface Embedding {
  productId: number;
  vector: number[];
  text: string;
  metadata?: Record<string, any>;
}

// Agent State (for LangGraph workflow)
export interface AgentState {
  sessionId: string;
  userQuery: string;
  intent?: QueryIntent;
  products: Product[];
  response: string;
  isCompleted: boolean;
  actionTaken?: string;
  error?: string;
}

// Tool Result Interface
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  toolName: string;
  executionTime?: number;
}

// RAG Context
export interface RAGContext {
  query: string;
  retrievedDocs: Product[];
  relevanceScores: number[];
  context: string;
}

// Logging Metadata
export interface LogMetadata {
  query?: string;
  intent?: QueryIntent;
  productCount?: number;
  executionTime?: number;
  error?: Error | string;
  [key: string]: any;
}