import { DEFAULT_CURRENCY, ORDER_STATUSES, type OrderStatus } from "../../database/enums.js";
import { ProductModel } from "../catalog/product.model.js";
import { OrderModel } from "../orders/order.model.js";
import { PaymentModel } from "../payments/payment.model.js";

const lowStockThreshold = 5;
const lowStockLimit = 8;
const topProductsLimit = 5;

interface StatusCount {
  status: OrderStatus;
  count: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stockQuantity: number;
  status: string;
}

interface TopProduct {
  productId: string;
  productName: string;
  soldQuantity: number;
  revenueMinor: number;
}

interface AdminDashboardSummary {
  paidRevenueMinor: number;
  currency: string;
  totalOrders: number;
  ordersByStatus: StatusCount[];
  lowStockProducts: LowStockProduct[];
  topProducts: TopProduct[];
}

export const getAdminDashboardSummary = async (): Promise<AdminDashboardSummary> => {
  const [revenueResult, totalOrders, statusCounts, lowStockProducts, topProducts] = await Promise.all([
    PaymentModel.aggregate<{ _id: string; totalMinor: number }>([
      { $match: { status: "PAID" } },
      { $group: { _id: "$currency", totalMinor: { $sum: "$amountMinor" } } },
      { $sort: { totalMinor: -1 } },
      { $limit: 1 }
    ]).exec(),
    OrderModel.countDocuments().exec(),
    OrderModel.aggregate<{ _id: OrderStatus; count: number }>([
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).exec(),
    ProductModel.find({ stockQuantity: { $lte: lowStockThreshold } })
      .select("_id name slug stockQuantity status")
      .sort({ stockQuantity: 1, updatedAt: -1 })
      .limit(lowStockLimit)
      .lean<Array<{ _id: { toString: () => string }; name: string; slug: string; stockQuantity: number; status: string }>>()
      .exec(),
    OrderModel.aggregate<TopProduct>([
      { $match: { paymentStatus: "PAID", orderStatus: { $in: ["PROCESSING", "SHIPPED", "COMPLETED"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          soldQuantity: { $sum: "$items.quantity" },
          revenueMinor: { $sum: "$items.lineTotalMinor" }
        }
      },
      { $sort: { soldQuantity: -1, revenueMinor: -1 } },
      { $limit: topProductsLimit },
      {
        $project: {
          _id: 0,
          productId: { $toString: "$_id" },
          productName: 1,
          soldQuantity: 1,
          revenueMinor: 1
        }
      }
    ]).exec()
  ]);

  const countsByStatus = new Map(statusCounts.map((item) => [item._id, item.count]));

  return {
    paidRevenueMinor: revenueResult[0]?.totalMinor ?? 0,
    currency: revenueResult[0]?._id ?? DEFAULT_CURRENCY,
    totalOrders,
    ordersByStatus: ORDER_STATUSES.map((status) => ({ status, count: countsByStatus.get(status) ?? 0 })),
    lowStockProducts: lowStockProducts.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      stockQuantity: product.stockQuantity,
      status: product.status
    })),
    topProducts
  };
};
