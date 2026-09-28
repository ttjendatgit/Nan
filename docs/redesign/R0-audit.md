# R0: Kiểm kê giao diện public trước khi đổi hướng thương hiệu

- **Ngày kiểm kê:** 2026-09-28
- **Nhánh / commit:** `feature/brand-warm-redesign` @ `16c4601`
- **Chế độ:** chỉ đọc. Tài liệu này là file duy nhất được tạo; không sửa file nào khác.
- **Hướng mới (đã chốt):** "xưởng quạt đương đại". Nền xanh tối làm ấm (chàm), chữ trên nền tối màu giấy ngà, điểm nhấn trên nền tối màu tre, navy `#192B88` chỉ làm điểm nhấn trên mảng sáng, một số section dùng mảng giấy ngà với chữ mực ấm. Bỏ lưới kẻ nền. Chữ mono chỉ còn ở bảng thông số sản phẩm. Chip viền thay bằng chữ nối "·". Chỉ mục Quy trình giữ đánh số. Thân chữ đổi từ Geist sang Be Vietnam Pro; EB Garamond giữ cho tiêu đề.

## Phạm vi và cách làm

- **Phạm vi quét** (33 file): `src/app` trừ `admin/` và `dev/`; `src/components/homepage` (không gồm nội dung `silk-fan/`, nhưng gồm `HeroSection.tsx` và `HeroSectionBackground.tsx`); `src/components/common`; `src/components/product`; `src/components/ui`; `src/app/globals.css`; `src/app/layout.tsx`.
- **Trong thư mục phạm vi nhưng không phải giao diện public** (vẫn được đếm, có đánh dấu trong bảng):
  - `components/product/ContentBlockEditor.tsx` và `components/ui/Modal.tsx`: chỉ admin dùng.
  - `components/ui/MediaUpload.tsx`: không file nào import.
  - `components/homepage/HeroCanvas.tsx`: hero legacy, không render vì `HERO_VARIANT = "silk"` (`heroVariant.ts:14`).
- **Nằm ngoài thư mục phạm vi nhưng được route public render.** Mục 2 không quét hex/rgba của các file này; R2/R3 cần tính thêm:
  - `components/auth/NanBrandPanel.tsx` (trang /auth)
  - `components/content/PageArticle.tsx` và `components/admin/content/preview/BlockRenderer.tsx` (trang CMS `/[slug]`)
  - `components/quote/QuoteRequestForm.tsx` (trang chi tiết sản phẩm)
  - `data/homepageData.ts`: nguồn chữ và một số màu cho trang chủ (xem 2c, mục 8)
- **Cách đếm màu** (script chỉ đọc, chạy ngoài repo):
  - Bắt mọi hex `#rgb`/`#rrggbb`/`#rrggbbaa`, `rgb()/rgba()` và `white`/`black` dạng class Tailwind (`text-white`, `white/10`…).
  - Hex được chuẩn hóa về chữ thường 6 ký tự.
  - Hậu tố opacity Tailwind (`bg-[#192B88]/10`) được gộp vào giá trị gốc.
  - Dòng chú thích bị bỏ qua.
  - Vai trò lấy từ tiền tố (`bg-`/`text-`/`border-`/`ring-`…) hoặc thuộc tính inline (`background`, `color`…); "nền tối/sáng" tính theo độ sáng của màu.
  - Màu bảng màu có sẵn của Tailwind (`red-400`, `rose-50`…) đếm riêng ở 2b.

---

## 1. Bản đồ trang chủ

Thứ tự lấy từ `src/app/page.tsx`. Có hai lớp nền xen kẽ: **tối `#0F1320`** và **kem `#F1F0EA`**. Nền `body` là `#0D131F` (class trong `layout.tsx:38`, thắng quy tắc `body { background: #FAFAF8 }` ở `globals.css:314`).

| # | Section | File component | `id` | Nền hiện tại | Chữ chính | Chữ phụ | Lưới/hoa văn |
|---|---|---|---|---|---|---|---|
| 0 | Navbar (fixed) | `common/Navbar.tsx` | — | trong suốt trên hero; cuộn xuống: `rgba(15,19,32,0.94)` + blur (`:416`); dải thông báo `rgba(15,19,32,0.35)` / `var(--nan-dark)` (`:396`) | `#F1F0EA` | `#A9ABA5`, `#F1F0EA/45` | — |
| 1 | Hero | `homepage/HeroSection.tsx` + `HeroSectionBackground.tsx` | — | `#0F1320` (`HERO_BACKGROUND_COLOR`, `HeroSectionBackground.tsx:22`) | H1 `#FFFFFF` (`HeroSection:272`) | `rgba(241,240,234,0.65)` (mô tả), `rgba(241,240,234,0.46)` (dòng 01/02/03), `white/75` (badge) | lưới 60px `white` 0.28, lớp opacity 0.07, chỉ bên phải; quầng `#192B88`, `#B6A17B` |
| — | Motif sợi quạt (fixed, xuyên suốt) | `homepage/HomepageNarrativeMotif.tsx` | — | trong suốt; nét `rgba(182,161,123,0.14)`, quầng `rgba(182,161,123,0.09)` | — | — | — |
| 2 | Brand Statement | `homepage/BrandStatementSection.tsx` | `about` | `#0F1320` (`:12`) | `text-white` (`:47`) | `#DCEAF7/80` (dòng tiêu đề 2), `rgba(220,234,247,0.45)` (thân) | lưới 48px, opacity 0.028; quầng `#192B88/10` |
| 3 | Loại quạt | `homepage/ProductTypeSection.tsx` | `products` | `#F1F0EA` (`:35`); ảnh `#E7E4D8` | `#0F1320` | `rgba(15,19,32,0.62)`; nhấn `#192B88` | EditorialGrid |
| 4 | Vấn đề | `homepage/ProblemSection.tsx` | — | `#F1F0EA` (`:12`) | `#0F1320` | `rgba(15,19,32,0.62)`, `0.72`; số `#192B88/70` | EditorialGrid |
| 5 | Giải pháp | `homepage/SolutionSection.tsx` | — | `#0F1320` (`:11`) | `text-white` | `rgba(220,234,247,0.50)`; số `rgba(182,161,123,0.65)` | lưới 48px, opacity 0.04; quầng `#192B88/10` |
| 6 | AI Designer | `homepage/AIDesignerSection.tsx` | `ai-designer` | `#F1F0EA` (`:47`); panel `#FBFAF6` | `#0F1320` | `rgba(15,19,32,0.55)`, `0.42`; nhấn `#192B88` (12 chỗ) | EditorialGrid; chấm 10px trên mockup |
| 7 | Chất liệu | `homepage/MaterialSection.tsx` | `materials` | `#F1F0EA` (`:23`); thẻ `#FBFAF6`, ảnh `#E7E4D8` | `#0F1320` | `rgba(15,19,32,0.62)`; nhãn `#192B88/70` | EditorialGrid; chấm 9px trên ảnh thẻ |
| 8 | Ứng dụng | `homepage/UseCaseSection.tsx` | `applications` | `#0F1320` (`:12`) | `text-white` | `rgba(220,234,247,0.50)`, `0.32`; số `rgba(182,161,123,0.65)` | lưới 48px, opacity 0.04; quầng `#192B88/10` |
| 9 | Quy trình | `homepage/ProcessSection.tsx` | `process` | `#F1F0EA` (`:15`) | `#0F1320` | `rgba(15,19,32,0.62)`, `0.38`; số bước `#192B88` | EditorialGrid |
| 10 | FAQ | `homepage/FAQSection.tsx` | — | `#F1F0EA` (`:15`) | `#0F1320` | `rgba(15,19,32,0.62)`, `0.50`; icon `#192B88` | EditorialGrid |
| 11 | CTA báo giá | `homepage/FinalCTASection.tsx` | `quote` | `#0F1320` (`:20`); panel trong `#192B88` (`:47`) | `text-white` (`:98`) | `rgba(241,240,234,0.60)`, `0.45`; `white/65–80` | lưới 48px opacity 0.035 (section) + lưới 40px opacity 0.04 (panel); quầng |
| 12 | Footer | `common/Footer.tsx` | — | `#0F1320` (`:5`) | `#F1F0EA` (link hover), `#A9ABA5` | `rgba(241,240,234,0.24–0.28)` | vạch `white/10` |

**Trang public khác** (không thuộc trang chủ, cùng dùng Navbar/Footer):

| Route | File | Nền | Bảng màu đang dùng |
|---|---|---|---|
| `/products` | `app/products/page.tsx` | `#0D131F` (`:27`); thẻ `#111335`, viền `#1B1C4A` | **bảng màu cũ (v2)**: `#111335`/`#1B1C4A`/`#273481`/`#B6D6F2`, khác trang chủ |
| `/products/[id]` | `app/products/[id]/page.tsx` | `#0F1320` (`:110`); khối nội dung `#F1F0EA` (`:283`) | bảng màu trang chủ; nút `#192B88` trên nền tối |
| `/[slug]` (CMS) | `app/[slug]/page.tsx` | khung `#0D131F` (`:64`) + vùng đọc `var(--nan-light)` (`:72`) | bảng màu trang chủ + EditorialGrid |
| `/auth/login`, `/auth/register` | `app/auth/*/page.tsx` | `[data-auth]` `#05091A` (`globals.css:408`) + quầng xanh | **bảng màu cũ (v2/v3)**: `#4A74A7`, `#E8F2FC`, `#B6D6F2`, gradient xanh `rgba(24,72,165,…)` |

---

## 2. Màu viết cứng

**Tổng:** 238 giá trị khác nhau, 881 lượt viết cứng trong 30 file có màu (chưa tính 79 dòng khai báo token ở `globals.css`, xem mục 3).

Nhận định nhanh:

- **Có ba bảng màu song song:**
  - **A. "Nan v4" (trang chủ, chi tiết sản phẩm, CMS):** `#0F1320`, `#F1F0EA`, `#192B88`, `#B6A17B`, `#A9ABA5`.
  - **B. "Nan v2" (danh sách sản phẩm, ContentBlocksRenderer, admin sidebar):** `#111335`, `#1B1C4A`, `#273481`, `#B6D6F2`.
  - **C. "v3 Luxury Blue" (auth, highlight):** `#4A74A7`, `#E8F2FC`, `#DCEAF7`, `#08337D`, `#ECCA3E`.
- **Token gần như không được dùng.** `--nan-*` chỉ xuất hiện 6 lần qua `var()` trong phạm vi; toàn bộ phần còn lại viết cứng.
- **Trắng tinh** (`white`, `#FFFFFF`) xuất hiện 66 lần, chủ yếu là chữ trên nền tối. Quyết định "chữ giấy ngà" sẽ thay nhóm này.

### 2a. Bảng đầy đủ theo giá trị

Ký hiệu cột vị trí: `a/` = `src/app/`, `c/` = `src/components/`. "Số lần" = lượt viết cứng / tổng (tổng gồm cả dòng khai báo token nếu có). **điểm nhấn** = màu có độ bão hòa cao, dùng làm nhấn.

| # | Giá trị | Số lần (viết cứng / tổng) | Vai trò | Vị trí (file:dòng) |
|---|---|---|---|---|
| 1 | `#f1f0ea` | 88 / 89 | nền sáng ×22, chữ ×65, viền ×1, khai báo token ×1 | `a/globals.css`:14; `a/products/[id]/page.tsx`:130,137,154,163,178,182,190,229,254,254,261,283,300,317,322,401,430; `c/common/Footer.tsx`:14,28,43,55,73; `c/common/Navbar.tsx`:108,163,202,404,425,450,457,476,491,504,532,534,550,569,584,592,603,611,626,637,664,689,714,730,737,744,754,761; `c/homepage/AIDesignerSection.tsx`:47,101,118,158,175,225; `c/homepage/FAQSection.tsx`:15; `c/homepage/FinalCTASection.tsx`:141; `c/homepage/HeroSection.tsx`:298; `c/homepage/MaterialSection.tsx`:23; `c/homepage/ProblemSection.tsx`:12; `c/homepage/ProcessSection.tsx`:15; `c/homepage/ProductTypeSection.tsx`:35,96,100,146,191,212; `c/product/ProductOptionSelector.tsx`:210,222,223,226,237,238,243,248,261,262,266,267,271,272,280,295,295,349,355; `c/ui/Button.tsx`:29 |
| 2 | `#192b88` | 78 / 79 | nền ×18, chữ ×34, viền ×23, hằng số JS/khác ×3, khai báo token ×1, **điểm nhấn** | `a/globals.css`:13; `a/products/[id]/page.tsx`:150,151,163,163,216,224,254,359,412,425; `c/homepage/AIDesignerSection.tsx`:64,94,101,101,107,117,117,117,118,129,140,155,158,158,165,165,176,189,194,194,233,233,234,237; `c/homepage/BrandStatementSection.tsx`:28; `c/homepage/FAQSection.tsx`:54,91; `c/homepage/FinalCTASection.tsx`:23,47; `c/homepage/HeroCanvas.tsx`:90,186 _(hero legacy, không render)_; `c/homepage/HeroSection.tsx`:380; `c/homepage/HeroVisualStage.tsx`:26; `c/homepage/MaterialSection.tsx`:40,61,83,121; `c/homepage/ProblemSection.tsx`:49; `c/homepage/ProcessSection.tsx`:31,84,103; `c/homepage/ProductTypeSection.tsx`:52,96,101,111,146,177,198; `c/homepage/SolutionSection.tsx`:25; `c/homepage/UseCaseSection.tsx`:26; `c/product/ProductOptionSelector.tsx`:176,176,191,197,197,209,295,312,349,349,350; `c/ui/Button.tsx`:18,20,20,20,22,22,29 |
| 3 | `white` | 56 / 56 | nền sáng ×14, chữ ×32, viền ×7, hằng số JS/khác ×3 | `a/[slug]/page.tsx`:64,69; `a/auth/login/page.tsx`:229,398,419; `a/auth/register/page.tsx`:155,290,309; `a/products/page.tsx`:27,76,95,100,114,199,209,231,253,258,272,279,337,445,456; `c/common/Footer.tsx`:7,82; `c/common/Navbar.tsx`:108,147,149,186,188,488,504,563,584,592,603,611,689,693; `c/homepage/AIDesignerSection.tsx`:270,280; `c/homepage/BrandStatementSection.tsx`:47; `c/homepage/FinalCTASection.tsx`:98,124,141,150; `c/homepage/HeroSection.tsx`:298,307; `c/homepage/SolutionSection.tsx`:37,61; `c/homepage/UseCaseSection.tsx`:37,69; `c/product/ContentBlockEditor.tsx`:70,880 _(chỉ admin)_; `c/product/ContentBlocksRenderer.tsx`:42; `c/ui/MediaUpload.tsx`:216 _(không được dùng)_ |
| 4 | `#0f1320` | 43 / 44 | nền tối ×9, chữ ×30, gradient ×3, hằng số JS/khác ×1, khai báo token ×1 | `a/globals.css`:12; `a/products/[id]/page.tsx`:110,254,359; `c/common/Footer.tsx`:5; `c/homepage/AIDesignerSection.tsx`:62,85,101,168,229,282; `c/homepage/BrandStatementSection.tsx`:12; `c/homepage/FAQSection.tsx`:29,51,91; `c/homepage/FinalCTASection.tsx`:20,141; `c/homepage/HeroSection.tsx`:298,399; `c/homepage/HeroSectionBackground.tsx`:22,70,74; `c/homepage/MaterialSection.tsx`:38,80,104,123; `c/homepage/ProblemSection.tsx`:26; `c/homepage/ProcessSection.tsx`:29,94; `c/homepage/ProductTypeSection.tsx`:50,108,165; `c/homepage/SolutionSection.tsx`:11; `c/homepage/UseCaseSection.tsx`:12; `c/product/ProductOptionSelector.tsx`:138,176,191,197,209,295,316,350; `c/ui/Button.tsx`:18,22 |
| 5 | `#b6d6f2` | 41 / 41 | chữ ×32, viền ×2, hằng số JS/khác ×7, **điểm nhấn** | `a/products/page.tsx`:79,96,100,115,178,178,203,221,221,232,232,254,258,275,279,288,342,347,347,370,371,372,373,374,375,376,431,440,450,461,461; `c/product/ContentBlockEditor.tsx`:1328 _(chỉ admin)_; `c/product/ContentBlocksRenderer.tsx`:36,49,55,110,195,209,254; `c/ui/MediaUpload.tsx`:139,168 _(không được dùng)_ |
| 6 | `#1b1c4a` | 36 / 37 | nền tối ×16, chữ ×2, viền ×16, gradient ×2, khai báo token ×1, **điểm nhấn** | `a/globals.css`:139; `a/products/page.tsx`:74,110,174,194,195,216,221,232,268,315,318,329,392,394,396,397,398,399,413,416,426,455,478,480,482,483,484,485,486,487,488; `c/product/ContentBlockEditor.tsx`:1323 _(chỉ admin)_; `c/product/ContentBlocksRenderer.tsx`:99,184; `c/ui/MediaUpload.tsx`:145,201 _(không được dùng)_ |
| 7 | `#a9aba5` | 35 / 36 | nền ×1, chữ ×34, khai báo token ×1 | `a/globals.css`:15; `c/common/Footer.tsx`:15,28,38,50,62; `c/common/Navbar.tsx`:99,108,119,123,128,138,159,165,177,198,203,429,496,504,573,584,592,603,611,664,675,682,689,724,731,737,744,754,761; `c/homepage/ProductTypeSection.tsx`:199 |
| 8 | `#273481` | 25 / 25 | nền ×3, chữ ×8, viền ×13, gradient ×1, **điểm nhấn** | `a/products/page.tsx`:100,100,111,221,231,232,258,258,269,279,279,315,379,413,427,431; `c/product/ContentBlocksRenderer.tsx`:88,95,266; `c/ui/MediaUpload.tsx`:138,139,144,150,179,216 _(không được dùng)_ |
| 9 | `#b6a17b` | 20 / 22 | nền ×5, chữ ×4, viền ×9, gradient ×2, khai báo token ×2 | `a/globals.css`:16,133; `c/common/Footer.tsx`:73,73,76; `c/common/Navbar.tsx`:108,399,407,504,626,626,629,689,714,717; `c/homepage/AIDesignerSection.tsx`:289,289; `c/homepage/BrandStatementSection.tsx`:39; `c/homepage/FinalCTASection.tsx`:86; `c/homepage/HeroSection.tsx`:265,323; `c/homepage/UseCaseSection.tsx`:55 |
| 10 | `rgba(15,19,32,0.14)` | 19 / 19 | phủ mờ/overlay ×1, viền ×17, bóng ×1 | `c/homepage/AIDesignerSection.tsx`:101,118,165,175,222,225,244; `c/homepage/FAQSection.tsx`:35,45; `c/homepage/MaterialSection.tsx`:101,113,117,118; `c/homepage/ProcessSection.tsx`:90; `c/homepage/ProductTypeSection.tsx`:100; `c/product/ProductOptionSelector.tsx`:146,151,163,169 |
| 11 | `rgba(15,19,32,0.62)` | 13 / 13 | chữ ×13 | `c/homepage/AIDesignerSection.tsx`:66,88; `c/homepage/FAQSection.tsx`:68; `c/homepage/MaterialSection.tsx`:42,87,107; `c/homepage/ProblemSection.tsx`:29; `c/homepage/ProcessSection.tsx`:33,97; `c/homepage/ProductTypeSection.tsx`:56,109,169,173 |
| 12 | `white/10` | 13 / 13 | phủ mờ/overlay ×3, viền ×10 | `a/products/[id]/page.tsx`:240,298,315,412; `c/common/Navbar.tsx`:578,674,723; `c/homepage/FinalCTASection.tsx`:150; `c/homepage/HeroSection.tsx`:307; `c/product/ProductOptionSelector.tsx`:220,236,242,270 |
| 13 | `white/5` | 13 / 13 | phủ mờ/overlay ×13 | `a/products/[id]/page.tsx`:450,451,452,453,454,459,461,462,463,464,465,466,467 |
| 14 | `rgba(15,19,32,0.12)` | 11 / 11 | phủ mờ/overlay ×4, viền ×7 | `c/homepage/AIDesignerSection.tsx`:72,83,141; `c/homepage/MaterialSection.tsx`:48,61; `c/homepage/ProcessSection.tsx`:46,50,58; `c/homepage/ProductTypeSection.tsx`:71,96,146 |
| 15 | `rgba(15,19,32,0.20)` | 11 / 11 | phủ mờ/overlay ×5, chữ ×1, viền ×5 | `c/homepage/AIDesignerSection.tsx`:158,251,252,253,254,255; `c/homepage/ProcessSection.tsx`:103; `c/product/ProductOptionSelector.tsx`:176,191,197; `c/ui/Button.tsx`:20 |
| 16 | `#111335` | 10 / 11 | nền tối ×8, gradient ×2, khai báo token ×1 | `a/globals.css`:138; `a/products/page.tsx`:315,329,392,413,426,478; `c/product/ContentBlockEditor.tsx`:1323 _(chỉ admin)_; `c/product/ContentBlocksRenderer.tsx`:95,97,99 |
| 17 | `rgba(15,19,32,0.10)` | 10 / 10 | phủ mờ/overlay ×1, viền ×8, bóng ×1 | `c/homepage/AIDesignerSection.tsx`:248; `c/homepage/HeroSection.tsx`:298; `c/homepage/MaterialSection.tsx`:78; `c/homepage/ProblemSection.tsx`:35,47; `c/homepage/ProductTypeSection.tsx`:107,164,191,212,215 |
| 18 | `rgba(255,255,255,0.5)` | 8 / 8 | gradient ×8 | `c/homepage/BrandStatementSection.tsx`:20,20; `c/homepage/FinalCTASection.tsx`:67,67; `c/homepage/SolutionSection.tsx`:19,19; `c/homepage/UseCaseSection.tsx`:20,20 |
| 19 | `#dceaf7` | 7 / 9 | nền sáng ×2, chữ ×2, hằng số JS/khác ×3, khai báo token ×2 | `a/globals.css`:36,97; `c/homepage/BrandStatementSection.tsx`:57; `c/homepage/HeroCanvas.tsx`:88,141,174 _(hero legacy, không render)_; `c/homepage/UseCaseSection.tsx`:39; `c/ui/MediaUpload.tsx`:138,139 _(không được dùng)_ |
| 20 | `#e7e4d8` | 7 / 7 | nền sáng ×7 | `c/homepage/MaterialSection.tsx`:64; `c/homepage/ProductTypeSection.tsx`:98,149,214,216,217,218 |
| 21 | `#e8f2fc` | 7 / 8 | chữ ×4, hằng số JS/khác ×3, khai báo token ×1 | `a/auth/login/page.tsx`:57,271; `a/auth/register/page.tsx`:46,194; `a/globals.css`:59,396,397; `c/homepage/HeroCanvas.tsx`:183 _(hero legacy, không render)_ |
| 22 | `#ffffff` | 7 / 10 | chữ ×2, hằng số JS/khác ×5, khai báo token ×3 | `a/globals.css`:46,85,90,114; `c/homepage/HeroCanvas.tsx`:89,140,148,177 _(hero legacy, không render)_; `c/homepage/HeroSection.tsx`:272; `c/ui/Button.tsx`:18 |
| 23 | `#4a74a7` | 6 / 11 | chữ ×2, hằng số JS/khác ×4, khai báo token ×5, **điểm nhấn** | `a/auth/login/page.tsx`:276; `a/auth/register/page.tsx`:199; `a/globals.css`:34,57,95,124,142; `c/homepage/HeroCanvas.tsx`:91,142,149,180 _(hero legacy, không render)_ |
| 24 | `rgba(15,19,32,0.18)` | 6 / 6 | phủ mờ/overlay ×5, viền ×1 | `c/homepage/ProductTypeSection.tsx`:193,194,195,196,197; `c/product/ProductOptionSelector.tsx`:350 |
| 25 | `rgba(241,240,234,0.40)` | 6 / 6 | chữ ×6 | `a/products/[id]/page.tsx`:177,268,303,322,397,434 |
| 26 | `#05091a` | 5 / 5 | nền tối ×2, hằng số JS/khác ×3 | `a/auth/login/page.tsx`:200,210,222; `a/auth/register/page.tsx`:148; `a/globals.css`:408 |
| 27 | `white/65` | 5 / 5 | chữ ×5 | `a/auth/login/page.tsx`:229,364; `a/auth/register/page.tsx`:155,261; `c/homepage/FinalCTASection.tsx`:87 |
| 28 | `#5b9bd5` | 4 / 4 | viền ×4, **điểm nhấn** | `a/auth/login/page.tsx`:62,401; `a/auth/register/page.tsx`:51,293 |
| 29 | `#7a9fc0` | 4 / 4 | chữ ×4, **điểm nhấn** | `a/auth/login/page.tsx`:92,92; `a/auth/register/page.tsx`:69,69 |
| 30 | `#9fcbff` | 4 / 4 | chữ ×4, **điểm nhấn** | `c/product/ContentBlocksRenderer.tsx`:38,51,86,106 |
| 31 | `#e8c77a` | 4 / 4 | chữ ×3, viền ×1, **điểm nhấn** | `c/product/ContentBlocksRenderer.tsx`:40,53,97,108 |
| 32 | `rgba(0,0,0,0.90)` | 4 / 4 | gradient ×4 | `c/homepage/HeroSection.tsx`:383,383,385,385 |
| 33 | `rgba(14,52,128,0.28)` | 4 / 4 | hằng số JS/khác ×4, **điểm nhấn** | `a/auth/login/page.tsx`:310,413; `a/auth/register/page.tsx`:215,305 |
| 34 | `rgba(15,19,32,0.55)` | 4 / 4 | chữ ×4 | `c/homepage/AIDesignerSection.tsx`:118,181,194; `c/homepage/MaterialSection.tsx`:126 |
| 35 | `rgba(220,234,247,0.10)` | 4 / 4 | viền ×4 | `c/homepage/FinalCTASection.tsx`:45; `c/homepage/SolutionSection.tsx`:43,55; `c/homepage/UseCaseSection.tsx`:79 |
| 36 | `rgba(241,240,234,0.45)` | 4 / 4 | chữ ×4 | `a/products/[id]/page.tsx`:133,157; `c/common/Footer.tsx`:19; `c/homepage/FinalCTASection.tsx`:125 |
| 37 | `rgba(241,240,234,0.65)` | 4 / 4 | chữ ×4 | `c/common/Navbar.tsx`:476,532,550; `c/homepage/HeroSection.tsx`:289 |
| 38 | `rgba(255,255,255,0.10)` | 4 / 4 | viền ×2, hằng số JS/khác ×2 | `a/auth/login/page.tsx`:408,410; `a/auth/register/page.tsx`:300,302 |
| 39 | `#0d131f` | 3 / 3 | nền tối ×3 | `a/[slug]/page.tsx`:64; `a/layout.tsx`:39; `a/products/page.tsx`:27 |
| 40 | `#aecde8` | 3 / 3 | chữ ×3, **điểm nhấn** | `a/auth/login/page.tsx`:338,439; `a/auth/register/page.tsx`:324 |
| 41 | `rgba(0,0,0,0.22)` | 3 / 3 | bóng ×1, hằng số JS/khác ×2 | `a/auth/login/page.tsx`:411; `a/auth/register/page.tsx`:303; `c/homepage/HeroSection.tsx`:298 |
| 42 | `rgba(0,0,0,0.28)` | 3 / 3 | bóng ×1, hằng số JS/khác ×2 | `a/auth/login/page.tsx`:308; `a/auth/register/page.tsx`:214; `c/homepage/HeroSection.tsx`:298 |
| 43 | `rgba(15,19,32,0.42)` | 3 / 3 | chữ ×3 | `c/homepage/AIDesignerSection.tsx`:169,199,226 |
| 44 | `rgba(15,19,32,0.45)` | 3 / 3 | chữ ×2, hằng số JS/khác ×1 | `c/homepage/FinalCTASection.tsx`:49; `c/product/ProductOptionSelector.tsx`:146,163 |
| 45 | `rgba(15,19,32,0.50)` | 3 / 3 | chữ ×3 | `c/homepage/AIDesignerSection.tsx`:145; `c/homepage/FAQSection.tsx`:87; `c/product/ProductOptionSelector.tsx`:201 |
| 46 | `rgba(220,234,247,0.50)` | 3 / 3 | chữ ×3 | `c/homepage/SolutionSection.tsx`:62; `c/homepage/UseCaseSection.tsx`:41,72 |
| 47 | `rgba(241,240,234,0.20)` | 3 / 3 | chữ ×3 | `a/products/[id]/page.tsx`:181,187,196 |
| 48 | `rgba(241,240,234,0.28)` | 3 / 3 | phủ mờ/overlay ×1, chữ ×2 | `c/common/Footer.tsx`:83,88; `c/common/Navbar.tsx`:790 |
| 49 | `rgba(241,240,234,0.42)` | 3 / 3 | chữ ×3 | `c/common/Footer.tsx`:41,53,65 |
| 50 | `white/20` | 3 / 3 | viền ×3 | `a/auth/login/page.tsx`:62; `a/auth/register/page.tsx`:51; `a/products/[id]/page.tsx`:261 |
| 51 | `white/80` | 3 / 3 | chữ ×2, viền ×1 | `c/homepage/AIDesignerSection.tsx`:270; `c/homepage/FinalCTASection.tsx`:150; `c/homepage/HeroSection.tsx`:307 |
| 52 | `#15803d` | 2 / 3 | chữ ×2, khai báo token ×1, **điểm nhấn** | `a/globals.css`:149,296,301 |
| 53 | `#161b2c` | 2 / 2 | nền tối ×2 | `a/products/[id]/page.tsx`:204,414 |
| 54 | `#4a6a8a` | 2 / 2 | chữ ×2 | `a/auth/login/page.tsx`:435; `a/auth/register/page.tsx`:320 |
| 55 | `#6a8faf` | 2 / 2 | chữ ×2 | `a/auth/login/page.tsx`:322; `a/auth/register/page.tsx`:226 |
| 56 | `#78674a` | 2 / 2 | chữ ×2 | `a/globals.css`:297,303 |
| 57 | `#7ab8e0` | 2 / 2 | chữ ×2, **điểm nhấn** | `a/auth/login/page.tsx`:439; `a/auth/register/page.tsx`:324 |
| 58 | `#8dcbf0` | 2 / 2 | chữ ×2, **điểm nhấn** | `a/auth/login/page.tsx`:92; `a/auth/register/page.tsx`:69 |
| 59 | `#ecca3e` | 2 / 3 | chữ ×1, hằng số JS/khác ×1, khai báo token ×1, **điểm nhấn** | `a/auth/login/page.tsx`:337; `a/globals.css`:65; `a/products/page.tsx`:377 |
| 60 | `#f0f8ff` | 2 / 2 | chữ ×2 | `a/auth/login/page.tsx`:319; `a/auth/register/page.tsx`:223 |
| 61 | `#f7faff` | 2 / 4 | nền sáng ×2, khai báo token ×2 | `a/globals.css`:81,88; `c/ui/MediaUpload.tsx`:139,168 _(không được dùng)_ |
| 62 | `#fbfaf6` | 2 / 2 | nền sáng ×2 | `c/homepage/AIDesignerSection.tsx`:83; `c/homepage/MaterialSection.tsx`:61 |
| 63 | `black/40` | 2 / 2 | phủ mờ/overlay ×2 | `c/product/ContentBlockEditor.tsx`:319 _(chỉ admin)_; `c/ui/Modal.tsx`:74 _(chỉ admin)_ |
| 64 | `rgba(0,0,0,0.6)` | 2 / 2 | bóng ×2 | `c/common/Navbar.tsx`:489,564 |
| 65 | `rgba(10,42,110,0.45)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/auth/login/page.tsx`:218; `a/auth/register/page.tsx`:144 |
| 66 | `rgba(12,44,110,0.92)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/auth/login/page.tsx`:407; `a/auth/register/page.tsx`:299 |
| 67 | `rgba(120,103,74,0.09)` | 2 / 2 | phủ mờ/overlay ×2 | `a/globals.css`:297,303 |
| 68 | `rgba(14,52,128,0.50)` | 2 / 2 | hằng số JS/khác ×2, **điểm nhấn** | `a/auth/login/page.tsx`:412; `a/auth/register/page.tsx`:304 |
| 69 | `rgba(14,58,145,0.62)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/auth/login/page.tsx`:214; `a/auth/register/page.tsx`:140 |
| 70 | `rgba(15,19,32,0.16)` | 2 / 2 | viền ×1, gradient ×1 | `c/homepage/AIDesignerSection.tsx`:194; `c/homepage/HeroSection.tsx`:399 |
| 71 | `rgba(15,19,32,0.30)` | 2 / 2 | viền ×2 | `c/homepage/AIDesignerSection.tsx`:118,141 |
| 72 | `rgba(15,19,32,0.32)` | 2 / 2 | chữ ×2 | `c/homepage/AIDesignerSection.tsx`:101; `c/product/ProductOptionSelector.tsx`:317 |
| 73 | `rgba(15,19,32,0.35)` | 2 / 2 | phủ mờ/overlay ×1, chữ ×1 | `c/common/Navbar.tsx`:396; `c/homepage/AIDesignerSection.tsx`:281 |
| 74 | `rgba(18,68,172,0.38)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/auth/login/page.tsx`:253; `a/auth/register/page.tsx`:176 |
| 75 | `rgba(182,161,123,0.65)` | 2 / 2 | chữ ×2 | `c/homepage/SolutionSection.tsx`:57; `c/homepage/UseCaseSection.tsx`:66 |
| 76 | `rgba(2,5,18,0.72)` | 2 / 2 | hằng số JS/khác ×2 | `a/auth/login/page.tsx`:312; `a/auth/register/page.tsx`:216 |
| 77 | `rgba(2,5,18,0.75)` | 2 / 2 | bóng ×2 | `a/globals.css`:372,382 |
| 78 | `rgba(21,128,61,0.10)` | 2 / 3 | phủ mờ/overlay ×2, khai báo token ×1, **điểm nhấn** | `a/globals.css`:150,296,301 |
| 79 | `rgba(21,128,61,0.25)` | 2 / 2 | viền ×2, **điểm nhấn** | `a/globals.css`:296,301 |
| 80 | `rgba(236,202,62,0.07)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/auth/login/page.tsx`:220; `a/auth/register/page.tsx`:146 |
| 81 | `rgba(239,68,68,0.08)` | 2 / 2 | phủ mờ/overlay ×2, **điểm nhấn** | `a/auth/login/page.tsx`:377; `a/auth/register/page.tsx`:274 |
| 82 | `rgba(239,68,68,0.14)` | 2 / 2 | viền ×2, **điểm nhấn** | `a/auth/login/page.tsx`:378; `a/auth/register/page.tsx`:275 |
| 83 | `rgba(24,72,165,0.88)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/auth/login/page.tsx`:407; `a/auth/register/page.tsx`:299 |
| 84 | `rgba(241,240,234,0.10)` | 2 / 2 | viền ×1, hằng số JS/khác ×1 | `c/common/Navbar.tsx`:417; `c/homepage/FinalCTASection.tsx`:49 |
| 85 | `rgba(241,240,234,0.18)` | 2 / 2 | phủ mờ/overlay ×1, hằng số JS/khác ×1 | `c/common/Navbar.tsx`:777,786 |
| 86 | `rgba(241,240,234,0.60)` | 2 / 2 | chữ ×2 | `a/products/[id]/page.tsx`:137; `c/homepage/FinalCTASection.tsx`:109 |
| 87 | `rgba(241,240,234,0.75)` | 2 / 2 | chữ ×2 | `a/products/[id]/page.tsx`:197,261 |
| 88 | `rgba(248,113,113,0.52)` | 2 / 2 | viền ×2, **điểm nhấn** | `a/auth/login/page.tsx`:379; `a/auth/register/page.tsx`:276 |
| 89 | `rgba(25,43,136,0.048)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/globals.css`:337,338 |
| 90 | `rgba(25,43,136,0.05)` | 2 / 2 | hằng số JS/khác ×2, **điểm nhấn** | `a/globals.css`:359,360 |
| 91 | `rgba(255,255,255,0.04)` | 2 / 2 | hằng số JS/khác ×2 | `a/auth/login/page.tsx`:306; `a/auth/register/page.tsx`:213 |
| 92 | `rgba(255,255,255,0.07)` | 2 / 2 | viền ×2 | `a/globals.css`:371,381 |
| 93 | `rgba(255,255,255,0.11)` | 2 / 2 | viền ×2 | `a/auth/login/page.tsx`:301; `a/auth/register/page.tsx`:210 |
| 94 | `rgba(255,255,255,0.13)` | 2 / 2 | hằng số JS/khác ×2 | `a/auth/login/page.tsx`:304; `a/auth/register/page.tsx`:212 |
| 95 | `rgba(255,255,255,0.28)` | 2 / 2 | gradient ×2 | `c/homepage/HeroSectionBackground.tsx`:33,33 |
| 96 | `rgba(255,255,255,0.50)` | 2 / 2 | gradient ×2 | `c/homepage/HeroSectionBackground.tsx`:36,38 |
| 97 | `rgba(255,255,255,0.6)` | 2 / 2 | gradient ×2 | `c/homepage/FinalCTASection.tsx`:30,30 |
| 98 | `rgba(255,255,255,0.85)` | 2 / 2 | gradient ×2 | `c/homepage/HeroSectionBackground.tsx`:36,38 |
| 99 | `rgba(28,55,115,0.70)` | 2 / 2 | hằng số JS/khác ×2, **điểm nhấn** | `a/auth/login/page.tsx`:406; `a/auth/register/page.tsx`:298 |
| 100 | `rgba(4,10,30,0.50)` | 2 / 2 | hằng số JS/khác ×2 | `a/auth/login/page.tsx`:313; `a/auth/register/page.tsx`:217 |
| 101 | `rgba(6,12,30,0.96)` | 2 / 2 | nền tối ×2 | `a/globals.css`:370,378 |
| 102 | `rgba(6,18,60,0.48)` | 2 / 2 | gradient ×2 | `a/auth/login/page.tsx`:216; `a/auth/register/page.tsx`:142 |
| 103 | `rgba(7,15,38,0.60)` | 2 / 2 | nền tối ×2 | `a/auth/login/page.tsx`:298; `a/auth/register/page.tsx`:207 |
| 104 | `rgba(8,42,110,0.28)` | 2 / 2 | gradient ×2, **điểm nhấn** | `a/auth/login/page.tsx`:254; `a/auth/register/page.tsx`:177 |
| 105 | `rgba(8,51,125,0.08)` | 2 / 3 | bóng ×1, hằng số JS/khác ×1, khai báo token ×1, **điểm nhấn** | `a/globals.css`:73; `c/product/ContentBlockEditor.tsx`:1104 _(chỉ admin)_; `c/ui/Modal.tsx`:89 _(chỉ admin)_ |
| 106 | `rgba(8,51,125,0.12)` | 2 / 2 | bóng ×2, **điểm nhấn** | `c/product/ContentBlockEditor.tsx`:330 _(chỉ admin)_; `c/ui/Modal.tsx`:89 _(chỉ admin)_ |
| 107 | `white/15` | 2 / 2 | phủ mờ/overlay ×1, viền ×1 | `c/common/Navbar.tsx`:428,534 |
| 108 | `white/30` | 2 / 2 | chữ ×2 | `a/auth/login/page.tsx`:364; `a/auth/register/page.tsx`:261 |
| 109 | `white/35` | 2 / 2 | chữ ×2 | `a/auth/login/page.tsx`:229; `a/auth/register/page.tsx`:155 |
| 110 | `white/40` | 2 / 2 | phủ mờ/overlay ×1, viền ×1 | `a/products/[id]/page.tsx`:261; `c/ui/MediaUpload.tsx`:183 _(không được dùng)_ |
| 111 | `white/90` | 2 / 2 | nền sáng ×1, chữ ×1 | `c/product/ContentBlocksRenderer.tsx`:250; `c/ui/MediaUpload.tsx`:198 _(không được dùng)_ |
| 112 | `#081426` | 1 / 6 | chữ ×1, khai báo token ×5 | `a/globals.css`:24,51,89,92,122,315 |
| 113 | `#0a0b24` | 1 / 1 | nền tối ×1 | `c/product/ContentBlocksRenderer.tsx`:184 |
| 114 | `#1d4ed8` | 1 / 1 | chữ ×1, **điểm nhấn** | `a/globals.css`:298 |
| 115 | `#4338ca` | 1 / 1 | chữ ×1, **điểm nhấn** | `a/globals.css`:300 |
| 116 | `#b45309` | 1 / 2 | chữ ×1, khai báo token ×1, **điểm nhấn** | `a/globals.css`:151,299 |
| 117 | `#dc2626` | 1 / 2 | chữ ×1, khai báo token ×1, **điểm nhấn** | `a/globals.css`:153,302 |
| 118 | `#ece1c9` | 1 / 1 | nền sáng ×1 | `a/globals.css`:207 |
| 119 | `#edebe1` | 1 / 1 | nền sáng ×1 | `c/homepage/AIDesignerSection.tsx`:222 |
| 120 | `#fafaf8` | 1 / 2 | nền sáng ×1, khai báo token ×1 | `a/globals.css`:42,314 |
| 121 | `black/22` | 1 / 1 | bóng ×1 | `c/homepage/FinalCTASection.tsx`:141 |
| 122 | `black/60` | 1 / 1 | nền tối ×1 | `c/product/ContentBlockEditor.tsx`:879 _(chỉ admin)_ |
| 123 | `black/72` | 1 / 1 | nền tối ×1 | `a/products/[id]/page.tsx`:354 |
| 124 | `rgba(0,0,0,0.16)` | 1 / 1 | bóng ×1 | `c/homepage/HeroSection.tsx`:298 |
| 125 | `rgba(0,0,0,0.18)` | 1 / 1 | bóng ×1 | `c/homepage/HeroSection.tsx`:298 |
| 126 | `rgba(0,0,0,0.85)` | 1 / 1 | bóng ×1 | `a/products/[id]/page.tsx`:359 |
| 127 | `rgba(120,103,74,0.18)` | 1 / 1 | viền ×1 | `a/globals.css`:303 |
| 128 | `rgba(120,103,74,0.22)` | 1 / 1 | viền ×1 | `a/globals.css`:297 |
| 129 | `rgba(15,19,32,0.06)` | 1 / 1 | gradient ×1 | `c/homepage/MaterialSection.tsx`:74 |
| 130 | `rgba(15,19,32,0.09)` | 1 / 1 | phủ mờ/overlay ×1 | `c/homepage/MaterialSection.tsx`:73 |
| 131 | `rgba(15,19,32,0.28)` | 1 / 1 | viền ×1 | `c/homepage/AIDesignerSection.tsx`:280 |
| 132 | `rgba(15,19,32,0.38)` | 1 / 1 | chữ ×1 | `c/homepage/ProcessSection.tsx`:81 |
| 133 | `rgba(15,19,32,0.40)` | 1 / 1 | chữ ×1 | `c/product/ProductOptionSelector.tsx`:355 |
| 134 | `rgba(15,19,32,0.60)` | 1 / 1 | chữ ×1 | `c/product/ProductOptionSelector.tsx`:141 |
| 135 | `rgba(15,19,32,0.72)` | 1 / 1 | chữ ×1 | `c/homepage/ProblemSection.tsx`:52 |
| 136 | `rgba(15,19,32,0.75)` | 1 / 1 | chữ ×1 | `c/product/ProductOptionSelector.tsx`:350 |
| 137 | `rgba(15,19,32,0.80)` | 1 / 1 | gradient ×1 | `c/homepage/HeroSection.tsx`:399 |
| 138 | `rgba(15,19,32,0.94)` | 1 / 1 | nền tối ×1 | `c/common/Navbar.tsx`:416 |
| 139 | `rgba(15,19,32,0.97)` | 1 / 1 | gradient ×1 | `c/homepage/HeroSection.tsx`:399 |
| 140 | `rgba(159,203,255,0.28)` | 1 / 1 | bóng ×1, **điểm nhấn** | `c/product/ContentBlocksRenderer.tsx`:95 |
| 141 | `rgba(169,171,165,0.2)` | 1 / 1 | phủ mờ/overlay ×1 | `c/homepage/ProductTypeSection.tsx`:192 |
| 142 | `rgba(169,171,165,0.30)` | 1 / 1 | phủ mờ/overlay ×1 | `c/homepage/AIDesignerSection.tsx`:247 |
| 143 | `rgba(180,83,9,0.08)` | 1 / 1 | phủ mờ/overlay ×1, **điểm nhấn** | `a/globals.css`:299 |
| 144 | `rgba(180,83,9,0.22)` | 1 / 1 | viền ×1, **điểm nhấn** | `a/globals.css`:299 |
| 145 | `rgba(182,161,123,0.04)` | 1 / 1 | gradient ×1 | `c/homepage/HomepageNarrativeMotif.tsx`:144 |
| 146 | `rgba(182,161,123,0.09)` | 1 / 1 | gradient ×1 | `c/homepage/HomepageNarrativeMotif.tsx`:144 |
| 147 | `rgba(182,161,123,0.14)` | 1 / 1 | hằng số JS/khác ×1 | `c/homepage/HomepageNarrativeMotif.tsx`:124 |
| 148 | `rgba(182,161,123,0.35)` | 1 / 1 | gradient ×1 | `c/homepage/HeroSectionBackground.tsx`:62 |
| 149 | `rgba(220,234,247,0.14)` | 1 / 1 | viền ×1 | `c/homepage/UseCaseSection.tsx`:64 |
| 150 | `rgba(220,234,247,0.32)` | 1 / 1 | chữ ×1 | `c/homepage/UseCaseSection.tsx`:79 |
| 151 | `rgba(220,234,247,0.45)` | 1 / 1 | chữ ×1 | `c/homepage/BrandStatementSection.tsx`:67 |
| 152 | `rgba(220,38,38,0.08)` | 1 / 2 | phủ mờ/overlay ×1, khai báo token ×1, **điểm nhấn** | `a/globals.css`:154,302 |
| 153 | `rgba(220,38,38,0.20)` | 1 / 1 | viền ×1, **điểm nhấn** | `a/globals.css`:302 |
| 154 | `rgba(232,199,122,0.28)` | 1 / 1 | bóng ×1, **điểm nhấn** | `c/product/ContentBlocksRenderer.tsx`:97 |
| 155 | `rgba(236,202,62,0.13)` | 1 / 1 | viền ×1, **điểm nhấn** | `a/auth/login/page.tsx`:333 |
| 156 | `rgba(236,202,62,0.55)` | 1 / 1 | viền ×1, **điểm nhấn** | `a/auth/login/page.tsx`:334 |
| 157 | `rgba(241,240,234,0.12)` | 1 / 1 | gradient ×1 | `c/homepage/FinalCTASection.tsx`:37 |
| 158 | `rgba(241,240,234,0.15)` | 1 / 1 | gradient ×1 | `c/homepage/FinalCTASection.tsx`:74 |
| 159 | `rgba(241,240,234,0.24)` | 1 / 1 | chữ ×1 | `c/common/Footer.tsx`:93 |
| 160 | `rgba(241,240,234,0.25)` | 1 / 1 | gradient ×1 | `c/homepage/FinalCTASection.tsx`:73 |
| 161 | `rgba(241,240,234,0.46)` | 1 / 1 | chữ ×1 | `c/homepage/HeroSection.tsx`:326 |
| 162 | `rgba(241,240,234,0.55)` | 1 / 1 | chữ ×1 | `c/common/Navbar.tsx`:450 |
| 163 | `rgba(241,240,234,0.6)` | 1 / 1 | chữ ×1 | `c/common/Footer.tsx`:88 |
| 164 | `rgba(241,240,234,0.62)` | 1 / 1 | chữ ×1 | `a/products/[id]/page.tsx`:234 |
| 165 | `rgba(241,240,234,0.70)` | 1 / 1 | chữ ×1 | `a/products/[id]/page.tsx`:163 |
| 166 | `rgba(25,43,136,0.055)` | 1 / 1 | phủ mờ/overlay ×1, **điểm nhấn** | `a/globals.css`:344 |
| 167 | `rgba(25,43,136,0.065)` | 1 / 1 | phủ mờ/overlay ×1, **điểm nhấn** | `a/globals.css`:331 |
| 168 | `rgba(25,43,136,0.12)` | 1 / 1 | bóng ×1, **điểm nhấn** | `c/homepage/AIDesignerSection.tsx`:140 |
| 169 | `rgba(25,43,136,0.22)` | 1 / 1 | bóng ×1, **điểm nhấn** | `c/ui/Button.tsx`:18 |
| 170 | `rgba(25,43,136,0.30)` | 1 / 1 | gradient ×1, **điểm nhấn** | `c/homepage/HeroSectionBackground.tsx`:52 |
| 171 | `rgba(25,43,136,0.35)` | 1 / 1 | phủ mờ/overlay ×1, **điểm nhấn** | `c/homepage/ProcessSection.tsx`:66 |
| 172 | `rgba(255,255,255,0.08)` | 1 / 1 | viền ×1 | `c/homepage/FinalCTASection.tsx`:120 |
| 173 | `rgba(255,255,255,0.09)` | 1 / 1 | hằng số JS/khác ×1 | `a/auth/login/page.tsx`:285 |
| 174 | `rgba(255,255,255,0.48)` | 1 / 1 | phủ mờ/overlay ×1 | `c/homepage/AIDesignerSection.tsx`:247 |
| 175 | `rgba(255,255,255,0.7)` | 1 / 1 | nền sáng ×1 | `c/homepage/ProductTypeSection.tsx`:192 |
| 176 | `rgba(255,255,255,0.92)` | 1 / 1 | nền sáng ×1 | `c/product/ContentBlockEditor.tsx`:1104 _(chỉ admin)_ |
| 177 | `rgba(255,255,255,0.96)` | 1 / 1 | nền sáng ×1 | `c/homepage/AIDesignerSection.tsx`:247 |
| 178 | `rgba(37,99,235,0.07)` | 1 / 1 | phủ mờ/overlay ×1, **điểm nhấn** | `a/globals.css`:298 |
| 179 | `rgba(37,99,235,0.20)` | 1 / 1 | viền ×1, **điểm nhấn** | `a/globals.css`:298 |
| 180 | `rgba(39,52,129,0.18)` | 1 / 1 | bóng ×1, **điểm nhấn** | `a/products/page.tsx`:413 |
| 181 | `rgba(39,52,129,0.20)` | 1 / 1 | bóng ×1, **điểm nhấn** | `a/products/page.tsx`:315 |
| 182 | `rgba(39,52,129,0.35)` | 1 / 1 | bóng ×1, **điểm nhấn** | `c/product/ContentBlocksRenderer.tsx`:99 |
| 183 | `rgba(6,12,30,0.0)` | 1 / 1 | bóng ×1 | `a/globals.css`:395 |
| 184 | `rgba(8,18,42,0.55)` | 1 / 1 | nền tối ×1 | `a/auth/login/page.tsx`:283 |
| 185 | `rgba(8,20,38,0.55)` | 1 / 1 | hằng số JS/khác ×1 | `c/homepage/FinalCTASection.tsx`:49 |
| 186 | `rgba(8,51,125,0.04)` | 1 / 1 | bóng ×1, **điểm nhấn** | `c/product/ContentBlockEditor.tsx`:682 _(chỉ admin)_ |
| 187 | `rgba(8,51,125,0.05)` | 1 / 1 | hằng số JS/khác ×1, **điểm nhấn** | `a/globals.css`:269 |
| 188 | `rgba(8,51,125,0.06)` | 1 / 1 | bóng ×1, **điểm nhấn** | `a/globals.css`:202 |
| 189 | `rgba(8,51,125,0.22)` | 1 / 1 | phủ mờ/overlay ×1, **điểm nhấn** | `a/auth/login/page.tsx`:332 |
| 190 | `rgba(8,51,125,0.30)` | 1 / 1 | viền ×1, **điểm nhấn** | `a/globals.css`:185 |
| 191 | `rgba(99,102,241,0.08)` | 1 / 1 | phủ mờ/overlay ×1, **điểm nhấn** | `a/globals.css`:300 |
| 192 | `rgba(99,102,241,0.20)` | 1 / 1 | viền ×1, **điểm nhấn** | `a/globals.css`:300 |
| 193 | `white/12` | 1 / 1 | viền ×1 | `c/homepage/HeroSection.tsx`:263 |
| 194 | `white/14` | 1 / 1 | viền ×1 | `c/homepage/FinalCTASection.tsx`:84 |
| 195 | `white/22` | 1 / 1 | viền ×1 | `c/homepage/HeroSection.tsx`:307 |
| 196 | `white/25` | 1 / 1 | viền ×1 | `c/homepage/FinalCTASection.tsx`:150 |
| 197 | `white/50` | 1 / 1 | viền ×1 | `c/homepage/FinalCTASection.tsx`:150 |
| 198 | `white/52` | 1 / 1 | viền ×1 | `c/homepage/HeroSection.tsx`:307 |
| 199 | `white/6` | 1 / 1 | phủ mờ/overlay ×1 | `c/homepage/FinalCTASection.tsx`:84 |
| 200 | `white/60` | 1 / 1 | nền sáng ×1 | `c/ui/MediaUpload.tsx`:178 _(không được dùng)_ |
| 201 | `white/7` | 1 / 1 | phủ mờ/overlay ×1 | `c/homepage/HeroSection.tsx`:263 |
| 202 | `white/70` | 1 / 1 | nền sáng ×1 | `c/ui/MediaUpload.tsx`:188 _(không được dùng)_ |
| 203 | `white/75` | 1 / 1 | chữ ×1 | `c/homepage/HeroSection.tsx`:266 |
| 204 | `#08337d` | 0 / 7 | khai báo token ×7, **điểm nhấn** | `a/globals.css`:30,53,93,96,128,155,159 |
| 205 | `#0d1e36` | 0 / 1 | khai báo token ×1 | `a/globals.css`:26 |
| 206 | `#0d2a55` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:28 |
| 207 | `#114f99` | 0 / 2 | khai báo token ×2, **điểm nhấn** | `a/globals.css`:32,129 |
| 208 | `#142a44` | 0 / 1 | khai báo token ×1 | `a/globals.css`:79 |
| 209 | `#2d4a6e` | 0 / 2 | khai báo token ×2, **điểm nhấn** | `a/globals.css`:55,123 |
| 210 | `#8a7350` | 0 / 1 | khai báo token ×1 | `a/globals.css`:134 |
| 211 | `#8dafc8` | 0 / 1 | khai báo token ×1 | `a/globals.css`:61 |
| 212 | `#d5d3c9` | 0 / 1 | khai báo token ×1 | `a/globals.css`:83 |
| 213 | `#ddd1b4` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:160 |
| 214 | `#eef5fc` | 0 / 1 | khai báo token ×1 | `a/globals.css`:47 |
| 215 | `#f0f6fc` | 0 / 1 | khai báo token ×1 | `a/globals.css`:44 |
| 216 | `#f1e8d6` | 0 / 1 | khai báo token ×1 | `a/globals.css`:115 |
| 217 | `#f5f2ea` | 0 / 1 | khai báo token ×1 | `a/globals.css`:40 |
| 218 | `#f7f2e6` | 0 / 1 | khai báo token ×1 | `a/globals.css`:113 |
| 219 | `#fffefa` | 0 / 1 | khai báo token ×1 | `a/globals.css`:114 |
| 220 | `rgba(150,119,66,0.16)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:118 |
| 221 | `rgba(150,119,66,0.32)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:119 |
| 222 | `rgba(17,79,153,0.20)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:75 |
| 223 | `rgba(180,83,9,0.10)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:152 |
| 224 | `rgba(182,161,123,0.16)` | 0 / 1 | khai báo token ×1 | `a/globals.css`:135 |
| 225 | `rgba(182,214,242,0.06)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:146 |
| 226 | `rgba(182,214,242,0.45)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:144 |
| 227 | `rgba(182,214,242,0.62)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:145 |
| 228 | `rgba(182,214,242,0.80)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:143 |
| 229 | `rgba(255,255,255,0.06)` | 0 / 1 | khai báo token ×1 | `a/globals.css`:140 |
| 230 | `rgba(39,52,129,0.22)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:141 |
| 231 | `rgba(74,116,167,0.15)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:76 |
| 232 | `rgba(8,20,38,0.38)` | 0 / 1 | khai báo token ×1 | `a/globals.css`:125 |
| 233 | `rgba(8,20,38,0.58)` | 0 / 1 | khai báo token ×1 | `a/globals.css`:94 |
| 234 | `rgba(8,51,125,0.07)` | 0 / 2 | khai báo token ×2, **điểm nhấn** | `a/globals.css`:130,156 |
| 235 | `rgba(8,51,125,0.10)` | 0 / 2 | khai báo token ×2, **điểm nhấn** | `a/globals.css`:68,91 |
| 236 | `rgba(8,51,125,0.14)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:74 |
| 237 | `rgba(8,51,125,0.17)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:69 |
| 238 | `rgba(8,51,125,0.28)` | 0 / 1 | khai báo token ×1, **điểm nhấn** | `a/globals.css`:70 |

### 2b. Màu bảng màu có sẵn của Tailwind (không qua hex)

| Nhóm | Số lần | Vị trí | Vai trò |
|---|---|---|---|
| `red-300…500` (+ `/10…/90`) | 24 | `a/auth/login/page.tsx`:61,91,114,375; `a/auth/register/page.tsx`:50,68,89,272; `a/products/page.tsx`:91,92,249,250; `a/products/[id]/page.tsx`:126,127; `c/product/ProductOptionSelector.tsx`:255,286,287,288 | báo lỗi (nền, viền, chữ) |
| `rose/pink/sky/amber/orange/violet/blue/yellow/emerald/cyan/purple/indigo/slate-50…200` | 30 | `src/data/homepageData.ts`:130,131,145,146,160,161,175,176,190,191,205,219–223,250,262,274,286,298,310 | gradient mockup quạt cho từng loại quạt/chất liệu và 5 màu mẫu AI Designer ("Ivory/Mint/Rose/Lavender/Sky") |

### 2c. Màu trong `src/data/homepageData.ts` (ngoài thư mục phạm vi, được render)

| Giá trị | Số lần | Vị trí | Vai trò |
|---|---|---|---|
| `#DCEAF7` | 3 | `homepageData.ts`:145,175,190 | màu nhấn mockup loại quạt |
| `#ECCA3E` | 1 | `homepageData.ts`:206 | màu nhấn mockup "Premium Gift" |
| `#F5F8FF` | 6 | `homepageData.ts`:250,262,274,286,298,310 | nền ảnh thẻ chất liệu |

### 2d. Số lượt màu viết cứng theo file (dùng cho ước lượng R3)

| File | Lượt màu viết cứng | Số giá trị khác nhau | Ghi chú |
|---|---|---|---|
| `app/globals.css` | 47 | 83 | đã trừ 79 dòng khai báo token; phần còn lại là CSS admin/auth/lưới |
| `app/products/page.tsx` | 103 | 9 |  |
| `components/common/Navbar.tsx` | 98 | 14 |  |
| `components/homepage/AIDesignerSection.tsx` | 79 | 25 |  |
| `app/products/[id]/page.tsx` | 69 | 17 |  |
| `components/product/ProductOptionSelector.tsx` | 57 | 13 |  |
| `app/auth/login/page.tsx` | 56 | 45 |  |
| `app/auth/register/page.tsx` | 47 | 39 |  |
| `components/homepage/ProductTypeSection.tsx` | 43 | 12 |  |
| `components/homepage/FinalCTASection.tsx` | 32 | 25 |  |
| `components/homepage/HeroSection.tsx` | 30 | 24 |  |
| `components/product/ContentBlocksRenderer.tsx` | 29 | 12 |  |
| `components/common/Footer.tsx` | 24 | 10 |  |
| `components/homepage/MaterialSection.tsx` | 24 | 12 |  |
| `components/ui/MediaUpload.tsx` | 19 | 10 | không được dùng |
| `components/homepage/ProcessSection.tsx` | 15 | 9 |  |
| `components/homepage/HeroCanvas.tsx` | 14 | 5 | hero legacy, không render |
| `components/homepage/UseCaseSection.tsx` | 14 | 11 |  |
| `components/ui/Button.tsx` | 13 | 6 |  |
| `components/product/ContentBlockEditor.tsx` | 11 | 10 | chỉ admin |
| `components/homepage/HeroSectionBackground.tsx` | 11 | 6 |  |
| `components/homepage/FAQSection.tsx` | 10 | 6 |  |
| `components/homepage/SolutionSection.tsx` | 10 | 7 |  |
| `components/homepage/BrandStatementSection.tsx` | 8 | 7 |  |
| `components/homepage/ProblemSection.tsx` | 7 | 6 |  |
| `app/[slug]/page.tsx` | 3 | 2 |  |
| `components/ui/Modal.tsx` | 3 | 3 | chỉ admin |
| `components/homepage/HomepageNarrativeMotif.tsx` | 3 | 3 |  |
| `components/homepage/HeroVisualStage.tsx` | 1 | 1 |  |
| `app/layout.tsx` | 1 | 1 |  |

---

## 3. Token sẵn có trong `globals.css`

"Dùng trong phạm vi" = số lần `var(--token)` trong các file phạm vi; "ngoài" = số lần ở admin/content và các file khác. Không token màu nào được khai báo trong `@theme`, nên không có class Tailwind kiểu `bg-nan-dark`.

| Nhóm / khối | Token | Giá trị | Dùng trong phạm vi | Dùng ngoài phạm vi | Ghi chú |
|---|---|---|---|---|---|
| v4 `:root` (`:12–16`) | `--nan-dark` | `#0f1320` | 5 (`a/[slug]/page.tsx`:72; `c/common/Navbar.tsx`:396,489,564,654) | 2 (`PageArticle`, `BlockRenderer`) | 43 lượt khác viết cứng `#0f1320` |
| | `--nan-light` | `#f1f0ea` | 1 (`a/[slug]/page.tsx`:72) | 1 (`PreviewPanel`) | 88 lượt viết cứng `#f1f0ea` |
| | `--nan-blue` | `#192b88` | 0 | 1 (`BlockRenderer`) | 78 lượt viết cứng |
| | `--nan-muted` | `#a9aba5` | 0 | 0 | 35 lượt viết cứng |
| | `--nan-material` | `#b6a17b` | 0 | 1 (`BlockRenderer`) | 20 lượt viết cứng; cũng là `--admin-accent` |
| v3 `:root` (`:24–97`) | `--bg-dark`, `--bg-navy`, `--bg-blue-mid`, `--brand-primary`, `--brand-secondary`, `--soft-blue`, `--ice-blue`, `--bg-ivory`, `--bg-warm-white`, `--bg-cool-white`, `--surface-card`, `--surface-ice`, `--text-primary`, `--text-navy`, `--text-secondary`, `--text-muted`, `--text-on-dark`, `--text-soft-dark`, `--border-soft/med/strong`, `--shadow-card(-hover)`, `--glow-royal`, `--glow-ice`, `--deep-navy`, `--pearl`, `--stone`, `--background`, `--foreground`, `--surface`, `--border`, `--text-primary-c`, `--text-secondary-c`, `--text-muted-c`, `--accent-blue`, `--deep-blue`, `--highlight-blue` | xem file | **0** | **0** | không token nào được dùng qua `var()`; `--surface-card` khai báo 2 lần (`:46`, `:85`); `--background`/`--foreground` chỉ được `@theme` tham chiếu |
| | `--accent-gold` | `#ECCA3E` | 0 | 0 (1 trong CSS: `.cs-highlight`, `:244`) | dùng cho highlight Content Studio |
| admin `:root` (`:113–160`) | `--admin-*` (35 token) | xem file | 0 trên giao diện public (các lượt "trong phạm vi" đều nằm ở `ContentBlockEditor`, là file chỉ admin) | nhiều (admin) | ngoài phạm vi redesign |
| `@theme inline` (`:305–311`) | `--color-background`, `--color-foreground` | `var(--background)`, `var(--foreground)` | 0 | 0 | không class `bg-background`/`text-foreground` nào được dùng |
| | `--font-sans` | `var(--font-geist-sans)` | qua class/`body` | — | `body` đặt trực tiếp `font-family: var(--font-geist-sans)` (`:316`) |
| | `--font-mono` | `var(--font-geist-mono)` | 31 class `font-mono` | — | xem mục 4 |
| | `--font-serif` | `var(--font-eb-garamond), Georgia, serif` | 34 class `font-serif` (16 file) | — | |
| class CSS dùng chung | `.nan-grid-12` (`:351–365`) | lưới 12 cột | 1 (qua `EditorialGrid`) | — | xem mục 5 |
| | `.bg-grid-dots`, `.bg-grid-lines`, `.bg-grid-dots-warm` (`:330–346`) | lưới chấm/kẻ | **0** | **0** | CSS chết |
| | `.auth-glass-card`, `.auth-input`, `[data-auth]` (`:367–410`) | màu auth viết cứng | trang auth | — | `#05091A`, `#E8F2FC`, `rgba(6,12,30,…)` |

---

## 4. Font

**Nơi nạp font:**

| Font | Nạp ở | Biến | Nối vào Tailwind/CSS | Dùng |
|---|---|---|---|---|
| Geist Sans | `app/layout.tsx`:2 (import), 6–9 (`subsets: ["latin"]`), gắn class ở `:36` | `--font-geist-sans` | `globals.css`:308 (`--font-sans`), 316 (`body { font-family }`) | toàn bộ thân chữ (mặc định); ngoài phạm vi còn `components/intro/FanIntro.tsx`:237 (inline) |
| Geist Mono | `app/layout.tsx`:2, 11–14 (`subsets: ["latin"]`) | `--font-geist-mono` | `globals.css`:309 (`--font-mono`) | 31 chỗ `font-mono` (bảng dưới) |
| EB Garamond | `app/layout.tsx`:2, 16–20 (`subsets: ["latin"]`, weight 400–800) | `--font-eb-garamond` | `globals.css`:310 (`--font-serif`) | 34 chỗ `font-serif`; 2 chỗ inline `fontFamily` ở `a/auth/login/page.tsx`:272, `a/auth/register/page.tsx`:195 |

**Mọi chỗ dùng `font-mono`** (31). Theo quyết định, chỉ giữ ở bảng thông số sản phẩm (dòng đánh dấu **GIỮ**).

| # | File:dòng | Loại phần tử | Nội dung |
|---|---|---|---|
| 1 | `a/auth/login/page.tsx`:276 | nhãn thương hiệu dưới wordmark | "Custom Fan Design" |
| 2 | `a/auth/register/page.tsx`:199 | nhãn thương hiệu dưới wordmark | "Custom Fan Design" |
| 3 | `a/products/page.tsx`:431 | badge trên ảnh | "Tùy chỉnh" |
| 4 | `a/products/page.tsx`:440 | nhãn danh mục (thẻ sản phẩm) | `{product.categoryName}` |
| 5 | `a/products/[id]/page.tsx`:224 | nhãn danh mục (trên tiêu đề) | `{product.categoryName}` |
| 6 | `a/products/[id]/page.tsx`:397 | **nhãn thông số sản phẩm (`MetaStat`)**: GIỮ | "Sản xuất", … |
| 7 | `c/common/Footer.tsx`:15 | nhãn thương hiệu dưới wordmark | "Custom Fan Design" |
| 8 | `c/common/Footer.tsx`:28 | link mạng xã hội | "Instagram / Facebook / Zalo" |
| 9–11 | `c/common/Footer.tsx`:38, 50, 62 | tiêu đề cột footer | "Bộ sưu tập", "Dịch vụ", "Liên hệ" |
| 12 | `c/common/Footer.tsx`:83 | dòng bản quyền | "© 2026 Nan. All rights reserved." |
| 13 | `c/common/Footer.tsx`:88 | link pháp lý | "Điều khoản…", "Chính sách…" |
| 14 | `c/common/Footer.tsx`:93 | tagline | "Premium Vietnamese fan craft experience." |
| 15 | `c/common/Navbar.tsx`:404 | dải thông báo | `{announcementBar.text}` |
| 16 | `c/common/Navbar.tsx`:429 | nhãn thương hiệu cạnh wordmark | "Custom / Fan Design" |
| 17 | `c/homepage/AIDesignerSection.tsx`:226 | nhãn trạng thái | "Style selected" |
| 18 | `c/homepage/AIDesignerSection.tsx`:234 | nhãn trạng thái | "Preview mode" |
| 19 | `c/homepage/FinalCTASection.tsx`:87 | chữ trong badge | `{finalCta.badge}` |
| 20 | `c/homepage/FinalCTASection.tsx`:125 | nhãn số liệu | `{stat.label}` |
| 21 | `c/homepage/HeroSection.tsx`:266 | chữ trong badge | `{heroConfig.badge}` |
| 22 | `c/homepage/HeroSection.tsx`:323 | số thứ tự 01/02/03 (dòng proof) | `padStart` |
| 23 | `c/homepage/MaterialSection.tsx`:83 | tag chất liệu | `{item.tag}` ("Popular"…) |
| 24 | `c/homepage/MaterialSection.tsx`:121 | số thứ tự 01–04 (kiểm tra in) | `{step.n}` |
| 25 | `c/homepage/ProblemSection.tsx`:49 | số thứ tự | `padStart` |
| 26 | `c/homepage/ProcessSection.tsx`:81 | nhãn "Step" | "Step" |
| 27 | `c/homepage/ProcessSection.tsx`:84 | số bước quy trình | `{item.step}` |
| 28 | `c/homepage/ProductTypeSection.tsx`:101 | chữ trong badge trên ảnh | `{item.badge}` |
| 29 | `c/homepage/UseCaseSection.tsx`:66 | số thứ tự | `padStart` |
| 30 | `c/homepage/UseCaseSection.tsx`:79 | chip ví dụ | `{ex}` |
| 31 | `c/product/ProductOptionSelector.tsx`:312 | số thứ tự nhóm tùy chọn | `padStart` |

---

## 5. Lưới và hoa văn nền

| # | Vị trí | Loại | Chi tiết | Nơi dùng / ghi chú |
|---|---|---|---|---|
| 1 | `c/homepage/HeroSectionBackground.tsx`:30–38 | lưới kẻ 60px | `linear-gradient` 2 chiều `rgba(255,255,255,0.28)`, lớp `opacity-[0.07]`, mask chỉ nửa phải | Hero; cả trang `/dev/silk-fan` dùng chung |
| 2 | `c/homepage/BrandStatementSection.tsx`:17–21 | lưới kẻ 48px | `rgba(255,255,255,0.5)`, lớp `opacity-[0.028]` | Brand Statement |
| 3 | `c/homepage/SolutionSection.tsx`:16–20 | lưới kẻ 48px | `rgba(255,255,255,0.5)`, `opacity-[0.04]` | Giải pháp |
| 4 | `c/homepage/UseCaseSection.tsx`:17–21 | lưới kẻ 48px | `rgba(255,255,255,0.5)`, `opacity-[0.04]` | Ứng dụng |
| 5 | `c/homepage/FinalCTASection.tsx`:27–31 | lưới kẻ 48px | `rgba(255,255,255,0.6)`, `opacity-[0.035]` | CTA (toàn section) |
| 6 | `c/homepage/FinalCTASection.tsx`:64–68 | lưới kẻ 40px | `rgba(255,255,255,0.5)`, `opacity-[0.04]` | CTA (panel xanh bên trong) |
| 7 | `c/homepage/EditorialGrid.tsx`:5–13 → `.nan-grid-12` (`globals.css`:351–365) | lưới 12 cột dọc | `repeating-linear-gradient` `rgba(25,43,136,0.05)`, chỉ từ `lg` | dùng ở `ProductTypeSection`:37, `ProblemSection`:14, `AIDesignerSection`:49, `MaterialSection`:25, `ProcessSection`:17, `FAQSection`:17, `a/[slug]/page.tsx`:74, `a/products/[id]/page.tsx`:284 (8 chỗ, sửa 1 component là đổi hết) |
| 8 | `c/homepage/AIDesignerSection.tsx`:248 | chấm 10px | `radial-gradient(rgba(15,19,32,0.10) 0.7px…)` opacity 0.25 | trên mockup quạt |
| 9 | `c/homepage/MaterialSection.tsx`:73 | chấm 9px | `radial-gradient(rgba(15,19,32,0.09) 0.7px…)` opacity 0.28 | trên ảnh thẻ chất liệu |
| 10 | `globals.css`:330–346 | `.bg-grid-dots`, `.bg-grid-lines`, `.bg-grid-dots-warm` | lưới chấm/kẻ | **không nơi nào dùng** (CSS chết) |
| — | *(không phải lưới, liên quan cảm giác "tech")* | quầng sáng mờ | `rounded-full … blur-[80–90px]` `#192B88/10–12`: `BrandStatementSection`:28, `SolutionSection`:25, `UseCaseSection`:26, `FinalCTASection`:23; `radial-gradient` ở `HeroSectionBackground`:52,62 | quyết định giữ/bỏ để R2 |

---

## 6. Chip và badge

**Không có component chip/badge dùng chung** trong phạm vi: không có `Chip`/`Badge` trong `components/ui`. Lớp `.admin-badge` ở `globals.css:286–303` chỉ dành cho admin. Mọi chip đều viết trực tiếp trong từng file.

| # | File:dòng | Loại | Nội dung / nguồn | Kiểu hiện tại |
|---|---|---|---|---|
| 1 | `c/homepage/HeroSection.tsx`:263–268 | badge hiển thị (chấm + chữ) | `heroConfig.badge` "Vietnamese Heritage Fan Design" | viền `white/12`, nền `white/7`, chấm `#B6A17B` (`:265`), chữ mono hoa |
| 2 | `c/homepage/FinalCTASection.tsx`:84–88 | badge hiển thị (chấm + chữ) | `finalCta.badge` "Premium custom fan design" | viền `white/14`, nền `white/6`, chấm `#B6A17B` (`:86`), chữ mono hoa |
| 3 | `c/homepage/ProductTypeSection.tsx`:100–103 | badge phủ trên ảnh | `collections[].badge` ("For special moments"…) | viền `rgba(15,19,32,0.14)`, nền `#F1F0EA/92`, chữ mono `#192B88` |
| 4 | `c/homepage/UseCaseSection.tsx`:77–80 | chip ví dụ (3 chip mỗi mục) | `useCases[].examples` | viền `rgba(220,234,247,0.10)`, chữ mono `rgba(220,234,247,0.32)` |
| 5 | `a/products/page.tsx`:431 | badge phủ trên ảnh | "Tùy chỉnh" | nền `#273481/80`, chữ mono `#B6D6F2` |
| 6 | `c/homepage/MaterialSection.tsx`:83 | tag chữ (không viền) | `materials[].tag` ("Popular"…) | chữ mono hoa `#192B88/70` |
| 7 | `a/products/[id]/page.tsx`:224, `a/products/page.tsx`:440 | nhãn danh mục (không viền) | `categoryName` | chữ mono hoa |
| — | *Chip tương tác (bộ lọc/chọn): là điều khiển, không phải trang trí* | | | |
| 8 | `c/common/Navbar.tsx`:108 | gợi ý tìm kiếm | từ khóa gợi ý | viền `white/12`, hover `#B6A17B/50` |
| 9 | `c/homepage/AIDesignerSection.tsx`:115 | chọn phong cách | `aiDesignerConfig.styles` | viền/nền `#192B88` khi chọn |
| 10 | `a/products/page.tsx`:221 (+ các nút danh mục cùng khối) | lọc danh mục | "Tất cả dòng…", danh mục | viền `#1B1C4A`, chữ `#B6D6F2/50` |
| — | *Nút dạng viên thuốc (không phải chip)* | | | |
| 11 | `c/ui/Button.tsx`:28 (base `rounded-full`) | nút dùng chung | 3 biến thể | xem mục 9 |
| 12 | `a/products/page.tsx`:100, 258, 279; `a/products/[id]/page.tsx`:163, 254, 261; `c/homepage/AIDesignerSection.tsx`:194 | nút tự viết, không dùng `Button` | "Thử lại", "Chọn dòng khác", "Xem tất cả sản phẩm"… | màu riêng từng chỗ |

---

## 7. Khối đánh số

| # | Section / trang | File:dòng | Cách đánh số | Nguồn | Theo quyết định |
|---|---|---|---|---|---|
| 1 | Hero: dòng proof 01/02/03 | `c/homepage/HeroSection.tsx`:318–327 | `String(i + 1).padStart(2, "0")`, mono `#B6A17B` | `heroConfig.proofPoints` | bỏ |
| 2 | Vấn đề: danh sách điểm đau | `c/homepage/ProblemSection.tsx`:49–51 | `padStart`, mono `#192B88/70` | `problemSection.points` | bỏ |
| 3 | Giải pháp: 4 trụ cột | `c/homepage/SolutionSection.tsx`:57–59 | `padStart`, serif `rgba(182,161,123,0.65)` | `solutionSection.pillars` | bỏ |
| 4 | Chất liệu: 4 bước kiểm tra in 01–04 | `c/homepage/MaterialSection.tsx`:11–16 (dữ liệu), 121 (render) | chuỗi `n: "01"…"04"` | hằng số trong file | bỏ (nội dung là một chuỗi bước, xem mục Mâu thuẫn) |
| 5 | Ứng dụng: 5 nhóm | `c/homepage/UseCaseSection.tsx`:66–68 | `padStart`, mono `rgba(182,161,123,0.65)` | `useCases` | bỏ |
| 6 | **Quy trình: 5 bước** | `c/homepage/ProcessSection.tsx`:81–85; dữ liệu `data/homepageData.ts`:322–352 | nhãn "Step" + số `item.step` "01"–"05", mono `#192B88` | `processSteps` | **GIỮ** (nhãn chữ "Step" là tiếng Anh, xem mục 8) |
| 7 | Chi tiết sản phẩm: nhóm tùy chọn | `c/product/ProductOptionSelector.tsx`:308–314 | `padStart(stepNumber)`, mono `#192B88` | thứ tự nhóm tùy chọn | chưa rõ (không thuộc trang chủ; cần quyết định) |
| — | CTA: số liệu "5+ / 48h / 100% / ∞" | `c/homepage/FinalCTASection.tsx`:124–125; `homepageData.ts`:396–399 | số liệu, không phải thứ tự | `finalCta.stats` | không phải khối đánh số |

---

## 8. Nhãn tiếng Anh trong giao diện

| # | Chữ | Nơi hiển thị | Nguồn (file:dòng) |
|---|---|---|---|
| 1 | "Vietnamese Heritage Fan Design" | badge Hero | `data/homepageData.ts`:84 → `c/homepage/HeroSection.tsx`:266 |
| 2 | "For special moments", "Premium experience", "F&B branding", "Marketing & activation", "Mass production", "Corporate gifting" | badge trên ảnh loại quạt | `homepageData.ts`:122,137,152,167,182,197 → `ProductTypeSection.tsx`:102 |
| 3 | "Wedding Fans", "Resort & Hospitality", "Restaurant / Café", "Brand Campaign", "Event & Activation", "Premium Gift" | tên loại quạt | `homepageData.ts`:121,136,151,166,181,196 → `ProductTypeSection.tsx`:108 |
| 4 | "Popular", "Premium", "Elegant", "Vibrant", "Luxury", "Custom" | tag chất liệu | `homepageData.ts`:249,261,273,285,297,309 → `MaterialSection.tsx`:83 |
| 5 | "File check", "Color care", "Safe margin", "Production" | 4 bước kiểm tra in | `c/homepage/MaterialSection.tsx`:12–15 |
| 6 | "Style selected", "Preview mode", "Live Mockup" | nhãn trạng thái mockup | `c/homepage/AIDesignerSection.tsx`:227, 235, 237 |
| 7 | "Upload ảnh / logo" (trộn) | nút tải ảnh | `c/homepage/AIDesignerSection.tsx`:156 |
| 8 | "Uploaded fan artwork preview" | `alt` ảnh | `c/homepage/AIDesignerSection.tsx`:274 |
| 9 | "Wedding", "Resort" (lẫn trong danh sách tiếng Việt) | chip phong cách AI Designer | `homepageData.ts`:217 → `AIDesignerSection.tsx`:111 |
| 10 | "Ivory", "Mint", "Rose", "Lavender", "Sky" | tên màu mẫu (key, không hiển thị chữ) | `homepageData.ts`:219–223 |
| 11 | "AI Designer" | tên tính năng: footer, FAQ, trang chi tiết | `c/common/Footer.tsx`:54; `homepageData.ts`:413; `a/products/[id]/page.tsx`:269 |
| 12 | "Premium custom fan design" | badge CTA | `homepageData.ts`:380 → `FinalCTASection.tsx`:87 |
| 13 | "Step" | nhãn bước quy trình | `c/homepage/ProcessSection.tsx`:82 |
| 14 | "Brand Activation", "Resort & Khách sạn" (trộn) | tiêu đề nhóm ứng dụng | `homepageData.ts`:506, 530 → `UseCaseSection.tsx` |
| 15 | "Beach club", "Spa resort", "Boutique hotel", "Rooftop bar", "Garden café", "Fine dining", "Limited edition", "Sampling campaign", "Pop-up booth", "Trade show" | chip ví dụ ứng dụng | `homepageData.ts`:510, 518, 526, 534 → `UseCaseSection.tsx`:80 |
| 16 | "Texture sang hơn, phù hợp wedding, resort, … lifestyle" (trộn) | mô tả chất liệu | `homepageData.ts`:260 |
| 17 | "Upload logo trực tiếp" (trộn) | bảng so sánh | `homepageData.ts`:373 |
| 18 | "Custom Fan Design" / "Custom · Fan Design" | nhãn cạnh wordmark | `c/common/Navbar.tsx`:430; `c/common/Footer.tsx`:16; `a/auth/login/page.tsx`:277; `a/auth/register/page.tsx`:200 |
| 19 | "Wedding Fans", "Resort & Hospitality", "Brand Campaign", "Event & Activation", "Premium Gift" | cột "Bộ sưu tập" footer (viết cứng, lặp lại #3) | `c/common/Footer.tsx`:42 |
| 20 | "© 2026 Nan. All rights reserved.", "Premium Vietnamese fan craft experience." | dòng cuối footer | `c/common/Footer.tsx`:84, 94 |
| 21 | "Instagram", "Facebook", "Zalo" | link mạng xã hội | `c/common/Footer.tsx`:25 (tên riêng, có thể giữ) |
| — | "Collections", "AI Designer", "Materials", "Process", "Quote" | `navConfig.links` | `homepageData.ts`:51–55: **không được render** (`navConfig` không file nào import) |

---

## 9. Component dùng chung ứng viên cho R2

| # | Ứng viên | Hiện trạng | Số chỗ | File liên quan | Sửa một lần thì đổi được gì |
|---|---|---|---|---|---|
| 1 | **Section** (khung section: nền + màu chữ theo tone `indigo`/`paper`) | mỗi section tự viết `<section … style={{ background: "#0F1320" \| "#F1F0EA" }}>` + tự gắn lưới | 12 section trang chủ + 3 trang khác | toàn bộ `components/homepage/*Section.tsx`, `Footer`, `a/products/[id]`, `a/[slug]` | đổi nền chàm/giấy, màu chữ mặc định và bỏ lưới ở một chỗ |
| 2 | **SectionTitle** (tiêu đề section serif) | chuỗi class lặp: `font-serif text-4xl font-semibold leading-[1.12] tracking-tight md:text-5xl` với màu `text-white` hoặc `text-[#0F1320]` | 11 (+ H1 hero, tiêu đề CTA) | Problem, Solution, ProductType, AIDesigner, Material, UseCase, Process, FAQ, FinalCTA, BrandStatement, products | đổi màu chữ (ngà/mực), cỡ, giãn chữ đồng bộ |
| 3 | **MetaLine** (dòng chữ nối "·", thay chip/eyebrow) | nhãn chữ hoa giãn `uppercase tracking-[…em]` | 35 lượt / 14 file (AIDesigner 7, Navbar 7, Footer 5, ProductType 3, …) | xem mục 4, 6 | thay chip viền + eyebrow mono bằng một kiểu chữ nối |
| 4 | **Chip/Badge** → gộp vào MetaLine | 5 chip hiển thị + 2 tag chữ, không có component | 7 | Hero, FinalCTA, ProductType, UseCase, products, Material | bỏ viền/nền/chấm trang trí ở một chỗ |
| 5 | **Rule** (đường phân cách) | `h-px` (thường là gradient) + `border-t border-[rgba(15,19,32,0.1x)]` | 11 + 13 | Footer, FinalCTA, Material, FAQ, AIDesigner, ProductOptionSelector, … | màu đường kẻ theo tone, bỏ gradient trang trí |
| 6 | **Card** (bề mặt nổi) | sáng: `rounded-lg border border-[rgba(15,19,32,0.12)] bg-[#FBFAF6]/[#F1F0EA]`; tối: `bg-[#111335]` viền `#1B1C4A` | 8 sáng + 7 tối | ProductType, Material, AIDesigner, products | một hệ bo góc + bề mặt giấy/chàm |
| 7 | **Button** (`components/ui/Button.tsx`) | đã dùng chung ở 5 file trang chủ, nhưng màu viết cứng (`#192B88`, `#0F1320`, `#FFFFFF`, ring-offset `#F1F0EA`); trang sản phẩm tự viết 7 nút riêng | 5 + 7 | `c/ui/Button.tsx`; `a/products/*`; `AIDesignerSection`:194 | nút trên nền chàm dùng tre/ngà, trên nền giấy dùng navy |
| 8 | **EditorialGrid** | đã dùng chung | 8 | xem mục 5 | bỏ lưới 12 cột một lần là mất trên cả 8 chỗ |
| 9 | **IndexMarker** (số thứ tự) | `padStart` / chuỗi "01" lặp | 7 | xem mục 7 | chỉ còn ở Quy trình; các chỗ khác xóa |
| 10 | **Glow** (quầng sáng mờ) | `rounded-full … blur-[80–90px]` | 5 (+2 radial ở hero) | Brand, Solution, UseCase, FinalCTA, HeroSectionBackground | giữ/bỏ đồng bộ |

---

## Đề xuất token cho R1

**Cách đọc bài toán** (theo skill `design-taste` / `design-taste-frontend`):

> *Reading this as: redesign (giữ thương hiệu, đổi ngôn ngữ thị giác) cho website bán quạt in theo yêu cầu cao cấp, người xem là bên tổ chức sự kiện, khách sạn và doanh nghiệp; ngôn ngữ "xưởng quạt đương đại", cảm giác vật liệu thật; nền tảng là token CSS + Tailwind v4 sẵn có, EB Garamond cho tiêu đề và Be Vietnam Pro cho thân chữ.*

- **Chế độ redesign:** "Redesign, giữ thương hiệu" (theo `design-taste-frontend` §11). Giữ nguyên cấu trúc trang, route, `id` anchor và nhãn menu.
- **Ba chỉ số của skill** (bám theo site hiện tại): DESIGN_VARIANCE ≈ 6, MOTION_INTENSITY ≈ 5 (đã có GSAP + motion), VISUAL_DENSITY ≈ 4.

**Nguyên tắc áp dụng:**

- **Token ba lớp** (skill `design-system`): primitive (giá trị) → semantic (vai trò) → dùng trong component. Component chỉ dùng token semantic, không viết hex.
- **Đưa token màu vào `@theme`**, để có class kiểu `bg-indigo` / `text-paper` và thay được các chuỗi `bg-[#…]`.
- **Không dùng trắng tinh / đen tinh** (`design-taste`): trùng với quyết định chữ giấy ngà.
- **Tương phản** (mọi skill): chữ thường ≥ 4,5:1; chữ lớn ≥ 3:1. Bảng đo hiện trạng ở cuối mục này.
- **Ranh giới trách nhiệm:** R1 chỉ đặt tên và ánh xạ; **giá trị hex mới** (chàm làm ấm, ngà, tre, mực ấm) do R1 chọn, R0 không chốt.

### Token màu

| Token (semantic) | Vai trò | Giá trị hiện tại tương ứng | Sẽ thay các giá trị viết cứng | Ghi chú cho R1 |
|---|---|---|---|---|
| `--color-indigo` | nền chủ đạo tối (chàm, làm ấm nhẹ) | `#0F1320` (`--nan-dark`) | `#0f1320` dùng làm nền (Hero, 4 section tối, Footer, `/products/[id]`), `#0d131f` (body, `/products`, `/[slug]`), `#05091a` (auth), navbar `rgba(15,19,32,0.94/0.35)`, gradient hero `from-[#0F1320]` | làm ấm = kéo hue về phía tím/đỏ nhẹ, giữ độ sáng thấp; phải đạt ≥ 12:1 với `--color-paper` |
| `--color-indigo-raised` | bề mặt nổi trên nền tối (thẻ, panel, ô nhập) | `#111335` / `#1B1C4A` | `#111335` (11), `#1b1c4a` (36), panel CTA `#192B88` (`FinalCTASection:47`) | thống nhất bảng màu v2 của `/products` về hệ mới |
| `--color-on-indigo` | chữ chính trên nền tối (giấy ngà) | `#F1F0EA` | `text-white` (32), `#ffffff` (10), `#e8f2fc` (8), `#dceaf7` dạng chữ, `#b6d6f2` (41, `/products`, ContentBlocksRenderer) | có thể trỏ cùng primitive với `--color-paper` |
| `--color-on-indigo-muted` | chữ phụ trên nền tối | `rgba(241,240,234,0.60)` | `rgba(241,240,234,0.40–0.65)`, `rgba(220,234,247,0.45–0.50)`, `#a9aba5` (35), `white/65–80` | mức 0.60 đạt 6,4:1; 0.46 chỉ đạt 4,25:1 (xem bảng đo) |
| `--color-on-indigo-subtle` | chú thích nhỏ trên nền tối | `rgba(241,240,234,0.45)` | `rgba(241,240,234,0.24–0.45)`, `rgba(220,234,247,0.32)` | hiện 2,0–4,1:1; nên nâng tối thiểu lên mức muted |
| `--color-line-on-indigo` | viền, đường kẻ trên nền tối | `rgba(241,240,234,0.10)` | `white/10` (13), `white/12–20`, `rgba(220,234,247,0.10)` (4), viền `#273481` (13) và `#1b1c4a` (16) | |
| `--color-paper` | mảng giấy ngà (nền section sáng) | `#F1F0EA` (`--nan-light`) | `#f1f0ea` làm nền (22), `bg-[#F1F0EA]/92` | cùng primitive với `--color-on-indigo` |
| `--color-paper-raised` / `--color-paper-deep` | lớp giấy thứ cấp (panel, nền ảnh) | `#FBFAF6` / `#E7E4D8` | `#fbfaf6`, `#e7e4d8` (7), `#F5F8FF` (data, 6), `#f7faff` | |
| `--color-ink` | chữ mực ấm trên nền giấy | `#0F1320` (dạng chữ) | `text-[#0F1320]` (30) | "mực ấm" nên đi cùng hướng làm ấm với chàm |
| `--color-ink-muted` | chữ phụ trên nền giấy | `rgba(15,19,32,0.62)` | `rgba(15,19,32,0.55–0.72)` (~20), `0.38–0.50` | mức 0.62 đạt 4,95:1; 0.42 và 0.38 dưới 3:1 |
| `--color-line-on-paper` | viền, đường kẻ trên nền giấy | `rgba(15,19,32,0.14)` | `rgba(15,19,32,0.10–0.20)` (~57 lượt) | |
| `--color-bamboo` | **điểm nhấn trên nền tối** (tre) | `#B6A17B` (`--nan-material`) | `#b6a17b` (20), `rgba(182,161,123,0.65)`; các nhấn xanh đang đặt trên nền tối: nút `#192B88` ở `/products/[id]`, `#273481`/`#b6d6f2` ở `/products` | tre đặc đạt 7,4:1 trên nền tối; mức 0.65 chỉ 3,8:1 |
| `--color-navy` | **điểm nhấn chỉ trên mảng sáng** | `#192B88` (`--nan-blue`) | `#192b88` trên nền giấy (AIDesigner, ProductType, Process, FAQ, Material, Problem, `Button`) | 10,6:1 trên giấy; không dùng trên nền tối |
| `--color-danger` | báo lỗi | `red-400/500` (Tailwind) | 24 lượt `red-*` (mục 2b) | chọn một đỏ đạt 4,5:1 trên cả chàm lẫn giấy |

**Dọn dẹp đề xuất cho R1:**

- **Các nhóm có thể xóa sau khi xác nhận:**
  - khối token v3 `globals.css:24–97` (không nơi nào dùng);
  - các class `.bg-grid-*` (`:330–346`, không dùng);
  - `--surface-card` khai báo trùng.
- **Riêng `--accent-gold`:** đang được `.cs-highlight` dùng (`:244`), cần giữ hoặc đổi sang token nhấn mới.
- **Ngoài phạm vi redesign:** token `--admin-*`.
- **Cần quyết định riêng:** màu gradient mockup quạt trong `homepageData.ts` (mục 2b, 2c). Đây là màu minh họa sản phẩm, không phải màu hệ thống.

### Token font

| Token | Vai trò | Hiện tại | Đề xuất R1 | Sẽ thay ở |
|---|---|---|---|---|
| `--font-sans` | thân chữ | Geist (`--font-geist-sans`, chỉ `subsets: ["latin"]`) | **Be Vietnam Pro** qua `next/font/google`, `subsets: ["latin", "vietnamese"]`, weight 400/500/600 (thêm 700 nếu cần) | `app/layout.tsx`:2, 6–9, 36; `globals.css`:308, 316; ngoài phạm vi: `components/intro/FanIntro.tsx`:237 |
| `--font-serif` | tiêu đề | EB Garamond (`subsets: ["latin"]`, 400–800) | **giữ** EB Garamond; cân nhắc thêm subset `vietnamese` và giảm weight về số thực dùng (hiện chỉ thấy `font-semibold`) | `app/layout.tsx`:16–20; `globals.css`:310; thay 2 chỗ `fontFamily` inline ở auth (`login:272`, `register:195`) bằng class |
| `--font-mono` | **chỉ bảng thông số sản phẩm** | Geist Mono, 31 chỗ | giữ Geist Mono cho `MetaStat` (`a/products/[id]/page.tsx`:397); gỡ 30 chỗ còn lại (mục 4). Nếu chỉ còn một chỗ, cân nhắc bỏ nạp font mono | `app/layout.tsx`:11–14; `globals.css`:309 |

**Cần kiểm chứng ở R1:**

- **Tiếng Việt:** Geist Mono và EB Garamond hiện chỉ nạp subset `latin`. Tôi chưa kiểm chứng dấu tiếng Việt ("Sản xuất", "Hành trình") có hiển thị bằng đúng font hay đang rơi về font dự phòng.
- **Tên biến font mới:** đặt biến trung tính (ví dụ `--font-body`) để không phải đổi tên lần nữa.

### Bảng đo tương phản hiện trạng (tham khảo khi chọn giá trị R1)

| Cặp màu hiện tại | Tỉ lệ | Đạt |
|---|---|---|
| ngà `#F1F0EA` đặc trên `#0F1320` | 16,21:1 | có |
| ngà 0.65 (mô tả hero) trên tối | 7,32:1 | có |
| ngà 0.60 (thân CTA) trên tối | 6,41:1 | có |
| ngà 0.46 (dòng proof hero) trên tối | 4,25:1 | chỉ chữ lớn |
| ngà 0.40 (nhãn MetaStat) trên tối | 3,48:1 | chỉ chữ lớn |
| ngà 0.28 / 0.24 (bản quyền, tagline footer) trên tối | 2,33:1 / 2,02:1 | **không** |
| `#DCEAF7` 0.45 (thân Brand Statement) trên tối | 3,91:1 | chỉ chữ lớn |
| `#DCEAF7` 0.32 (chip ví dụ Ứng dụng) trên tối | 2,59:1 | **không** |
| `#A9ABA5` (chữ phụ nav/footer) trên tối | 7,98:1 | có |
| tre `#B6A17B` đặc / 0.65 trên tối | 7,38:1 / 3,77:1 | có / chỉ chữ lớn |
| mực `#0F1320` trên kem | 16,21:1 | có |
| mực 0.62 trên kem | 4,95:1 | có |
| mực 0.55 trên kem | 3,97:1 | chỉ chữ lớn |
| mực 0.42 ("Style selected") / 0.38 ("Step") trên kem | 2,69:1 / 2,41:1 | **không** |
| navy `#192B88` / 0.70 trên kem | 10,56:1 / 4,74:1 | có |

---

## Ước lượng số file R2, R3

| Bước | Nội dung | File mới | File sửa (trong phạm vi) | Ghi chú |
|---|---|---|---|---|
| R1 | token màu + font | 0 | **2**: `app/globals.css`, `app/layout.tsx` | ngoài phạm vi thêm `components/intro/FanIntro.tsx` nếu còn dùng |
| R2 | component dùng chung (mục 9) + bỏ lưới, chip, mono, đánh số | **~5–6**: Section, SectionTitle, MetaLine, Rule, Card, (IndexMarker) | **~18–20**: 12 section trang chủ, `Navbar`, `Footer`, `Button`, `EditorialGrid`, `HeroSectionBackground`, `a/products/page.tsx`, `a/products/[id]/page.tsx`, `ProductOptionSelector` | |
| R3 | thay màu viết cứng còn lại theo từng trang | 0 | **~24**: mọi file public trong bảng 2d, trừ `globals.css`, `layout.tsx` và 4 file không public; nặng nhất là `a/products/page.tsx` (103), `Navbar` (98), `AIDesignerSection` (79), `a/products/[id]` (69), `ProductOptionSelector` (57), `auth/login` (56), `auth/register` (47) | phần lớn trùng file với R2; nếu tính file ngoài thư mục phạm vi (`NanBrandPanel`, `PageArticle`, `BlockRenderer`, `QuoteRequestForm`, `data/homepageData.ts`) thì thêm khoảng 5 |

---

## Mâu thuẫn giữa hướng dẫn skill và quyết định thương hiệu

Theo thứ tự ưu tiên đã chốt, quyết định thương hiệu thắng. Bảng dưới chỉ ghi nhận; **R0 không tự chọn thay**.

| # | Skill / mục | Hướng dẫn của skill | Quyết định thương hiệu | Ghi nhận |
|---|---|---|---|---|
| 1 | `design-taste-frontend` §4.2 "Premium-consumer palette ban"; `frontend-design` (xu hướng #1: nền kem gần `#F4F1EA` + serif + nhấn ấm); `design-taste` (tránh cream/beige + brass làm mặc định) | cấm nền "giấy/kem/ngà" và nhấn brass/ochre làm lựa chọn mặc định cho thương hiệu thủ công cao cấp | nền mảng giấy ngà + chữ mực ấm + nhấn màu tre | chính skill cho phép ngoại lệ khi brief nêu rõ màu và lý do vật liệu; brief ở đây nêu rõ (giấy, nan tre). Làm theo quyết định. Rủi ro cần để ý: tránh sa vào đúng bộ hex bị liệt kê (`#f5f1ea`, `#efeae0`, `#b08947`…) |
| 2 | `design-taste-frontend` §4.11 "Page Theme Lock" | một trang một theme; không xen section sáng giữa section tối, trừ một lần đổi theme có chủ đích | "Một số section dùng mảng giấy ngà" trên nền chàm | làm theo quyết định. Hiện trạng đã xen kẽ 6 tối / 6 sáng. Việc chọn section nào dùng giấy ngà để R2 quyết |
| 3 | `design-taste-frontend` §9.F (dấu "·" chỉ tối đa 1 lần mỗi dòng); `frontend-design` (xu hướng #5: chuỗi meta nối bằng "·" là dấu hiệu trang dựng sẵn) | hạn chế dấu "·" làm dấu ngăn | chip viền thay bằng chữ nối "·" | làm theo quyết định. **Câu hỏi mở:** mỗi dòng tối đa mấy dấu "·" (skill gợi ý 1)? |
| 4 | `design-taste-frontend` §6.C, §8 | bắt buộc thiết kế cả sáng lẫn tối, theo `prefers-color-scheme` | site một giao diện cố định (chàm + mảng ngà) | không nằm trong quyết định; hiện trạng không có dark/light mode. Ghi nhận, không đề xuất |
| 5 | `design-taste` (serif rất không khuyến khích làm mặc định); `design-taste-frontend` §4.1 | serif chỉ khi brief nêu tên font hoặc thẩm mỹ heritage/luxury có lý do | giữ EB Garamond cho tiêu đề | không mâu thuẫn: EB Garamond nằm trong danh sách serif được phép và brief nêu rõ tên |
| 6 | `frontend-design` (đánh số chỉ khi nội dung là chuỗi); `design-taste-frontend` §9.F (cấm nhãn "Step 1 / Stage 1") | chỉ đánh số khi có thứ tự; bỏ chữ "Step" | chỉ mục Quy trình giữ đánh số | khớp. **Câu hỏi mở 1:** bỏ chữ "Step" (`ProcessSection:82`) hay dịch sang tiếng Việt? **Câu hỏi mở 2:** "4 bước kiểm tra in" (`MaterialSection`) và nhóm tùy chọn (`ProductOptionSelector`) cũng là chuỗi bước; theo quyết định sẽ bỏ số, xin xác nhận |
| 7 | `design-taste-frontend` §3.C | không khuyến khích `lucide-react` | (không đề cập) | dự án đã dùng lucide; skill cho phép giữ khi dự án đã phụ thuộc. Ghi nhận, không đổi |
| 8 | `frontend-design` (xu hướng #5: chữ mono cho nhãn nhỏ, eyebrow chữ hoa); `design-taste-frontend` §4.7 (tối đa 1 eyebrow mỗi 3 section) | hạn chế | chữ mono chỉ còn ở bảng thông số | khớp, cùng chiều |
| 9 | `design-taste-frontend` §9.F (cấm lưới kẻ làm trang trí) | cấm | bỏ lưới kẻ nền | khớp |
| 10 | `design-taste` / `design-taste-frontend` §9.G (cấm gạch ngang dài "—") | cấm trong chữ hiển thị | (không đề cập) | ghi nhận: chỉ còn một chỗ hiển thị là tiêu đề trang `app/layout.tsx:23` ("Nan — Di sản…") |

---

## Phụ lục: skill đã rà

| Vị trí | Skill | Liên quan? | Đã đọc toàn bộ SKILL.md |
|---|---|---|---|
| `.claude/skills/` (gốc repo) | `design-taste` | có (thiết kế, màu, chữ, chuyển động, truy cập) | có |
| | `ui-ux-pro-max` (bản trong repo, 377 dòng) | có | có |
| | `gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils` | có (hoạt ảnh) | có (8/8; giống hệt bản trong marketplace `gsap-skills`) |
| `Frontend/.claude/skills/` | không có | — | — |
| `Frontend/fanova-ai/.claude/skills/` | `design-taste-frontend` (1206 dòng) | có | có |
| Thư mục `.agents/` | `Frontend/fanova-ai/.agents/skills/design-taste-frontend/SKILL.md` | có | có (giống hệt bản trong `.claude/skills`) |
| `~/.claude/skills/` | `find-skills` | không | không (chỉ ghi tên) |
| | `synced/…`: `docs`, `docx`, `import-memory`, `morning`, `pdf`, `pptx`, `skill-creator`, `xlsx` | không | không (chỉ ghi tên) |
| Plugin `frontend-design@claude-plugins-official` | `frontend-design` (bản cache mới nhất) | có | có |
| Plugin `ui-ux-pro-max@ui-ux-pro-max-skill` 2.5.0 | `ui-ux-pro-max` (658 dòng, khác bản repo), `brand`, `design-system`, `ui-styling`, `design` | có | có |
| | `banner-design`, `slides` | không | không (chỉ ghi tên) |
| Marketplace (không cài) | `plugin-dev/*`, `mcp-server-dev/*`, `hookify`, `skill-creator`, `discord`/`telegram`/`imessage`, `playground`, `session-report`, `claude-security`, `claude-md-management`, `claude-code-setup`, `math-olympiad`, `receipts`, `project-artifact`, `cwc-makers`, `example-plugin` | không | không (chỉ ghi tên) |
| MCP (`.mcp.json`) | `gsap-skills` (`https://skills.greensock.com/sse`) | có (hoạt ảnh) | **không truy cập được** trong phiên này (máy chủ báo lỗi 500); nội dung tương đương đã đọc qua 8 skill GSAP cục bộ |

Ghi chú:

- Các file tham chiếu phụ của skill (ví dụ `design-taste/reference/*.md`, `brand/references/*.md`) không đọc; yêu cầu chỉ là SKILL.md.
- Công cụ tìm kiếm của `ui-ux-pro-max` (`scripts/search.py`) không chạy, vì R0 chỉ kiểm kê và không sinh hệ thiết kế.
