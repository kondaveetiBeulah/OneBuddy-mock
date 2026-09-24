/* ---------------------------------------------------------------------
   Notification Settings — source data (section-level toggles).
   Each category is a list of sections. Unlike the full version, there
   is exactly ONE on/off toggle per section (not one per individual
   notification) — toggling "Order & Delivery" controls every
   notification in that group at once.
   ------------------------------------------------------------------- */

import type {
  CategoryId,
  CategoryTab,
  NotificationData,
  NotificationState,
} from './types'

type RawCategory = {
  title: string
  sections: string[]
}

const RAW_DATA: Record<CategoryId, RawCategory> = {
  food: {
    title: 'Food',
    sections: ['Order & Delivery', 'Offers & Discounts', 'Payments', 'Reviews'],
  },
  groceries: {
    title: 'Groceries',
    sections: ['Orders & Delivery', 'Products', 'Offers & Savings', 'Cart & Wishlist', 'Payments'],
  },
  rides: {
    title: 'Ride',
    sections: ['Ride Updates', 'Driver & Safety', 'Payment', 'Offers & Rewards', 'Ride Reminders'],
  },
  health: {
    title: 'Health',
    sections: ['Appointments', 'Medicines & Treatments', 'Health Reports', 'Payments', 'Health & Wellness'],
  },
  homeServices: {
    title: 'Home Services',
    sections: ['Booking & Service', 'Payments', 'Offers', 'Reviews & Support'],
  },
}

/** Tab config — emoji + colour class reuse the same category identity
 *  already established by the home screen's category cards. */
export const CATEGORY_TABS: CategoryTab[] = [
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'rides', label: 'Rides', emoji: '🚗' },
  { id: 'health', label: 'Health Care', emoji: '❤️' },
  { id: 'homeServices', label: 'Home Services', emoji: '🔧' },
]

/** "Payment & refund updates" -> "paymentRefundUpdates" */
function toKey(label: string): string {
  const words = label.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().split(/\s+/)
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
}

/** Same shape as RAW_DATA, but every section is now { key, title } so
 *  components can render with .map() and read/write state by key. */
export const NOTIFICATION_DATA: NotificationData = Object.fromEntries(
  (Object.entries(RAW_DATA) as [CategoryId, RawCategory][]).map(([categoryId, category]) => [
    categoryId,
    {
      title: category.title,
      sections: category.sections.map((title) => ({ key: toKey(title), title })),
    },
  ])
) as NotificationData

/** { food: { orderDelivery: true, ... }, groceries: { ... }, ... } —
 *  everything defaults ON, matching a fresh install where the user
 *  hasn't opted out of anything yet. */
export function buildDefaultNotificationState(): NotificationState {
  return Object.fromEntries(
    (Object.entries(NOTIFICATION_DATA) as [CategoryId, NotificationData[CategoryId]][]).map(
      ([categoryId, category]) => [
        categoryId,
        Object.fromEntries(category.sections.map((section) => [section.key, true])),
      ]
    )
  ) as NotificationState
}
