import { log } from '../utils/logger.js';
import { QueryIntent, Product } from '../types/index.js';
import { detectIntent } from './intentAgent.js';
import { searchProducts, getTopRatedProducts } from '../tools/productTools.js';
import { generateLocalResponse } from './reasoningAgent.js';
import { handleCommonQuery } from './customLocalLLM.js';
import { ChatMemory } from '../memory/chatHistory.js';

export interface ChatResponse {
  message: string;
  products?: Product[];
  intent?: QueryIntent;
}

export async function processChatQuery(userQuery: string, sessionId: string = 'default'): Promise<ChatResponse> {
  try {
    log.info(`🚀 Processing query for session [${sessionId}]:`, userQuery);

    // Save User Message to Memory
    ChatMemory.addMessage(sessionId, 'user', userQuery);

    // 1. Common Queries (Hi, Hello, Help)
    const commonResponse = handleCommonQuery(userQuery);
    if (commonResponse) {
      ChatMemory.addMessage(sessionId, 'assistant', commonResponse);
      return { message: commonResponse, products: [] };
    }

    // 2. Detect Intent
    const intent = await detectIntent(userQuery);
    log.info('📋 Intent:', intent);

    // 3. Search Products
    let products: Product[] = [];
    if (intent.type === 'recommendation') {
      products = await getTopRatedProducts(intent.category, 10);
    } else if (intent.type === 'general') {
      products = await getTopRatedProducts(undefined, 5);
    } else {
      products = await searchProducts(intent);
    }

    log.info(`🛍️ Found ${products.length} products`);

    // 4. Get Chat History to give context to response (Future proofing)
    // const history = ChatMemory.getHistory(sessionId);

    // 5. Generate Final Response
    const message = await generateLocalResponse(userQuery, products);

    // Save Bot Response to Memory
    ChatMemory.addMessage(sessionId, 'assistant', message);

    return {
      message,
      products: products.slice(0, 5),
      intent,
    };

  } catch (error: any) {
    log.error('❌ Chat processing failed:', error);
    return { message: 'Sorry, I encountered an error. Please try again! 😅', products: [] };
  }
}