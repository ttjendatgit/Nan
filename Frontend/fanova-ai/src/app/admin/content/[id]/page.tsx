"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { login } from "@/lib/api/auth";
import { getContentDocument } from "@/lib/api/contentDocuments";
import ContentStudio from "@/components/admin/content/ContentStudio";
import type { ContentDocument } from "@/types/content";

/** Draft-preferred: an unpublished edit in progress always wins over the last published version. */
function resolveEditableBlocksJson(doc: ContentDocument): string | null {
  if (doc.draftBlocksJson && doc.draftBlocksJson.trim()) return doc.draftBlocksJson;
  if (doc.blocksJson && doc.blocksJson.trim()) return doc.blocksJson;
  return null;
}

export default function EditContentDocumentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [document, setDocument] = useState<ContentDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = sessionStorage.getItem("nan_admin_token");
      if (stored) setToken(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadDocument(tk: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getContentDocument(id, tk);
      setDocument(result);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không thể tải nội dung này.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token || !id) return;
    const timer = window.setTimeout(() => { loadDocument(token); }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

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
          <p className="mb-1.5 font-serif text-[18px] font-semibold" style={{ color: "var(--admin-text)" }}>Nội dung</p>
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

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-live="polite">
        <div className="mb-6 space-y-3">
          <div className="h-3 w-32 rounded admin-skeleton" />
          <div className="h-7 w-64 rounded admin-skeleton" />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-[360px] rounded-xl admin-skeleton" />
          <div className="h-[360px] rounded-xl admin-skeleton" />
        </div>
      </div>
    );
  }

  if (loadError || !document) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" style={{ color: "var(--admin-text)" }}>
        <Link
          href="/admin/content"
          className="admin-focus-ring inline-flex items-center gap-1.5 rounded text-xs transition-colors"
          style={{ color: "var(--admin-text-subtle)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Quay lại nội dung
        </Link>
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl p-4" style={{ border: "1px solid rgba(220,38,38,0.22)", background: "var(--admin-danger-soft)" }}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--admin-danger)" }} />
          <div className="flex-1">
            <p className="text-sm" style={{ color: "var(--admin-danger)" }}>{loadError ?? "Không tìm thấy nội dung này."}</p>
            <button onClick={() => loadDocument(token)} className="admin-focus-ring mt-1.5 rounded text-xs font-medium underline underline-offset-2" style={{ color: "var(--admin-danger)" }}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ContentStudio
      token={token}
      documentId={document.id}
      initialTitle={document.title}
      initialStatus={document.status}
      initialType={document.type}
      initialProductId={document.productId ?? null}
      initialSlug={document.slug}
      initialEditableBlocksJson={resolveEditableBlocksJson(document)}
      initialPublishedBlocksJson={document.blocksJson ?? null}
      initialSeoTitle={document.seoTitle ?? null}
      initialSeoDescription={document.seoDescription ?? null}
      initialSeoKeywords={document.seoKeywords ?? null}
      initialSeoImageUrl={document.seoImageUrl ?? null}
      initialCanonicalUrl={document.canonicalUrl ?? null}
    />
  );
}
