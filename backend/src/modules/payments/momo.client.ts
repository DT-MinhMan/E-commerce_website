import crypto from "crypto";
import { AppError } from "../../common/errors/AppError.js";
import type { AppConfig } from "../../config/env.js";

export interface MomoPaymentRequestParams {
  amount: number;
  orderId: string;
  orderInfo: string;
  extraData?: string;
}

export interface MomoPaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export const createMomoPaymentRequest = async (
  params: MomoPaymentRequestParams,
  config: AppConfig
): Promise<MomoPaymentResponse> => {
  const {
    momoPartnerCode,
    momoAccessKey,
    momoSecretKey,
    momoApiUrl,
    momoRedirectUrl,
    momoIpnUrl
  } = config;

  if (
    !momoPartnerCode ||
    !momoAccessKey ||
    !momoSecretKey ||
    !momoApiUrl ||
    !momoRedirectUrl ||
    !momoIpnUrl
  ) {
    throw new AppError(500, "MOMO_CONFIG_MISSING", "MoMo configuration is incomplete");
  }

  const { amount, orderId, orderInfo, extraData = "" } = params;
  const requestId = crypto.randomUUID();
  const requestType = "captureWallet";
  const redirectUrl = momoRedirectUrl.replace("{ORDER_ID}", encodeURIComponent(orderId));

  const rawSignature = `accessKey=${momoAccessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoIpnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoPartnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  const signature = crypto
    .createHmac("sha256", momoSecretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode: momoPartnerCode,
    partnerName: "E-Commerce Store",
    storeId: momoPartnerCode,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl: momoIpnUrl,
    lang: "vi",
    extraData,
    requestType,
    signature
  };

  try {
    const response = await fetch(momoApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as MomoPaymentResponse;

    if (data.resultCode !== 0) {
      throw new AppError(
        502,
        "MOMO_PAYMENT_CREATION_FAILED",
        `MoMo error: ${data.message} (code: ${data.resultCode})`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      502,
      "MOMO_GATEWAY_ERROR",
      error instanceof Error ? error.message : "Failed to connect to MoMo gateway"
    );
  }
};
