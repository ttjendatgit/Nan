"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, ChevronLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import NanBrandPanel from "@/components/auth/NanBrandPanel";

interface FormData {
  fullName: string;
  email: string;
  password: string;
}

// ── FloatingField (same pattern as login page) ────────────────────────────────

interface FloatingFieldProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  hasError?: boolean;
  rightSlot?: React.ReactNode;
  errorNode?: React.ReactNode;
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    ref?: React.Ref<HTMLInputElement>;
  };
}

function FloatingField({ id, label, icon, hasError, rightSlot, errorNode, inputProps }: FloatingFieldProps) {
  return (
    <div className="relative pb-1">
      <input
        id={id}
        placeholder=" "
        {...inputProps}
        className={cn(
          "auth-input peer block w-full",
          "bg-transparent",
          "border-0 border-b",
          "py-3.5 px-0",
          rightSlot ? "pr-9" : "",
          "text-[13.5px] font-light text-[#E8F2FC] tracking-wide",
          "appearance-none outline-none ring-0 focus:ring-0",
          "transition-colors duration-300",
          hasError
            ? "border-red-400/40"
            : "border-white/20 focus:border-[#5B9BD5]",
          inputProps.className,
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none",
          "absolute left-0 top-3.5",
          "flex items-center gap-1.5",
          "text-[13.5px] tracking-wide",
          "origin-[0_50%]",
          "transition-all duration-300 ease-out",
          "-translate-y-[22px] scale-75",
          "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
          "peer-focus:-translate-y-[22px] peer-focus:scale-75",
          hasError
            ? "text-red-400/80 peer-focus:text-red-400"
            : "text-[#7A9FC0] peer-placeholder-shown:text-[#7A9FC0] peer-focus:text-[#8DCBF0]",
        )}
      >
        <span className="shrink-0 opacity-70">{icon}</span>
        {label}
      </label>

      {rightSlot && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
      {errorNode}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-[11px] leading-snug text-red-400/90">
      {message}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register: authRegister, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  // Does NOT auto-login. Redirects to /auth/login?registered=true (unchanged).
  async function onSubmit(data: FormData) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await authRegister(data.email, data.password, data.fullName || undefined);
      router.push("/auth/login?registered=true");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const { ref: nameRef,     ...nameRest     } = register("fullName");
  const { ref: emailRef,    ...emailRest    } = register("email",    { required: "Email là bắt buộc",      pattern:  { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không hợp lệ" } });
  const { ref: passwordRef, ...passwordRest } = register("password", { required: "Mật khẩu là bắt buộc",   minLength: { value: 8, message: "Mật khẩu tối thiểu 8 ký tự" } });

  return (
    <div
      data-auth="true"
      className="relative flex min-h-[100dvh] w-full overflow-hidden"
      style={{
        background: [
          /* Primary blue haze — fan/left side */
          "radial-gradient(ellipse 75% 80% at 22% 55%, rgba(14,58,145,0.62) 0%, transparent 60%)",
          /* Secondary cool drift — top right */
          "radial-gradient(ellipse 55% 55% at 82% 18%, rgba(6,18,60,0.48) 0%, transparent 58%)",
          /* Deep floor glow — bottom centre */
          "radial-gradient(ellipse 80% 45% at 50% 105%, rgba(10,42,110,0.45) 0%, transparent 62%)",
          /* Faint gold warmth at lower-left */
          "radial-gradient(ellipse 38% 22% at 18% 100%, rgba(236,202,62,0.07) 0%, transparent 100%)",
          /* Solid base */
          "#05091A",
        ].join(", "),
      }}
    >
      {/* ── "Về trang chủ" ── */}
      <Link
        href="/"
        className="group absolute left-5 top-5 z-30 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-white/35 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/65 md:left-8 md:top-7"
      >
        <ChevronLeft size={12} strokeWidth={2.2} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
        Về trang chủ
      </Link>

      {/* ── Scene: fan left | card right ── */}
      <div className="relative z-10 flex w-full max-w-[980px] items-center justify-between px-6 py-20 mx-auto md:px-10 lg:px-14">

        {/* Left: Nan fan — desktop only */}
        <div className="hidden flex-1 items-center justify-center pr-8 md:flex">
          <NanBrandPanel />
        </div>

        {/* Blue radial light source behind card */}
        <div
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 hidden md:block"
          style={{
            width: "520px",
            height: "520px",
            background: [
              "radial-gradient(ellipse 70% 55% at 55% 48%, rgba(18,68,172,0.38) 0%, transparent 70%)",
              "radial-gradient(ellipse 45% 40% at 55% 68%, rgba(8,42,110,0.28) 0%, transparent 100%)",
            ].join(", "),
            filter: "blur(2px)",
          }}
          aria-hidden="true"
        />

        {/* Right: Glass card */}
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:max-w-[370px] shrink-0"
        >
          {/* Mobile brand mark */}
          <div className="mb-8 flex flex-col items-center md:hidden">
            <span
              className="text-[36px] font-semibold leading-none tracking-wide text-[#E8F2FC]"
              style={{ fontFamily: "var(--font-eb-garamond), Georgia, serif" }}
            >
              Nan
            </span>
            <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.40em] text-[#4A74A7]">
              Custom Fan Design
            </span>
          </div>

          <div
            className="auth-glass-card w-full space-y-7 rounded-2xl p-8"
            style={{
              background: "rgba(7, 15, 38, 0.60)",
              backdropFilter: "blur(28px) saturate(1.8) brightness(1.05)",
              WebkitBackdropFilter: "blur(28px) saturate(1.8) brightness(1.05)",
              border: "1px solid rgba(255,255,255,0.11)",
              boxShadow: [
                "inset 0 1.5px 0 rgba(255,255,255,0.13)",
                "inset 1px 0 0 rgba(255,255,255,0.04)",
                "inset 0 -1px 0 rgba(0,0,0,0.28)",
                "0 0 60px rgba(14,52,128,0.28)",
                "0 40px 100px rgba(2, 5, 18, 0.72)",
                "0 12px 36px rgba(4, 10, 30, 0.50)",
              ].join(", "),
            }}
          >
            {/* Card header */}
            <div className="space-y-1.5">
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#F0F8FF]">
                Tạo tài khoản
              </h1>
              <p className="text-[12.5px] leading-[1.65] text-[#6A8FAF]">
                Lưu thiết kế, xem mockup và gửi yêu cầu báo giá nhanh hơn.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-9">
              {/* Họ tên — optional */}
              <FloatingField
                id="reg-fullName"
                label="Họ tên"
                icon={<User size={13} strokeWidth={1.5} />}
                inputProps={{ type: "text", autoComplete: "name", ref: nameRef, ...nameRest }}
              />

              <FloatingField
                id="reg-email"
                label="Email"
                icon={<Mail size={13} strokeWidth={1.5} />}
                hasError={!!errors.email}
                errorNode={<FieldError message={errors.email?.message} />}
                inputProps={{ type: "email", autoComplete: "email", ref: emailRef, ...emailRest }}
              />

              <FloatingField
                id="reg-password"
                label="Mật khẩu"
                icon={<Lock size={13} strokeWidth={1.5} />}
                hasError={!!errors.password}
                errorNode={<FieldError message={errors.password?.message} />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="text-white/30 transition-colors duration-200 hover:text-white/65"
                  >
                    {showPassword ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                  </button>
                }
                inputProps={{ type: showPassword ? "text" : "password", autoComplete: "new-password", ref: passwordRef, ...passwordRest }}
              />

              {/* Server error */}
              {serverError && (
                <div
                  className="rounded-xl px-4 py-2.5 text-[11.5px] leading-relaxed text-red-400/90"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.14)",
                    borderLeft: "2px solid rgba(248,113,113,0.52)",
                  }}
                >
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "group relative w-full overflow-hidden",
                  "flex items-center justify-center gap-2",
                  "py-[11px] px-5 rounded-xl",
                  "text-[13px] font-semibold tracking-wide text-white",
                  "transition-all duration-300",
                  "active:scale-[0.98] active:-translate-y-[1px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9BD5]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                style={{
                  background: isSubmitting
                    ? "rgba(28,55,115,0.70)"
                    : "linear-gradient(135deg, rgba(24,72,165,0.88) 0%, rgba(12,44,110,0.92) 100%)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: isSubmitting ? "none" : [
                    "inset 0 1px 0 rgba(255,255,255,0.10)",
                    "inset 0 -1px 0 rgba(0,0,0,0.22)",
                    "0 8px 28px rgba(14,52,128,0.50)",
                    "0 2px 8px rgba(14,52,128,0.28)",
                  ].join(", "),
                }}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-500 group-hover:translate-x-full" aria-hidden="true" />
                <span className="relative z-10">
                  {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </span>
                {!isSubmitting && (
                  <ArrowRight size={15} className="relative z-10 transition-transform duration-200 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            {/* Switch to login */}
            <p className="text-center text-[11.5px] text-[#4A6A8A]">
              Đã có tài khoản?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-[#7AB8E0] transition-colors duration-200 hover:text-[#AECDE8]"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
