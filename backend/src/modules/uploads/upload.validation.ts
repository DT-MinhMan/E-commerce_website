import { AppError } from "../../common/errors/AppError.js";

export interface ProductImageUploadInput {
  dataUri: string;
  fileName?: string;
}

const MAX_DATA_URI_LENGTH = 7_000_000;
const DATA_URI_PATTERN = /^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseProductImageUploadInput = (body: unknown): ProductImageUploadInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const dataUri = body.dataUri;
  const fileName = body.fileName;

  if (typeof dataUri !== "string" || !DATA_URI_PATTERN.test(dataUri) || dataUri.length > MAX_DATA_URI_LENGTH) {
    throw new AppError(400, "VALIDATION_ERROR", "dataUri must be a valid image data URI up to 5MB");
  }

  if (fileName !== undefined && (typeof fileName !== "string" || fileName.length > 180)) {
    throw new AppError(400, "VALIDATION_ERROR", "fileName must be a string up to 180 characters");
  }

  return {
    dataUri,
    ...(typeof fileName === "string" && fileName.trim() ? { fileName: fileName.trim() } : {})
  };
};
