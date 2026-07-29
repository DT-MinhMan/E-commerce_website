import { pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { getConfig, type NodeEnv } from "../config/env.js";
import { DEFAULT_CURRENCY } from "./enums.js";
import { CategoryModel, ProductModel, UserModel } from "./models.js";
import { syncDatabaseIndexes } from "./syncIndexes.js";

interface SeedAccount {
  email: string;
  password: string;
  fullName: string;
  role: "ADMIN" | "CUSTOMER";
}

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  categorySlug: string;
  priceMinor: number;
  stockQuantity: number;
  status?: "ACTIVE" | "INACTIVE";
  imageUrl: string;
}

interface SeedResult {
  created: number;
  updated: number;
}

const placeholderImage = (slug: string): string => `https://placehold.co/800x600/png?text=${encodeURIComponent(slug)}`;

const getSeedAccounts = (): SeedAccount[] => [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
    password: process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!",
    fullName: "Demo Admin",
    role: "ADMIN"
  },
  {
    email: process.env.SEED_CUSTOMER_EMAIL ?? "customer@example.com",
    password: process.env.SEED_CUSTOMER_PASSWORD ?? "ChangeMe123!",
    fullName: "Demo Customer",
    role: "CUSTOMER"
  }
];

const seedCategories: SeedCategory[] = [
  {
    name: "Keyboards",
    slug: "keyboards",
    description: "Mechanical and productivity keyboards for daily work and gaming."
  },
  {
    name: "Mice",
    slug: "mice",
    description: "Wired and wireless mice for gaming and office setups."
  },
  {
    name: "Audio",
    slug: "audio",
    description: "Headphones and audio accessories for focused work."
  },
  {
    name: "Monitors",
    slug: "monitors",
    description: "Displays for productivity and entertainment."
  }
];

const seedProducts: SeedProduct[] = [
  {
    name: "Mechanical Gaming Keyboard",
    slug: "mechanical-gaming-keyboard",
    description: "Compact mechanical keyboard with tactile switches and durable keycaps.",
    categorySlug: "keyboards",
    priceMinor: 8999,
    stockQuantity: 24,
    imageUrl: placeholderImage("mechanical-gaming-keyboard")
  },
  {
    name: "Wireless Gaming Mouse",
    slug: "wireless-gaming-mouse",
    description: "Lightweight wireless mouse with precise tracking and long battery life.",
    categorySlug: "mice",
    priceMinor: 4999,
    stockQuantity: 3,
    imageUrl: placeholderImage("wireless-gaming-mouse")
  },
  {
    name: "USB-C Headphones",
    slug: "usb-c-headphones",
    description: "Wired USB-C headphones with clear microphone input for calls.",
    categorySlug: "audio",
    priceMinor: 2999,
    stockQuantity: 0,
    imageUrl: placeholderImage("usb-c-headphones")
  },
  {
    name: "27-inch Monitor",
    slug: "27-inch-monitor",
    description: "Crisp 27-inch display with slim bezels for productivity desks.",
    categorySlug: "monitors",
    priceMinor: 19999,
    stockQuantity: 12,
    imageUrl: placeholderImage("27-inch-monitor")
  },
  {
    name: "Legacy Wired Mouse",
    slug: "legacy-wired-mouse",
    description: "Inactive demo product retained to exercise product visibility rules.",
    categorySlug: "mice",
    priceMinor: 1599,
    stockQuantity: 50,
    status: "INACTIVE",
    imageUrl: placeholderImage("legacy-wired-mouse")
  }
];

const countResult = (matchedCount: number, upsertedCount: number): SeedResult => ({
  created: upsertedCount,
  updated: matchedCount
});

const seedUsers = async (): Promise<SeedResult> => {
  const passwordSaltRounds = 10;
  const totals: SeedResult = { created: 0, updated: 0 };

  for (const account of getSeedAccounts()) {
    const passwordHash = await bcrypt.hash(account.password, passwordSaltRounds);
    const result = await UserModel.updateOne(
      { email: account.email.toLowerCase() },
      {
        $set: {
          email: account.email.toLowerCase(),
          passwordHash,
          fullName: account.fullName,
          role: account.role,
          status: "ACTIVE"
        }
      },
      { upsert: true, runValidators: true }
    );
    const counted = countResult(result.matchedCount, result.upsertedCount);
    totals.created += counted.created;
    totals.updated += counted.updated;
  }

  return totals;
};

const seedCategoryDocuments = async (): Promise<SeedResult> => {
  const totals: SeedResult = { created: 0, updated: 0 };

  for (const category of seedCategories) {
    const result = await CategoryModel.updateOne(
      { slug: category.slug },
      {
        $set: {
          ...category,
          status: "ACTIVE"
        }
      },
      { upsert: true, runValidators: true }
    );
    const counted = countResult(result.matchedCount, result.upsertedCount);
    totals.created += counted.created;
    totals.updated += counted.updated;
  }

  return totals;
};

const getCategoryIdsBySlug = async (): Promise<Map<string, Types.ObjectId>> => {
  const categories = await CategoryModel.find({ slug: { $in: seedCategories.map((category) => category.slug) } })
    .select("_id slug")
    .lean()
    .exec();

  return new Map(categories.map((category) => [category.slug, category._id]));
};

const seedProductDocuments = async (): Promise<SeedResult> => {
  const totals: SeedResult = { created: 0, updated: 0 };
  const categoryIdsBySlug = await getCategoryIdsBySlug();

  for (const product of seedProducts) {
    const categoryId = categoryIdsBySlug.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing seed category for product ${product.slug}`);
    }

    const result = await ProductModel.updateOne(
      { slug: product.slug },
      {
        $set: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          categoryId,
          priceMinor: product.priceMinor,
          currency: DEFAULT_CURRENCY,
          stockQuantity: product.stockQuantity,
          images: [{ url: product.imageUrl, alt: product.name }],
          status: product.status ?? "ACTIVE"
        }
      },
      { upsert: true, runValidators: true }
    );
    const counted = countResult(result.matchedCount, result.upsertedCount);
    totals.created += counted.created;
    totals.updated += counted.updated;
  }

  return totals;
};

const assertResetAllowed = (nodeEnv: NodeEnv): void => {
  if (nodeEnv === "production") {
    throw new Error("Refusing to reset database when NODE_ENV=production");
  }

  if (!process.argv.includes("--confirm")) {
    throw new Error("Reset requires --confirm");
  }
};

const resetSeedCollections = async (): Promise<void> => {
  await ProductModel.deleteMany({ slug: { $in: seedProducts.map((product) => product.slug) } });
  await CategoryModel.deleteMany({ slug: { $in: seedCategories.map((category) => category.slug) } });
  await UserModel.deleteMany({ email: { $in: getSeedAccounts().map((account) => account.email.toLowerCase()) } });
};

export const seedDatabase = async (): Promise<void> => {
  await syncDatabaseIndexes();

  const users = await seedUsers();
  const categories = await seedCategoryDocuments();
  const products = await seedProductDocuments();

  console.info(`users created/updated: ${users.created}/${users.updated}`);
  console.info(`categories created/updated: ${categories.created}/${categories.updated}`);
  console.info(`products created/updated: ${products.created}/${products.updated}`);
};

const run = async (): Promise<void> => {
  const config = getConfig();
  const shouldReset = process.argv.includes("--reset");

  await connectDatabase(config.mongodbUri);

  try {
    if (shouldReset) {
      assertResetAllowed(config.nodeEnv);
      await resetSeedCollections();
    }

    await seedDatabase();
  } finally {
    await disconnectDatabase();
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown seed error";
    console.error(message);
    await mongoose.disconnect();
    process.exit(1);
  });
}
