"use client";

import { useSyncExternalStore } from "react";
import { notFound } from "next/navigation";

/**
 * R1 dev-only token board -- not part of the real site, not linked from anywhere, notFound() in
 * production (same pattern as /dev/silk-fan). Every swatch and ratio is read live from the CSS
 * variables in globals.css, so this page cannot drift from the tokens it documents.
 * Decisions and the reference contrast table: docs/redesign/DECISIONS.md.
 */

type Token = { name: string; role: string; swatch: string };

const TOKENS: Token[] = [
  { name: "indigo", role: "Nền chủ đạo", swatch: "bg-indigo" },
  { name: "indigo-deep", role: "Footer, mảng tối phụ", swatch: "bg-indigo-deep" },
  { name: "indigo-raised", role: "Thẻ, panel trên nền tối", swatch: "bg-indigo-raised" },
  { name: "paper", role: "Mảng sáng (giấy ngà)", swatch: "bg-paper" },
  { name: "paper-raised", role: "Thẻ, khối nổi trên mảng ngà", swatch: "bg-paper-raised" },
  { name: "paper-deep", role: "Nền ảnh, khối lõm trên mảng ngà", swatch: "bg-paper-deep" },
  { name: "on-indigo", role: "Chữ chính trên nền tối", swatch: "bg-on-indigo" },
  { name: "on-indigo-muted", role: "Chữ phụ trên nền tối", swatch: "bg-on-indigo-muted" },
  { name: "ink", role: "Chữ chính trên mảng ngà", swatch: "bg-ink" },
  { name: "ink-muted", role: "Chữ phụ trên mảng ngà", swatch: "bg-ink-muted" },
  { name: "bamboo", role: "Nhấn trên nền tối", swatch: "bg-bamboo" },
  { name: "bamboo-deep", role: "Chữ nhãn nhỏ trên mảng ngà", swatch: "bg-bamboo-deep" },
  { name: "navy", role: "Nhấn trên mảng ngà", swatch: "bg-navy" },
  { name: "danger", role: "Báo lỗi trên nền tối", swatch: "bg-danger" },
  { name: "danger-on-paper", role: "Báo lỗi trên mảng ngà", swatch: "bg-danger-on-paper" },
  { name: "line-on-indigo", role: "Đường mảnh trên nền tối", swatch: "bg-line-on-indigo" },
  { name: "line-on-paper", role: "Đường mảnh trên mảng ngà", swatch: "bg-line-on-paper" },
];

/** [foreground, background, what the pair is for, decorative (no text threshold)] */
const PAIRS: [string, string, string, boolean?][] = [
  ["on-indigo", "indigo", "chữ chính trên nền tối"],
  ["on-indigo-muted", "indigo", "chữ phụ trên nền tối"],
  ["bamboo", "indigo", "chữ/nhấn tre trên nền tối"],
  ["on-indigo", "indigo-deep", "chữ chính ở footer"],
  ["on-indigo-muted", "indigo-deep", "chữ phụ ở footer"],
  ["bamboo", "indigo-deep", "nhấn tre ở footer"],
  ["on-indigo", "indigo-raised", "chữ chính trên thẻ tối"],
  ["on-indigo-muted", "indigo-raised", "chữ phụ trên thẻ tối"],
  ["bamboo", "indigo-raised", "nhấn tre trên thẻ tối"],
  ["ink", "paper", "chữ chính trên mảng ngà; nút chính trên nền tối"],
  ["ink-muted", "paper", "chữ phụ trên mảng ngà"],
  ["bamboo-deep", "paper", "nhãn nhỏ tre trên mảng ngà"],
  ["navy", "paper", "nhấn navy trên mảng ngà"],
  ["ink", "paper-raised", "chữ chính trên thẻ"],
  ["ink-muted", "paper-raised", "chữ phụ trên thẻ"],
  ["bamboo-deep", "paper-raised", "nhãn nhỏ tre trên thẻ"],
  ["navy", "paper-raised", "nhấn navy trên thẻ"],
  ["ink", "paper-deep", "chữ chính trên khối lõm"],
  ["ink-muted", "paper-deep", "chữ phụ trên khối lõm"],
  ["bamboo-deep", "paper-deep", "nhãn nhỏ tre trên khối lõm"],
  ["navy", "paper-deep", "nhấn navy trên khối lõm"],
  ["on-indigo", "navy", "nút chính trên mảng ngà"],
  ["danger", "indigo", "báo lỗi trên nền tối"],
  ["danger", "indigo-deep", "báo lỗi trên nền tối phụ"],
  ["danger", "indigo-raised", "báo lỗi trên thẻ tối"],
  ["danger-on-paper", "paper", "báo lỗi trên mảng ngà"],
  ["danger-on-paper", "paper-raised", "báo lỗi trên thẻ"],
  ["danger-on-paper", "paper-deep", "báo lỗi trên khối lõm"],
  ["line-on-indigo", "indigo", "đường mảnh (trang trí)", true],
  ["line-on-paper", "paper", "đường mảnh (trang trí)", true],
];

const NAMES = TOKENS.map((t) => t.name);

function readVars(): string {
  const style = getComputedStyle(document.documentElement);
  return NAMES.map((n) => style.getPropertyValue(`--color-${n}`).trim()).join("|");
}

/** Token values from the live stylesheet; empty on the server render. */
function useTokenValues(): Record<string, string> {
  const joined = useSyncExternalStore(
    () => () => {},
    readVars,
    () => "",
  );
  const values = joined ? joined.split("|") : [];
  return Object.fromEntries(NAMES.map((n, i) => [n, values[i] ?? ""]));
}

type Rgba = [number, number, number, number];

function parseColor(value: string): Rgba | null {
  const v = value.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const fn = v.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  }
  return null;
}

function blend([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrast(fg: string, bg: string): number | null {
  const f = parseColor(fg);
  const b = parseColor(bg);
  if (!f || !b) return null;
  const [l1, l2] = [luminance(blend(f, b)), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const HEADING = "Di sản trong từng nếp quạt — ỗ ữ ặ ẫ ợ";
const BODY =
  "Mỗi chiếc quạt được in theo yêu cầu: giấy dó, nan tre, lụa tơ tằm. Đội ngũ xưởng kiểm tra tệp, giữ màu và lề an toàn trước khi sản xuất — ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ ế ề ể ễ ệ ố ồ ổ ỗ ộ ớ ờ ở ỡ ợ ứ ừ ử ữ ự ỳ ỷ ỹ ỵ đ Đ.";

export default function TokensDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const values = useTokenValues();

  return (
    <main className="min-h-screen bg-indigo px-4 py-16 text-on-indigo md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-on-indigo-muted">/dev/tokens · R1</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold">Token màu và font</h1>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">Màu</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOKENS.map((t) => (
              <div key={t.name} className="overflow-hidden rounded-lg border border-line-on-indigo">
                <div className={`h-20 ${t.swatch}`} />
                <div className="p-4">
                  <p className="font-medium">{t.name}</p>
                  <p className="mt-1 text-sm text-on-indigo-muted">{t.role}</p>
                  <p className="mt-1 font-mono text-xs text-on-indigo-muted">{values[t.name] || "…"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-2xl font-semibold">Tương phản</h2>
          <p className="mt-2 text-sm text-on-indigo-muted">
            Chữ thường cần ≥ 4.5:1. Đường mảnh là trang trí, không áp ngưỡng chữ.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-on-indigo-muted">
                <tr className="border-b border-line-on-indigo">
                  <th className="py-2 pr-4 font-medium">Mẫu</th>
                  <th className="py-2 pr-4 font-medium">Chữ / nền</th>
                  <th className="py-2 pr-4 font-medium">Dùng cho</th>
                  <th className="py-2 pr-4 font-medium">Tỉ lệ</th>
                  <th className="py-2 font-medium">Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {PAIRS.map(([fg, bg, use, decorative]) => {
                  const ratio = contrast(values[fg] ?? "", values[bg] ?? "");
                  const pass = ratio !== null && ratio >= 4.5;
                  return (
                    <tr key={`${fg}-${bg}`} className="border-b border-line-on-indigo">
                      <td className="py-2 pr-4">
                        <span
                          className="inline-block rounded px-3 py-1"
                          style={{ background: values[bg], color: values[fg] }}
                        >
                          {decorative ? "────" : "Quạt Nan"}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {fg} / {bg}
                      </td>
                      <td className="py-2 pr-4 text-on-indigo-muted">{use}</td>
                      <td className="py-2 pr-4 tabular-nums">{ratio === null ? "…" : `${ratio.toFixed(2)}:1`}</td>
                      <td className="py-2">
                        {ratio === null ? "…" : decorative ? "trang trí" : pass ? "đạt" : "KHÔNG ĐẠT"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-serif text-2xl font-semibold">Chữ</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-line-on-indigo bg-indigo p-8">
              <p className="text-sm text-bamboo">Nền chàm · chữ ngà</p>
              <p className="mt-4 font-serif text-4xl font-semibold leading-tight">{HEADING}</p>
              <p className="mt-4 leading-relaxed text-on-indigo">{BODY}</p>
              <p className="mt-3 text-sm leading-relaxed text-on-indigo-muted">{BODY}</p>
              <div className="mt-6 rounded-lg bg-indigo-raised p-4">
                <p className="text-sm text-on-indigo-muted">Thẻ tối (indigo-raised)</p>
                <p className="mt-1 text-sm text-danger">Vui lòng nhập số điện thoại hợp lệ.</p>
              </div>
              <button type="button" className="mt-6 rounded-full bg-paper px-6 py-3 font-medium text-ink">
                Gửi yêu cầu báo giá
              </button>
            </div>
            <div className="rounded-lg bg-paper p-8 text-ink">
              <p className="text-sm text-bamboo-deep">Mảng giấy ngà · chữ mực</p>
              <p className="mt-4 font-serif text-4xl font-semibold leading-tight">{HEADING}</p>
              <p className="mt-4 leading-relaxed">{BODY}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{BODY}</p>
              <div className="mt-6 rounded-lg border border-line-on-paper bg-paper-raised p-4">
                <p className="text-sm text-navy">Thẻ lụa · nhấn navy</p>
                <p className="mt-1 text-sm text-danger-on-paper">Vui lòng nhập số điện thoại hợp lệ.</p>
              </div>
              <div className="mt-4 rounded-lg bg-paper-deep p-4">
                <p className="text-sm text-ink-muted">Khối lõm (paper-deep)</p>
              </div>
              <button type="button" className="mt-6 rounded-full bg-navy px-6 py-3 font-medium text-on-indigo">
                Gửi yêu cầu báo giá
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-line-on-indigo p-8">
            <p className="text-sm text-on-indigo-muted">
              Các weight của Be Vietnam Pro đã nạp
            </p>
            <div className="mt-4 space-y-2">
              <p className="font-light">300 · Quạt giấy in theo yêu cầu, ỗ ữ ặ ẫ ợ</p>
              <p className="font-normal">400 · Quạt giấy in theo yêu cầu, ỗ ữ ặ ẫ ợ</p>
              <p className="font-medium">500 · Quạt giấy in theo yêu cầu, ỗ ữ ặ ẫ ợ</p>
              <p className="font-semibold">600 · Quạt giấy in theo yêu cầu, ỗ ữ ặ ẫ ợ</p>
              <p className="font-bold">700 · Quạt giấy in theo yêu cầu, ỗ ữ ặ ẫ ợ</p>
            </div>
            <p className="mt-6 text-sm text-on-indigo-muted">
              Geist Mono (chỉ MetaStat): next/font không cho khai báo subset tiếng Việt, nhưng mặt chữ tiếng
              Việt vẫn được tải khi cần. Kiểm tra Ả, Ấ, Ố bên dưới có cùng nét với các chữ khác.
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-on-indigo-muted">
              Giá từ · SL tối thiểu · Sản xuất
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
