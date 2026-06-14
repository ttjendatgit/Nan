"use client";

import { useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadMultipleMedia } from "@/lib/api/media";
import type { MediaFolder, MediaUploadResult } from "@/types/media";

interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  result?: MediaUploadResult;
  error?: string;
}

interface MediaUploadProps {
  folder?: MediaFolder;
  maxFiles?: number;
  /** Called when all selected files finish uploading successfully. */
  onUploaded?: (results: MediaUploadResult[]) => void;
  /** Auth token — required for authenticated endpoints. */
  token?: string;
  className?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function MediaUpload({
  folder,
  maxFiles = 10,
  onUploaded,
  token,
  className,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const next: SelectedFile[] = [];

    for (const file of Array.from(incoming)) {
      if (files.length + next.length >= maxFiles) break;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        continue; // silently skip unsupported types
      }
      if (file.size > MAX_SIZE_BYTES) {
        continue; // silently skip oversized files
      }

      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
      });
    }

    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  async function handleUpload() {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0 || uploading) return;

    setUploading(true);
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading" } : f,
      ),
    );

    try {
      const results = await uploadMultipleMedia(
        pending.map((f) => f.file),
        folder,
        token,
      );

      setFiles((prev) =>
        prev.map((f, _i) => {
          const match = results.find(
            (r) => r.originalFilename === f.file.name || f.status === "uploading",
          );
          if (f.status === "uploading") {
            const result = results[pending.findIndex((p) => p.id === f.id)];
            return result
              ? { ...f, status: "done", result }
              : { ...f, status: "done" };
          }
          return f;
        }),
      );

      onUploaded?.(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "error", error: message } : f,
        ),
      );
    } finally {
      setUploading(false);
    }
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const canAddMore = files.length < maxFiles;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => canAddMore && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-sm transition-colors",
          dragOver
            ? "border-[#273481] bg-[#DCEAF7]/40"
            : "border-[#B6D6F2] bg-[#F7FAFF] hover:border-[#273481] hover:bg-[#DCEAF7]/20",
          !canAddMore && "cursor-not-allowed opacity-50",
        )}
        disabled={!canAddMore}
      >
        <Upload className="h-6 w-6 text-[#273481]" />
        <span className="font-medium text-[#1B1C4A]">
          {canAddMore
            ? "Click to select or drag & drop images"
            : `Maximum ${maxFiles} files reached`}
        </span>
        <span className="text-xs text-[#273481]/60">
          JPEG, PNG, WebP, AVIF — up to 10 MB each
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {files.map((f) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg border border-[#B6D6F2] bg-[#F7FAFF]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.previewUrl}
                alt={f.file.name}
                className="h-full w-full object-cover"
              />

              {/* Status overlay */}
              {f.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <Loader2 className="h-5 w-5 animate-spin text-[#273481]" />
                </div>
              )}
              {f.status === "done" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              )}
              {f.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}

              {/* Remove button */}
              {f.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="absolute right-1 top-1 hidden rounded-full bg-white/90 p-0.5 shadow group-hover:flex"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5 text-[#1B1C4A]" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg bg-[#273481] px-5 py-2.5 text-sm font-medium text-white transition-opacity",
            uploading ? "cursor-not-allowed opacity-60" : "hover:opacity-90",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload {pendingCount} image{pendingCount > 1 ? "s" : ""}
            </>
          )}
        </button>
      )}
    </div>
  );
}
