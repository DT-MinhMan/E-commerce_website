export const USER_ROLES = ["CUSTOMER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const CATEGORY_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];

export const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ROOM_TYPES = ["LIVING_ROOM", "BEDROOM", "DINING_ROOM", "WORKING_ROOM", "OUTDOOR", "DECOR"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "RETURNED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_PROVIDERS = ["STRIPE", "COD"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const WEBHOOK_PROCESSING_STATUSES = ["RECEIVED", "PROCESSING", "PROCESSED", "FAILED", "IGNORED"] as const;
export type WebhookProcessingStatus = (typeof WEBHOOK_PROCESSING_STATUSES)[number];

export const DEFAULT_CURRENCY = "USD";
