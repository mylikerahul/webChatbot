import { Product, QueryIntent } from "../types/index.js";

// This represents the "Brain State" of our Bot at any given second
export interface AgentState {
  sessionId: string;
  userQuery: string;
  intent?: QueryIntent | null;
  products: Product[];
  actionTaken?: string;
  response: string;
  isCompleted: boolean;
}