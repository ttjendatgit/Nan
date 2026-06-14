export default function NanBrandPanel() {
  return (
    <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-[#060E1C] md:flex">

      {/* Fine dot grid — very subtle on deep dark */}
      <div className="absolute inset-0 bg-grid-dots opacity-[0.18]" />

      {/* Primary radial glow — warm royal blue centered */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 72% at 50% 52%, rgba(17,79,153,0.38) 0%, transparent 100%)",
        }}
      />

      {/* Secondary glow — lifts the fan from below */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 90%, rgba(8,51,125,0.38) 0%, transparent 100%)",
        }}
      />

      {/* Gold warmth near pivot */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 28% 16% at 50% 97%, rgba(236,202,62,0.09) 0%, transparent 100%)",
        }}
      />

      {/* ── Fan line-art ─────────────────────────────────────────────────────
          Pivot at (100, 195). 13 ribs spanning ±38° from vertical, r=155.
          6 concentric arcs. Gradient ribs (tips brighter than base).
          Alternating paper-fold panel fills. Gold hardware pivot.
          viewBox 200×200, rendered at h-[500px] w-[500px].
      ─────────────────────────────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden="true"
        className="absolute bottom-[-8px] left-1/2 h-[500px] w-[500px] -translate-x-1/2"
      >
        <defs>
          {/* Rib gradient: nearly invisible at pivot, crisper at tips */}
          <linearGradient
            id="ribFade"
            gradientUnits="userSpaceOnUse"
            x1="100" y1="195"
            x2="100" y2="40"
          >
            <stop offset="0%"   stopColor="#DCEAF7" stopOpacity="0.04" />
            <stop offset="60%"  stopColor="#DCEAF7" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#DCEAF7" stopOpacity="0.26" />
          </linearGradient>

          {/* Blue pivot glow */}
          <radialGradient id="pivotGlow" cx="50%" cy="97.5%" r="55%">
            <stop offset="0%"   stopColor="#1E4FA0" stopOpacity="0.34" />
            <stop offset="55%"  stopColor="#1E4FA0" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#1E4FA0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Atmospheric glow from pivot */}
        <ellipse cx="100" cy="195" rx="105" ry="82" fill="url(#pivotGlow)" />

        {/* ── Alternating paper-fold panel fills ──
            Even-indexed pairs among 13 ribs:
            (0-1) (2-3) (4-5) (6-7) (8-9) (10-11)
        ── */}
        <path d="M 100,195 L 5,73  A 155,155 0 0,1 18,63  Z" fill="rgba(220,234,247,0.032)" />
        <path d="M 100,195 L 34,55 A 155,155 0 0,1 50,48  Z" fill="rgba(220,234,247,0.032)" />
        <path d="M 100,195 L 66,44 A 155,155 0 0,1 83,41  Z" fill="rgba(220,234,247,0.032)" />
        <path d="M 100,195 L 100,40 A 155,155 0 0,1 117,41 Z" fill="rgba(220,234,247,0.032)" />
        <path d="M 100,195 L 134,44 A 155,155 0 0,1 150,48 Z" fill="rgba(220,234,247,0.032)" />
        <path d="M 100,195 L 166,55 A 155,155 0 0,1 182,63 Z" fill="rgba(220,234,247,0.032)" />

        {/* ── 13 Ribs — gradient from pivot to tip ── */}
        <line x1="100" y1="195" x2="5"   y2="73"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="18"  y2="63"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="34"  y2="55"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="50"  y2="48"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="66"  y2="44"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="83"  y2="41"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="100" y2="40"  stroke="url(#ribFade)" strokeWidth="1.00" strokeLinecap="round" />
        <line x1="100" y1="195" x2="117" y2="41"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="134" y2="44"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="150" y2="48"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="166" y2="55"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="182" y2="63"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />
        <line x1="100" y1="195" x2="195" y2="73"  stroke="url(#ribFade)" strokeWidth="0.85" strokeLinecap="round" />

        {/* ── 6 Concentric arcs — outer most visible ── */}
        <path d="M 5,73   A 155,155 0 0,1 195,73"  stroke="#DCEAF7" strokeWidth="0.90" strokeOpacity="0.22" fill="none" />
        <path d="M 27,102 A 118,118 0 0,1 173,102" stroke="#DCEAF7" strokeWidth="0.72" strokeOpacity="0.18" fill="none" />
        <path d="M 46,126 A 88,88   0 0,1 154,126" stroke="#DCEAF7" strokeWidth="0.60" strokeOpacity="0.15" fill="none" />
        <path d="M 62,146 A 62,62   0 0,1 138,146" stroke="#DCEAF7" strokeWidth="0.52" strokeOpacity="0.13" fill="none" />
        <path d="M 75,164 A 40,40   0 0,1 125,164" stroke="#DCEAF7" strokeWidth="0.46" strokeOpacity="0.11" fill="none" />
        <path d="M 86,177 A 23,23   0 0,1 114,177" stroke="#DCEAF7" strokeWidth="0.40" strokeOpacity="0.09" fill="none" />

        {/* ── Gold hardware pivot ── */}
        {/* Outer halo ring */}
        <circle cx="100" cy="195" r="10"  fill="none" stroke="#ECCA3E" strokeWidth="0.35" strokeOpacity="0.20" />
        {/* Main gold ring — the pivot pin surround */}
        <circle cx="100" cy="195" r="5.8" fill="none" stroke="#ECCA3E" strokeWidth="0.80" strokeOpacity="0.58" />
        {/* Inner disc — pearl/ice */}
        <circle cx="100" cy="195" r="2.4" fill="#E8F2FC" fillOpacity="0.55" />
        {/* Center point */}
        <circle cx="100" cy="195" r="1.0" fill="#ECCA3E" fillOpacity="0.75" />
      </svg>

      {/* ── Brand content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-12 text-center">
        <div className="h-px w-14 bg-gradient-to-r from-transparent via-[#ECCA3E] to-transparent opacity-70" />

        <div className="flex flex-col items-center gap-2.5">
          <span
            className="font-serif text-[80px] font-semibold leading-none tracking-wide text-[#E8F2FC]"
            style={{ fontFamily: "var(--font-eb-garamond)" }}
          >
            Nan
          </span>
          <span className="font-mono text-[7.5px] uppercase tracking-[0.44em] text-[#4A74A7]">
            Custom Fan Design
          </span>
        </div>

        <p className="max-w-[18ch] text-[13px] leading-[1.65] text-[#7A9FC0]">
          Di sản trong từng nếp quạt
        </p>

        <div className="h-px w-8 bg-[#ECCA3E] opacity-25" />
      </div>
    </div>
  );
}
