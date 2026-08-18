import { createHash } from "node:crypto";
import { AppError } from "../../common/errors/AppError.js";
import type { AppConfig } from "../../config/env.js";
import { getConfig } from "../../config/env.js";

interface CloudinaryUploadResponse {
  public_id?: string;
  secure_url?: string;
}

interface ProductImageUploadInput {
  dataUri: string;
  fileName?: string;
}

interface ProductImageUploadResult {
  url: string;
  publicId: string;
}

const assertCloudinaryConfigured = (config: AppConfig): void => {
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    throw new AppError(500, "CLOUDINARY_CONFIG_MISSING", "Cloudinary is not configured");
  }
};

const signCloudinaryParams = (params: Record<string, string>, apiSecret: string): string => {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
};

const publicIdFromFileName = (fileName: string | undefined): string | undefined => {
  if (!fileName) {
    return undefined;
  }

  const slug = fileName
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug ? `${slug}-${Date.now()}` : undefined;
};

export const uploadProductImageToCloudinary = async (
  input: ProductImageUploadInput,
  config: AppConfig = getConfig()
): Promise<ProductImageUploadResult> => {
  assertCloudinaryConfigured(config);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams: Record<string, string> = {
    folder: config.cloudinaryProductFolder,
    timestamp
  };
  const publicId = publicIdFromFileName(input.fileName);

  if (publicId) {
    signedParams.public_id = publicId;
  }

  const form = new FormData();
  form.set("file", input.dataUri);
  form.set("api_key", config.cloudinaryApiKey as string);
  form.set("signature", signCloudinaryParams(signedParams, config.cloudinaryApiSecret as string));

  Object.entries(signedParams).forEach(([key, value]) => form.set(key, value));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    throw new AppError(502, "CLOUDINARY_UPLOAD_FAILED", "Cloudinary image upload failed");
  }

  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!payload.secure_url || !payload.public_id) {
    throw new AppError(502, "CLOUDINARY_UPLOAD_INVALID", "Cloudinary upload response is invalid");
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id
  };
};

export const uploadCategoryImageToCloudinary = async (
  input: ProductImageUploadInput,
  config: AppConfig = getConfig()
): Promise<ProductImageUploadResult> => {
  assertCloudinaryConfigured(config);

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParams: Record<string, string> = {
    folder: config.cloudinaryCategoryFolder,
    timestamp
  };
  const publicId = publicIdFromFileName(input.fileName);

  if (publicId) {
    signedParams.public_id = publicId;
  }

  const form = new FormData();
  form.set("file", input.dataUri);
  form.set("api_key", config.cloudinaryApiKey as string);
  form.set("signature", signCloudinaryParams(signedParams, config.cloudinaryApiSecret as string));

  Object.entries(signedParams).forEach(([key, value]) => form.set(key, value));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    throw new AppError(502, "CLOUDINARY_UPLOAD_FAILED", "Cloudinary image upload failed");
  }

  const payload = (await response.json()) as CloudinaryUploadResponse;

  if (!payload.secure_url || !payload.public_id) {
    throw new AppError(502, "CLOUDINARY_UPLOAD_INVALID", "Cloudinary upload response is invalid");
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id
  };
};
