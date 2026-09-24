import { useMemo } from 'react';

import { GROUP_ORDER } from '../config';
import type { Filter, OrderCard, OrderSection } from '../types';

// Filters by category, buckets into Ongoing / Upcoming / Completed, then drops
// any bucket that ended up empty.
export function useGroupedOrders(
  orders: OrderCard[],
  filter: Filter,
): OrderSection[] {
  return useMemo(() => {
    const filtered = orders.filter(
      (order) => filter === 'all' || order.category === filter,
    );

    return GROUP_ORDER.map((group) => ({
      group,
      items: filtered.filter((order) => order.group === group),
    })).filter((section) => section.items.length > 0);
  }, [orders, filter]);
}
