/**
 * Backward compatibility facade for carts module.
 * Re-exports all cart item and checkout quote operations from:
 * - ./items (getCart, setCartItem, removeCartItem, clearCart)
 * - ./quote (quoteCheckout)
 */
export * from './index';
