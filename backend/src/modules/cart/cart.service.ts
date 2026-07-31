import { Types } from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import { DEFAULT_CURRENCY } from "../../database/enums.js";
import { ProductModel, type Product, type ProductImage } from "../catalog/product.model.js";
import { CartModel, type Cart, type CartItem } from "./cart.model.js";
import type { CartItemInput, CartItemResponse, CartQuantityInput, CartResponse } from "./cart.types.js";

interface CartRecord extends Cart {
  _id: Types.ObjectId;
}

interface ProductRecord extends Product {
  _id: Types.ObjectId;
}

const cartSelect = "_id userId items createdAt updatedAt";
const productSelect = "_id name slug priceMinor currency stockQuantity images status";

const getActiveProductForMutation = async (productId: string): Promise<ProductRecord> => {
  const product = await ProductModel.findById(productId).select(productSelect).lean<ProductRecord>().exec();

  if (!product) {
    throw new AppError(404, "CART_PRODUCT_NOT_FOUND", "Product not found");
  }

  if (product.status !== "ACTIVE") {
    throw new AppError(400, "CART_PRODUCT_INACTIVE", "Product is inactive");
  }

  if (product.stockQuantity < 1) {
    throw new AppError(409, "CART_INSUFFICIENT_STOCK", "Product is out of stock");
  }

  return product;
};

const assertStock = (product: ProductRecord, quantity: number): void => {
  if (quantity > product.stockQuantity) {
    throw new AppError(409, "CART_INSUFFICIENT_STOCK", "Requested quantity exceeds available stock");
  }
};

const assertCartCurrency = async (cart: CartRecord, nextProduct: ProductRecord): Promise<void> => {
  const products = await getProductsById(cart.items);
  const currencies = new Set(
    cart.items
      .map((item) => products.get(item.productId.toString()))
      .filter((product): product is ProductRecord => product !== undefined && product.status === "ACTIVE")
      .map((product) => product.currency)
  );

  if (currencies.size > 0 && !currencies.has(nextProduct.currency)) {
    throw new AppError(409, "CART_CURRENCY_MISMATCH", "Cart contains multiple currencies");
  }
};

const getOrCreateCart = async (userId: string): Promise<CartRecord> => {
  const cart = await CartModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $setOnInsert: { userId: new Types.ObjectId(userId), items: [] } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  )
    .select(cartSelect)
    .lean<CartRecord>()
    .exec();

  if (!cart) {
    throw new AppError(500, "CART_UNAVAILABLE", "Unable to load cart");
  }

  return cart;
};

const findCart = async (userId: string): Promise<CartRecord | null> =>
  CartModel.findOne({ userId: new Types.ObjectId(userId) }).select(cartSelect).lean<CartRecord>().exec();

const getProductsById = async (items: CartItem[]): Promise<Map<string, ProductRecord>> => {
  const ids = items.map((item) => item.productId);
  const products = await ProductModel.find({ _id: { $in: ids } }).select(productSelect).lean<ProductRecord[]>().exec();
  return new Map(products.map((product) => [product._id.toString(), product]));
};

const fallbackItem = (item: CartItem): CartItemResponse => ({
  productId: item.productId.toString(),
  slug: null,
  name: "Unavailable product",
  image: null,
  unitPriceMinor: 0,
  currency: DEFAULT_CURRENCY,
  quantity: item.quantity,
  lineTotalMinor: 0,
  stockQuantity: 0,
  isAvailable: false
});

const toCartItemResponse = (item: CartItem, product: ProductRecord | undefined): CartItemResponse => {
  if (!product) {
    return fallbackItem(item);
  }

  const isAvailable = product.status === "ACTIVE" && product.stockQuantity >= item.quantity;
  const unitPriceMinor = product.priceMinor;
  const lineTotalMinor = isAvailable ? unitPriceMinor * item.quantity : 0;
  const image = (product.images[0] as ProductImage | undefined) ?? null;

  return {
    productId: product._id.toString(),
    slug: product.slug,
    name: product.name,
    image,
    unitPriceMinor,
    currency: product.currency,
    quantity: item.quantity,
    lineTotalMinor,
    stockQuantity: product.stockQuantity,
    isAvailable
  };
};

const toCartResponse = async (cart: CartRecord | null): Promise<CartResponse> => {
  if (!cart) {
    return {
      id: null,
      items: [],
      itemCount: 0,
      subtotalMinor: 0,
      currency: DEFAULT_CURRENCY
    };
  }

  const products = await getProductsById(cart.items);
  const items = cart.items.map((item) => toCartItemResponse(item, products.get(item.productId.toString())));
  const availableItems = items.filter((item) => item.isAvailable);
  const currencies = new Set(availableItems.map((item) => item.currency));

  if (currencies.size > 1) {
    throw new AppError(409, "CART_CURRENCY_MISMATCH", "Cart contains multiple currencies");
  }

  return {
    id: cart._id.toString(),
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotalMinor: availableItems.reduce((total, item) => total + item.lineTotalMinor, 0),
    currency: availableItems[0]?.currency ?? DEFAULT_CURRENCY
  };
};

export const getCurrentCart = async (userId: string): Promise<CartResponse> => toCartResponse(await findCart(userId));

export const addCartItem = async (userId: string, input: CartItemInput): Promise<CartResponse> => {
  const product = await getActiveProductForMutation(input.productId);
  const cart = await getOrCreateCart(userId);
  const existingItem = cart.items.find((item) => item.productId.toString() === input.productId);
  const nextQuantity = (existingItem?.quantity ?? 0) + input.quantity;

  assertStock(product, nextQuantity);
  await assertCartCurrency(cart, product);

  if (existingItem) {
    await CartModel.updateOne(
      { _id: cart._id, "items.productId": product._id },
      { $set: { "items.$.quantity": nextQuantity } },
      { runValidators: true }
    ).exec();
  } else {
    await CartModel.updateOne(
      { _id: cart._id, "items.productId": { $ne: product._id } },
      { $push: { items: { productId: product._id, quantity: input.quantity } } },
      { runValidators: true }
    ).exec();
  }

  return toCartResponse(await findCart(userId));
};

export const updateCartItem = async (userId: string, productId: string, input: CartQuantityInput): Promise<CartResponse> => {
  const product = await getActiveProductForMutation(productId);
  assertStock(product, input.quantity);

  const result = await CartModel.updateOne(
    { userId: new Types.ObjectId(userId), "items.productId": product._id },
    { $set: { "items.$.quantity": input.quantity } },
    { runValidators: true }
  ).exec();

  if (result.matchedCount === 0) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  return toCartResponse(await findCart(userId));
};

export const removeCartItem = async (userId: string, productId: string): Promise<CartResponse> => {
  const result = await CartModel.updateOne(
    { userId: new Types.ObjectId(userId), "items.productId": new Types.ObjectId(productId) },
    { $pull: { items: { productId: new Types.ObjectId(productId) } } },
    { runValidators: true }
  ).exec();

  if (result.matchedCount === 0) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  return toCartResponse(await findCart(userId));
};

export const clearCart = async (userId: string): Promise<CartResponse> => {
  const cart = await getOrCreateCart(userId);
  await CartModel.updateOne({ _id: cart._id }, { $set: { items: [] } }, { runValidators: true }).exec();
  return toCartResponse(await findCart(userId));
};
