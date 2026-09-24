/* ---------------------------------------------------------------------
   Shared types for the Notification Settings feature.
   ------------------------------------------------------------------- */

export type CategoryId = 'food' | 'groceries' | 'rides' | 'health' | 'homeServices'

export interface CategoryTab {
  id: CategoryId
  label: string
  emoji: string
}

export interface NotificationSectionItem {
  key: string
  title: string
}

export interface NotificationCategoryData {
  title: string
  sections: NotificationSectionItem[]
}

export type NotificationData = Record<CategoryId, NotificationCategoryData>

/** e.g. { orderDelivery: true, offersDiscounts: false, ... } */
export type CategoryToggleState = Record<string, boolean>

/** e.g. { food: { orderDelivery: true, ... }, groceries: { ... }, ... } */
export type NotificationState = Record<CategoryId, CategoryToggleState>
