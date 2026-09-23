"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/lib/api/auth";
import ContentStudio from "@/components/admin/content/ContentStudio";

export default function NewContentDocumentPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("nan_admin_token");
      if (stored) setToken(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await login(loginEmail, loginPassword);
      setToken(res.accessToken);
      sessionStorage.setItem("nan_admin_token", res.accessToken);
      window.location.reload();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoginLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ background: "var(--admin-canvas)" }}>
        <div className="w-full max-w-[340px]">
          <p className="mb-1.5 font-serif text-[18px] font-semibold" style={{ color: "var(--admin-text)" }}>Nội dung mới</p>
          <p className="mb-6 text-[12px]" style={{ color: "var(--admin-text-subtle)" }}>Vui lòng đăng nhập để tiếp tục.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="email" className="admin-input" required />
            <input type="password" placeholder="Mật khẩu" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" className="admin-input" required />
            {loginError && (
              <p className="rounded-lg px-3 py-2 text-xs" style={{ color: "var(--admin-danger)", background: "var(--admin-danger-soft)", border: "1px solid rgba(220,38,38,0.20)" }}>
                {loginError}
              </p>
            )}
            <button type="submit" disabled={loginLoading} className="admin-focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "var(--admin-primary)" }}>
              {loginLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <ContentStudio
      token={token}
      documentId={null}
      initialTitle="Nội dung mới"
      initialStatus="Draft"
      initialType="Page"
      initialProductId={null}
      initialSlug={null}
      initialEditableBlocksJson={null}
      initialPublishedBlocksJson={null}
      initialSeoTitle={null}
      initialSeoDescription={null}
      initialSeoKeywords={null}
      initialSeoImageUrl={null}
      initialCanonicalUrl={null}
    />
  );
}
