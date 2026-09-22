import { CONTENT_STATUS_BADGE_CLS, contentStatusLabel } from "@/lib/contentLabels";

/** Shared by the content library list and the Content Studio header so the two surfaces never drift. */
export default function ContentStatusBadge({ status }: { status: string }) {
  const cls = CONTENT_STATUS_BADGE_CLS[status] ?? "admin-badge-inactive";
  return <span className={`admin-badge ${cls}`}>{contentStatusLabel(status)}</span>;
}
