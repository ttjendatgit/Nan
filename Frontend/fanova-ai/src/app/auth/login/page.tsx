"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, CheckCircle, ChevronLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import NanBrandPanel from "@/components/auth/NanBrandPanel";

interface FormData {
  email: string;
  password: string;
}

// ── FloatingField ─────────────────────────────────────────────────────────────
//
// Real <label htmlFor> is the semantic label. placeholder=" " (single space)
// triggers :placeholder-shown CSS pseudo-class when the field is empty,
// allowing the label to animate between two positions via CSS peer selectors.
// This is the exact pattern from the minhxthanh/login-form 21st.dev reference.
// Taste Skill §4.6: label above input — ✓. No placeholder-as-label — ✓.

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
      {/*
        Input — bg-transparent + no border on top/sides.
        "auth-input" class activates the autofill CSS override in globals.css.
        placeholder=" " (single space) is required for :placeholder-shown to trigger
        when the field is empty. It has no visible content (aria ignored).
      */}
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

      {/*
        Floating label — AFTER input so CSS `peer` selectors work.
        Default (floated-up) state: when input has a value — label sits above.
        :placeholder-shown state: when input is empty — label sits at input baseline.
        :focus state: always floated up regardless of content.
        Accessible: htmlFor={id} links this <label> to its <input> semantically.
      */}
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none",
          "absolute left-0 top-3.5",
          "flex items-center gap-1.5",
          "text-[13.5px] tracking-wide",
          "origin-[0_50%]",
          "transition-all duration-300 ease-out",
          // Floated-up state (input has value)
          "-translate-y-[22px] scale-75",
          // Empty state: label returns to baseline
          "peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100",
          // Focus: float back up
          "peer-focus:-translate-y-[22px] peer-focus:scale-75",
          // Colors
          hasError
            ? "text-red-400/80 peer-focus:text-red-400"
            : "text-[#7A9FC0] peer-placeholder-shown:text-[#7A9FC0] peer-focus:text-[#8DCBF0]",
        )}
      >
        <span className="shrink-0 opacity-70">{icon}</span>
        {label}
      </label>

      {/* Right slot (eye toggle etc.) */}
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

/** True for Manager or Staff — case-insensitive, defensive. */
function isAdminRole(roles: string[]): boolean {
  return roles.some((r) => ["manager", "staff"].includes(r.toLowerCase()));
}

/** Write the public access token into the admin session bridge and notify the admin shell. */
function bridgeAdminToken() {
  const token = localStorage.getItem("nan_access_token");
  if (token) {
    sessionStorage.setItem("nan_admin_token", token);
    window.dispatchEvent(new Event("nan-admin-auth-change"));
  }
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const shouldReduce = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Prevents the already-authenticated useEffect from double-redirecting
  // after the form submit already issued a programmatic navigation.
  const loginCompletedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setSuccessMessage("Tạo tài khoản thành công. Vui lòng đăng nhập để tiếp tục.");
      window.history.replaceState({}, "", "/auth/login");
    }
  }, []);

  // Already-authenticated guard: redirect away from the login page.
  // All users land on "/" — Manager/Staff also get the admin token bridged
  // so the Dashboard button in the Navbar works immediately.
  // Guarded by loginCompletedRef to avoid double-navigating after form submit.
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !loginCompletedRef.current) {
      if (isAdminRole(user.roles ?? [])) {
        bridgeAdminToken();
      }
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, user, router]);

  async function onSubmit(data: FormData) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const { roles } = await login(data.email, data.password);
      loginCompletedRef.current = true; // suppress already-authenticated useEffect
      if (isAdminRole(roles)) {
        bridgeAdminToken(); // copy localStorage token → sessionStorage for admin shell
      }
      // All users — including Manager/Staff — land on the public homepage.
      // Manager/Staff reach /admin via the Dashboard button in the Navbar.
      router.push("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const { ref: emailRef,    ...emailRest    } = register("email",    { required: "Email là bắt buộc",     pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không hợp lệ" } });
  const { ref: passwordRef, ...passwordRest } = register("password", { required: "Vui lòng nhập mật khẩu" });

  return (
    /*
      data-auth="true" activates the [data-auth="true"] CSS rule in globals.css
      which sets background-color: #05091A on this element, ensuring the dark
      background covers the full page even below content on short screens.
      This is the GUARANTEED dark base — not relying on body bg.
    */
    <div
      data-auth="true"
      className="relative flex min-h-[100dvh] w-full overflow-hidden"
      style={{
        /*
          Multi-layer dark atmosphere. Order matters: first = top layer, last = base.
          Solid #05091A MUST be the final entry so it becomes background-color.
        */
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
      {/* ── "Về trang chủ" — top-left ── */}
      <Link
        href="/"
        className="group absolute left-5 top-5 z-30 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-white/35 transition-all duration-200 hover:bg-white/[0.05] hover:text-white/65 md:left-8 md:top-7"
      >
        <ChevronLeft size={12} strokeWidth={2.2} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
        Về trang chủ
      </Link>

      {/* ── Scene: fan left | card right ── */}
      <div className="relative z-10 flex w-full max-w-[980px] items-center justify-between px-6 py-20 mx-auto md:px-10 lg:px-14">

        {/* ── Left: Nan fan visual — desktop only ── */}
        <div className="hidden flex-1 items-center justify-center pr-8 md:flex">
          <NanBrandPanel />
        </div>

        {/* ── Blue radial light source behind card ──
             Sits BELOW the card (z-0) so it bleeds around the card edges
             and creates the impression of a glowing environment. -->
        */}
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

        {/* ── Right: Glass card ── */}
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

          {/*
            Glass card — dark translucent, NOT white translucent.
            background: rgba(8, 18, 42, 0.55) = dark navy at 55% opacity.
            backdrop-filter blurs the dark gradient BEHIND the card → frosted glass look.
            Inner top edge refraction: inset 0 1px 0 rgba(255,255,255,0.09).
            Taste Skill §2.B glassmorphism: backdrop-filter + 1px inner border + inner shadow.
          */}
          <div
            className="auth-glass-card w-full space-y-7 rounded-2xl p-8"
            style={{
              /*
                Glass card: dark navy base with high blur.
                backdrop-filter blurs the blue atmospheric glow behind it
                → genuine frosted glass over a glowing dark scene.
                Inner top edge highlight simulates glass surface refraction.
                Outer glow: the ambient blue behind bleeds as a soft halo.
              */
              background: "rgba(7, 15, 38, 0.60)",
              backdropFilter: "blur(28px) saturate(1.8) brightness(1.05)",
              WebkitBackdropFilter: "blur(28px) saturate(1.8) brightness(1.05)",
              border: "1px solid rgba(255,255,255,0.11)",
              boxShadow: [
                /* Top-edge refraction highlight — makes the card feel like real glass */
                "inset 0 1.5px 0 rgba(255,255,255,0.13)",
                /* Left-edge faint highlight */
                "inset 1px 0 0 rgba(255,255,255,0.04)",
                /* Inset bottom shadow — depth inside the card */
                "inset 0 -1px 0 rgba(0,0,0,0.28)",
                /* Blue ambient halo around the card */
                "0 0 60px rgba(14,52,128,0.28)",
                /* Primary drop shadow — depth */
                "0 40px 100px rgba(2, 5, 18, 0.72)",
                "0 12px 36px rgba(4, 10, 30, 0.50)",
              ].join(", "),
            }}
          >
            {/* Card header */}
            <div className="space-y-1.5">
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#F0F8FF]">
                Đăng nhập
              </h1>
              <p className="text-[12.5px] leading-[1.65] text-[#6A8FAF]">
                Tiếp tục hành trình thiết kế chiếc quạt mang dấu ấn riêng của bạn.
              </p>
            </div>

            {/* Success banner */}
            {successMessage && (
              <div
                className="flex items-start gap-2.5 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(8,51,125,0.22)",
                  border: "1px solid rgba(236,202,62,0.13)",
                  borderLeft: "2px solid rgba(236,202,62,0.55)",
                }}
              >
                <CheckCircle size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-[#ECCA3E]" />
                <p className="text-[11.5px] leading-relaxed text-[#AECDE8]">{successMessage}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-9">
              <FloatingField
                id="login-email"
                label="Email"
                icon={<Mail size={13} strokeWidth={1.5} />}
                hasError={!!errors.email}
                errorNode={<FieldError message={errors.email?.message} />}
                inputProps={{ type: "email", autoComplete: "email", ref: emailRef, ...emailRest }}
              />

              <FloatingField
                id="login-password"
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
                inputProps={{ type: showPassword ? "text" : "password", autoComplete: "current-password", ref: passwordRef, ...passwordRest }}
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

              {/*
                Submit button — dark blue gradient, premium sheen on hover.
                Arrow slides right (21st.dev reference pattern).
                active:scale-[0.98] = tactile press feedback (Taste Skill §4.5).
              */}
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
                {/* Hover sheen sweep */}
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-500 group-hover:translate-x-full"
                  aria-hidden="true"
                />
                <span className="relative z-10">
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </span>
                {!isSubmitting && (
                  <ArrowRight
                    size={15}
                    className="relative z-10 transition-transform duration-200 group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            {/* Switch to register */}
            <p className="text-center text-[11.5px] text-[#4A6A8A]">
              Chưa có tài khoản?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-[#7AB8E0] transition-colors duration-200 hover:text-[#AECDE8]"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
