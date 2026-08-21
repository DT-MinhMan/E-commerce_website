import mongoose, { Types, type FilterQuery } from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import { logger, type LogFields } from "../../common/logger.js";
import { getConfig } from "../../config/env.js";
import { DEFAULT_CURRENCY } from "../../database/enums.js";
import { CartModel, type Cart, type CartItem } from "../cart/cart.model.js";
import { ProductModel, type Product, type ProductImage } from "../catalog/product.model.js";
import { PaymentModel } from "../payments/payment.model.js";
import { OrderModel, type Order, type OrderDocument, type OrderItem } from "./order.model.js";
import type { AdminOrderListQuery, AdminOrderStatusUpdateInput, CheckoutInput, OrderListQuery, OrderResponse, PaginationMeta } from "./order.types.js";

interface CartRecord extends Cart {
  _id: Types.ObjectId;
}

interface ProductRecord extends Product {
  _id: Types.ObjectId;
}

type OrderRecord = Order & {
  _id: Types.ObjectId;
};

const cartSelect = "_id userId items";
const productSelect = "_id name slug priceMinor currency stockQuantity images status";
const orderSelect =
  "_id userId orderNumber items shippingAddress paymentMethod subtotalMinor shippingFeeMinor totalMinor currency orderStatus paymentStatus paidAt cancelledAt completedAt createdAt updatedAt";
const orderNumberRetryLimit = 3;
const shippingFeeMinor = 0;

const getCart = async (userId: string): Promise<CartRecord> => {
  const cart = await CartModel.findOne({ userId: new Types.ObjectId(userId) }).select(cartSelect).lean<CartRecord>().exec();

  if (!cart || cart.items.length === 0) {
    throw new AppError(400, "CHECKOUT_CART_EMPTY", "Cart is empty");
  }

  return cart;
};

const getProductsById = async (items: CartItem[]): Promise<Map<string, ProductRecord>> => {
  const products = await ProductModel.find({ _id: { $in: items.map((item) => item.productId) } })
    .select(productSelect)
    .lean<ProductRecord[]>()
    .exec();

  return new Map(products.map((product) => [product._id.toString(), product]));
};

const getProductImage = (product: ProductRecord): ProductImage | undefined => product.images[0] as ProductImage | undefined;

export const buildCheckoutSnapshot = async (cart: CartRecord): Promise<{
  items: OrderItem[];
  subtotalMinor: number;
  totalMinor: number;
  currency: string;
}> => {
  const products = await getProductsById(cart.items);
  const currencies = new Set<string>();
  const items = cart.items.map((item) => {
    const product = products.get(item.productId.toString());

    if (!product) {
      throw new AppError(404, "CHECKOUT_PRODUCT_NOT_FOUND", "Product not found");
    }

    if (product.status !== "ACTIVE") {
      throw new AppError(400, "CHECKOUT_PRODUCT_INACTIVE", "Product is inactive");
    }

    if (product.stockQuantity < item.quantity) {
      throw new AppError(409, "CHECKOUT_INSUFFICIENT_STOCK", "Requested quantity exceeds available stock");
    }

    currencies.add(product.currency);
    const image = getProductImage(product);
    const unitPriceMinor = product.priceMinor;
    const lineTotalMinor = unitPriceMinor * item.quantity;

    return {
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: image?.url,
      unitPriceMinor,
      quantity: item.quantity,
      lineTotalMinor
    };
  });

  if (currencies.size > 1) {
    throw new AppError(409, "CHECKOUT_CURRENCY_MISMATCH", "Cart contains multiple currencies");
  }

  const subtotalMinor = items.reduce((total, item) => total + item.lineTotalMinor, 0);

  return {
    items,
    subtotalMinor,
    totalMinor: subtotalMinor + shippingFeeMinor,
    currency: currencies.values().next().value ?? DEFAULT_CURRENCY
  };
};

const generateOrderNumber = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");

  return `ORD-${datePart}-${randomPart}`;
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === 11000;

const toDateString = (value: Date | undefined): string | null => value?.toISOString() ?? null;

const toOrderResponse = (order: OrderRecord | OrderDocument): OrderResponse => ({
  id: order._id.toString(),
  userId: order.userId.toString(),
  orderNumber: order.orderNumber,
  items: order.items.map((item) => ({
    productId: item.productId.toString(),
    productName: item.productName,
    productSlug: item.productSlug,
    productImage: item.productImage ? { url: item.productImage } : null,
    unitPriceMinor: item.unitPriceMinor,
    quantity: item.quantity,
    lineTotalMinor: item.lineTotalMinor
  })),
  shippingAddress: {
    recipientName: order.shippingAddress.recipientName,
    phone: order.shippingAddress.phone,
    addressLine1: order.shippingAddress.addressLine1,
    addressLine2: order.shippingAddress.addressLine2,
    city: order.shippingAddress.city,
    stateOrProvince: order.shippingAddress.stateOrProvince,
    postalCode: order.shippingAddress.postalCode,
    countryCode: order.shippingAddress.countryCode
  },
  paymentMethod: order.paymentMethod ?? "COD",
  subtotalMinor: order.subtotalMinor,
  shippingFeeMinor: order.shippingFeeMinor,
  totalMinor: order.totalMinor,
  currency: order.currency,
  orderStatus: order.orderStatus,
  paymentStatus: order.paymentStatus,
  paidAt: toDateString(order.paidAt),
  cancelledAt: toDateString(order.cancelledAt),
  completedAt: toDateString(order.completedAt),
  createdAt: order.createdAt.toISOString(),
  updatedAt: order.updatedAt.toISOString()
});

export const checkout = async (userId: string, input: CheckoutInput, logContext: LogFields = {}): Promise<OrderResponse> => {
  const cart = await getCart(userId);
  const snapshot = await buildCheckoutSnapshot(cart);
  const config = getConfig();
  const paymentMethod = input.paymentMethod ?? "COD";

  for (let attempt = 1; attempt <= orderNumberRetryLimit; attempt += 1) {
    const session = await mongoose.startSession();

    try {
      let createdOrder: OrderDocument | null = null;
      let createdPaymentId: string | undefined;

      await session.withTransaction(async () => {
        const [order] = await OrderModel.create(
          [
            {
              orderNumber: generateOrderNumber(),
              userId: new Types.ObjectId(userId),
              items: snapshot.items,
              shippingAddress: input.shippingAddress,
              paymentMethod,
              subtotalMinor: snapshot.subtotalMinor,
              shippingFeeMinor,
              totalMinor: snapshot.totalMinor,
              currency: snapshot.currency,
              orderStatus: "PENDING",
              paymentStatus: "PENDING"
            }
          ],
          { session }
        );

        createdOrder = order;

        const [payment] = await PaymentModel.create(
          [
            {
              orderId: order._id,
              userId: new Types.ObjectId(userId),
              provider: paymentMethod === "COD" ? "COD" : "STRIPE",
              amountMinor: snapshot.totalMinor,
              currency: snapshot.currency,
              status: "PENDING"
            }
          ],
          { session }
        );
        createdPaymentId = payment?._id.toString();

        await CartModel.updateOne({ _id: cart._id }, { $set: { items: [] } }, { runValidators: true, session }).exec();
      });

      if (!createdOrder) {
        throw new AppError(500, "CHECKOUT_TRANSACTION_FAILED", "Checkout transaction failed");
      }

      const order = createdOrder as OrderDocument;
      logger.info(config, "Checkout order created", {
        ...logContext,
        userId,
        orderId: order._id.toString(),
        paymentId: createdPaymentId
      });

      return toOrderResponse(order);
    } catch (error) {
      if (isDuplicateKeyError(error) && attempt < orderNumberRetryLimit) {
        logger.warn(config, "Checkout order number collision retry", { ...logContext, userId, attempt });
        continue;
      }

      if (isDuplicateKeyError(error)) {
        logger.warn(config, "Checkout order number conflict", { ...logContext, userId, errorCode: "ORDER_NUMBER_CONFLICT" });
        throw new AppError(409, "ORDER_NUMBER_CONFLICT", "Unable to generate a unique order number");
      }

      if (error instanceof AppError) {
        logger.warn(config, "Checkout failed", { ...logContext, userId, errorCode: error.code });
        throw error;
      }

      logger.error(config, "Checkout transaction failed", { ...logContext, userId, errorCode: "CHECKOUT_TRANSACTION_FAILED" });
      throw new AppError(500, "CHECKOUT_TRANSACTION_FAILED", "Checkout transaction failed");
    } finally {
      await session.endSession();
    }
  }

  throw new AppError(409, "ORDER_NUMBER_CONFLICT", "Unable to generate a unique order number");
};

export const listOrders = async (
  userId: string,
  query: OrderListQuery
): Promise<{ orders: OrderResponse[]; meta: PaginationMeta }> => {
  const filter = { userId: new Types.ObjectId(userId) };
  const skip = (query.page - 1) * query.limit;
  const [orders, totalItems] = await Promise.all([
    OrderModel.find(filter).select(orderSelect).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean<OrderRecord[]>().exec(),
    OrderModel.countDocuments(filter).exec()
  ]);

  return {
    orders: orders.map(toOrderResponse),
    meta: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit)
    }
  };
};

export const getOrderById = async (userId: string, orderId: string): Promise<OrderResponse> => {
  const order = await OrderModel.findOne({ _id: new Types.ObjectId(orderId), userId: new Types.ObjectId(userId) })
    .select(orderSelect)
    .lean<OrderRecord>()
    .exec();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return toOrderResponse(order);
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listAdminOrders = async (
  query: AdminOrderListQuery
): Promise<{ orders: OrderResponse[]; meta: PaginationMeta }> => {
  const filter: FilterQuery<Order> = {};

  if (query.orderStatus) {
    filter.orderStatus = query.orderStatus;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.q) {
    const searchRegex = { $regex: escapeRegex(query.q), $options: "i" };
    filter.$or = [
      { orderNumber: searchRegex },
      { "shippingAddress.recipientName": searchRegex },
      { "shippingAddress.phone": searchRegex }
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [orders, totalItems] = await Promise.all([
    OrderModel.find(filter).select(orderSelect).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean<OrderRecord[]>().exec(),
    OrderModel.countDocuments(filter).exec()
  ]);

  return {
    orders: orders.map(toOrderResponse),
    meta: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit)
    }
  };
};

export const getAdminOrderById = async (orderId: string): Promise<OrderResponse> => {
  const order = await OrderModel.findById(orderId).select(orderSelect).lean<OrderRecord>().exec();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return toOrderResponse(order);
};

const validAdminTransitions: Partial<Record<Order["orderStatus"], Order["orderStatus"][]>> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "RETURNED"]
};

export const updateAdminOrderStatus = async (orderId: string, input: AdminOrderStatusUpdateInput): Promise<OrderResponse> => {
  const current = await OrderModel.findById(orderId).select(orderSelect).lean<OrderRecord>().exec();

  if (!current) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (current.orderStatus !== input.expectedCurrentStatus) {
    throw new AppError(409, "ORDER_STATUS_CONFLICT", "Order status changed before this update");
  }

  if (!validAdminTransitions[current.orderStatus]?.includes(input.nextStatus)) {
    throw new AppError(400, "ORDER_STATUS_TRANSITION_INVALID", "Order status transition is not allowed");
  }

  const update: Partial<Order> = { orderStatus: input.nextStatus };

  if (input.nextStatus === "CANCELLED") {
    update.cancelledAt = new Date();
  }

  if (input.nextStatus === "COMPLETED") {
    update.completedAt = new Date();
  }

  const order = await OrderModel.findByIdAndUpdate(orderId, { $set: update }, { new: true, runValidators: true })
    .select(orderSelect)
    .lean<OrderRecord>()
    .exec();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return toOrderResponse(order);
};

export const cancelCustomerOrder = async (userId: string, orderId: string): Promise<OrderResponse> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const current = await OrderModel.findOne({ _id: orderId, userId }).select(orderSelect).lean<OrderRecord>().exec();

  if (!current) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (current.orderStatus !== "PENDING" || current.paymentStatus === "PAID") {
    throw new AppError(409, "ORDER_NOT_CANCELLABLE", "Order cannot be cancelled at this stage");
  }

  const order = await OrderModel.findByIdAndUpdate(
    orderId,
    { $set: { orderStatus: "CANCELLED", cancelledAt: new Date() } },
    { new: true, runValidators: true }
  )
    .select(orderSelect)
    .lean<OrderRecord>()
    .exec();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return toOrderResponse(order);
};

