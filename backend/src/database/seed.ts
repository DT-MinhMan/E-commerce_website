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
  roomType?: "LIVING_ROOM" | "BEDROOM" | "DINING_ROOM" | "WORKING_ROOM" | "OUTDOOR" | "DECOR";
  priceMinor: number;
  stockQuantity: number;
  status?: "ACTIVE" | "INACTIVE";
  imageUrl: string;
}

interface SeedResult {
  created: number;
  updated: number;
}

const placeholderImage = (label: string): string => `https://placehold.co/800x600/FAF8F5/171717/png?text=${encodeURIComponent(label)}`;

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
    name: "Sofa phòng khách",
    slug: "sofa-phong-khach",
    description: "Sofa vải, sofa module và ghế thư giãn cho căn hộ hiện đại."
  },
  {
    name: "Giường và tủ",
    slug: "giuong-va-tu",
    description: "Giường ngủ, tủ đầu giường và giải pháp lưu trữ gọn cho phòng ngủ."
  },
  {
    name: "Bàn ăn căn hộ",
    slug: "ban-an-can-ho",
    description: "Bàn ăn và ghế ăn nhỏ gọn, dễ phối cho không gian chung cư."
  },
  {
    name: "Decor tối giản",
    slug: "decor-toi-gian",
    description: "Đèn, kệ và vật dụng trang trí tạo điểm nhấn nhẹ cho căn hộ."
  }
];

const seedProducts: SeedProduct[] = [
  {
    name: "Sofa module vải Linen",
    slug: "sofa-module-vai-linen",
    description: "Sofa module ba chỗ ngồi với bề mặt vải linen, dáng thấp và phần tựa rộng cho phòng khách căn hộ.",
    categorySlug: "sofa-phong-khach",
    roomType: "LIVING_ROOM",
    priceMinor: 89900,
    stockQuantity: 12,
    imageUrl: placeholderImage("Sofa module vai Linen")
  },
  {
    name: "Ghế thư giãn gỗ Ash",
    slug: "ghe-thu-gian-go-ash",
    description: "Ghế thư giãn khung gỗ ash, đệm rời màu trung tính và kích thước phù hợp góc đọc sách.",
    categorySlug: "sofa-phong-khach",
    roomType: "LIVING_ROOM",
    priceMinor: 32900,
    stockQuantity: 3,
    imageUrl: placeholderImage("Ghe thu gian go Ash")
  },
  {
    name: "Giường hộc kéo Oak",
    slug: "giuong-hoc-keo-oak",
    description: "Giường ngủ khung oak veneer có hai hộc kéo dưới gầm, tối ưu lưu trữ cho phòng ngủ nhỏ.",
    categorySlug: "giuong-va-tu",
    roomType: "BEDROOM",
    priceMinor: 74900,
    stockQuantity: 0,
    imageUrl: placeholderImage("Giuong hoc keo Oak")
  },
  {
    name: "Bàn ăn mở rộng Nordic",
    slug: "ban-an-mo-rong-nordic",
    description: "Bàn ăn bốn đến sáu chỗ với mặt gỗ sáng, chân bo nhẹ và cơ chế mở rộng cho bữa ăn gia đình.",
    categorySlug: "ban-an-can-ho",
    roomType: "DINING_ROOM",
    priceMinor: 58900,
    stockQuantity: 9,
    imageUrl: placeholderImage("Ban an mo rong Nordic")
  },
  {
    name: "Đèn bàn gốm matte",
    slug: "den-ban-gom-matte",
    description: "Đèn bàn thân gốm matte, ánh sáng ấm và chụp vải dệt cho bàn console hoặc kệ đầu giường.",
    categorySlug: "decor-toi-gian",
    roomType: "DECOR",
    priceMinor: 12900,
    stockQuantity: 24,
    imageUrl: placeholderImage("Den ban gom matte")
  },
  {
    name: "Kệ trang trí treo tường",
    slug: "ke-trang-tri-treo-tuong",
    description: "Kệ treo tường thanh mảnh cho sách nhỏ, bình gốm và vật dụng trang trí nhẹ.",
    categorySlug: "decor-toi-gian",
    roomType: "DECOR",
    priceMinor: 6900,
    stockQuantity: 18,
    imageUrl: placeholderImage("Ke trang tri treo tuong")
  },
  {
    name: "Tủ đầu giường Legacy",
    slug: "tu-dau-giuong-legacy",
    description: "Sản phẩm nội thất demo không còn bán, được giữ inactive để kiểm tra quy tắc hiển thị catalog.",
    categorySlug: "giuong-va-tu",
    roomType: "BEDROOM",
    priceMinor: 9900,
    stockQuantity: 6,
    status: "INACTIVE",
    imageUrl: placeholderImage("Tu dau giuong Legacy")
  }
];

const legacyDemoCategorySlugs = ["keyboards", "mice", "audio", "monitors"];
const legacyDemoProductSlugs = [
  "mechanical-gaming-keyboard",
  "wireless-gaming-mouse",
  "usb-c-headphones",
  "27-inch-monitor",
  "legacy-wired-mouse"
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

const deactivateLegacyDemoCatalog = async (): Promise<void> => {
  await ProductModel.updateMany({ slug: { $in: legacyDemoProductSlugs } }, { $set: { status: "INACTIVE" } }, { runValidators: true }).exec();
  await CategoryModel.updateMany({ slug: { $in: legacyDemoCategorySlugs } }, { $set: { status: "INACTIVE" } }, { runValidators: true }).exec();
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
          ...(product.roomType ? { roomType: product.roomType } : {}),
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
  await ProductModel.deleteMany({ slug: { $in: [...seedProducts.map((product) => product.slug), ...legacyDemoProductSlugs] } });
  await CategoryModel.deleteMany({ slug: { $in: [...seedCategories.map((category) => category.slug), ...legacyDemoCategorySlugs] } });
  await UserModel.deleteMany({ email: { $in: getSeedAccounts().map((account) => account.email.toLowerCase()) } });
};

export const seedDatabase = async (): Promise<void> => {
  await syncDatabaseIndexes();
  await deactivateLegacyDemoCatalog();

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
