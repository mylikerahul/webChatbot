/**
 * ════════════════════════════════════════════════════════════════════════
 * LANGCHAIN AGENTS - Decision Making Entities
 * Ye file agents define karti hai jo tools use karte hain
 * ════════════════════════════════════════════════════════════════════════
 */

import { log } from '../utils/logger.js';
import { Product, QueryIntent } from '../types/index.js';
import { searchProducts, getTopRatedProducts } from '../tools/productTools.js';
import { CartTools } from '../tools/cartTools.js';
import { 
  detectIntentWithLangChain,
  generateRecommendationWithLangChain,
  generateConversationalResponse,
  generateSmartFallback,
} from './chains.js';
import { ChatMemory } from '../memory/chatHistory.js';

// ════════════════════════════════════════════════════════════════════════
// AGENT 1: Product Search Agent
// ════════════════════════════════════════════════════════════════════════

export class ProductSearchAgent {
  name = 'ProductSearchAgent';
  
  async execute(query: string, sessionId: string): Promise<string> {
    log.ai(`🤖 [Agent: ${this.name}] Starting execution`);
    
    // Step 1: Use LangChain to detect intent
    const intent = await detectIntentWithLangChain(query);
    log.ai(`📋 [Agent] Intent detected: ${intent.type}`);
    
    // Step 2: Fetch products using tools
    let products: Product[] = [];
    
    if (intent.type === 'recommendation') {
      products = await getTopRatedProducts(intent.category, 10);
    } else {
      products = await searchProducts(intent);
    }
    
    log.ai(`🛍️ [Agent] Found ${products.length} products`);
    
    // Step 3: Use LangChain to generate response
    let response: string;
    
    if (products.length > 0) {
      response = await generateRecommendationWithLangChain(query, intent, products);
    } else {
      response = await generateSmartFallback(query, intent);
    }
    
    // Step 4: Update memory
    ChatMemory.updateUserProfile(sessionId, intent);
    
    log.ai(`✅ [Agent: ${this.name}] Execution complete`);
    return response;
  }
}

// ════════════════════════════════════════════════════════════════════════
// AGENT 2: Conversational Agent (with Memory)
// ════════════════════════════════════════════════════════════════════════

export class ConversationalAgent {
  name = 'ConversationalAgent';
  
  async execute(query: string, sessionId: string): Promise<string> {
    log.ai(`🤖 [Agent: ${this.name}] Starting execution`);
    
    // Step 1: Get conversation history
    const history = ChatMemory.getRecentContext(sessionId, 5);
    log.ai(`🧠 [Agent] Retrieved conversation history (${history.split('\n').length} messages)`);
    
    // Step 2: Detect intent with LangChain
    const intent = await detectIntentWithLangChain(query);
    
    // Step 3: Fetch products
    const products = await searchProducts(intent);
    
    // Step 4: Generate context-aware response using LangChain
    const response = await generateConversationalResponse(query, products, history);
    
    log.ai(`✅ [Agent: ${this.name}] Context-aware response generated`);
    return response;
  }
}

// ════════════════════════════════════════════════════════════════════════
// AGENT 3: Action Agent (Cart, Compare, etc.)
// ════════════════════════════════════════════════════════════════════════

export class ActionAgent {
  name = 'ActionAgent';
  
  async execute(query: string, sessionId: string, action: string): Promise<string> {
    log.ai(`🤖 [Agent: ${this.name}] Starting action: ${action}`);
    
    switch (action) {
      case 'add_to_cart': {
        // Would need product ID from context
        return `Cart action detected. Please specify which product to add.`;
      }
      
      case 'compare': {
        return `Product comparison feature using LangChain chains.`;
      }
      
      case 'get_details': {
        return `Product details retrieval using LangChain.`;
      }
      
      default: {
        return `Unknown action: ${action}`;
      }
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
// AGENT COORDINATOR - Routes to correct agent
// ════════════════════════════════════════════════════════════════════════

export class AgentCoordinator {
  private productSearchAgent = new ProductSearchAgent();
  private conversationalAgent = new ConversationalAgent();
  private actionAgent = new ActionAgent();
  
  async route(query: string, sessionId: string): Promise<string> {
    log.ai('🎯 [Coordinator] Routing query to appropriate agent');
    
    const lowerQuery = query.toLowerCase();
    
    // Route logic
    if (/cart|add|daal/i.test(lowerQuery)) {
      log.ai('→ Routing to: ActionAgent');
      return this.actionAgent.execute(query, sessionId, 'add_to_cart');
    }
    
    if (/compare|vs|difference/i.test(lowerQuery)) {
      log.ai('→ Routing to: ActionAgent');
      return this.actionAgent.execute(query, sessionId, 'compare');
    }
    
    // Check if user has conversation history
    const hasHistory = ChatMemory.isReturningUser(sessionId);
    
    if (hasHistory) {
      log.ai('→ Routing to: ConversationalAgent (with memory)');
      return this.conversationalAgent.execute(query, sessionId);
    }
    
    log.ai('→ Routing to: ProductSearchAgent');
    return this.productSearchAgent.execute(query, sessionId);
  }
}