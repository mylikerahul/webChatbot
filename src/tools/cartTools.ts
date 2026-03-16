import { log } from '../utils/logger.js';
import { Product } from '../types/index.js';

// In-Memory Cart Store
const userCarts = new Map<string, Product[]>();

export const CartTools = {
  getCart(sessionId: string): Product[] {
    return userCarts.get(sessionId) || [];
  },

  addToCart(sessionId: string, product: Product): string {
    const cart = this.getCart(sessionId);
    cart.push(product);
    userCarts.set(sessionId, cart);
    log.info(`🛒 Product added to cart for [${sessionId}]`);
    return `Successfully added **${product.name}** to your cart! 🛍️`;
  },

  clearCart(sessionId: string): string {
    userCarts.set(sessionId, []);
    return `Your cart has been cleared. 🧹`;
  }
};