import nodemailer from "nodemailer";
import { getConfig } from "../../config/env.js";
import { logger } from "../logger.js";

let cachedTransporter: nodemailer.Transporter | null | false = null;

const getTransporter = (): nodemailer.Transporter | null => {
  if (cachedTransporter !== null) {
    return cachedTransporter === false ? null : cachedTransporter;
  }

  const config = getConfig();

  if (config.smtpHost && config.smtpUser && config.smtpPass) {
    cachedTransporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort ?? 587,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
    return cachedTransporter;
  }

  cachedTransporter = false;
  return null;
};

export const sendOtpEmail = async (toEmail: string, otpCode: string): Promise<void> => {
  const config = getConfig();

  if (config.nodeEnv === "test") {
    logger.info(config, `[TEST EMAIL FALLBACK] Verification OTP for ${toEmail}: ${otpCode}`);
    return;
  }

  const transporter = getTransporter();

  if (!transporter) {
    logger.info(config, `[DEV EMAIL FALLBACK] Verification OTP for ${toEmail}: ${otpCode}`);
    return;
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: config.smtpFrom ?? config.smtpUser,
    to: toEmail,
    subject: `Mã xác thực tài khoản - ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-bottom: 16px;">Xác nhận địa chỉ Email</h2>
        <p style="color: #4b5563; line-height: 1.5;">Cảm ơn bạn đã đăng ký tài khoản tại cửa hàng trực tuyến. Vui lòng sử dụng mã xác thực bên dưới để hoàn tất đăng ký:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d97706;">${otpCode}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Mã này có hiệu lực trong <strong>10 phút</strong>. Vì lý do bảo mật, tuyệt đối không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Đây là email tự động, vui lòng không phản hồi email này.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};
