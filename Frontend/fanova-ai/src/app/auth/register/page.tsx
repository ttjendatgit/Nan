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

// ── Floating-label underline input ───────────────────────────────────────────

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

function FloatingField({
  id,
  label,
  icon,
  hasError,
  rightSlot,
  errorNode,
  inputProps,
}: FloatingFieldProps) {
  return (
    <div className="relative pb-1">
      <input
        id={id}
        placeholder=" "
        {...inputProps}
        className={cn(
          "peer block w-full bg-transparent",
          "border-0 border-b-2",
          "py-3 px-0",
          rightSlot ? "pr-8" : "",
          "text-sm text-white",
          "appearance-none outline-none ring-0 focus:ring-0",
          "transition-colors duration-300",
          hasError
            ? "border-red-500/50"
            : "border-white/20 focus:border-[#3B82F6]",
          inputProps.className,
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none -z-10",
          "absolute left-0 top-3",
          "flex items-center gap-1.5",
          "text-sm origin-[0_50%]",
          "duration-300 ease-in-out transform",
          "-translate-y-6 scale-75",
          "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
          "peer-focus:-translate-y-6 peer-focus:scale-75",
          hasError
            ? "text-red-400/80"
            : "text-white/50 peer-focus:text-blue-400",
        )}
      >
        {icon}
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
    <p role="alert" className="mt-1 text-[11px] leading-snug text-red-400">
      {message}
    </p>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register: authRegister, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      await authRegister(data.email, data.password, data.fullName || undefined);
      router.push("/auth/login?registered=true");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.",
      );
    }
  }

  const { ref: nameRef,     ...nameRest     } = register("fullName");
  const { ref: emailRef,    ...emailRest    } = register("email", { required: "Email là bắt buộc", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không hợp lệ" } });
  const { ref: passwordRef, ...passwordRest } = register("password", { required: "Mật khẩu là bắt buộc", minLength: { value: 8, message: "Mật khẩu tối thiểu 8 ký tự" } });

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-[45fr_55fr]">
      {/* ── Left: brand panel ─────────────────────────────────────────────── */}
      <NanBrandPanel />

      {/* ── Right: smoky atmospheric background ───────────────────────────── */}
      <div
        className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-12 md:min-h-0"
        style={{
          background: [
            "radial-gradient(ellipse 55% 65% at 78% 40%, rgba(10,50,120,0.35) 0%, transparent 70%)",
            "radial-gradient(ellipse 45% 55% at 22% 28%, rgba(6,25,70,0.30) 0%, transparent 65%)",
            "radial-gradient(ellipse 65% 45% at 50% 85%, rgba(14,50,130,0.22) 0%, transparent 60%)",
            "radial-gradient(ellipse 38% 42% at 35% 58%, rgba(8,35,90,0.16) 0%, transparent 55%)",
            "#05091A",
          ].join(", "),
        }}
      >
        <motion.div
          initial={shouldReduce ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex w-full max-w-sm flex-col"
        >
          {/* ── "Về trang chủ" ── */}
          <Link
            href="/"
            className="group mb-8 -ml-1 flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] text-white/40 transition-all duration-200 hover:bg-white/[0.06] hover:text-white/75"
          >
            <ChevronLeft
              size={12}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            Về trang chủ
          </Link>

          {/* ── Glass card ── */}
          <div
            className="auth-glass-card w-full space-y-6 rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg"
          >
            {/* Card header */}
            <div className="text-center">
              {/* Mobile brand mark */}
              <div className="mb-5 flex flex-col items-center md:hidden">
                <span
                  className="font-serif text-[20px] font-semibold text-white"
                  style={{ fontFamily: "var(--font-eb-garamond)" }}
                >
                  Nan
                </span>
                <span className="font-mono text-[7px] uppercase tracking-[0.30em] text-[#4A74A7]">
                  Custom Fan Design
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white">Tạo tài khoản</h2>
              <p className="mt-2 text-sm text-gray-300">
                Lưu thiết kế, xem mockup và đặt hàng dễ dàng hơn
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
              {/* Full name — optional, no error */}
              <FloatingField
                id="fullName"
                label="Họ tên (không bắt buộc)"
                icon={<User size={14} strokeWidth={1.5} />}
                inputProps={{
                  type: "text",
                  autoComplete: "name",
                  ref: nameRef,
                  ...nameRest,
                }}
              />

              {/* Email */}
              <FloatingField
                id="email"
                label="Email"
                icon={<Mail size={14} strokeWidth={1.5} />}
                hasError={!!errors.email}
                errorNode={<FieldError message={errors.email?.message} />}
                inputProps={{
                  type: "email",
                  autoComplete: "email",
                  ref: emailRef,
                  ...emailRest,
                }}
              />

              {/* Password */}
              <FloatingField
                id="password"
                label="Mật khẩu"
                icon={<Lock size={14} strokeWidth={1.5} />}
                hasError={!!errors.password}
                errorNode={<FieldError message={errors.password?.message} />}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="text-white/35 transition-colors hover:text-white/75"
                  >
                    {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                  </button>
                }
                inputProps={{
                  type: showPassword ? "text" : "password",
                  autoComplete: "new-password",
                  ref: passwordRef,
                  ...passwordRest,
                }}
              />

              {/* Server error */}
              {serverError && (
                <div
                  className="rounded-lg border border-red-500/20 px-4 py-2.5 text-[11.5px] leading-relaxed text-red-400"
                  style={{
                    background: "rgba(239,68,68,0.10)",
                    borderLeft: "3px solid rgba(248,113,113,0.60)",
                  }}
                >
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "group w-full flex items-center justify-center gap-2",
                  "py-3 px-4 rounded-lg",
                  "text-white font-semibold text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent",
                  "transition-all duration-300",
                  "disabled:cursor-not-allowed disabled:opacity-55",
                  isSubmitting
                    ? "bg-blue-700/70"
                    : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/30",
                )}
              >
                {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                {!isSubmitting && (
                  <ArrowRight
                    size={16}
                    className="transform transition-transform duration-200 group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-400/20" />
              <span className="mx-4 flex-shrink font-mono text-[9px] uppercase tracking-[0.16em] text-gray-500">
                hoặc
              </span>
              <div className="flex-grow border-t border-gray-400/20" />
            </div>

            {/* Switch to login */}
            <p className="text-center text-xs text-gray-400">
              Đã có tài khoản?{" "}
              <Link
                href="/auth/login"
                className="font-semibold text-blue-400 transition hover:text-blue-300"
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
