import { AgentState } from '../graph/state';
import { ChatMemory } from '../memory/chatHistory';
import { detectIntent } from '../agents/intentAgent';
import { searchProducts, getTopRatedProducts, getProductByName, getSimilarProducts } from '../tools/productTools';
import { generateLocalResponse, generateProductDetailResponse } from '../agents/reasoningAgent';
import { handleCommonQuery } from '../agents/customLocalLLM';
import { CartTools } from '../tools/cartTools.js';

export async function runAgenticWorkflow(query: string, sessionId: string): Promise<AgentState> {

  let state: AgentState = {
    sessionId,
    userQuery: query,
    products: [],
    response: '',
    isCompleted: false,
  };

  ChatMemory.addMessage(sessionId, 'user', query);

  const commonResponse = await handleCommonQuery(query);
  if (commonResponse && isValidCommonResponse(commonResponse, query)) {
    state.response = commonResponse;
    state.isCompleted = true;
    return finalizeWorkflow(state);
  }

  state.intent = await detectIntent(query);

  if (state.intent.type === 'greeting') {
    const greetings = [
      'Namaste! Main aapki shopping assistant hoon. Aap kya dhundh rahe hain?',
      'Hello! Kya main aapki madad kar sakti hoon?',
      'Hi there! Aaj kya chahiye aapko?',
      'Namaskar! Main yahan hoon aapki help ke liye. Batao kya chahiye?',
    ];
    state.response = greetings[Math.floor(Math.random() * greetings.length)];
    state.isCompleted = true;
    return finalizeWorkflow(state);
  }

  if (state.intent.type === 'product_detail') {
    const productName =
      state.intent.productName ||
      (state.intent.keywords && state.intent.keywords.length > 0
        ? state.intent.keywords.join(' ')
        : null) ||
      query;

    const product = await getProductByName(productName);

    if (product) {
      state.products = [product];
      const similarProducts = await getSimilarProducts(product.id, product.category, 4);
      const detailResponse = await generateProductDetailResponse(product, query);

      if (similarProducts.length > 0) {
        state.response = detailResponse + '\n\n**Isse milte julte products:**\n';
        state.products = [product, ...similarProducts];
      } else {
        state.response = detailResponse;
      }
    } else {
      const fallbackProduct = await getProductByName(query);
      if (fallbackProduct) {
        state.products = [fallbackProduct];
        state.response = await generateProductDetailResponse(fallbackProduct, query);
      } else {
        state.response = `Sorry! "${productName}" naam ka product nahi mila. Thoda alag naam try karo ya category batao.`;
      }
    }

    state.isCompleted = true;
    return finalizeWorkflow(state);
  }

  const isGenericQuery =
    /kuch\s+(accha|acha|sahi)|koi\s+bhi|recommend|suggest|dikhao\s*$/i.test(query.toLowerCase()) &&
    !state.intent.category &&
    !state.intent.budget;

  if (isGenericQuery) {
    const userProfile = ChatMemory.getUserProfile(sessionId);

    if (userProfile?.preferredCategory) {
      state.intent.category = userProfile.preferredCategory;
      state.intent.type = 'recommendation';

      if (userProfile.avgBudget) {
        state.intent.budget = userProfile.avgBudget;
      }

      if (ChatMemory.isReturningUser(sessionId)) {
        state.response = `Welcome back! Maine notice kiya aapko **${userProfile.preferredCategory}** products pasand hain.\n\n`;
      }
    }
  }

  if (/add to cart|cart me|cart mein|daal do|dal do/i.test(query.toLowerCase())) {
    if (state.products.length > 0) {
      const product = state.products[0];
      state.response = CartTools.addToCart(sessionId, product);
      state.actionTaken = 'add_to_cart';
    } else {
      state.response = 'Pehle koi product search karein, phir main cart me add kar dunga!';
    }

    state.isCompleted = true;
    return finalizeWorkflow(state);
  }

  switch (state.intent.type) {
    case 'price_query':
      if (state.intent.productName) {
        const directProduct = await getProductByName(state.intent.productName);
        if (directProduct) {
          state.products = [directProduct];
          break;
        }
      }
      state.products = await searchProducts(state.intent);
      break;

    case 'product_search':
      state.products = await searchProducts(state.intent);
      break;

    case 'recommendation':
      if (state.intent.budget || state.intent.priceRange) {
        state.products = await searchProducts(state.intent);
      } else {
        state.products = await getTopRatedProducts(state.intent.category, 10);
      }
      break;

    case 'general':
      if (state.intent.category) {
        state.products = await getTopRatedProducts(state.intent.category, 5);
      } else {
        state.response = 'Maaf karna! Main samajh nahi paayi. Kya aap mujhe bata sakte hain ki aapko kya chahiye?\n\n**Examples:**\n- "Laptop under 50000"\n- "Best headphones"\n- "Kitchen appliances dikhao"';
        state.isCompleted = true;
        return finalizeWorkflow(state);
      }
      break;

    default:
      state.response = 'Hmm... Main aapki baat samajh nahi paayi. Kya aap dobara try kar sakte hain?';
      state.isCompleted = true;
      return finalizeWorkflow(state);
  }

  const generatedResponse = await generateLocalResponse(query, state.products, state.intent);
  state.response = (state.response || '') + generatedResponse;

  if (state.intent && state.products.length > 0) {
    ChatMemory.updateUserProfile(sessionId, state.intent);
  }

  state.isCompleted = true;
  return finalizeWorkflow(state);
}

function finalizeWorkflow(state: AgentState): AgentState {
  ChatMemory.addMessage(state.sessionId, 'assistant', state.response);
  return state;
}

function isValidCommonResponse(response: string, query: string): boolean {
  const defaultPattern = /I understand your query regarding/i;
  return !defaultPattern.test(response);
}