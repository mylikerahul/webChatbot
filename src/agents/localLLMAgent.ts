import { log } from '../utils/logger.js';
import { Product } from '../types/index.js';

// ─── ADVANCED CONTEXT-AWARE REASONING ENGINE ────────────────────────────

export async function generateLocalResponse(
  userQuery: string,
  products: Product[]
): Promise<string> {
  try {
    log.ai('🤖 Reasoning engine analyzing query intent...');

    const queryLower = userQuery.toLowerCase();
    
    // 1. Check if no products found
    if (!products || products.length === 0) {
      return generateNoProductsResponse(queryLower);
    }

    // 2. Language & Intent Detection
    const isHinglish = /mujhe|dikhao|batao|chahiye|kya|kaise|kitne|bhej|de do/i.test(queryLower);
    const wantsDetail = /detail|about|features|specs|specification|batao/i.test(queryLower);
    const isBudgetSearch = /under|cheap|sasta|kam price/i.test(queryLower);

    // 3. Logic: Does the user want detail of ONE product, or a LIST of products?
    // If only 1 product matches, or user specifically asked for "detail"
    if (products.length === 1 || wantsDetail) {
      return generateDetailedProductResponse(products[0], isHinglish);
    }

    // 4. Logic: User wants a list of products
    return generateListResponse(products, isBudgetSearch, isHinglish);

  } catch (error) {
    log.error('❌ Response generation failed:', error);
    return `Sorry, I found the products but had trouble formatting them. Please try again! 😅`;
  }
}

// ─── GENERATE DETAILED RESPONSE (Like ChatGPT) ──────────────────────────

function generateDetailedProductResponse(product: Product, isHinglish: boolean): string {
  let response = '';

  // Conversational Intro
  if (isHinglish) {
    response += `Zaroor! Ye rahi **${product.name}** ki poori details: ✨\n\n`;
  } else {
    response += `Sure! Here is the detailed information for the **${product.name}**: ✨\n\n`;
  }

  // Product Data
  response += `📱 **Product:** ${product.title || product.name}\n`;
  response += `💰 **Price:** ₹${product.price.toLocaleString('en-IN')}\n`;
  response += `⭐ **Rating:** ${product.rating ? `${product.rating}/5` : 'Not Rated Yet'}\n`;
  response += `📦 **Category:** ${product.category}\n\n`;
  
  // Description Highlight
  if (product.description) {
    response += `📝 **About this product:**\n${product.description}\n\n`;
  }

  // Conversational Outro
  if (isHinglish) {
    response += `Agar aapka budget kuch aur hai, ya koi aur product dekhna hai toh mujhe bataiye! 😊`;
  } else {
    response += `Let me know if you want to see similar products or if you have a specific budget! 😊`;
  }

  return response;
}

// ─── GENERATE LIST RESPONSE ─────────────────────────────────────────────

function generateListResponse(products: Product[], isBudgetSearch: boolean, isHinglish: boolean): string {
  let response = '';
  
  // Sort products logically
  let sortedProducts = [...products];
  if (isBudgetSearch) {
    sortedProducts.sort((a, b) => a.price - b.price); // Cheapest first
  } else {
    sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Highest rated first
  }

  const topProduct = sortedProducts[0];

  // Smart Contextual Intro
  if (isHinglish) {
    if (isBudgetSearch) {
      response += `Mujhe aapke budget me ${products.length} badhiya options mile hain! 💸 Sabse affordable **${topProduct.name}** hai sirf ₹${topProduct.price.toLocaleString('en-IN')} me.\n\n`;
    } else {
      response += `Mujhe ${products.length} behtareen products mile hain! 🎉 Ye rahe top recommendations:\n\n`;
    }
  } else {
    if (isBudgetSearch) {
      response += `I found ${products.length} budget-friendly options for you! 💸 The most affordable one is **${topProduct.name}** at just ₹${topProduct.price.toLocaleString('en-IN')}.\n\n`;
    } else {
      response += `I found ${products.length} excellent matches for your search! 🎉 Here are the top recommendations:\n\n`;
    }
  }

  // Build the list
  sortedProducts.slice(0, 4).forEach((p, idx) => {
    response += `${idx + 1}. **${p.name}**\n`;
    response += `   💰 ₹${p.price.toLocaleString('en-IN')} | ⭐ ${p.rating || 'N/A'} Rating\n\n`;
  });

  if (products.length > 4) {
    const remaining = products.length - 4;
    response += `\n✨ _Aur ${remaining} options bhi available hain. Kisi specific product ki detail chahiye toh naam batayein!_\n`;
  }

  return response;
}

// ─── NO PRODUCTS FOUND RESPONSE ─────────────────────────────────────────

function generateNoProductsResponse(query: string): string {
  const isHinglish = /mujhe|dikhao|batao|chahiye|kya|bhej/i.test(query);

  if (isHinglish) {
    return `Maaf karna! 😔 Mujhe aapki search "${query}" ke hisaab se koi product nahi mila.\n\n` +
      `**Aap ye try kar sakte hain:**\n` +
      `• Thode alag words use karein (e.g., "Phone", "Rice", "Headphones")\n` +
      `• Apna budget change karke dekhein\n` +
      `• Humari categories check karein: Electronics, Grocery, Games ya Kitchen\n\n` +
      `Bataiye, main aapki aur kya madad kar sakta hu? 😊`;
  }

  return `Sorry! 😔 I couldn't find any products matching your search.\n\n` +
    `**Try these instead:**\n` +
    `• Use different keywords (e.g., "laptop", "headphones", "rice")\n` +
    `• Adjust your price limit\n` +
    `• Browse our categories: Electronics, Grocery, Games, Kitchen\n\n` +
    `Need help? Just ask! 😊`;
}

// ─── COMMON GREETINGS & CHIT-CHAT ───────────────────────────────────────

export function handleCommonQuery(query: string): string | null {
  const q = query.toLowerCase().trim();
  
  // Hindi / Hinglish Greetings
  if (['hi', 'hello', 'hey', 'namaste', 'kaise ho', 'kya hal hai'].includes(q)) {
    return `Namaste! 🙏 Main aapka apna AI Shopping Assistant hu.\n\n` +
           `Aap mujhse kisi bhi product ki detail ya budget recommendations maang sakte hain.\n\n` +
           `**Try asking:**\n` +
           `• "Mujhe 50,000 ke under best laptop dikhao"\n` +
           `• "iPhone 15 ki detail bhej"\n` +
           `• "Kitchen appliances on budget"\n`;
  }
  
  if (q.includes('help') || q === '?') {
    return `**Main aapki in cheezon me madad kar sakta hu:**\n\n` +
      `🔍 **Product Search:** "Show me laptops under 50000"\n` +
      `📝 **Details:** "iPhone 15 ki details batao"\n` +
      `⭐ **Recommendations:** "Best rated headphones dikhao"\n` +
      `💰 **Budget:** "Sasta chawal batao"\n\n` +
      `Bataiye, kya dekhna pasand karenge aap? 😊`;
  }
  
  return null;
}