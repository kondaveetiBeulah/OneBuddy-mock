/**
 * Backward compatibility facade for orders module.
 * Re-exports all operations from:
 * - ./checkout (placeOrder, schemas)
 * - ./stateMachine (cancelOrder, updateOrderStatus, runOrderAction)
 * - ./queries (listMyOrders, getMyOrder)
 * - ./reorder (reorder, rescheduleOrder)
 */
export * from './index';
