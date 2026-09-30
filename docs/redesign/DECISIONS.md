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
| BrandStatement, Problem, Solution, AIDesigner, UseCase, Process, FAQ, FinalCTA | `indigo` |
| ProductType, Material | `paper` (đúng 2 mảng ngà) |

**Ngăn cách hai section indigo liền nhau** (Problem → Solution → AIDesigner, UseCase → Process → FAQ → FinalCTA): một `Rule` tone indigo ở đầu section thứ hai, như ngắt chương của sách. Không dùng nền xen kẽ, không thêm màu.

**Ngoại lệ đã duyệt (R2d)**
- **Panel CTA cuối trang (`FinalCTASection`) giữ nền `navy` trên nền indigo.** Đây là điểm navy duy nhất trên nền tối, dùng làm điểm nhấn kết trang. Panel không có bóng đổ, glow hay gradient. Chữ trên panel dùng token nền tối: `on-indigo` 10,52:1, `on-indigo-muted` 5,73:1, `bamboo` 4,81:1 (đều đạt). Không dùng navy trên nền tối ở bất kỳ chỗ nào khác.
- **Khung xem trước mockup trong `AIDesignerSection` giữ nền sáng `paper-deep`,** như một tờ giấy vẽ nằm trong section indigo, để màu quạt pastel hiện đúng như khi in. Đây là khung bên trong section, không tính là một mảng ngà. Hai nhãn nổi trên mockup ("Style selected", "Preview mode / Live Mockup") đã bỏ.

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
- **Viền điều khiển trên nền tối (đo ở R2d):** ô nhập, nút chọn phong cách, ô màu, vùng tải ảnh trong AIDesigner dùng `border-on-indigo-muted/60`. Đo được 3,64:1 trên `indigo-raised` và 3,86:1 trên `indigo`, đạt mức 3:1 của WCAG 1.4.11. Mức 50% chỉ đạt 2,94:1, nên **không** hạ dưới 60%. Đây là viền, không phải chữ, nên không trái quy tắc "không pha loãng màu chữ".

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
