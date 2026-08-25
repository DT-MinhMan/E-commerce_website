import { type FormEvent, useEffect, useRef, useState } from "react";
import { useResendOtp, useVerifyEmail } from "../hooks/useAuthQueries.js";

interface OtpVerificationModalProps {
  email: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const OtpVerificationModal = ({ email, onSuccess, onClose }: OtpVerificationModalProps) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const verifyEmailMutation = useVerifyEmail();
  const resendOtpMutation = useResendOtp();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const maskEmail = (str: string): string => {
    const [name, domain] = str.split("@");
    if (!name || !domain) return str;
    const maskedName = name.length <= 2 ? `${name[0]}*` : `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
    return `${maskedName}@${domain}`;
  };

  const submitCode = (otpCode: string) => {
    if (otpCode.length !== 6 || verifyEmailMutation.isPending) return;
    verifyEmailMutation.mutate(
      { email, code: otpCode },
      {
        onSuccess: () => {
          onSuccess();
        },
        onError: (err) => {
          setErrorMsg(err.message ?? "Mã xác thực không chính xác");
        }
      }
    );
  };

  const handleCodeChange = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    setCode(clean);
    setErrorMsg(null);

    if (clean.length === 6) {
      submitCode(clean);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitCode(code);
  };

  const handleResend = () => {
    if (countdown > 0 || resendOtpMutation.isPending) return;
    setErrorMsg(null);
    setInfoMsg(null);

    resendOtpMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setInfoMsg("Mã xác thực mới đã được gửi đến email của bạn.");
          setCountdown(60);
          setCode("");
          inputRef.current?.focus();
        },
        onError: (err) => {
          setErrorMsg(err.message ?? "Không thể gửi lại mã");
        }
      }
    );
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px"
      }}
    >
      <div
        className="panel"
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "28px",
          borderRadius: "12px",
          background: "var(--color-surface, #fff)",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "20px" }}>Xác thực Email</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--color-text-muted)" }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", margin: "0 0 24px", lineHeight: "1.5" }}>
          Chúng tôi đã gửi mã xác nhận 6 số đến địa chỉ <strong>{maskEmail(email)}</strong>. Vui lòng nhập mã bên dưới:
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
              Mã xác thực (6 chữ số)
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="123456"
              style={{
                width: "100%",
                height: "54px",
                fontSize: "24px",
                fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
                fontWeight: "bold",
                letterSpacing: "0.35em",
                textAlign: "center",
                borderRadius: "8px",
                border: code ? "2px solid var(--color-primary, #d97706)" : "1px solid #d1d5db",
                outline: "none",
                transition: "all 0.15s ease",
                boxSizing: "border-box"
              }}
            />
          </div>

          {errorMsg && <p className="status-error" style={{ marginBottom: "16px", textAlign: "center" }}>{errorMsg}</p>}
          {infoMsg && <p className="status-success" style={{ marginBottom: "16px", textAlign: "center" }}>{infoMsg}</p>}

          <button
            type="submit"
            disabled={code.length !== 6 || verifyEmailMutation.isPending}
            style={{ width: "100%", padding: "12px", fontWeight: 600, fontSize: "15px", marginBottom: "16px" }}
          >
            {verifyEmailMutation.isPending ? "Đang xác thực..." : "Xác nhận OTP"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "14px", color: "var(--color-text-muted)" }}>
          Chưa nhận được mã?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resendOtpMutation.isPending}
            style={{
              background: "none",
              border: "none",
              color: countdown > 0 ? "#9ca3af" : "var(--color-primary, #d97706)",
              fontWeight: 600,
              cursor: countdown > 0 ? "default" : "pointer",
              padding: 0
            }}
          >
            {resendOtpMutation.isPending ? "Đang gửi..." : countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi lại mã OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};
