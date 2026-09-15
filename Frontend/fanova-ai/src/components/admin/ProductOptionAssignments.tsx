"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Loader2, Search } from "lucide-react";
import { getOptionDefinitions } from "@/lib/api/optionDefinitions";
import {
  assignOptionToProduct,
  getProductOptionGroups,
  removeAssignment,
  updateAssignment,
} from "@/lib/api/productOptions";
import { formatVnd } from "@/lib/format";
import { OPTION_TYPES, optionTypeLabel } from "@/lib/optionTypes";
import type { OptionDefinition, ProductOption, ProductOptionGroup } from "@/types/catalog";

interface ProductOptionAssignmentsProps {
  productId: string;
  token: string;
}

const ICON_BTN =
  "admin-focus-ring rounded-lg p-2 transition-colors disabled:opacity-30 disabled:pointer-events-none";

function formatOptionPrice(amount: number, type: string): string {
  if (type === "None") return "Không cộng thêm";
  const suffix = type === "FixedPerOrder" ? "/đơn" : "/cái";
  return `${amount > 0 ? "+" : ""}${formatVnd(amount)}${suffix}`;
}

interface Row {
  optionDefinitionId: string;
  optionValue: string;
  priceAdjustmentType: string;
  additionalPrice: number;
  /** True if the catalog entry itself has since been deactivated (still assigned, but can no longer be newly picked elsewhere). */
  catalogInactive: boolean;
  /** The current assignment for this product, if any. */
  assignment: ProductOption | null;
}

function AssignmentsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((g) => (
        <div key={g}>
          <div className="mb-2 h-2.5 w-24 rounded admin-skeleton" />
          <div className="space-y-1.5">
            {[0, 1].map((r) => <div key={r} className="h-11 rounded-lg admin-skeleton" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductOptionAssignments({ productId, token }: ProductOptionAssignmentsProps) {
  const [catalog, setCatalog] = useState<OptionDefinition[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<ProductOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [busyDefinitionId, setBusyDefinitionId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [catalogResult, assignedResult] = await Promise.all([
        getOptionDefinitions(token, true),
        getProductOptionGroups(productId, token),
      ]);
      setCatalog(catalogResult);
      setAssignedGroups(assignedResult.groups);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Không thể tải danh mục tùy chọn.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const assignmentByDefinitionId = useMemo(() => {
    const map = new Map<string, ProductOption>();
    for (const group of assignedGroups) {
      for (const option of group.options) map.set(option.optionDefinitionId, option);
    }
    return map;
  }, [assignedGroups]);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rowsByType = new Map<string, Row[]>();

    // Active catalog entries: what CAN be newly assigned.
    for (const d of catalog) {
      if (term && !d.optionName.toLowerCase().includes(term) && !d.optionValue.toLowerCase().includes(term)) continue;
      const list = rowsByType.get(d.optionType) ?? [];
      list.push({
        optionDefinitionId: d.id,
        optionValue: d.optionValue,
        priceAdjustmentType: d.priceAdjustmentType,
        additionalPrice: d.additionalPrice,
        catalogInactive: false,
        assignment: assignmentByDefinitionId.get(d.id) ?? null,
      });
      rowsByType.set(d.optionType, list);
    }

    // Assignments whose catalog entry is no longer active: still shown (checked, grayed),
    // just not addable elsewhere since they're absent from the active catalog fetch above.
    for (const group of assignedGroups) {
      for (const option of group.options) {
        if (catalog.some((d) => d.id === option.optionDefinitionId)) continue;
        const list = rowsByType.get(option.optionType) ?? [];
        list.push({
          optionDefinitionId: option.optionDefinitionId,
          optionValue: option.optionValue,
          priceAdjustmentType: option.priceAdjustmentType,
          additionalPrice: option.additionalPrice,
          catalogInactive: true,
          assignment: option,
        });
        rowsByType.set(option.optionType, list);
      }
    }

    return Array.from(rowsByType.entries())
      .sort(([a], [b]) => OPTION_TYPES.indexOf(a as (typeof OPTION_TYPES)[number]) - OPTION_TYPES.indexOf(b as (typeof OPTION_TYPES)[number]))
      .map(([optionType, rows]) => ({
        optionType,
        rows: rows.sort((a, b) => (a.assignment?.sortOrder ?? 999) - (b.assignment?.sortOrder ?? 999) || a.optionValue.localeCompare(b.optionValue)),
      }))
      .filter((g) => g.rows.length > 0);
  }, [catalog, assignedGroups, assignmentByDefinitionId, search]);

  async function handleToggle(row: Row) {
    setBusyDefinitionId(row.optionDefinitionId);
    setNotice(null);
    try {
      if (row.assignment) {
        await removeAssignment(row.assignment.id, token);
        setNotice({ type: "success", text: `Đã bỏ "${row.optionValue}" khỏi sản phẩm.` });
      } else {
        await assignOptionToProduct(productId, { optionDefinitionId: row.optionDefinitionId }, token);
        setNotice({ type: "success", text: `Đã gắn "${row.optionValue}" vào sản phẩm.` });
      }
      await load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Thao tác thất bại. Vui lòng thử lại." });
    } finally {
      setBusyDefinitionId(null);
    }
  }

  async function handleMove(rows: Row[], index: number, direction: -1 | 1) {
    const current = rows[index]?.assignment;
    const target = rows[index + direction]?.assignment;
    if (!current || !target) return;

    setReorderingId(current.id);
    setNotice(null);
    try {
      await Promise.all([
        updateAssignment(current.id, { sortOrder: target.sortOrder, isActive: true }, token),
        updateAssignment(target.id, { sortOrder: current.sortOrder, isActive: true }, token),
      ]);
      await load();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Không thể thay đổi thứ tự. Vui lòng thử lại." });
    } finally {
      setReorderingId(null);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text)" }}>Tùy chọn áp dụng</h3>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--admin-text-subtle)" }}>
        Chọn tùy chọn có sẵn trong danh mục để gắn vào sản phẩm này. Tạo tùy chọn mới hoặc chỉnh giá tại{" "}
        <span style={{ color: "var(--admin-text-muted)" }}>Tùy chọn sản phẩm</span> trong menu quản trị.
      </p>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--admin-text-subtle)" }} />
        <input
          type="text"
          placeholder="Tìm tùy chọn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-focus-ring h-9 w-full rounded-lg pl-8 pr-3 text-sm outline-none transition"
          style={{
            background: "var(--admin-surface-muted)",
            border: "1px solid var(--admin-border-strong)",
            color: "var(--admin-text)",
          }}
        />
      </div>

      {loading && <AssignmentsSkeleton />}

      {!loading && loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-lg px-3.5 py-3" style={{ border: "1px solid rgba(220,38,38,0.25)", background: "var(--admin-danger-soft)" }}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--admin-danger)" }} />
          <div className="flex-1">
            <p className="text-sm" style={{ color: "var(--admin-danger)" }}>{loadError}</p>
            <button onClick={load} className="admin-focus-ring mt-1.5 rounded text-xs font-medium underline underline-offset-2" style={{ color: "var(--admin-danger)" }}>Thử lại</button>
          </div>
        </div>
      )}

      {!loading && !loadError && catalog.length === 0 && assignedGroups.length === 0 && (
        <p className="rounded-lg px-3 py-6 text-center text-xs" style={{ border: "1px dashed var(--admin-border-strong)", color: "var(--admin-text-subtle)" }}>
          Danh mục tùy chọn đang trống. Hãy tạo tùy chọn trong &ldquo;Tùy chọn sản phẩm&rdquo; trước.
        </p>
      )}

      {!loading && !loadError && groups.length === 0 && (catalog.length > 0 || assignedGroups.length > 0) && (
        <p className="py-4 text-center text-xs" style={{ color: "var(--admin-text-subtle)" }}>Không tìm thấy tùy chọn phù hợp.</p>
      )}

      {!loading && !loadError && groups.length > 0 && (
        <div className="space-y-4">
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2.5 rounded-lg px-3 py-2 text-xs"
              style={{
                border: notice.type === "success" ? "1px solid rgba(21,128,61,0.25)" : "1px solid rgba(220,38,38,0.25)",
                background: notice.type === "success" ? "var(--admin-success-soft)" : "var(--admin-danger-soft)",
                color: notice.type === "success" ? "var(--admin-success)" : "var(--admin-danger)",
              }}
            >
              {notice.type === "success" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              <p>{notice.text}</p>
            </div>
          )}

          {groups.map((group) => (
            <div key={group.optionType}>
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] mb-2" style={{ color: "var(--admin-text-subtle)" }}>
                {optionTypeLabel(group.optionType)}
              </p>
              <div className="space-y-1">
                {group.rows.map((row, index) => {
                  const checked = row.assignment !== null;
                  const busy = busyDefinitionId === row.optionDefinitionId;
                  return (
                    <div key={row.optionDefinitionId} className="flex items-center gap-2 rounded-lg px-1 py-1">
                      {checked && (
                        <div className="flex shrink-0 flex-col">
                          <button
                            type="button"
                            onClick={() => handleMove(group.rows, index, -1)}
                            disabled={index === 0 || !group.rows[index - 1]?.assignment || reorderingId !== null}
                            aria-label={`Di chuyển "${row.optionValue}" lên trên`}
                            className={ICON_BTN}
                            style={{ color: "var(--admin-text-subtle)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-primary)"; (e.currentTarget as HTMLElement).style.background = "var(--admin-primary-soft)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-text-subtle)"; (e.currentTarget as HTMLElement).style.background = ""; }}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(group.rows, index, 1)}
                            disabled={index === group.rows.length - 1 || !group.rows[index + 1]?.assignment || reorderingId !== null}
                            aria-label={`Di chuyển "${row.optionValue}" xuống dưới`}
                            className={ICON_BTN}
                            style={{ color: "var(--admin-text-subtle)" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-primary)"; (e.currentTarget as HTMLElement).style.background = "var(--admin-primary-soft)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--admin-text-subtle)"; (e.currentTarget as HTMLElement).style.background = ""; }}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <label
                        className={`flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${row.catalogInactive ? "opacity-60" : ""}`}
                        style={
                          checked
                            ? { borderColor: "rgba(8,51,125,0.35)", background: "var(--admin-primary-soft)" }
                            : { borderColor: "var(--admin-border)", background: "var(--admin-surface)" }
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={busy}
                          onChange={() => handleToggle(row)}
                          className="h-3.5 w-3.5 rounded"
                          style={{ accentColor: "var(--admin-primary)" }}
                        />
                        <span className="flex-1" style={{ color: "var(--admin-text)" }}>
                          {row.optionValue}
                          {row.catalogInactive && (
                            <span className="ml-2 admin-badge admin-badge-hidden">Danh mục đã ẩn</span>
                          )}
                        </span>
                        <span className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>
                          {formatOptionPrice(row.additionalPrice, row.priceAdjustmentType)}
                        </span>
                        {busy && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "var(--admin-text-subtle)" }} />}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
