import { AgentState, QueryIntent } from '../types/index.js';
import { ChatMemory } from '../memory/chatHistory.js';
import { IntentAgent } from './intentAgent.js';
import { ReasoningAgent } from './reasoningAgent.js';
import { CommonQueryHandler } from './commonQueryHandler.js';
import {
  searchProducts,
  getTopRatedProducts,
  getProductByName,
  getSimilarProducts,
} from '../tools/productTools.js';
import { CartTools } from '../tools/cartTools.js';

const CART_PATTERN = /add to cart|cart me|cart mein|daal do|dal do/i;
const GENERIC_QUERY_PATTERN = /kuch\s+(accha|acha|sahi)|koi\s+bhi|recommend|suggest|dikhao\s*$/i;
const HINGLISH_PATTERN = /mujhe|dikhao|batao|chahiye/i;

const PRODUCT_NAME_CLEAN_PATTERNS = [
  /ki price|ka price|ke price/gi,
  /kya hai|price kya/gi,
  /wale ki|wala ka|wali ki/gi,
  /kitne ka|kitne ki/gi,
];

class ResponseBuilder {
  buildUnknownResponse(isHinglish: boolean): string {
    if (isHinglish) {
      return [
        'Main samajh nahi paayi. Kya aap dobara try kar sakte hain?\n',
        'Examples:',
        '- "Laptop under 50000"',
        '- "Best headphones"',
        '- "Kitchen appliances dikhao"',
      ].join('\n');
    }

    return [
      'I could not understand that. Please try again.\n',
      'Examples:',
      '- "Laptop under 50000"',
      '- "Best headphones"',
      '- "Show kitchen appliances"',
    ].join('\n');
  }

  buildSimilarProductsResponse(products: any[]): string {
    if (products.length === 0) return '';
    
    return '\n\n**Isse milte julte products:**\n' + products
      .map((p, i) => `${i + 1}. ${p.name} - Rs.${p.price.toLocaleString('en-IN')}`)
      .join('\n');
  }

  buildCartEmptyResponse(): string {
    return 'Pehle koi product search karein, phir main cart me add kar dunga.';
  }

  buildWelcomeBackResponse(category: string): string {
    return `Welcome back! Maine notice kiya aapko ${category} products pasand hain.\n\n`;
  }
}

class WorkflowProductNameExtractor {
  extract(query: string, intent: QueryIntent): string {
    if (intent.productName) {
      return intent.productName;
    }

    if (intent.keywords && intent.keywords.length > 0) {
      return intent.keywords.join(' ');
    }

    let cleaned = query;
    for (const pattern of PRODUCT_NAME_CLEAN_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
  }
}

class WorkflowStateManager {
  createInitialState(sessionId: string, query: string): AgentState {
    return {
      sessionId,
      userQuery: query,
      products: [],
      response: '',
      isCompleted: false,
    };
  }

  finalize(state: AgentState): AgentState {
    ChatMemory.addMessage(state.sessionId, 'assistant', state.response);
    return state;
  }

  markCompleted(state: AgentState, response: string): AgentState {
    state.response = response;
    state.isCompleted = true;
    return state;
  }
}

class ProductDetailHandler {
  private readonly responseBuilder: ResponseBuilder;
  private readonly nameExtractor: WorkflowProductNameExtractor;
  private readonly reasoningAgent: ReasoningAgent;

  constructor(reasoningAgent: ReasoningAgent) {
    this.responseBuilder = new ResponseBuilder();
    this.nameExtractor = new WorkflowProductNameExtractor();
    this.reasoningAgent = reasoningAgent;
  }

  async handle(state: AgentState): Promise<AgentState> {
    const productName = this.nameExtractor.extract(
      state.userQuery,
      state.intent!
    );

    const product = await getProductByName(productName);

    if (product) {
      const similar = await getSimilarProducts(product.id, product.category, 4);
      
      // Generate detailed response
      const detailResponse = await this.reasoningAgent.generate(
        state.userQuery,
        [product],
        state.intent
      );

      state.products = similar.length > 0 ? [product, ...similar] : [product];
      state.response = detailResponse;

      // Add similar products if found
      if (similar.length > 0) {
        state.response += this.responseBuilder.buildSimilarProductsResponse(similar);
      }
    } else {
      // No exact match - try broader search
      const broadSearch = await searchProducts({
        type: 'product_search',
        keywords: productName.split(' ').filter(w => w.length > 2),
      });

      if (broadSearch.length > 0) {
        state.products = broadSearch;
        state.response = await this.reasoningAgent.generate(
          state.userQuery,
          broadSearch,
          state.intent
        );
      } else {
        state.response = `"${productName}" ke liye koi product nahi mila. Spelling check karo ya category specify karo.`;
      }
    }

    state.isCompleted = true;
    return state;
  }
}

class CartHandler {
  private readonly responseBuilder: ResponseBuilder;

  constructor() {
    this.responseBuilder = new ResponseBuilder();
  }

  handle(state: AgentState): AgentState {
    if (state.products.length > 0) {
      state.response = CartTools.addToCart(state.sessionId, state.products[0]);
      state.actionTaken = 'add_to_cart';
    } else {
      state.response = this.responseBuilder.buildCartEmptyResponse();
    }

    state.isCompleted = true;
    return state;
  }

  isCartRequest(query: string): boolean {
    return CART_PATTERN.test(query.toLowerCase());
  }
}

class GenericQueryHandler {
  private readonly responseBuilder: ResponseBuilder;

  constructor() {
    this.responseBuilder = new ResponseBuilder();
  }

  isGenericQuery(query: string, intent: QueryIntent): boolean {
    return GENERIC_QUERY_PATTERN.test(query.toLowerCase()) &&
           !intent.category &&
           !intent.budget;
  }

  applyUserProfile(state: AgentState): AgentState {
    const profile = ChatMemory.getUserProfile(state.sessionId);

    if (profile?.preferredCategory) {
      state.intent!.category = profile.preferredCategory;
      state.intent!.type = 'recommendation';

      if (profile.avgBudget) {
        state.intent!.budget = profile.avgBudget;
      }

      if (ChatMemory.isReturningUser(state.sessionId)) {
        state.response = this.responseBuilder.buildWelcomeBackResponse(
          profile.preferredCategory
        );
      }
    }

    return state;
  }
}

class ProductSearchHandler {
  async search(state: AgentState): Promise<AgentState> {
    const intent = state.intent!;

    switch (intent.type) {
      case 'price_query':
      case 'product_search':
        state.products = await searchProducts(intent);
        break;

      case 'recommendation':
        state.products = (intent.budget || intent.priceRange)
          ? await searchProducts(intent)
          : await getTopRatedProducts(intent.category, 10);
        break;

      case 'general':
        if (intent.category) {
          state.products = await getTopRatedProducts(intent.category, 5);
        } else if (intent.keywords && intent.keywords.length > 0) {
          state.products = await searchProducts(intent);
        }
        break;

      default:
        if (intent.keywords && intent.keywords.length > 0) {
          state.products = await searchProducts(intent);
        }
        break;
    }

    return state;
  }
}

class AgentWorkflowOrchestrator {
  private readonly intentAgent: IntentAgent;
  private readonly reasoningAgent: ReasoningAgent;
  private readonly commonHandler: CommonQueryHandler;
  private readonly stateManager: WorkflowStateManager;
  private readonly productDetailHandler: ProductDetailHandler;
  private readonly cartHandler: CartHandler;
  private readonly genericQueryHandler: GenericQueryHandler;
  private readonly productSearchHandler: ProductSearchHandler;
  private readonly responseBuilder: ResponseBuilder;

  constructor() {
    this.intentAgent = new IntentAgent();
    this.reasoningAgent = new ReasoningAgent();
    this.commonHandler = new CommonQueryHandler();
    this.stateManager = new WorkflowStateManager();
    this.productDetailHandler = new ProductDetailHandler(this.reasoningAgent);
    this.cartHandler = new CartHandler();
    this.genericQueryHandler = new GenericQueryHandler();
    this.productSearchHandler = new ProductSearchHandler();
    this.responseBuilder = new ResponseBuilder();
  }

  async run(query: string, sessionId: string): Promise<AgentState> {
    const state = this.stateManager.createInitialState(sessionId, query);
    ChatMemory.addMessage(sessionId, 'user', query);

    // Step 1: Handle common queries
    const commonResponse = this.commonHandler.handle(query);
    if (commonResponse) {
      return this.stateManager.finalize(
        this.stateManager.markCompleted(state, commonResponse)
      );
    }

    // Step 2: Detect intent
    state.intent = await this.intentAgent.detect(query);

    // Step 3: Handle greeting intent
    if (state.intent.type === 'greeting') {
      const greetingResponse = this.commonHandler.handle(query) ?? 
        'Namaste! Kya chahiye aapko?';
      return this.stateManager.finalize(
        this.stateManager.markCompleted(state, greetingResponse)
      );
    }

    // Step 4: Handle product detail request
    if (state.intent.type === 'product_detail') {
      const detailState = await this.productDetailHandler.handle(state);
      return this.stateManager.finalize(detailState);
    }

    // Step 5: Handle cart operations
    if (this.cartHandler.isCartRequest(query)) {
      const cartState = this.cartHandler.handle(state);
      return this.stateManager.finalize(cartState);
    }

    // Step 6: Handle generic queries with user profile
    if (this.genericQueryHandler.isGenericQuery(query, state.intent)) {
      this.genericQueryHandler.applyUserProfile(state);
    }

    // Step 7: Search products
    await this.productSearchHandler.search(state);

    // Step 8: Generate response based on results
    if (state.products.length === 0) {
      // No products found - give helpful message
      const isHinglish = HINGLISH_PATTERN.test(query.toLowerCase());
      
      if (state.intent.category || (state.intent.keywords && state.intent.keywords.length > 0)) {
        state.response = `Aapki search "${state.intent.keywords?.join(' ') || state.intent.category}" ke liye koi product nahi mila. Thoda different try karo!`;
      } else {
        state.response = this.responseBuilder.buildUnknownResponse(isHinglish);
      }

      state.isCompleted = true;
      return this.stateManager.finalize(state);
    }

    // Step 9: Generate rich response for found products
    const generatedResponse = await this.reasoningAgent.generate(
      query, 
      state.products,
      state.intent
    );
    
    state.response = (state.response || '') + generatedResponse;

    // Step 10: Update user profile
    if (state.intent && state.products.length > 0) {
      ChatMemory.updateUserProfile(state.sessionId, state.intent);
    }

    state.isCompleted = true;
    return this.stateManager.finalize(state);
  }
}

const workflowOrchestrator = new AgentWorkflowOrchestrator();

export async function runAgenticWorkflow(query: string, sessionId: string): Promise<AgentState> {
  return workflowOrchestrator.run(query, sessionId);
}