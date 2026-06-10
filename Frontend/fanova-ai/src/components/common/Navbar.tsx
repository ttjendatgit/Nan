"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Button from "@/components/ui/Button";

const navLinks = [
  { label: "Collections", href: "#products" },
  { label: "Heritage", href: "#ai-designer" },
  { label: "Bespoke", href: "#process" },
  { label: "Story", href: "#quote" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-[999] w-full border-b border-[#2F3542]/60 bg-[#080E1A]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
        {/* Left: nav links */}
        <nav className="hidden flex-1 items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8D9197] transition-colors duration-200 hover:text-[#C6E2FF]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Center: brand — absolute on desktop so it's truly centered */}
        <div className="flex flex-1 justify-start md:absolute md:left-1/2 md:flex-none md:-translate-x-1/2">
          <a href="/" className="flex flex-col items-center leading-tight">
            <span className="font-serif text-[22px] font-semibold tracking-wide text-[#FBFBFF]">
              Nhã Phong
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-[#539AD3]">
              Custom Paper Fans
            </span>
          </a>
        </div>

        {/* Right: CTA + mobile toggle */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <Button className="hidden px-5 py-2 text-[11px] md:inline-flex">
            Bắt đầu thiết kế
          </Button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2F3542] text-[#8D9197] transition hover:border-[#539AD3] hover:text-[#C6E2FF] md:hidden"
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#2F3542]/60 bg-[#080E1A]/97 px-6 py-5 md:hidden">
          <nav className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8D9197] transition hover:text-[#C6E2FF]"
              >
                {link.label}
              </a>
            ))}
            <Button className="mt-1 w-full py-2.5 text-xs">
              Bắt đầu thiết kế
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
