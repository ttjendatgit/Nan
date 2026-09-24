"use client";

/**
 * Dev-only floating tuning panel for HeroSilkStage's StageConfig -- lives under src/app/dev/ and
 * is never imported outside it, so it can never end up in a production bundle. Plain native
 * <input type="range"> sliders throughout, no charting/tuning library.
 */

import { useState } from "react";
import {
  DEFAULT_STAGE_CONFIG,
  type BlendingMode,
  type DustLayerConfig,
  type GlowLayerConfig,
  type StageConfig,
} from "@/components/homepage/silk-fan/stageConfig";

export interface TuningPanelProps {
  config: StageConfig;
  onChange: (next: StageConfig) => void;
  onReset: () => void;
}

function diffTuple(current: readonly number[], base: readonly number[]): number[] | undefined {
  const changed = current.length !== base.length || current.some((v, i) => v !== base[i]);
  return changed ? [...current] : undefined;
}

function diffValue(current: unknown, base: unknown): unknown {
  if (Array.isArray(current) && Array.isArray(base)) return diffTuple(current, base);
  return current === base ? undefined : current;
}

/** Only the fields that differ from DEFAULT_STAGE_CONFIG -- what "Copy config" puts on the
 * clipboard. Handles both nested sections (back/front/glow/parallax, each a plain object of its
 * own fields) and top-level scalars (edgeFadePercent) generically. */
function diffStageConfig(config: StageConfig): Partial<Record<keyof StageConfig, unknown>> {
  const result: Partial<Record<keyof StageConfig, unknown>> = {};
  (Object.keys(config) as (keyof StageConfig)[]).forEach((key) => {
    const current = config[key];
    const base = DEFAULT_STAGE_CONFIG[key];
    if (current !== null && typeof current === "object" && !Array.isArray(current)) {
      const currentSection = current as unknown as Record<string, unknown>;
      const baseSection = base as unknown as Record<string, unknown>;
      const sectionDiff: Record<string, unknown> = {};
      Object.keys(currentSection).forEach((field) => {
        const d = diffValue(currentSection[field], baseSection[field]);
        if (d !== undefined) sectionDiff[field] = d;
      });
      if (Object.keys(sectionDiff).length > 0) result[key] = sectionDiff;
    } else {
      const d = diffValue(current, base);
      if (d !== undefined) result[key] = d;
    }
  });
  return result;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-[11px] text-white/80">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-white/45">{value.toFixed(3)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full accent-[#C9A84C]"
      />
    </label>
  );
}

function BlendingToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BlendingMode;
  onChange: (value: BlendingMode) => void;
}) {
  return (
    <div className="flex items-center justify-between text-[11px] text-white/80">
      <span>{label}</span>
      <div className="flex overflow-hidden rounded border border-white/20">
        {(["additive", "normal"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`cursor-pointer px-2 py-0.5 text-[10px] ${
              value === mode ? "bg-[#C9A84C] text-[#0D1B5E]" : "bg-transparent text-white/60"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}

function DirectionToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: 1 | -1;
  onChange: (value: 1 | -1) => void;
}) {
  return (
    <div className="flex items-center justify-between text-[11px] text-white/80">
      <span>{label}</span>
      <div className="flex overflow-hidden rounded border border-white/20">
        {([1, -1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => onChange(dir)}
            className={`cursor-pointer px-2 py-0.5 text-[10px] ${
              value === dir ? "bg-[#C9A84C] text-[#0D1B5E]" : "bg-transparent text-white/60"
            }`}
          >
            {dir === 1 ? "viewer moves" : "fan turns"}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaletteToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "original" | "nan";
  onChange: (value: "original" | "nan") => void;
}) {
  return (
    <div className="flex items-center justify-between text-[11px] text-white/80">
      <span>{label}</span>
      <div className="flex overflow-hidden rounded border border-white/20">
        {(["nan", "original"] as const).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`cursor-pointer px-2 py-0.5 text-[10px] capitalize ${
              value === name ? "bg-[#C9A84C] text-[#0D1B5E]" : "bg-transparent text-white/60"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

function DustLayerSection({
  title,
  layer,
  countMax,
  sizeMax,
  onChange,
}: {
  title: string;
  layer: DustLayerConfig;
  countMax: number;
  sizeMax: number;
  onChange: (next: DustLayerConfig) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2 border-t border-white/10 pt-2">
      <legend className="px-0 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">{title}</legend>
      <SliderRow label="Count" value={layer.count} min={0} max={countMax} step={1} onChange={(v) => onChange({ ...layer, count: v })} />
      <SliderRow
        label="Opacity min"
        value={layer.opacityRange[0]}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ ...layer, opacityRange: [v, layer.opacityRange[1]] })}
      />
      <SliderRow
        label="Opacity max"
        value={layer.opacityRange[1]}
        min={0}
        max={1}
        step={0.01}
        onChange={(v) => onChange({ ...layer, opacityRange: [layer.opacityRange[0], v] })}
      />
      <SliderRow
        label="Size min"
        value={layer.sizeRange[0]}
        min={0}
        max={sizeMax}
        step={0.01}
        onChange={(v) => onChange({ ...layer, sizeRange: [v, layer.sizeRange[1]] })}
      />
      <SliderRow
        label="Size max"
        value={layer.sizeRange[1]}
        min={0}
        max={sizeMax}
        step={0.01}
        onChange={(v) => onChange({ ...layer, sizeRange: [layer.sizeRange[0], v] })}
      />
      <SliderRow label="Speed" value={layer.speed} min={0} max={1} step={0.01} onChange={(v) => onChange({ ...layer, speed: v })} />
      <BlendingToggle label="Blending" value={layer.blending} onChange={(v) => onChange({ ...layer, blending: v })} />
    </fieldset>
  );
}

export default function TuningPanel({ config, onChange, onReset }: TuningPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy config");

  function updateSection<K extends keyof StageConfig>(section: K, next: StageConfig[K]) {
    onChange({ ...config, [section]: next });
  }

  async function handleCopy() {
    const diff = diffStageConfig(config);
    const text = JSON.stringify(diff, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied!");
    } catch {
      setCopyLabel("Copy failed");
    }
    window.setTimeout(() => setCopyLabel("Copy config"), 1500);
  }

  return (
    <div className="fixed right-4 top-4 z-50 w-72 max-w-[90vw] rounded-lg border border-white/15 bg-[#0A1030]/90 text-white shadow-xl backdrop-blur">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold tracking-wide text-white">Silk stage tuning</span>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="cursor-pointer rounded border border-white/20 px-2 py-0.5 text-[10px] text-white/70"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed && (
        <div className="flex max-h-[80vh] flex-col gap-3 overflow-y-auto px-3 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 cursor-pointer rounded border border-[#C9A84C]/60 bg-[#C9A84C]/10 px-2 py-1 text-[11px] text-[#F3E3A8]"
            >
              {copyLabel}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex-1 cursor-pointer rounded border border-white/20 px-2 py-1 text-[11px] text-white/70"
            >
              Reset
            </button>
          </div>

          <fieldset className="flex flex-col gap-2 border-t border-white/10 pt-2">
            <legend className="px-0 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">Palette</legend>
            <PaletteToggle
              label="Palette"
              value={config.palette}
              onChange={(v) => updateSection("palette", v)}
            />
          </fieldset>

          <DustLayerSection
            title="Back dust"
            layer={config.back}
            countMax={1200}
            sizeMax={1.5}
            onChange={(next) => updateSection("back", next)}
          />

          <fieldset className="flex flex-col gap-2 border-t border-white/10 pt-2">
            <legend className="px-0 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">
              Front dust -- spawn region
            </legend>
            <SliderRow
              label="X min"
              value={config.front.spreadX[0]}
              min={-6}
              max={6}
              step={0.1}
              onChange={(v) => updateSection("front", { ...config.front, spreadX: [v, config.front.spreadX[1]] })}
            />
            <SliderRow
              label="X max"
              value={config.front.spreadX[1]}
              min={-6}
              max={6}
              step={0.1}
              onChange={(v) => updateSection("front", { ...config.front, spreadX: [config.front.spreadX[0], v] })}
            />
            <SliderRow
              label="Y min"
              value={config.front.spreadY[0]}
              min={-5}
              max={5}
              step={0.1}
              onChange={(v) => updateSection("front", { ...config.front, spreadY: [v, config.front.spreadY[1]] })}
            />
            <SliderRow
              label="Y max"
              value={config.front.spreadY[1]}
              min={-5}
              max={5}
              step={0.1}
              onChange={(v) => updateSection("front", { ...config.front, spreadY: [config.front.spreadY[0], v] })}
            />
          </fieldset>

          <DustLayerSection
            title="Front dust"
            layer={config.front}
            countMax={80}
            sizeMax={2}
            onChange={(next) => updateSection("front", next)}
          />

          <fieldset className="flex flex-col gap-2 border-t border-white/10 pt-2">
            <legend className="px-0 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">Glow</legend>
            <SliderRow
              label="Intensity"
              value={config.glow.intensity}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateSection("glow", { ...config.glow, intensity: v } satisfies GlowLayerConfig)}
            />
            <SliderRow
              label="Offset X"
              value={config.glow.offsetX}
              min={-6}
              max={6}
              step={0.1}
              onChange={(v) => updateSection("glow", { ...config.glow, offsetX: v })}
            />
            <SliderRow
              label="Offset Y"
              value={config.glow.offsetY}
              min={-6}
              max={6}
              step={0.1}
              onChange={(v) => updateSection("glow", { ...config.glow, offsetY: v })}
            />
            <BlendingToggle
              label="Blending"
              value={config.glow.blending}
              onChange={(v) => updateSection("glow", { ...config.glow, blending: v })}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-2 border-t border-white/10 pt-2">
            <legend className="px-0 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">Parallax</legend>
            <SliderRow
              label="Fan tilt Y (deg)"
              value={config.parallax.fanMaxTiltYDeg}
              min={0}
              max={30}
              step={0.5}
              onChange={(v) => updateSection("parallax", { ...config.parallax, fanMaxTiltYDeg: v })}
            />
            <SliderRow
              label="Fan tilt X (deg)"
              value={config.parallax.fanMaxTiltXDeg}
              min={0}
              max={30}
              step={0.5}
              onChange={(v) => updateSection("parallax", { ...config.parallax, fanMaxTiltXDeg: v })}
            />
            <SliderRow
              label="Perspective (px)"
              value={config.parallax.perspectivePx}
              min={300}
              max={3000}
              step={50}
              onChange={(v) => updateSection("parallax", { ...config.parallax, perspectivePx: v })}
            />
            <SliderRow
              label="Back camera shift"
              value={config.parallax.backCameraShift}
              min={0}
              max={3}
              step={0.05}
              onChange={(v) => updateSection("parallax", { ...config.parallax, backCameraShift: v })}
            />
            <SliderRow
              label="Front camera shift"
              value={config.parallax.frontCameraShift}
              min={0}
              max={3}
              step={0.05}
              onChange={(v) => updateSection("parallax", { ...config.parallax, frontCameraShift: v })}
            />
            <SliderRow
              label="Damping"
              value={config.parallax.damping}
              min={0.5}
              max={20}
              step={0.1}
              onChange={(v) => updateSection("parallax", { ...config.parallax, damping: v })}
            />
            <SliderRow
              label="Idle amplitude"
              value={config.parallax.idleAmplitude}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateSection("parallax", { ...config.parallax, idleAmplitude: v })}
            />
            <SliderRow
              label="Idle period (s)"
              value={config.parallax.idlePeriodSec}
              min={1}
              max={30}
              step={0.5}
              onChange={(v) => updateSection("parallax", { ...config.parallax, idlePeriodSec: v })}
            />
            <DirectionToggle
              label="Fan tilt direction"
              value={config.parallax.fanTiltDirection}
              onChange={(v) => updateSection("parallax", { ...config.parallax, fanTiltDirection: v })}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-2 border-t border-white/10 pt-2">
            <legend className="px-0 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">Canvas edges</legend>
            <SliderRow
              label="Edge fade (%)"
              value={config.edgeFadePercent}
              min={0}
              max={40}
              step={1}
              onChange={(v) => updateSection("edgeFadePercent", v)}
            />
          </fieldset>
        </div>
      )}
    </div>
  );
}
