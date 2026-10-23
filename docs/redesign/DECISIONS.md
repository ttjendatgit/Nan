# Quyết định thương hiệu: redesign "xưởng quạt đương đại"

**Đọc file này trước mọi bước R2, R3 và các bước sau.**

- Quyết định ở đây thắng hướng dẫn chung của skill.
- Gặp mâu thuẫn mới: ghi vào mục 6, không tự chọn thay.
- Nguồn: brief R0/R1 và [R0-audit.md](R0-audit.md).
- Token nằm ở `Frontend/fanova-ai/src/app/globals.css`; trang xem token: `/dev/tokens` (chỉ chạy ở dev).

## 1. Màu và bố cục

**Nền tối**
- Nền chủ đạo là xanh tối làm ấm nhẹ, đọc như màu chàm: `indigo`.
- Thẻ, panel trên nền tối: `indigo-raised`. Footer, mảng tối phụ: `indigo-deep`.
- Chữ trên nền tối màu giấy ngà (`on-indigo`), **không dùng trắng tinh**. Chữ phụ: `on-indigo-muted`.
- Nhấn trên nền tối: tre (`bamboo`).
- Navy `#192B88` **không** dùng trên nền tối.

**Mảng giấy ngà**
- Tối đa **2 mảng** trên trang chủ: **Sản phẩm** (`ProductTypeSection`) và **Chất liệu** (`MaterialSection`). Mọi section khác của trang chủ dùng nền chàm.
- Nền mảng: `paper`. Thẻ và khối nổi: `paper-raised`. Nền ảnh, khối lõm: `paper-deep`.
- Chữ mực ấm: `ink` / `ink-muted`.
- Nhấn trên mảng ngà: navy (`navy`, `#192B88`).

**Màu tre trên mảng ngà** chỉ được dùng ở hai dạng:
- đường mảnh (`line-on-paper`);
- chữ nhãn nhỏ (`bamboo-deep`).

**Nút**
- **KHÔNG có nút nền tre/vàng**, ở bất kỳ đâu.
- Trên nền `indigo`: nút chính nền `paper`, chữ `ink`.
- Trên nền `paper`: nút chính nền `navy`, chữ `on-indigo`.

Trên mảng ngà cũng **không** có:
- chữ vàng cỡ lớn;
- gradient ánh kim.

**Báo lỗi**
- Trên nền tối dùng `danger`; trên mảng ngà dùng `danger-on-paper`.
- Không có màu đỏ nào đạt 4,5:1 trên cả `indigo` lẫn `paper`: mức tốt nhất một màu duy nhất đạt được trên cả hai nền là 3,95:1 (xem mục 5).

**Lưới nền: bỏ hết.** Gồm lưới kẻ 48/60/40px, `EditorialGrid` / `.nan-grid-12` và lưới chấm (xem R0 mục 5).

**Bản đồ tone trang chủ (chốt ở R2d)**

| Section | Tone |
|---|---|
| BrandStatement, Problem + Solution (một spread từ R6), UseCase, Process, FAQ, FinalCTA | `indigo` |
| ProductType, Material | `paper` (đúng 2 mảng ngà) |

**Ngăn cách hai section indigo liền nhau** (UseCase → Process → FAQ → FinalCTA): một `Rule` tone indigo ở đầu section thứ hai, như ngắt chương của sách. Không dùng nền xen kẽ, không thêm màu.

**Ngoại lệ đã duyệt (R2d)**
- **Panel CTA cuối trang (`FinalCTASection`) giữ nền `navy` trên nền indigo.** Đây là điểm navy duy nhất trên nền tối, dùng làm điểm nhấn kết trang. Panel không có bóng đổ, glow hay gradient. Chữ trên panel dùng token nền tối: `on-indigo` 10,52:1, `on-indigo-muted` 5,73:1, `bamboo` 4,81:1 (đều đạt). Không dùng navy trên nền tối ở bất kỳ chỗ nào khác.
- ~~Khung xem trước mockup sáng trong `AIDesignerSection`~~: không còn áp dụng, vì AIDesigner đã bị gỡ (xem mục 8).

**Khu vực admin** giữ theme hiện tại (token `--admin-*`), không thuộc redesign.

## 2. Chữ

| Vai trò | Font | Ghi chú |
|---|---|---|
| Tiêu đề | EB Garamond (`font-serif`) | subset `latin` + `vietnamese` |
| Thân chữ | Be Vietnam Pro (`font-sans`, mặc định của `body`) | subset `latin` + `vietnamese`; weight 300/400/500/600/700 |
| Mono | Geist Mono (`font-mono`) | **chỉ** ở `MetaStat` (`src/app/products/[id]/page.tsx`) |

- Khu vực admin cũng nhận Be Vietnam Pro; chấp nhận, không tách font riêng.
- Geist Sans đã gỡ khỏi `layout.tsx`. Chỗ duy nhất còn nhắc tới nó là `components/intro/FanIntro.tsx:237`, hiện không được render (`FanIntroWrapper` không còn được import). Nếu dùng lại, chỗ đó sẽ rơi về `sans-serif` và cần đổi sang `var(--font-be-vietnam-pro)`.
- **Tiếng Việt với Geist Mono:** next/font không cho khai báo subset `vietnamese` cho Geist Mono; khai báo sẽ làm build lỗi, vì metadata của nó chỉ có latin/latin-ext/cyrillic. CSS của Google Fonts vẫn trả về mặt chữ tiếng Việt (unicode-range `U+1EA0-1EF9`), và bản build R1 đã xác nhận điều này. Trình duyệt tải mặt chữ đó khi gặp ký tự tiếng Việt. `subsets` chỉ quyết định phần tải trước, nên Geist Mono giữ `["latin"]` như cũ.

## 3. Chip, nhãn, đánh số

**Chip viền** thay bằng chữ nối "·":
- **tối đa 2 dấu "·" mỗi dòng**;
- không viền, không nền, không chấm trang trí.

**Đánh số**

| Khối | Quyết định |
|---|---|
| Quy trình (`ProcessSection`) | **giữ** số 01–05, viết bằng EB Garamond; **bỏ chữ "Step"** |
| Nhóm tuỳ chọn (`ProductOptionSelector`) | **giữ** số, dùng chữ thường (không mono) |
| "4 bước kiểm tra in" (`MaterialSection`) | chuyển thành **một câu văn**, không danh sách đánh số |
| Hero 01/02/03, Vấn đề, Giải pháp, Ứng dụng | **bỏ số** |

## 4. Token màu (R1)

- Khai báo trong `@theme static` của Tailwind v4, namespace `--color-*`, nên dùng được cho mọi utility màu: `bg-indigo`, `text-on-indigo`, `border-line-on-paper`, `from-paper`…
- `static` giữ mọi biến trong CSS xuất ra, nên `var(--color-…)` dùng được ngay trong style inline.
- `--color-indigo` không đụng bảng màu Tailwind có sẵn: `indigo-50…950` là tên khác (`bg-indigo` so với `bg-indigo-500`).

| Token | Giá trị | Vai trò |
|---|---|---|
| `indigo` | `#121629` | Nền chủ đạo |
| `indigo-deep` | `#0E111F` | Footer, mảng tối phụ. Cùng sắc với `indigo` (hue 229° so với 230°, độ bão hoà 38% so với 39%), độ sáng 8,8% so với 11,6% |
| `indigo-raised` | `#1A1F3A` | Thẻ, panel trên nền tối. Cùng sắc (hue 231°, độ bão hoà 38%), độ sáng 16,5% so với 11,6% |
| `paper` | `#F4EFE6` | Mảng sáng |
| `paper-raised` | `#FBF8F2` | Thẻ, khối nổi trên mảng ngà |
| `paper-deep` | `#ECE3D3` | Nền ảnh, khối lõm. Cùng sắc với `paper` (hue 38° so với 39°, độ bão hoà 40% so với 39%), độ sáng 87,6% so với 92,9% |
| `on-indigo` | `#F4EFE6` | Chữ chính trên nền tối; chữ trên nút navy |
| `on-indigo-muted` | `#B9B2A6` | Chữ phụ trên nền tối |
| `ink` | `#2A241E` | Chữ chính trên mảng ngà; chữ trên nút nền paper |
| `ink-muted` | `#5E554A` | Chữ phụ trên mảng ngà |
| `bamboo` | `#B6A17B` | Nhấn trên nền tối |
| `bamboo-deep` | `#735F3E` | Chữ nhãn nhỏ trên mảng ngà |
| `navy` | `#192B88` | Nhấn trên mảng ngà; nền nút chính trên mảng ngà |
| `danger` | `#E5715F` | Báo lỗi trên nền tối (`indigo`, `indigo-deep`, `indigo-raised`) |
| `danger-on-paper` | `#A8321E` | Báo lỗi trên mảng ngà (`paper`, `paper-raised`, `paper-deep`) |
| `line-on-indigo` | `rgb(182 161 123 / 0.24)` | Đường mảnh trên nền tối: màu tre, độ đục 24% |
| `line-on-paper` | `#D6CBB6` | Đường mảnh trên mảng ngà |

**Token cũ**
- `--nan-*` (5 token): giữ, gắn comment "deprecated, thay trong R2/R3". Vẫn còn `var()` ở `[slug]/page.tsx`, `Navbar`, và phần Content Studio preview/renderer.
- `--accent-gold`: giữ, vì `.cs-highlight` (highlight của Content Studio) đang dùng.

## 5. Độ tương phản WCAG (đo trong R1)

- **Cách tính:** công thức độ sáng tương đối của WCAG 2.x. Màu có độ đục được trộn lên nền trước khi đo.
- **Ngưỡng:** chữ thường ≥ 4,5:1.
- **Kết quả:** mọi cặp chữ/nền dự kiến dùng **đều đạt**. 13 token của brief đạt ngay với giá trị khởi điểm, nên không phải chỉnh giá trị nào (không có cặp giá trị cũ → mới). Ba token thêm trong R1-fix được chọn sẵn để đạt ngưỡng.

| Chữ / nhấn | Nền | Dùng cho | Tỉ lệ | Kết quả |
|---|---|---|---|---|
| `on-indigo` #F4EFE6 | `indigo` #121629 | chữ chính trên nền tối | 15,64:1 | đạt |
| `on-indigo-muted` #B9B2A6 | `indigo` | chữ phụ trên nền tối | 8,51:1 | đạt |
| `bamboo` #B6A17B | `indigo` | chữ/nhấn tre trên nền tối | 7,14:1 | đạt |
| `on-indigo` | `indigo-deep` #0E111F | chữ chính ở footer | 16,39:1 | đạt |
| `on-indigo-muted` | `indigo-deep` | chữ phụ ở footer | 8,92:1 | đạt |
| `bamboo` | `indigo-deep` | nhấn tre ở footer | 7,48:1 | đạt |
| `on-indigo` | `indigo-raised` #1A1F3A | chữ chính trên thẻ tối | 14,09:1 | đạt |
| `on-indigo-muted` | `indigo-raised` | chữ phụ trên thẻ tối | 7,67:1 | đạt |
| `bamboo` | `indigo-raised` | nhấn tre trên thẻ tối | 6,44:1 | đạt |
| `ink` #2A241E | `paper` #F4EFE6 | chữ chính trên mảng ngà; **nút chính trên nền indigo** (nền paper, chữ ink) | 13,39:1 | đạt |
| `ink-muted` #5E554A | `paper` | chữ phụ trên mảng ngà | 6,38:1 | đạt |
| `bamboo-deep` #735F3E | `paper` | nhãn nhỏ tre trên mảng ngà | 5,34:1 | đạt |
| `navy` #192B88 | `paper` | nhấn navy trên mảng ngà | 10,52:1 | đạt |
| `ink` | `paper-raised` #FBF8F2 | chữ chính trên thẻ | 14,47:1 | đạt |
| `ink-muted` | `paper-raised` | chữ phụ trên thẻ | 6,89:1 | đạt |
| `bamboo-deep` | `paper-raised` | nhãn nhỏ tre trên thẻ | 5,77:1 | đạt |
| `navy` | `paper-raised` | nhấn navy trên thẻ | 11,37:1 | đạt |
| `ink` | `paper-deep` #ECE3D3 | chữ chính trên khối lõm | 12,04:1 | đạt |
| `ink-muted` | `paper-deep` | chữ phụ trên khối lõm | 5,74:1 | đạt |
| `bamboo-deep` | `paper-deep` | nhãn nhỏ tre trên khối lõm | 4,80:1 | đạt |
| `navy` | `paper-deep` | nhấn navy trên khối lõm | 9,47:1 | đạt |
| `on-indigo` | `navy` | **nút chính trên nền paper** (nền navy, chữ on-indigo) | 10,52:1 | đạt |
| `danger` #E5715F | `indigo` / `indigo-deep` / `indigo-raised` | báo lỗi trên nền tối | 5,85 / 6,13 / 5,27:1 | đạt |
| `danger-on-paper` #A8321E | `paper` / `paper-raised` / `paper-deep` | báo lỗi trên mảng ngà | 5,84 / 6,31 / 5,25:1 | đạt |
| `line-on-indigo` (trộn lên nền còn #39373D / #363435 / #3F3E4A) | `indigo` / `indigo-deep` / `indigo-raised` | đường mảnh | 1,52 / 1,52 / 1,54:1 | trang trí |
| `line-on-paper` #D6CBB6 | `paper` / `paper-raised` / `paper-deep` | đường mảnh | 1,40 / 1,51 / 1,26:1 | trang trí |

**Vì sao `danger` phải tách hai token**
- Độ sáng tương đối: `indigo` = 0,0086, `paper` = 0,8668.
- Một màu đạt ≥ 4,5:1 trên `indigo` phải có độ sáng ≥ 0,213; đạt ≥ 4,5:1 trên `paper` phải có độ sáng ≤ 0,152. Hai điều kiện không thể cùng đúng.
- Mức tối thiểu cao nhất một màu duy nhất đạt được trên cả hai nền là **3,95:1**.
- Đối chiếu: `danger` trên `paper` chỉ 2,67:1, `danger-on-paper` trên `indigo` chỉ 2,68:1, nên **không đổi chéo hai token**.
- Mọi chỗ báo lỗi hiện có (auth, `/products`, `ProductOptionSelector`, form báo giá) đều nằm trên nền tối, nên tên ngắn `danger` dành cho nền tối.

**Lưu ý cho R2**

- **Đường mảnh chỉ để trang trí.** Hai token đường mảnh thấp hơn nhiều mức 3:1 mà WCAG 1.4.11 yêu cầu cho viền thành phần giao diện. **Không** dùng chúng làm viền ô nhập, checkbox hay viền nút duy nhất; các chỗ đó cần viền đạt ≥ 3:1, ví dụ `on-indigo-muted` trên nền tối hoặc `ink-muted` trên mảng ngà.
- **Không pha loãng màu chữ.** Không hạ độ đục của các token chữ (kiểu `text-on-indigo/40`). R0 đo được nhiều chỗ dưới 3:1 chính vì cách làm này; muốn chữ phụ thì dùng token `-muted`.
- **Viền điều khiển trên nền tối (đo ở R2d, trên form AIDesigner nay đã gỡ; quy tắc vẫn áp dụng cho mọi ô nhập/nút chọn trên nền tối):** dùng `border-on-indigo-muted/60`. Đo được 3,64:1 trên `indigo-raised` và 3,86:1 trên `indigo`, đạt mức 3:1 của WCAG 1.4.11. Mức 50% chỉ đạt 2,94:1, nên **không** hạ dưới 60%. Đây là viền, không phải chữ, nên không trái quy tắc "không pha loãng màu chữ".

## 6. Mâu thuẫn với skill và cách đã xử lý

Ba mâu thuẫn được ghi trong R0 (`design-taste-frontend`, `frontend-design`, `design-taste`). Cả ba đều theo quyết định thương hiệu.

| # | Hướng dẫn skill | Quyết định thương hiệu | Cách xử lý |
|---|---|---|---|
| 1 | §4.2 "premium-consumer palette ban": không dùng nền kem/giấy + nhấn brass/ochre làm mặc định; `frontend-design` coi "kem + serif + nhấn ấm" là dấu hiệu template | nền giấy ngà, chữ mực, nhấn màu tre | Giữ, vì lý do vật liệu (giấy, nan tre) được nêu rõ trong brief, đúng ngoại lệ mà skill cho phép. Giảm rủi ro "template" bằng cách giới hạn: tối đa 2 mảng ngà; tre trên mảng ngà chỉ là đường mảnh hoặc nhãn nhỏ; không nút vàng, không chữ vàng lớn, không gradient ánh kim; nhấn chính trên mảng ngà là navy. Ghi nhận: `#F4EFE6` rất gần `#f5f1ea` trong danh sách hex skill liệt kê |
| 2 | §4.11 "Page Theme Lock": một trang một theme, không xen section sáng giữa section tối | có mảng giấy ngà trên nền chàm | Giữ, nhưng giới hạn **tối đa 2 mảng** (Sản phẩm, Chất liệu) thay cho kiểu xen 6 tối / 6 sáng hiện nay. Các section còn lại về nền chàm |
| 3 | §9.F: dấu "·" tối đa 1 lần mỗi dòng; `frontend-design` coi chuỗi meta nối "·" là dấu hiệu template | chip viền đổi thành chữ nối "·" | Giữ, **tối đa 2 dấu "·" mỗi dòng** (nới hơn skill 1 dấu). Không dùng "·" làm trang trí ở dòng không có chip cũ |

Các điểm R0 ghi là khớp hoặc không mâu thuẫn:
- chỉ đánh số chuỗi thật; bỏ chữ "Step";
- mono không làm trang trí;
- bỏ lưới nền;
- EB Garamond nằm trong danh sách serif được phép;
- lucide-react giữ vì dự án đã phụ thuộc.

Yêu cầu bắt buộc chế độ sáng/tối của `design-taste-frontend` §6.C **không áp dụng**: site dùng một giao diện cố định.

## 7. Những gì R1 đã làm và chưa làm

**R1 đã đổi trên trang thật đúng một thứ:** font thân chữ, Geist chuyển sang Be Vietnam Pro.

**R1 chưa đổi:**
- Không component nào đổi màu. Màu viết cứng thuộc R2/R3.
- Quy tắc `body { background: #FAFAF8; color: #081426 }` trong `globals.css` còn nguyên, vì đổi nó là thay đổi thị giác. R2/R3 đổi sang token khi chuyển trang.

**R1 đã xoá khỏi `globals.css`** (sau khi grep toàn bộ `src` xác nhận không còn nơi nào dùng):

| Nhóm | Chi tiết |
|---|---|
| 38 token v3 | `--bg-dark`, `--bg-navy`, `--bg-blue-mid`, `--brand-primary`, `--brand-secondary`, `--soft-blue`, `--ice-blue`, `--bg-ivory`, `--bg-warm-white`, `--bg-cool-white`, `--surface-card` (khai báo 2 lần), `--surface-ice`, `--text-primary`, `--text-navy`, `--text-secondary`, `--text-muted`, `--text-on-dark`, `--text-soft-dark`, `--border-soft`, `--border-med`, `--border-strong`, `--shadow-card`, `--shadow-card-hover`, `--glow-royal`, `--glow-ice`, `--deep-navy`, `--pearl`, `--stone`, `--background`, `--foreground`, `--surface`, `--border`, `--text-primary-c`, `--text-secondary-c`, `--text-muted-c`, `--accent-blue`, `--deep-blue`, `--highlight-blue` |
| 2 alias trong `@theme inline` | `--color-background` và `--color-foreground`: chỉ trỏ tới `--background`/`--foreground`, và không có class `bg-background`/`text-foreground` nào |
| 3 class lưới | `.bg-grid-dots`, `.bg-grid-lines`, `.bg-grid-dots-warm` |

Vài comment trong khối `--admin-*` vẫn nhắc tên token v3 cũ ("reuses --brand-primary"). Đó là ghi chú lịch sử bên cạnh giá trị hex cụ thể, không phải tham chiếu, nên giữ nguyên.

## 8. Phạm vi sản phẩm: bỏ AIDesigner (chốt sau R3a)

- **Nan không còn cung cấp chức năng AIDesigner / thiết kế và tùy biến quạt trực tiếp trên website.** Đã gỡ toàn bộ section "Thiết kế chiếc quạt trong chính không gian của bạn." cùng UI và logic: ô ý tưởng, chọn phong cách, chọn màu nền, tải ảnh/logo, kéo thả, phóng to/thu nhỏ, mockup tương tác, nút "Tạo mẫu thử", và mọi CTA hay câu chữ dẫn tới công cụ này. Không giữ dưới dạng ẩn, disabled hay placeholder.
- **Dịch vụ thiết kế của Nan vẫn giữ.** Bỏ AIDesigner là bỏ công cụ tự thiết kế trên website, không phải bỏ dịch vụ: tư vấn thiết kế, hỗ trợ thiết kế, khách gửi logo/artwork, và mockup do đội ngũ Nan dựng rồi gửi khách duyệt vẫn là một phần của quy trình.
- **Visual 3D/Three.js hiện có trong Hero và silk-fan không thuộc phạm vi chức năng AIDesigner và vẫn được giữ.** Gồm `silk-fan/`, `HeroCanvas.tsx`, `HeroVisualStage`, và các gói `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`.
- **Không tạo lại công cụ tự thiết kế** (designer, upload để tạo mẫu, preview tương tác) trong các phase sau nếu không có quyết định mới.

## 9. Material: mật độ trên mobile khi chưa có ảnh (chốt ở R4d, phương án C2)

- Khi `image.src` của một chất liệu rỗng (chưa có ảnh thật), vùng ảnh `paper-deep` cao 256px **chỉ hiển thị từ `md` (768px) trở lên**. Dưới 768px, card thu lại chỉ còn phần chữ (tên, tag MetaLine, mô tả), vẫn giữ Card, viền và bo góc.
- Khi `image.src` có giá trị, vùng ảnh hiển thị ở mọi kích thước.
- Desktop (3 cột) và tablet (2 cột) không đổi.
- Không thay vùng ảnh trống bằng ảnh giả, icon, họa tiết, gradient hay badge.

## 10. R6: ngôn ngữ "Nan & Nếp" (chốt ở R6.1.5, dựng ở R6.2)

Nguồn: storyboard R6.1.5. Nan (thanh tre) là đường dẫn giữa các chương; nếp (nếp gấp) là nhịp lặp; "mở nếp" (mở từ một điểm trục) chỉ dùng đúng 3 lần: Hero, F5 của Process, FinalCTA.

**R7a (bổ sung):** spread Problem + Solution có thêm một chiếc quạt làm nhân vật chính, đặt trên đường gáy và chạy theo một tiến trình cuộn duy nhất: quạt mở dần, artwork quét từ trang vấn đề sang trang giải pháp, các vấn đề lùi về `on-indigo-muted` (màu token, không hạ opacity chữ), các lời đáp mở ra từ gáy. Đây là lần "mở nếp" thứ 4 trên trang chủ, theo yêu cầu R7a. Khác ba lần kia ở chỗ nó kể **sự chuyển hoá** (quạt trơn thành quạt có thiết kế), không chỉ việc mở. Quạt là vector cục bộ (`ProblemSolutionFan`) cho tới khi có A1/A2; component nhận `src` để thay asset thật mà không đổi choreography.

**Bố cục**
- **Problem + Solution gộp thành một spread** (`ProblemSolutionSection`): trang trái là vấn đề, trang phải là cách Nan làm, mỗi vấn đề cùng hàng với lời đáp; đường gáy dọc ở giữa từ 1024px. Không đánh số, không gạch chữ. `ProblemSection` và `SolutionSection` đã gỡ.
- **FinalCTA:** giữ panel `navy` (ngoại lệ ở mục 1) nhưng **bo góc 8px** (trước là 24px) và **bỏ hàng 4 chỉ số**; chỉ giữ "48h xem mockup" thành một dòng chữ.
- **Motif cũ** (`HomepageNarrativeMotif`: đường cung cố định và đốm sáng mờ) **đã gỡ**: vai trò sợi chỉ chuyển cho cây nan của BrandStatement và rail của Process.
- **Material:** "4 bước kiểm tra in" đã thành một câu văn (đúng mục 3).

**Motion**
- Token thêm: `--dur-signature` 900ms, `--dur-wipe` 520ms; JS: `PLEAT` 60ms, `PLEAT_FINE` 40ms, `CLIP_FROM`/`CLIP_OPEN`, `FAN_OPEN_DEG` 80°.
- Reduced motion: `initial` cố định giữa server và client; `animate` về trạng thái cuối với `INSTANT`; trạng thái phụ thuộc trình duyệt chỉ áp dụng sau hydration (`useHydrated`).
- `whileInView` **không** đặt trên phần tử đang bị clip-path che hết (trình duyệt coi nó là không giao); quan sát wrapper và truyền trạng thái bằng `variants` (`wipeVariants`).

**Asset**
- Mọi asset trang chủ R6 khai báo trong `src/data/homepageAssets.ts` với đúng tỉ lệ cuối; `AssetSlot` vẽ placeholder có nhãn khi `src` rỗng.
- **Placeholder chỉ dùng cho prototype**, không lên production. Không dùng ảnh sinh (AI), ảnh stock hay 2 PNG trong `public/images` làm asset.

## 11. R9B: catalogue `/products` (chốt ở R9B, thay cho gallery R9)

**Khái niệm**: B2B catalogue + editorial, không phải lưới card thương mại điện tử, cũng không phải gallery/triển lãm. Khách phải biết ngay Nan có những dòng nào, mẫu nào, giá cơ bản, và tới báo giá trong vài giây. Component: `CatalogueList` (`src/components/product/CatalogueList.tsx`); gallery R9 (`ProductGallery`) đã gỡ.

**Bố cục**
- `/products`: nhãn "Sản phẩm", tiêu đề và câu mô tả cũ, rồi mỗi dòng sản phẩm một hàng editorial: số, đường tre, tên, mô tả, CTA "Xem dòng quạt", ảnh ~50% hàng, tràn một gutter ra phía ngoài.
- `/products?categoryId=`: tên dòng, mô tả, thanh chuyển dòng bằng chữ ("Tất cả" + các dòng, dòng hiện tại có gạch tre và `aria-current`, thay cho link "Tất cả dòng quạt" riêng), số sản phẩm; mỗi sản phẩm một hàng gọn hơn: tên, mô tả, dữ kiện (giá hoặc "Báo giá theo yêu cầu" · "Tùy chỉnh" · "SL tối thiểu N cái", đúng chữ và định dạng của trang chi tiết), CTA "Xem chi tiết", ảnh ~40%. Từ 1024px chữ và ảnh là một cặp 5 + 5 cột đặt sát nhau.
- Ảnh và chữ đổi bên luân phiên. Từ 768px là 2 cột; dưới 768px một cột theo thứ tự số + tên, ảnh, mô tả, dữ kiện, CTA. Không card, bóng, pill, khung ảnh.
- Thông tin luôn hiện, không phụ thuộc hover; ảnh `object-contain` (không crop), neo về phía chữ.

**Đánh số**: giữ 01/02/03 (`IndexMarker`, EB Garamond, `bamboo`): ngoại lệ của mục 3, vì đây là danh mục có thứ tự.

**Motion**: chỉ một nhịp ngắn khi hàng vào viewport (ảnh 0,97 → 1 và opacity 0,6 → 1 trong 0,5s, chữ trễ 80ms, đường tre mở); không parallax, pin hay scroll story. Hover/focus: ảnh 1,03, tên 4px, mũi tên 4px. Reduced motion: `initial` giống server, `animate` về trạng thái cuối với `INSTANT`.

**Asset**: A1 khai báo trong `src/data/productAssets.ts` theo slug (danh mục và sản phẩm). `src` rỗng thì dùng `imageUrl` của API, nên không có placeholder lên production. A2 không dùng ở listing; để dành cho trang chi tiết.

**R9C (bổ sung, chỉnh tinh R9B)**
- Khối chữ của mỗi hàng **canh theo mép trên ảnh** (trước đó canh giữa, làm tên tụt ~170px); padding đầu trang và giữa các hàng giảm. Ở 1440×900, dòng 01 (số, tên, mô tả, CTA) và trọn ảnh đầu tiên nằm trong màn hình đầu.
- **Dữ kiện thương mại là một `<dl>` 3 cột** (Giá từ · Tùy chỉnh · SL tối thiểu), nhãn nhỏ trên giá trị, ngăn bằng đường mảnh; cùng thứ tự và cùng nhãn trên mọi hàng để so sánh. Giá và SL tối thiểu đậm hơn một bậc. Không ô, pill, icon hay màu.
- "Tùy chỉnh" hiện **"Có" / "Không"** từ `isCustomizable` (dữ liệu boolean, không phải copy mới), để hàng nào cũng có đủ ô. SL tối thiểu = 0 hiện "Liên hệ" (cùng chữ fallback của trang chi tiết).
- **Mâu thuẫn còn mở:** giá = 0 ở listing là "Báo giá theo yêu cầu" (chữ cũ của card), ở trang chi tiết là "Liên hệ". Chưa thống nhất, chờ quyết định.
- Hàng dòng sản phẩm thêm một dòng **"{n} sản phẩm"** (dữ liệu thật, cùng chữ với số đếm ở trang dòng), lấy bằng `totalCount`; ô giữ chiều cao khi đang tải.

## 12. R9D: trang chi tiết sản phẩm theo dữ liệu (chốt ở R9D)

**Một nguồn quy tắc**: `src/lib/productFacts.ts` (`formatProductPrice`, `formatCustomization`, `formatMinimumQuantity`, `formatProductionTime`, `catalogueFacts`, `detailFacts`) dùng cho cả catalogue và trang chi tiết; hiển thị qua `ProductFacts` (`<dl>`: "strip" 3 cột ở catalogue, "grid" 2 × 2 ở trang chi tiết).

**Ý nghĩa dữ liệu (theo entity + validator backend)**
| Trường | Có giá trị | Không có / 0 |
|---|---|---|
| `basePrice` (decimal ≥ 0) | "Giá từ" · "40.000 đ" | "Giá" · "Báo giá theo yêu cầu" |
| `isCustomizable` (bool) | "Tùy chỉnh" · "Có" / "Không" | "Liên hệ" |
| `minQuantity` (int > 0) | "SL tối thiểu" · "200 cái" | "Liên hệ" |
| `estimatedProductionDays` (int ≥ 0, mặc định 0, không có logic nghiệp vụ nào đọc) | "Thời gian sản xuất" · "15 ngày" | 0 = **chưa cấu hình** → "Liên hệ" |

- Thay quyết định R9C: giá = 0 giờ là "Báo giá theo yêu cầu" ở **cả hai** trang (trang chi tiết bỏ "Liên hệ"); nhãn đổi "Giá từ" → "Giá" khi không có giá. Không trang public nào hiện "0 đ", "0 cái", "0 ngày", "undefined", "null", "NaN".
- Trang chi tiết: nhãn danh mục chữ thường sans viết hoa, màu `bamboo` (thay navy trên nền tối); nền `indigo`, mảng cấu hình `paper`, chữ/đường mảnh theo token; nút chính là `Button tone="indigo"` (nền paper, chữ ink) "Nhận báo giá →"; ảnh `object-contain` trong khung 4:3 (không crop), không khung/nền; thiếu ảnh thì hiện nét quạt Nan. Geist Mono không còn dùng ở trang chi tiết (`MetaStat` đã gỡ), nên mục 2 "Mono chỉ ở MetaStat" nay là: không dùng mono ở trang public.
- Admin sản phẩm: nhóm "Thông tin cơ bản" / "Thông tin thương mại" / "Hiển thị" / "Hình ảnh"; "Tùy chỉnh được" chuyển sang nhóm thương mại; thời gian sản xuất để trống = 0 (trước đây tự lưu 7 ngày); mỗi trường thương mại có một dòng gợi ý trang public sẽ hiện gì. Không có điều khiển trình bày (font, màu, khoảng cách).

## 13. R9E: Product Navigator (chốt ở R9E)

- "Sản phẩm" trên navbar **không còn là link**: là nút disclosure (`aria-expanded`, `aria-controls`, chevron nhỏ màu tre), mở một **mục lục catalogue** thay vì đi thẳng tới `/products`. Vẫn có gạch tre active ở mọi trang `/products*`.
- Desktop (từ 768px): panel dưới thanh nav, nền `--nan-dark`, đường mảnh, một lớp phủ tối (không blur) phía sau; trái là các dòng sản phẩm (nút, số sản phẩm, dòng đang chọn có đường tre dọc), phải là tối đa 8 sản phẩm của dòng đó (tên, một dòng mô tả, giá theo `formatProductPrice`, "Xem sản phẩm →"), cùng "Xem tất cả N sản phẩm →" và "Tất cả sản phẩm →". Mỗi cột cao tối đa min(62vh, 520px) và tự cuộn, nên menu dùng được với 10+ dòng và 100+ sản phẩm mà trang không phải cuộn.
- Mở bằng click (hoặc Enter/Space, khi đó focus vào dòng đang chọn); đóng bằng click ra ngoài, Escape (focus về nút), khi focus rời header, hoặc khi điều hướng. Trong trang dòng hoặc trang sản phẩm, mục lục mở sẵn ở dòng đó.
- Mobile: "Sản phẩm" trong menu mobile mở một màn riêng (dòng sản phẩm → sản phẩm của dòng), có nút quay lại ở mỗi cấp, dùng chung focus trap / khoá cuộn / Escape của menu mobile.
- Dữ liệu: chỉ API hiện có (`getCategories`, `getProductsByCategory(id, pageSize 8)`, lấy `totalCount` làm số đếm), cache trong phiên trang.
- Hàng catalogue không còn là một link lớn vô hình: CTA ("Xem chi tiết" / "Xem dòng quạt") là link duy nhất trong tab order; ảnh là lối tắt chuột tới cùng trang (`tabIndex=-1`, `aria-hidden`); hiệu ứng hover chỉ chạy khi trỏ vào hai link đó.

## 14. R10: không khí nền và chữ ký hình học (chốt ở R10)

**Hệ thống 3 lớp, dùng lại được**
- **A, Canvas:** giữ nguyên token (`indigo`, `paper`, `--nan-dark`). Không thêm màu.
- **B, Chất liệu:** `Section material="quiet" | "tactile"` (globals `.nan-material`): một tile SVG `feTurbulence` seed cố định, stitch, cắt ngưỡng; trên chàm là hạt mịn gần đẳng hướng (vải nhuộm), trên giấy là thớ giấy; "tactile" (chỉ Material) thêm vạch chain line của giấy dó. Không ảnh raster, không animation.
- **C, Chữ ký:** `NanField` (`components/ui/NanField.tsx`): nan quạt + cung lá quạt toả từ một trục, nét 1px, nan xen kẽ đậm/nhạt như nếp gấp núi/thung; luôn quá khổ và bị cắt. Vị trí/độ lớn/xoay qua `--nf-x/--nf-y/--nf-r/--nf-rot` (đặt theo breakpoint bằng class). `Section backdrop` vẽ nó trong lớp trang trí bị cắt ngang (không thanh cuộn ngang) nhưng được tràn lên section phía trên.

**Theo section**
| Section | Xử lý |
|---|---|
| Hero | Không đổi (khoá). |
| Brand | Dải chuyển từ `--nan-dark` xoá vạch màu với Hero; field toả từ **trục của quạt Hero** (đúng điểm cây nan bắt đầu, cùng công thức x), chỉ phía phải cột sống. md+. |
| ProductType | Tia hội tụ về ảnh sản phẩm từ ngoài mép phải, nằm ở khoảng trống giữa danh sách và ảnh. lg+. |
| Problem / Solution | Chỉ canvas; quạt của R7a vẫn là nhân vật chính. |
| Material | Canvas "tactile"; cung dẫn và nan dài quanh chốt của bộ mẫu (như vạch canh trên bàn in). Section `overflow-x-clip`. |
| UseCase / Process | Một field nằm vắt qua ranh giới hai section ở mép phải, trong khoảng trống cạnh tiêu đề cả hai; không chạm rail. lg+. |
| FAQ | Chỉ canvas. |
| FinalCTA | Field mạnh nhất trong panel navy, cùng trục với quạt cuối và mở cùng lúc với nó (`shown={built}`); chỉ toả lên trên, chữ bên dưới trục giữ sạch. |

**Motion:** field xoay ±1–1,5° theo cuộn (motion value, chỉ sau hydration). Reduced motion: tĩnh, field FinalCTA hiện ngay. Mobile: giảm mật độ (chỉ cây nan Brand, field FinalCTA và canvas).

## 15. R10.1: quạt là nhân vật xuyên suốt (chốt ở R10.1)

**Nguyên tắc:** không thêm trang trí; một vật thể duy nhất (quạt của Problem/Solution, `ProblemSolutionFan`) đi qua trang ở nhiều **trạng thái vật lý**, thường quá khổ và bị cắt (chỉ thấy 20–40%). Trạng thái mới của component: `leaf` (có lá giấy), `bare` (nan lộ), `pleat` (nếp giấy ↔ mặt vải phẳng), `outline` (đường viền), `hairline` (nét giữ px khi phóng to); `FanObject` đặt quạt theo trục (kể cả ngoài màn hình), `useFanState` chuyển trạng thái theo token. Mặc định giữ nguyên quạt Problem/Solution.

| Section | Trạng thái của cùng chiếc quạt |
|---|---|
| Hero | Khoá, không đổi. |
| Brand | Nan tre vật lý (3px) rời trục của quạt Hero và tách dần theo cuộn (`NanField separate`), trên lưới nét mảnh R10. Mobile: cây nan + hai nan rời. |
| ProductType | Quạt quá khổ sau sân khấu, trục ngoài mép phải, đổi trạng thái theo dòng đang xem (giấy: nếp; nan tre: nan lộ, dừng trước chữ; vải: mặt phẳng mềm); dòng đang xem đi theo cả cuộn lẫn trỏ/focus. Cắt dưới vạch tiêu đề. |
| Problem/Solution | Giữ nguyên. |
| Material | Bàn in: trục gấp nét đứt qua chốt, dấu canh ⊕, cung dẫn; hiện cùng lúc bộ mẫu mở. |
| UseCase | Quạt hoàn thiện ở dạng đường viền mảnh, cắt ở góc phải dưới, cạnh tiêu đề (vật thể trong bối cảnh). Thay field vắt ranh giới của R10. |
| Process | Khi chưa có ảnh A2: quạt **được dựng lại** theo từng bước (khung nan → lá trơn → artwork → in canh trên nan → gấp → hoàn thiện), quá khổ trong khung 4:5; reduced motion: quạt hoàn thiện + dải 6 trạng thái. Ảnh A2 thật tự thay khi có `src`. |
| FinalCTA | **Quạt trở về:** quạt hoàn thiện lớn hơn panel, trục ngoài góc phải dưới (lg) / cắt ngang đầu panel (dưới lg), mở cùng nhịp BUILD; chữ canh trái, luôn nằm trên nền navy. Bỏ field R10 và placeholder A1-final (ảnh thật thay qua `src`). |

**Hydration:** trạng thái quạt phụ thuộc reduced motion chỉ áp dụng sau hydration (`useHydrated`), nên HTML server và lần render đầu của client luôn khớp.

**Ghi nhận mâu thuẫn skill:** `ui-ux-pro-max --design-system` đề xuất Liquid Glass, Playfair/Inter, đen + vàng; không áp dụng vì trái DECISIONS (§1, §2, không glass). Chỉ dùng phần UX (1–2 chuyển động chính mỗi khung nhìn, reduced motion, transform/opacity, không cuộn ngang).

## 16. R10.2: tinh chỉnh bằng cách bớt (chờ duyệt thị giác)

**Nguyên tắc:** ít yếu tố hơn R10.1. Ảnh thật và vật thể quạt mang trọng lượng, không phải hình học trang trí.

**Đã gỡ:** 3 lớp `NanField` của Brand (gồm các nan tre tràn lên Hero); quạt quá khổ sau ProductType; `NanField` của Material (cung dẫn, trục gấp, dấu canh ⊕); contour quạt và rail kéo 5 ô của UseCase; spine của Problem/Solution; các `Rule` ngắt chương giữa các section indigo; panel navy, badge và nút phụ của FinalCTA; lưới 60px trong nền Hero; dải số 01/02/03 dưới CTA Hero (đúng §3); chip viền + chấm + mono ở badge Hero, ở dải thông báo và tagline logo (đúng §2: không mono trên trang public). `NanField.tsx` không còn được dùng (chưa xoá file).

**Thay §1 (bản đồ tone):** thứ tự mới Hero → Brand → Problem/Solution → ProductType → Material → UseCase → Process → FAQ → FinalCTA, để 2 mảng ngà liền nhau thành một chương giấy (tối → giấy → tối). Chỗ đổi tone dùng `Section seam` (globals `.nan-seam`, cao `--seam-h`), section sau tăng padding-top bằng chiều cao seam. Section indigo liền nhau không còn `Rule`. **Ngoại lệ panel navy của FinalCTA bỏ:** FinalCTA nằm trên `--nan-dark` (cùng nền Hero), không còn navy trên nền tối ở đâu.

**Thay §10 (asset):** `AssetSlot` không còn vẽ placeholder có nhãn/viền đứt; ô thiếu ảnh là mặt nền tone + chữ "Nan" nhỏ, `aria-hidden`. Trang chủ dùng ảnh catalogue thật trên Cloudinary (`catalogPhotos` trong `homepageAssets.ts`): Brand = quạt giấy vẽ lá tre; UseCase = quạt in "Văn Hoá" (lớn) + quạt "Hội chợ mùa thu" (nhỏ). Ảnh sản phẩm "Quạt giấy nan tre" có watermark bên thứ ba ("Đoàn Thái Cúc Hương arts & crafts"), **không** dùng ở trang chủ. Vẫn không dùng ảnh AI/stock/2 PNG trong `public/images`.

**Chữ:** `SectionTitle` 2rem → 2.75rem, weight 500 (trước 600, 2.25 → 3rem); Brand 3.75rem; FinalCTA 3.5rem; Hero giữ nguyên cỡ. Bỏ tiêu đề hai màu (navy/tre) ở ProductType, Material, UseCase, Process.

**Header:** thanh nav 84px → 64px, canh cùng trục nội dung section (80rem + gutter); dải thông báo sans 10px, trong suốt trên Hero, thu lại khi cuộn. `html { scroll-padding-top: var(--nav-height) }`.

**Hero (khái niệm giữ nguyên):** bụi vàng 500 → 110 (sau 30 → 6) và mờ hơn; tia quanh quạt 37 → 19 tia ngắn, mờ dần về hai nan cái; cung mờ .5 → .22. `SilkFan` có prop `rays` (FinalCTA tắt).

**Theo section:** Problem/Solution 3 cột từ 1024px, quạt ở giữa tới 580px (trước 260–320px), vấn đề canh phải về phía quạt. ProductType: tên dòng 4 cột + ảnh 4:3 7 cột, đổi bằng cross-fade. Material: mỗi dải mẫu tự mang bề mặt chất liệu (`FINISHES`), panel chỉ còn chữ. Process: danh sách 5 cột + một vật thể lớn 7 cột (sticky), quạt đứng trên nền indigo, không hộp giấy; dưới 1024px vật thể sticky phía trên danh sách. FAQ: 2 cột (tiêu đề + "Vẫn còn thắc mắc?" sticky trái, accordion phải). FinalCTA: quạt lụa của Hero quay lại, lớn, cắt ở góc phải dưới; một CTA.

**Texture:** sợi giấy indigo .08 → .035, paper .12 → .05, tactile bỏ chain line.

## 17. R10.3: chiều sâu có chọn lọc (chờ duyệt thị giác)

**Nguyên tắc:** giữ kỷ luật R10.2 (cấu trúc, chữ, khoảng cách), trả lại chiều sâu bằng một ngôn ngữ duy nhất. Mỗi section: nền + không khí + tối đa 1–2 yếu tố ngôn ngữ Nan + một tiêu điểm.

**Không khí (`Section atmosphere`, globals `.nan-atmos`):** một vùng sáng mềm đặt trên tiêu điểm của section (navy: xanh `navy` 24% + lõi ấm tre 5,5%; giấy: sáng `paper-raised`), cùng vignette **chỉ hai bên** (hai section tối liền nhau không tạo dải tối ở chỗ nối). Sợi giấy: indigo .035 → .05, paper .05 → .07, tactile .075 → .1.

**Chuyển tone (thay §16):** bỏ gradient seam giữa giấy và chàm (đọc thành sương xám). Mép giấy/chàm là mép sạch; UseCase cho ảnh chính đè qua mép. Seam chỉ còn giữa hai nền tối (Hero → Brand, FAQ → FinalCTA).

**Ngôn ngữ Nan (dùng lại `NanField`, mờ, luôn gắn với trục của một vật thể thật):**
| Section | Yếu tố |
|---|---|
| Hero | Bụi vàng 110 → 170 (gốc 530), trước quạt 6 → 10; tia 25 tia dài/ngắn xen kẽ, mờ dần về nan cái; sợi giấy + vignette hai bên |
| Brand | Trường nan 9 nan, 2 cung, opacity .10, từ trục quạt Hero (md+) |
| Problem/Solution | Quầng nan ngắn + 2 cung ngay ngoài lá quạt, từ trục của chính quạt |
| ProductType | Nếp gấp mờ từ góc dưới phải ảnh (lg+), chỉ thấy quanh ảnh |
| Material | Một cung bàn in quanh chốt + 2 dấu canh; dải mẫu có cạnh sáng và bóng tiếp xúc nhiều lớp |
| UseCase | Một trường nan từ khe giữa ảnh và chữ, xoay vài độ theo ngữ cảnh đang xem |
| Process | Quầng nan quanh quạt đang dựng (chỉ khung chính) |
| FAQ | Chỉ không khí |
| FinalCTA | Quầng tia của chính quạt lụa (`rays` bật lại) + không khí + sợi giấy |

**UseCase (viết lại):** spread biên tập. Ảnh chính 4:5 đè qua mép giấy/chàm và tràn ra mép trái; tiêu đề + 3 ngữ cảnh đánh số 01–03 bên phải (bản brief: Sự kiện, Resort & Khách sạn, Nhà hàng & Quán cà phê; `homepageData.useCases` vẫn giữ đủ 5); ảnh phụ có viền chàm 10px đè góc dưới phải ảnh chính, có chú thích. Ngữ cảnh đang xem (theo cuộn hoặc chuột): đường nhấn dài ra, tên lên màu chữ chính, ảnh chính đổi khung nhẹ, trường nan xoay. Mobile: tiêu đề → ảnh chính → 01 → ảnh phụ lệch phải → 02 → 03. Mô tả section đổi theo ý brief R10.3 ("Một chiếc quạt có thể trở thành điểm chạm thương hiệu trong nhiều thế giới khác nhau…").

**Asset:** khung giữ tỉ lệ, ảnh lấp khung (`object-cover`). `useCaseScenes[id].photo` cho mỗi ngữ cảnh (đang `null`); điền vào thì ảnh chính cross-fade sang ảnh đó, không đổi layout. `AssetDef.caption` mới. Quạt vector (Problem/Solution, Process) vẫn là asset tạm.

**Mâu thuẫn skill ghi nhận:** `design-taste` cấm "paper grain" bằng `feTurbulence` và số 01/02/03 làm khung; brief R10.3 yêu cầu sợi giấy và cho phép số section có tiết chế. Theo brief: sợi giấy giữ ở mức dưới ngưỡng nhận biết; số chỉ dùng ở Process (chuỗi thật) và chỉ mục UseCase.

## 18. R10.4: làm cho Nan "thật" (chờ duyệt)

**Nguyên tắc:** chỉ nói điều doanh nghiệp đã xác nhận. Không có dữ liệu thì bỏ, không thay bằng con số khác.

**Đã gỡ vì chưa có căn cứ:** dòng "48h xem mockup" và mảng `finalCta.stats` (5+, 48h, 100%, ∞); tag chất liệu (Popular, Premium, Elegant, Vibrant, Luxury, Custom; dữ liệu còn trong `materials`, không hiển thị); "phản hồi trong 24 giờ làm việc" (Process); "5-10 ngày làm việc" (FAQ); "Không phát sinh chi phí bất ngờ", "Không có mẫu chung". Footer: email/số điện thoại giả (hello@nan.vn, 0900 000 000), tên mạng xã hội không có link, mục pháp lý không có trang, slogan tiếng Anh, danh sách "collections" tiếng Anh không phải dòng sản phẩm thật. ProductType: khi API lỗi không còn hiện 6 "collections" giả, chỉ một câu báo lỗi + "Xem tất cả".

**Trang trí bớt thêm:** quầng nan Problem/Solution, nếp gấp ProductType, cung + dấu canh Material, xoay trường nan và đổi khung ảnh UseCase, số 01–03 của UseCase (không phải chuỗi). Hero: bụi 170 → 80, trước quạt 10 → 4, glow 0,2 → 0,12, đèn nền 0,30 → 0,18. Giữ: tia của quạt Hero/FinalCTA, quầng quanh quạt Process, trường nan Brand/UseCase, không khí.

**Copy:** Process nói rõ khách đưa gì và khi nào có báo giá, mockup, sản xuất, giao hàng; FAQ chỉ trả lời điều web/business hỗ trợ (form không có upload file nên FAQ nói Nan liên hệ để nhận logo); "điểm chạm thương hiệu" chỉ còn ở FinalCTA; mỗi ý định CTA một nhãn ("Gửi yêu cầu báo giá"; navbar giữ "Yêu cầu báo giá" vì chỗ hẹp).

**Form báo giá:** vẫn gửi thật tới API, chỉ báo thành công khi server nhận. Chuyển sang token thương hiệu (`indigo-deep`, viền `on-indigo-muted/60`, `danger`, nút `Button tone="indigo"`); label gắn với ô (`htmlFor`), lỗi `role="alert"` + `aria-describedby`, focus nhảy về ô lỗi đầu tiên, placeholder dùng token đủ tương phản (in nghiêng, không hạ opacity), nút đóng 44px, câu "Báo giá dựa trên kiểu quạt, chất liệu, số lượng và yêu cầu hoàn thiện." Modal: nền `indigo-deep/85`, không blur.

**Còn chờ dữ liệu thật:** liên hệ (email, điện thoại, mạng xã hội), trang pháp lý, ưu đãi "tư vấn thiết kế miễn phí cho đơn hàng đầu tiên" (dải thông báo + FAQ, nội dung có sẵn, cần chủ doanh nghiệp xác nhận), mô tả danh mục trong admin (vd. "Quạt nan tre" chỉ lặp tên, nay bị ẩn).

## 19. R10.4.1: QA cuối (chờ duyệt)

Chỉ sửa chữ, khoảng cách và ngữ nghĩa; không thêm yếu tố nào.
- **Chữ tiếng Việt:** `h1–h3 { text-wrap: balance }`, `p { text-wrap: pretty }` (globals) để không còn chữ mồ côi kiểu "quạt." một mình một dòng. Thân chữ 14px → 15px ở mô tả Process, lời đáp Problem/Solution, danh sách Material (mobile) và mô tả dòng sản phẩm.
- **Hero:** bỏ eyebrow tiếng Anh viết hoa ("Vietnamese Heritage Fan Design"), cùng tween GSAP của nó; `heroConfig.badge` vẫn là dữ liệu. Hai CTA thành một control mỗi nút (trước là `<button>` lồng trong `<a>`/`<Link>`: hai tab stop, HTML không hợp lệ): CTA chính mở form báo giá như mọi nút "Gửi yêu cầu báo giá" khác, CTA phụ là một link tới `/products`; dùng `Button tone="indigo"` (bỏ viền/bóng trắng ngoài token).
- **Nội dung cần chủ doanh nghiệp cung cấp (CONTENT REQUIRED FROM OWNER):** ảnh sản phẩm/ứng dụng thật (ảnh catalogue hiện là ảnh tạm, có ảnh nền trắng và ảnh chất lượng thấp), mô tả dòng sản phẩm trong admin, liên hệ thật, trang pháp lý, xác nhận ưu đãi tư vấn miễn phí, logo SVG (A6).

## 20. R10.5: thứ bậc thị giác, nhịp trang (chờ duyệt)

**Nguyên tắc:** Hero là tiêu điểm lớn nhất; các section sau dùng quạt làm vật hỗ trợ. Không thêm trang trí.
- **Thu nhỏ quạt:** Problem/Solution cột quạt `clamp(320, 100vw−660, 580)` → `clamp(300, 100vw−760, 440)` (mobile tối đa 520 → 380); Process: danh sách 5 → 6 cột, vật thể 7 → 5 cột, cao tối đa 66vh → 48vh (mobile sticky 34vh → 24vh); FinalCTA: quạt `min(84vw,1240)` → `min(62vw,900)`, mobile 150vw/860 → 112vw/640, chiều cao section `min(52rem,100svh)` → `min(40rem,90svh)`.
- **Khoảng trắng (~15–25%):** Brand `md:py-36` → `md:py-28` (cây nan Brand tính lại theo 112px), Problem/Solution, ProductType, Material, UseCase, Process, FAQ, FinalCTA giảm padding/margin đầu–cuối và giữa tiêu đề với nội dung. UseCase: ảnh chính đè lên Material 140px → 72px.
- **Material:** bên cạnh bộ mẫu là danh sách đủ 6 chất liệu: tên → bề mặt (`surface`) → "Phù hợp" (`bestFor`), cả hai tách từ `description` sẵn có, không thêm thông số. Chất liệu đang chọn mở rộng và được nâng trong bộ mẫu. Danh sách là control chính (nút `aria-expanded`); dải mẫu thành lối tắt chuột (`aria-hidden`, không vào Tab).
- **Kiểm tra trước in (thay §3 "một câu văn"):** khối ảnh trái (`prepressPhoto`, tạm dùng ảnh "Quạt vải") + tiêu đề hai câu, câu dẫn, 3 mục kiểm tra (không đánh số: không phải chuỗi) và bước duyệt mockup (đúng Process/FAQ).
- **UseCase:** tên ngữ cảnh luôn đậm màu chữ chính; trạng thái đang xem chỉ còn đường nhấn.
- **FAQ:** hover màu tre trên câu hỏi, focus ring rõ.
- **Giới hạn ảnh:** `prepressPhoto` trùng ảnh "Quạt vải" của ProductType (ảnh tạm); thay bằng ảnh proof/bản in thật khi có.

## 21. R10.5-H2: Hero "quạt là vật thể chính" (thay R10.5-H corner crop đã bị từ chối; chờ duyệt)

**Yêu cầu:** thấy **trọn chiếc quạt** (bóng, mép cung, nan, trục, cán), không crop; chữ và quạt là một bố cục, không 50/50.

**Ba phương án dựng thật ở 1440 × 900:** A "editorial offset" (chữ trên trái bậc thang, quạt dưới phải) vẫn đọc như "chữ trái trên, sản phẩm phải dưới"; C "diagonal" (quạt +9°, đẩy phải) đọc rõ là chữ trái / sản phẩm phải. **Chọn B, "centered object / type frame":** tiêu đề hai dòng chạy ngang phía trên (lùi 13vw, dòng 2 thụt 1.15em), quạt **trọn vẹn đứng giữa khung** làm vật thể chính, câu mô tả + 2 CTA neo góc dưới phải trên mép nội dung. Đường đọc: chữ → vật thể → hành động.
- **Hình học vật thể** (SilkFan, không tia): quạt rộng 0.747 W, cao 0.437 W (W = bề rộng khung asset), đỉnh 0.385 W trên pivot, cán 0.051 W dưới pivot. Mọi vị trí tính từ đó nên quạt luôn trọn trong khung; kiểm bằng điểm ảnh ở 7 kích thước: luôn trọn, cách mép ≥ 27 px (mobile) / ≥ 96 px dưới đáy (desktop).
- **Vị trí** (pivot, bề rộng khung, góc): xl `45vw, 100%−14vh, min(62vw,94vh), 0°` (1440: quạt ≈ 612 × 340 px); lg `40vw, 100%−15vh, min(56vw,84vh)`; md (tablet, chữ + CTA phía trên, quạt giữa dưới) `50vw, 100%−17vh, min(84vw,66vh)`; mobile: dải riêng giữa mô tả và CTA, khung 115vw, −4°, cao `2.5rem + 50.3vw`. Chiều cao Hero: desktop `clamp(720px,100svh,940px)`, tablet `max(100svh,720px)`, mobile theo nội dung (~720–750 px).
- **Asset:** `heroFan` (ratio + pivot) giữ nguyên; ảnh cut-out thật đặt vào cùng vị trí. Bố cục thiết kế quanh vật thể trọn vẹn.
- **Bỏ** so với R10.5-H: crop góc, pivot ngoài khung, quay −20°, lớp mờ đáy Hero, chốt tre và trường nan mờ ở Brand. Cây nan Brand giờ rơi từ đầu cán quạt, qua mép dưới Hero, dừng trong padding trên của Brand (không cắt qua tiêu đề Brand), md+.
- **Motion:** chữ `.hero-rise` (CSS, 16px); quạt opacity + scale 0.97 → 1 + 14px; cuộn: chìm ≤ 16px, quay ≤ 1° quanh pivot; không theo chuột, không vòng lặp. SilkFan vẫn tự mở một lần khi tải (choreography có sẵn). Reduced motion: khung cuối ngay.
- **Copy:** giữ tiêu đề "Di sản trong / từng nếp quạt." (thêm `heroConfig.headlineLines`, cùng chữ).

## 22. R10.6: Hero "bản lề" (**bị từ chối**, thay bằng §23)

**Yêu cầu:** một khung mở đầu như key visual chiến dịch: quạt lớn, **trọn vẹn**, chữ có tính không gian, chữ và quạt là một bố cục; không thêm trang trí để lấp chỗ trống.

**Bốn hệ bố cục dựng thật ở 1440 × 900** (`/dev/hero-lab?v=A|B|C|D`, chỉ chạy ở dev):
- **A "Typographic mass"**: quạt trọn vẹn ≈ 860 px ở trên, cả tiêu đề thành **một dòng** khổng lồ chạy hết bề rộng nội dung, ray mỏng bên dưới (mô tả trái, CTA phải).
- **B "Fan as centre of gravity"**: quạt lớn nhất ở giữa, hai dòng tiêu đề nằm ở hai "vai" của cung quạt, mô tả và CTA giữ hai góc dưới. Chữ bị dồn ra bốn góc nên bố cục bị phân tán.
- **C "Editorial edge"**: tiêu đề tách đôi, dòng 1 trên trái, dòng 2 dưới trái; quạt nằm giữa phải; mô tả treo mép phải trên. Mạnh, nhưng vùng giữa trái vẫn là khoảng thừa.
- **D "Typographic frame"**: tiêu đề chạy trên một cung đồng tâm với quạt, như con dấu. Đây là phương án lạ nhất, nhưng chữ ở hai đầu nghiêng khoảng 50°, khó đọc. Cung chữ cũng chỉ khớp khi quạt chính diện tròn đều, nên ảnh thật chụp hơi nghiêng sẽ làm hỏng bố cục.

**Chọn A, gọi là "bản lề":** **trục quạt đặt đúng trên khoảng trắng giữa "trong" và "từng"**, nên quạt mở ra từ chỗ câu chia đôi. Vị trí này đo từ chữ đã dàn (`data-hero-hinge`, ResizeObserver + `document.fonts.ready`) và ghi ra `--hero-hinge` (trong field) / `--hero-hinge-x` (viewport), nên đúng ở mọi khổ và mọi metric font.
- **Desktop (≥ 1024):** Hero cao `clamp(720px,100svh,940px)`, cột dọc: khoảng trống cho nav → field (size container, chứa quạt) → tiêu đề một dòng `min(7.75rem, (100vw−3rem)/10.4)` (124 px ở 1440) → ray. Quạt rộng `min(860px, 62% khung, theo chiều cao field)`, cán cách mép trên chữ 14 px. Đo: 1440 × 900 quạt 860 px; 1280 × 800: 724; 1024 × 768: 635; 1920 × 1080: 860.
- **Dưới 1024 (bố cục kiểu bìa tạp chí):** mô tả thành chú thích nhỏ ở đầu khung (trên trái), quạt trọn vẹn ≈ 92% (phone) / 90% (tablet) bề rộng, tiêu đề hai dòng so le (dòng 1 trái, dòng 2 phải, cỡ `min(6.5rem,(100vw−3rem)/5.75)`), trục quạt ở giữa trên chỗ ngắt; CTA cuối: phone full-width xếp dọc, tablet dồn phải dưới dòng 2. Thứ tự đọc DOM vẫn là tiêu đề → mô tả → CTA.
- **Asset:** `heroFan.extent` (bề rộng quạt, đỉnh trên trục, cán dưới trục, theo phần của bề rộng ảnh) cùng `ratio` + `pivot` mô tả vật thể; CSS tính kích thước từ đó (`--fw/--fa/--fb/--fan-tall`). Ảnh cut-out thật chỉ cần khai đúng ba số này.
- **Cây nan Brand:** giờ nối dài trục bản lề: rơi từ ray Hero (khoảng trống giữa mô tả và CTA), qua mép dưới Hero, dừng trong padding trên của Brand; chỉ lg+. Sửa sai lệch 24 px cũ: `cqw` của Section là content box (đã trừ padding 1.5rem).
- **Không làm:** chữ "NAN" khổng lồ làm nền. Đã cân nhắc nhưng bỏ, vì nó tranh chỗ với chữ NAN thật trên quạt. Không thêm hạt, glow, lưới, vòng tròn.
- **Motion:** giữ như R10.5-H2 (chữ `.hero-rise`, quạt vào một lần, cuộn chìm ≤ 16 px / quay ≤ 1°; reduced motion: khung cuối ngay).

## 23. R11: Hero "Typographic composition" (**bị từ chối**: dùng ảnh quạt giấy catalogue thay quạt 3D; thay bằng §24)

**Lý do làm lại:** R10.6 vẫn là ngôn ngữ hero website (khối tiêu đề + vật thể + mô tả + CTA). Yêu cầu: khung mở đầu như visual chiến dịch / editorial, phá lưới, chữ là một phần của tác phẩm, **quạt luôn trọn vẹn**, dựng với **quạt thật** chứ không theo vector.

**Quạt thật:** chưa có ảnh A1. Tạm dùng ảnh catalogue "Quạt giấy" (`catalogPhotos.paperFan`): tách nền bằng Cloudinary `e_background_removal`, cắt chân đế, đệm lề, xuất 1600 × 880 → `public/images/hero/nan-paper-fan-cutout.png`. Đây là quạt Nan thật, **nhưng nguồn chỉ 736 px** nên hơi mềm trên màn hình retina. Khi có ảnh A1 (≥ 3000 px), cập nhật `heroFan` (`src`, `ratio`, `pivot`, `extent`). Để `src` rỗng thì Hero quay về vector SilkFan, cùng vị trí và cùng kích thước nhìn thấy.

**Ba concept dựng thật** (`/dev/hero-lab?c=1|2|3`, chỉ chạy ở dev), mỗi concept render ở 1440 × 900, 1280 × 800, 1024 × 768, 768 × 1024 và 430 × 932:
- **01 Editorial poster:** "Di sản" cỡ masthead; quạt nghiêng đứng **trước** chữ, cắt qua chân chữ như bìa tạp chí; câu còn lại viết nghiêng ở dưới trái. Mạnh, nhưng là thủ pháp quen, và góc dưới trái thành một vùng nội dung.
- **02 Gallery / catalogue plate:** quạt đặt trên một mảng nổi như trang in catalogue; nhãn kiểu bảo tàng; tiêu đề cắt qua mép mảng. **Loại** vì trên desktop vẫn là "chữ trái / ảnh phải" (tiêu chí #2) và không đủ khác biệt khi xem riêng (#8).
- **03 Typographic composition: CHỌN.** Câu tiêu đề **đi xuyên qua vật thể**: "Di sản" (cỡ cực lớn) tựa mép trên trái; quạt trọn vẹn, nghiêng −11°, cắt chéo khung; "trong từng" (nhỏ, nghiêng) nằm ở vai quạt đang nâng lên; "nếp quạt." (cỡ cực lớn) tựa mép dưới phải. Đường đọc là chữ Z qua quạt. Bố cục không chia vùng chữ / ảnh; mỗi khoảng trống nằm giữa hai khối (dưới trái là ray CTA, trên phải là ghi chú). Ảnh thật làm bố cục mạnh hơn, vì chữ đè lên mép một vật thể có thật.

**Bố cục chốt:**
- **lg+:** Hero `clamp(720px,100svh,940px)`. Quạt rộng (phần nhìn thấy) `min(55vw, 86vh, 808px)`, trục quạt ở 47% / 75% khung. "Di sản" `clamp(8rem,17vw,17rem)` ở top 14%; "trong từng" `clamp(2.5rem,4.4vw,4.5rem)` ở right 6vw, top 37%; "nếp quạt." `clamp(8rem,15.5vw,15.5rem)` ở bottom 7%. Ghi chú trên phải (15rem); 2 CTA xếp dọc ở mép trái, bottom 7%.
- **Dưới 1024:** chữ Z theo chiều dọc: "Di sản" / "trong từng" (phải) / quạt (78vw phone, 74vw tablet, −7°) / "nếp quạt." treo ngay dưới quạt / ghi chú (chỉ hiện khi màn hình cao ≥ 740 px) / CTA ở mép dưới trái.
- **Kích thước theo phần quạt nhìn thấy** (`--fv`, chia cho `heroFan.extent.width`), nên vector hay ảnh thật đều đặt đúng chỗ. Đã kiểm ở 375 × 667 → 1920 × 1080: quạt luôn trọn trong khung, không tràn ngang.
- **Copy:** `heroConfig.headlineParts` ["Di sản", "trong từng", "nếp quạt."] (vẫn là một `h1`, đọc liền câu); `heroConfig.statement` "Bạn đưa ý tưởng. Nan biến nó thành một chiếc quạt mang dấu ấn riêng." Không dùng eyebrow và micro-info: thử rồi, chỉ làm loãng bố cục.
- **Cây nan Brand** (không sửa Brand): Hero ghi `--hero-hinge-x` = điểm giữa khe giữa ray CTA và "nếp quạt.", nên cây nan rơi trong khe trống, không cắt qua chữ hay quạt.
- **Motion:** giữ nguyên (chữ `.hero-rise`; quạt vào một lần; cuộn chìm ≤ 16 px, quay ≤ 1° quanh trục; reduced motion: khung cuối ngay).
- **Giới hạn đã biết:** ảnh Hero tạm trùng ảnh "Quạt giấy" của Brand ngay bên dưới (cùng một chiếc quạt, hai lần liên tiếp). Cần ảnh A1 riêng.

## 24. R11.1: Hero "Typographic collision" với quạt 3D (thay R11 bị từ chối; chờ duyệt)

**Quy tắc chốt:** hình của Hero **là quạt 3D SilkFan** (`components/homepage/silk-fan/SilkFan.tsx`, dựng trong `HeroSilkStage` qua `HeroVisualStage`): lá quạt navy gấp nếp, highlight, viền vàng, chữ "NAN". **Không** dùng ảnh catalogue, ảnh quạt giấy, ảnh tách nền hay ảnh stock trong Hero. Ảnh tách nền của R11 (`public/images/hero/nan-paper-fan-cutout.png`) đã bị xoá; `heroFan` trỏ lại vector (`src: ""`).

**Ba concept dựng với quạt 3D ở 1440 × 900** (`/dev/hero-lab?c=1|2|3`, chỉ chạy ở dev):
- **01 Type as architecture (cổng tam quan):** "Di sản" và "nếp quạt." đứng dọc như hai cột trụ ở hai mép khung, "trong từng" làm xà ngang, quạt đứng trong cổng. Dễ nhớ, nhưng gần như đối xứng, và chữ dọc làm giảm độ dễ đọc.
- **02 Editorial object (bản giải phẫu):** quạt có 4 chú thích đánh số kèm đường dẫn (Kiểu quạt, In ấn, Chất liệu, Hoàn thiện). Rõ ràng, nhưng các điểm chú thích gần với sơ đồ tính năng sản phẩm, vẫn là ngôn ngữ website.
- **03 Typographic collision: CHỌN.** Tiêu đề cỡ lớn và quạt chiếm cùng một không gian. Chữ đặc nằm **sau** quạt; chỗ chữ đi qua quạt thì được vẽ tiếp bằng **nét viền mảnh phủ lên quạt** (`.hero-outline`), nên quạt hiện trọn vẹn và mọi chữ vẫn đủ nét. Đây là cách đọc "tác phẩm", không phải "website có ảnh sản phẩm".

**Bố cục chốt:**
- **lg+:** Hero `clamp(720px,100svh,940px)`; hai dòng "Di sản trong" (từ mép trái, top 22%) và "từng nếp quạt." (tới mép phải, top 50.2%), cỡ `min(14.9vw, 23.8svh, 14rem)`. Quạt rộng (phần nhìn thấy) `min(57vw, 91svh, 856px)`, trục ở 52.8vw / 78.4%, quay −9°. Ghi chú trên dòng 1, bên trái; 2 CTA ở mép dưới trái.
- **Dưới 1024:** bố cục riêng: ba dòng "Di sản" (trái), "trong từng" (phải, cắt qua cung quạt), "nếp quạt." (trái, đi qua lá quạt, trên phần nan vàng); quạt 86vw (phone) / 84vw (tablet), −9°; ghi chú (chỉ khi màn hình cao ≥ 760 px) và CTA ở mép dưới trái.
- Đo ở 375 × 667 → 1920 × 1080: quạt luôn trọn trong khung, không tràn ngang; chỉ có một `h1`, đọc liền câu (lớp viền là bản sao `aria-hidden`).
- **Cây nan Brand** (không sửa Brand): `--hero-hinge-x` = điểm giữa mép phải ray CTA và trục quạt, nên cây nan rơi dưới quạt, trong khoảng trống.
- **Motion:** chữ `.hero-rise`; quạt vào một lần; cuộn chìm ≤ 16 px, quay ≤ 1°; không vòng lặp, không theo chuột; reduced motion: khung cuối ngay.

## 25. Hero showcase (HeroShowcase): quạt là vật thể được dàn dựng (chờ duyệt)

**Bối cảnh:** R11.1–R17 đều bị từ chối, vì chỉ sắp lại "tiêu đề + quạt + nút" quanh một hình SVG phẳng. Hero mới là component riêng `HeroShowcase.tsx`, có hệ CSS riêng (`.hs-*`); trang chủ dùng nó thay cho `HeroSection` (`HeroSection`, `HeroArtDirected`, `HeroR17` và lab vẫn còn để đối chiếu).
- **Ý tưởng:** một khung cảnh có ánh sáng. Ánh sáng là một vệt dịu trên tường sau quạt. Dưới đường chân trời (`--hz`), sàn hắt nhẹ ánh sáng đó. Quạt 3D (SilkFan, không đổi) xoay trong phối cảnh thật (`rotateY` 28°, `rotateX` 13°), đứng trên sàn, có bóng tiếp xúc ở cán và bóng đổ mềm trên sàn.
- **Chữ:** tiêu đề đứng trên đường chân trời, tức cùng mặt sàn với quạt. Hai câu đỡ và hai hành động nằm trên sàn phía trước. Câu đỡ thứ hai ("Từ ý tưởng, chất liệu đến hoàn thiện…", `heroConfig.supportLine`) chỉ hiện khi khung đủ chỗ.
- **Chuyển động:** vào một lần (`.hero-rise`); khi cuộn đi, quạt xoay thêm tối đa 7°. Không theo chuột, không vòng lặp; reduced motion: khung cuối ngay.
- **Hạn chế đã thừa nhận:** về cấu trúc vẫn là chữ một bên, vật thể một bên. Phần mới là cách dàn dựng vật thể (ánh sáng, sàn, bóng, góc máy), không phải mô hình bố cục.

## 26. R18: Hero "Dấu ấn của bạn" (HeroImprint), mounted on `/` (local review candidate)

**Ý tưởng:** Hero là một bằng chứng hoạt động được cho dịch vụ của Nan: in chữ của khách lên quạt. Quạt (chỉ SilkFan, không còn lớp WebGL) xuất hiện với chữ NAN. Một ô nhập mời khách "Thử in tên của bạn lên quạt". Khi khách ngừng gõ, quạt gấp lại theo chính đường mở của nó, được in lại bằng nhũ vàng với chữ của khách, rồi mở ra. Nút "Gửi yêu cầu báo giá" mở form báo giá với ghi chú điền sẵn "Chữ muốn in trên quạt: …".
- **Ba concept dựng thật** (`/dev/hero-lab?v=a|b|c`, so với `current`), mỗi concept một cơ chế:
  - **A "Mở ra":** cuộn trang làm quạt gấp thành một thanh nan và nối sang cây nan của Brand. Khung đầu là bố cục bản lề, đã bị từ chối trước đây.
  - **B "Bốn nếp":** cảnh được ghim, 4 chương ứng với 4 trạng thái gấp, dài 4 màn hình cuộn.
  - **C "Dấu ấn của bạn":** chọn, vì là tương tác duy nhất chỉ thuộc về Nan và dẫn thẳng tới báo giá.
- **Thay đổi kỹ thuật:**
  - SilkFan thêm hai thứ, mặc định không đổi: `foldRef` (điều khiển gấp, không lắc khi giữ) và `fitText` (chữ ≤ 3 ký tự giữ cỡ 130; chữ dài hơn tự thu nhỏ, tối đa khoảng 12 ký tự).
  - `QuoteRequestForm` thêm `initialMessage` (tùy chọn).
  - `--hero-hinge-x` = trục quạt, nên cây nan Brand rơi từ cán quạt.
- **Rollback:** trong `app/page.tsx`, mount lại `HeroShowcase` (hoặc `HeroSection`).
- **Hạn chế đã biết:** khung tĩnh trên desktop vẫn là chữ trái, quạt phải. Điểm khác biệt nằm ở hành vi, không ở bố cục.

## 27. R19: Hero "The unfolding atelier" (HeroAtelier), mounted on `/`

**Khung hình mới:** không còn là một hình chữ nhật tối chia chữ / sản phẩm. Hero là một trang sổ mẫu đặt trên sân khấu chàm.
- **Tờ giấy:** một tờ giấy ngà (`paper` + sợi giấy `nan-material-paper`) phủ bên trái và chạy dọc chân khung. Mép tờ giấy gấp xiên, có một dải mép gập lộ mặt sau giấy và một đường nhũ champagne mảnh, mở ra một ô cửa không đều nhìn vào sân khấu.
- **Quạt:** quạt NAN đứng trọn trong ô cửa, cán đặt lên dải giấy dưới, có bóng tiếp xúc trên giấy.
- **Chữ:** in trên giấy. Tiêu đề (navy) và câu dẫn nằm ở lá trên; dòng "Viết tên của bạn, Nan in thử lên quạt" nằm trên dải dưới, ngay dưới trục quạt; hai hành động ở góc dưới trái.
- **Header:** vẫn nằm trên dải chàm, vì Navbar được thiết kế cho nền tối và không bị đổi.
- **Phone/tablet:** lá giấy trên + dải giấy dưới, ô cửa chàm ở giữa (bố cục riêng, không thu nhỏ desktop).

**Trình tự:** A, khung hoàn chỉnh (quạt in NAN). B, focus vào dòng viết: quạt nhấc lên 10 px, đường nhũ sáng hơn. C, khi khách ngừng gõ hoặc bấm "In lên quạt": quạt gấp theo đường mở của chính nó (`foldRef`), được in lại chữ mới (`fitText` theo độ rộng từng grapheme), mở ra. Dải giấy ghi rõ "Bản xem trước. Quạt thật được in theo thiết kế bạn duyệt." và có nút "Về chữ NAN". Form báo giá nhận ngay chữ khách vừa yêu cầu. Reduced motion: cùng các bước, không gấp.

**Nhập liệu** (`atelier/imprint.ts`): chuẩn hoá NFC; khoảng trắng (cả tab) thành dấu cách, sau đó mới bỏ ký tự điều khiển/định dạng; giới hạn 14 grapheme (`Intl.Segmenter`); viết hoa theo locale vi; tôn trọng IME (không in lại khi đang soạn).

**Dọn dẹp:** gỡ `HeroArtDirected`, `HeroR17`, `HeroShowcase`, ba concept R18 cùng CSS của chúng (khoảng 280 dòng trong globals), và prop `inscription` không còn dùng. Giữ `HeroImprint` (R18) làm rollback; giữ `HeroSection` (vẫn được nơi khác tham chiếu).

**Hạn chế đã biết:**
- Desktop rộng (1440–1920) còn một khoảng giấy trống giữa nhóm tiêu đề và hàng hành động.
- Bề mặt quạt vẫn là shading SVG (không đổi vật liệu).
- Hoạt ảnh gấp không quay được trong trình duyệt headless (render phần mềm quá chậm). Đã kiểm đường gấp bằng các giá trị cố định.

## 28. R20: Hero "Nan Signature" (HeroSignature), mounted on `/`

**Ý tưởng:** một vật thể trong một nguồn sáng. Quạt Nan lớn, nghiêng 8°, được chiếu từ trên bên trái trong một căn phòng chàm tối, bóng đổ lên tường phía sau. Bố cục đi theo chính hình học của quạt: tiêu đề bậc xuống bên vai trái quạt (mỗi dòng ngắn dần theo đường cung), một thẻ tên bằng giấy treo từ đinh tán bằng sợi dây mảnh, nằm dưới cánh phải. Khách viết chữ lên thẻ; nút báo giá nằm ngay dưới thẻ.
- **Hai hướng đã dựng** (`/dev/hero-lab?v=r20|b`): A "Signature" (chọn) và B "Gallery wall" (quạt treo trên tường ngà, tiêu đề như chữ dán tường, nhãn bảo tàng). B bị loại: về cấu trúc vẫn là chữ dưới trái, quạt trên phải; dải header tối trên nền giấy lặp lại vấn đề R19; bản mobile là chồng khối thông thường.
- **Desktop (ngang ≥ 1024):** mọi phần tử đặt từ đinh tán (`--px`, `--py`) và cỡ quạt `--fw`. `--fw` là giá trị nhỏ nhất của ba giới hạn: 75vw, chiều cao còn lại phía trên thẻ, và độ rộng đủ để cánh trái không chạm cột chữ trong khi thẻ vẫn vừa bên phải.
- **Phone/tablet:** chuỗi dọc riêng: tiêu đề hai dòng, quạt trọn chiều ngang, dây rơi thẳng từ cán quạt xuống lỗ xỏ ở giữa mép trên thẻ, rồi các nút.
- **Tiêu đề:** "Dấu ấn riêng trong từng nếp quạt." (đổi từ "Di sản…" để khớp câu chuyện cá nhân hóa); câu đỡ dùng `heroConfig.subheadline` có sẵn, không thêm thông tin kinh doanh.

**Quạt (SilkFan, vẫn là SVG có shading, không phải mô hình 3D):** viền nhũ chuyển sang gradient kim loại có nền tối định hình mép; chữ nhũ có vết ép tối bên dưới. Props mới, mặc định giữ hành vi cũ: `ambient` (khi đang giữ bằng `foldRef`, ánh sáng trượt chậm trên nếp và quạt lắc ≤ 0,45°), `openDelayMs`/`openMs` (mở lại sau khi in nhanh hơn: 1,5 s). Vòng lặp giữ quạt dừng hẳn khi Hero ra khỏi màn hình (đã đo: 0 lần ghi thuộc tính SVG/giây).

**Tương tác** (`signature/useImprint.ts`, tách từ R19, cùng quy tắc `atelier/imprint.ts`): gấp 640 ms (ease-in-out cubic), in lại, mở 1,5 s; bóng đổ co lại khi quạt gấp. Chữ trong thẻ tự thu nhỏ theo độ dài để luôn vừa. Thẻ ghi rõ "Bản xem trước. Báo giá sẽ kèm chữ này."; form báo giá nhận "Chữ muốn in trên quạt: …".

**Rollback:** trong `app/page.tsx`, mount lại `atelier/HeroAtelier` (R19) hoặc `HeroImprint` (R18).

**Hạn chế đã biết:**
- Quạt vẫn là SVG procedural. Muốn chất liệu ảnh thật (lụa, tre, nhũ) cần một render/mô hình 3D từ designer; `SignatureFan` là điểm thay duy nhất, layout không phụ thuộc vào SVG.
- Ở 1024 × 768 quạt chỉ rộng khoảng 44% khung (để chừa cột chữ và thẻ).
- Hoạt ảnh gấp không chụp được từng khung trong trình duyệt headless; đã kiểm bằng khung chụp lúc quạt đang mở lại.

## 29. R20.1: "The Signature Object", quạt 3D thật, mounted on `/`

**Quạt (fan3d/FanScene.ts, three.js thuần, tải lười; khoảng 182 KB gzip, không nằm trong HTML ban đầu):**
- Hình học thật: lá quạt gồm 28 mặt phẳng giữa 29 nếp (nếp lõm ở trước, nếp lồi ở sau). Độ sâu nếp theo vật lý gấp, √(a_phẳng² − a²)·r, nên nếp sâu dần khi quạt khép; khi khép hẳn, quạt là một chồng lá đứng. 14 nan trong và 2 nan cái là các thanh vuốt thon xoay quanh một đinh tán kim loại. Chuyển động dùng lại `openAngles`/`openGroup` của SilkFan.
- Vật liệu: `MeshPhysicalMaterial` cho lá (sheen kiểu vải). Màu, sợi, viền nhũ bám theo mép lượn và chữ được vẽ lên canvas theo toạ độ lá trải phẳng, nên chữ đi theo đúng từng nếp. Cùng bố cục ấy tạo bản đồ roughness/metalness (nhũ và viền là kim loại thật, phản chiếu môi trường) và bump map (chữ ép vào sợi). Nan tre có vân dọc.
- Ánh sáng: một spotlight trên bên trái đổ bóng thật lên nếp quạt và lên một tường bắt bóng trong suốt; môi trường `RoomEnvironment` để phản xạ; tone mapping ACES.
- Hiệu năng: canvas chỉ phủ quạt và bóng đổ, nền phòng là CSS; ngân sách khoảng 3,2 triệu pixel (2,2 triệu trên màn cảm ứng); chỉ render khi có thay đổi (mở, gấp, con trỏ, đổi kích thước) và ngủ khi ra khỏi màn hình.
- Fallback: không có WebGL hoặc mất context thì SilkFan SVG đứng đúng chỗ đó. Kiểm đường gấp tại `/dev/hero-lab?v=fold3d`.

**Bố cục:** quạt đứng trên trục giữa khung. Desktop: tiêu đề nằm trên đường chân trời dưới hai cánh quạt và bị cán quạt tách đôi (lưới `1fr | 0,36R | 1fr`); dòng viết chữ nằm ngay dưới cán, cùng trục; câu đỡ và hành động ở hai bên. Mobile/tablet: một cột trên cùng trục (tiêu đề, quạt, dòng viết, hành động), căn giữa theo chiều dọc. Toàn bộ kích thước suy ra từ `--R`.

**Cá nhân hoá:** bỏ thẻ treo và nút xanh; thay bằng một dòng chữ không khung (gạch chân champagne, chữ hoa EB Garamond, tự thu nhỏ theo độ dài, không dưới 16 px). Trạng thái: số ký tự, "Quạt đang gấp lại…", "Bản xem trước, báo giá sẽ kèm chữ này. Về chữ NAN". Chữ chỉ đổi khi quạt đã khép; cảnh giữ quạt khép cho tới khi chữ mới được vẽ (không loé chữ cũ).

**Chữ:** bỏ in nghiêng/đổi màu riêng "nếp quạt." và các mũi tên "→".

**Rollback:** `signature/HeroSignatureR20.tsx` (R20, lớp `.s20-*`, lab `?v=r20`); `atelier/HeroAtelier` (R19).

**Hạn chế / cần designer:**
- Vật liệu là texture thủ tục, không phải scan. Để đạt chất lượng ảnh thật cần: scan hoặc ảnh vải/giấy của lá quạt thật (albedo + normal), vân tre của nan, mẫu nhũ thật; tốt nhất là một mô hình quạt glTF có UV cho lá do designer dựng, còn `FanScene` giữ vai trò dựng cảnh, gấp và in chữ.
- Hoạt ảnh mở/gấp không đo được 60 fps trong Chrome headless (render phần mềm khoảng 1 khung/3 s); đã kiểm bằng các tư thế cố định (`?v=fold3d`) và luồng chức năng thật.
- Lần render đầu biên dịch shader (ngắn trên GPU thật, có thể khựng nhẹ trên máy yếu).

## 30. R20.2: quạt R20 trở lại, bố cục trục được hoàn thiện, mounted on `/`

**Chọn quạt bằng hình ảnh, không theo công nghệ.** Hai ứng viên được dựng cùng kích thước, cùng nền (`/dev/hero-lab?v=cmp`):
- **A, R20 cải tiến:** SilkFan SVG (quạt R20 không đổi), chỉ chỉnh bóng đổ.
- **B, 3D cải tiến:** FanScene chỉnh theo thẩm mỹ R20: pháp tuyến mềm ở nếp (`CREASE_SOFT` 0,55), mép lượn tròn hơn, bảng màu lụa R20, nhũ dùng đúng font của R20 (EB Garamond; canvas không đọc được `var()`, xem `cssFontStack`), lụa mờ, nan thon có hạt thoi trên nan cái, đinh tán dẹt, bóng nhẹ, tone mapping Neutral.
- **Kết quả: A.** B đã gần phom R20, nhũ phản chiếu tốt, nhưng màu vẫn xanh coban gắt, bề mặt mịn như nhựa, mất các đường nếp sáng mảnh vốn tạo chất lụa của R20, hạt thoi không rõ. Homepage dùng A và không tải three.js. B giữ trong lab (`?v=b3d`, `?v=cmp`, `?v=fold3d`) qua `FanStage engine="gl"`.

**Những gì làm quạt R20 đẹp (được giữ nguyên):** mép trên lượn tròn theo từng nếp; chuyển sáng tối mềm trong mỗi nếp, có đường nếp sáng mảnh; xanh hoàng gia ánh chàm hơi giảm bão hoà; dải ánh sáng rộng chạy qua lá; nan màu kem thanh, khe rõ, bông tua đầy dưới đinh tán; chữ NAN lớn, nhũ champagne nhạt có vết ép; viền vàng mảnh; đinh tán nhỏ dạng vòng; hạt thoi trên nan cái.

**Bóng và ánh sáng:** bóng đổ nhỏ hơn và nhạt hơn nhiều (`rgb(3 4 14 / .36)`, lệch 0,012/0,026 --fw); quạt vẫn đứng vững khi không có bóng. Nền là một vùng sáng rộng, rất nhẹ sau quạt, góc tối dần; không glow trên quạt.

**Bố cục:** một trục.
- Desktop: khối chữ căn giữa ở trên (tiêu đề một dòng, không còn bị cán quạt tách đôi; một câu đỡ; hai hành động), quạt đứng thẳng, lớn nhất có thể theo chiều cao; dòng viết chữ ngay dưới cán quạt. Quạt và dòng viết là một khối sản phẩm, khối chữ giới thiệu nó; không còn hàng UI dưới Hero.
- Mobile/tablet: tiêu đề, câu đỡ, quạt, dòng viết, rồi hành động (vùng ngón cái). Phone dùng lề 0,75rem cho quạt để quạt lớn hơn; tablet giữ lề 6vw.

**Bản lưu:** `HeroSignatureR201` (R20.1, `.s201-*`, lab `?v=r201`), `HeroSignatureR20` (`?v=r20`), `atelier/HeroAtelier` (R19). `FanStage` nhận `ns` (tiền tố class) để hai Hero dùng chung.

**Hạn chế:** quạt vẫn là SVG procedural (đẹp nhưng không phải ảnh vật liệu thật); để vượt mức này cần ảnh hoặc render quạt thật từ designer (lụa, tre, nhũ). Dải sáng trôi chậm trên lụa (`ambient`) vẫn bật; tắt dưới reduced motion.

## 31. R20.3: "Signature Canvas", mounted on `/`

**Quạt:** giữ nguyên quạt R20 SVG (SilkFan qua `FanStage engine="svg"`), không đổi thiết kế; chỉ đổi quy mô và vị trí.

**Bố cục desktop (dựng từ đinh tán: `--px`, `--py` theo % khung, bán kính `--R`):**
- Quạt khoảng 2/3 bề ngang (`--R` ≤ 34vw), lệch phải, đinh tán thấp trong khung, đứng thẳng.
- Tiêu đề 3 dòng ("Dấu ấn riêng / trong từng / nếp quạt.", serif 5vw, tối đa 6rem) nằm trong khoảng lõm phía trên cánh trái, căn phải theo một vòng tròn đồng tâm với mép quạt (`shape-outside: circle(1,04R + 1,6rem)` trên một float). Đầu mỗi dòng chạy song song với viền nhũ; câu đỡ theo cùng đường cong. Đây là quan hệ trực tiếp giữa chữ và hình học quạt, không phải cột chữ đặt cạnh ảnh.
- Dưới hai cánh, hai khối dựa vào cán quạt: khối in chữ ("Tên bạn, dấu ấn bạn.") kết thúc cách cán 0,22R về bên trái; khối báo giá bắt đầu cách cán 0,22R về bên phải, là điểm cuối đường đọc (tiêu đề, câu đỡ, in chữ, báo giá). Thứ tự DOM trùng thứ tự nhìn và thứ tự Tab. Cây nan của Brand rơi thẳng từ cán quạt qua khe giữa hai khối.
- **Mobile/tablet:** cột căn trái kiểu biên tập: tiêu đề 3 dòng lớn (11vw), câu đỡ, quạt gần trọn bề ngang, khối in chữ, báo giá. Trên máy thấp (≤ 700 px) ẩn câu đỡ và ghi chú để nút báo giá ở màn hình đầu.

**In chữ:** lúc nghỉ chỉ là tiêu đề nhỏ + ghi chú + nút "Viết chữ lên quạt" (rõ ràng, không giấu sau hover). Bấm thì dòng viết mở ra tại chỗ, con trỏ vào ô. Trạng thái: đếm ký tự, "Quạt đang gấp lại…", "Đã in bản xem trước. Báo giá sẽ kèm chữ này. Về chữ NAN", lỗi khi bấm "In thử" với dòng trống (`aria-invalid`, viền đỏ, thông báo live). Esc trên dòng trống đóng lại và trả focus. IME, giới hạn 14 grapheme, gấp/mở và truyền chữ sang form báo giá giữ nguyên (`useImprint`, thêm `error` và `inputRef`).

**Tham khảo:** các trang Awwwards được chỉ định chỉ có ảnh/video, không có nội dung đọc được về bố cục; không có trình duyệt trực tiếp, nên không rút ra kỹ thuật cụ thể từ chúng.

**Rollback:** `signature/HeroSignatureR202.tsx` (R20.2, `.s202-*`, lab `?v=r202`), rồi R20.1/R20/R19.

**Hạn chế:** chữ căn phải theo đường cong khó đọc hơn chữ căn trái một chút (chấp nhận được cho 3 dòng tiêu đề và 2 dòng câu đỡ); góc trên phải và dưới trái trên desktop là khoảng thở, không có nội dung; quạt vẫn là minh hoạ SVG, không phải ảnh vật liệu thật.
