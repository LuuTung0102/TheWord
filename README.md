# 📄 TheWord - Hệ Thống Tự Động Hóa Tạo Văn Bản

## 📋 Mục Lục
- [Tổng Quan](#-tổng-quan)
- [Tính Năng Chính](#-tính-năng-chính)
- [Tính Năng Mới](#-tính-năng-mới-v60)
- [Cài Đặt](#-cài-đặt)
- [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Công Nghệ](#-công-nghệ)

---

## 🎯 Tổng Quan

**TheWord** là hệ thống tự động hóa tạo văn bản dựa trên Electron, giúp tạo file Word từ template nhanh chóng và chính xác. Được thiết kế cho văn bản pháp lý và hành chính với khả năng quản lý và tái sử dụng dữ liệu thông minh.

### Quy Trình Làm Việc
```
Chọn Folder Template → Chọn File .docx → Điền Form → Xuất Văn Bản ✅
```

### 100% Offline
- Không cần internet sau khi cài đặt
- Dữ liệu lưu trữ local
- Kiểm soát quyền riêng tư hoàn toàn

### ⚠️ Lưu Ý Quan Trọng
- **Chỉ hỗ trợ định dạng .docx** (Word 2007+)
- **File .doc (Word 97-2003) KHÔNG hoạt động**
- Xem [Hỗ Trợ Định Dạng File](#-hỗ-trợ-định-dạng-file) để biết cách chuyển đổi

---

## ✨ Tính Năng Chính

### 📝 Tạo Form Thông Minh
- **Tự động tạo form** từ placeholder trong template
- **15+ loại trường**: text, number, date, select, address, money, land-type, HTSD, và nhiều hơn
- **Validation thông minh** với phản hồi trực quan và tự động chuyển tab
- **Tự động format**: CCCD (9/12 số), Tiền (1,000,000), Ngày tháng, Số điện thoại
- **Nhập địa chỉ linh hoạt**: Tự động gợi ý từ database HOẶC nhập thủ công cho thôn/xóm


### 🏷️ Hệ Thống Loại Đất Nâng Cao
- **3 định dạng thông minh**:
  - `Loai_Dat`: Mã cơ bản (CLN+NST)
  - `Loai_Dat_F`: Có diện tích (CLN 1236.5m²)
  - `Loai_Dat_D`: Chi tiết với vị trí (CLN|Vị trí|1236.5)
- **Tự động đồng bộ** giữa các định dạng
- **Chuyển đổi tự động** khi tái sử dụng giữa các template

### 🔄 Hệ Thống HTSD (Hình Thức Sử Dụng Đất) - MỚI
- **2 chế độ hiển thị**:
  - **Loại 1**: Dropdown (Sử dụng chung/Sử dụng riêng)
  - **Loại 2**: Nhập diện tích (m² Chung + m² Riêng)
- **Toggle linh hoạt**: Bật/tắt từng loại độc lập hoặc cả 2
- **Tự động sync**: Thay đổi HTSD tự động cập nhật vào session gốc
- **Hỗ trợ tái sử dụng**: Giữ nguyên printMode khi reuse data
- **Logic đặc biệt**: Không ảnh hưởng merge logic (giống Loai_Dat_D)

### 🗺️ Hệ Thống Địa Chỉ Linh Hoạt
- **4 cấp cascading**: Tỉnh → Xã → Thôn/Xóm → Đường
- **Hành vi dropdown thông minh**:
  - Tỉnh & Xã: Phải chọn từ database
  - Thôn/Xóm: **Chọn từ danh sách HOẶC nhập thủ công** nếu không có
- **Tự động gợi ý với tìm kiếm**: Gõ để lọc kết quả phù hợp
- **Điều hướng bàn phím**: Hỗ trợ phím mũi tên, Enter, Tab
- **Bảo toàn dữ liệu**: Lưu và khôi phục đúng cả nhập thủ công
- **Hỗ trợ tái sử dụng**: Tất cả thành phần địa chỉ kể cả thôn/xóm thủ công

### 👥 Quản Lý Dữ Liệu Người
- **LocalStorage** cho người thường dùng (PERSON1, PERSON2, ...)
- **CRUD đầy đủ** với validation
- **Chọn nhanh** với preview trực quan
- **Tự động tạo ID** và nhãn tiếng Việt


### 🔄 Tái Sử Dụng Dữ Liệu Thông Minh
- **SessionStorage** cho dữ liệu tạm với logic merge thông minh
- **Tự động khôi phục** - tự động lưu và khôi phục session khi khởi động lại
- **Loại bỏ trùng lặp** giữa các file
- **3 chiến lược merge**: NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
- **Dropdown "Tái Sử Dụng"** với timestamp để theo dõi phiên bản dữ liệu
- **Sync thông minh**: 
  - HTSD tự động sync với session gốc khi cùng base type (INFO, INFO2, INFO3...)
  - Loai_Dat_D không ảnh hưởng logic merge

### 🗂️ Quản Lý Subgroup Động
- **Thêm/Xóa** subgroup (người, phần) động
- **Kiểm soát hiển thị** không mất dữ liệu
- **Tự động refresh** UI sau thay đổi
- **Dọn dẹp event listener** đúng cách để tránh memory leak

### 📊 UI/UX Chuyên Nghiệp
- **Layout 2 màu**: Panel xanh (nhập liệu) + Panel cam (chọn folder)
- **Taskbar navigation** để chuyển section nhanh
- **Responsive design** cho mọi kích thước màn hình
- **Toast notifications** thay thế alert/confirm cũ
- **Loading overlay** khi xuất file
- **Smart input fields**: Tự động gợi ý với fallback thủ công để linh hoạt tối đa

### ⚡ Tối Ưu Hiệu Năng
- **Render form**: < 200ms
- **Validation**: < 50ms
- **Xuất file**: < 5 giây
- **Sử dụng RAM**: ~100-150MB với templates

### 🛡️ Hệ Thống Validation Thông Minh
- **Highlight lỗi trực quan**: Viền đỏ + nền hồng + animation rung
- **Tự động chuyển tab** đến vị trí lỗi
- **Tự động scroll & focus** để UX tốt hơn
- **Thông báo lỗi theo nhóm** theo section
- **Tự động xóa** styling lỗi khi user bắt đầu gõ
- **Regex constants** để validation nhất quán
- **Xử lý đặc biệt** cho trường địa chỉ (4 cấp dropdown)
- **Validation HTSD**: Kiểm tra printMode và value

---


## 🆕 Tính Năng Mới (v6.0)

### 1. Hệ Thống HTSD (Hình Thức Sử Dụng Đất)
**Vấn đề giải quyết:** Cần nhập hình thức sử dụng đất linh hoạt với 2 cách hiển thị khác nhau

**Tính năng:**
- **Dual-mode input**: 
  - Loại 1: Dropdown chọn "Sử dụng chung" hoặc "Sử dụng riêng"
  - Loại 2: Nhập diện tích m² Chung và m² Riêng
- **Toggle buttons**: Bật/tắt từng loại độc lập
- **Smart sync**: Tự động cập nhật vào session gốc khi thay đổi
- **Base type matching**: INFO, INFO2, INFO3... đều sync với nhau
- **Không ảnh hưởng merge**: Giống Loai_Dat_D, không tham gia phân tích merge

**Cách sử dụng:**
```
1. Thêm placeholder {{HTSD}} vào template Word
2. Form tự động tạo HTSD field với 2 toggle buttons
3. Bật Loại 1 để nhập dropdown
4. Bật Loại 2 để nhập diện tích
5. Có thể bật cả 2 để xuất cả 2 loại
6. Khi tái sử dụng, HTSD tự động sync với session gốc
```

**Ví dụ output:**
- Loại 1: "Sử dụng chung"
- Loại 2: "1500m² Chung; 250m² Riêng"
- Both: "Sử dụng chung|1500|250"

### 2. Tự Động Khôi Phục Session
**Vấn đề giải quyết:** Mất dữ liệu khi app bị tắt đột ngột hoặc crash

**Tính năng:**
- **Auto-save**: Tự động lưu session vào localStorage trước khi đóng app
- **Restore modal**: Hỏi người dùng khi khởi động lại: "Khôi phục" hoặc "Làm mới"
- **Preserve work**: Giữ nguyên toàn bộ công việc nếu app crash
- **Disable option**: Có thể tắt bằng `localStorage.setItem('disable_auto_restore', 'true')`

**Cách hoạt động:**
```
1. User đang làm việc → App tắt đột ngột
2. Mở lại app → Modal hiện lên
3. Chọn "Khôi phục" → Dữ liệu được load lại
4. Chọn "Làm mới" → Bắt đầu session mới
```

### 3. Nhập Thôn/Xóm Thủ Công
**Vấn đề giải quyết:** Nhiều thôn/xóm không có trong database

**Tính năng:**
- **Flexible input**: Chọn từ dropdown HOẶC nhập thủ công
- **Smart placeholder**: "Chọn hoặc nhập thôn/xóm..."
- **Data preservation**: Lưu và khôi phục đúng cả nhập thủ công
- **Reuse support**: Tái sử dụng hoạt động với cả manual entries

**Cách sử dụng:**
```
1. Chọn Tỉnh và Xã
2. Trường Thôn/Xóm active
3. Nếu có trong database → Chọn từ dropdown
4. Nếu không có → Gõ trực tiếp tên thôn/xóm
5. Enter hoặc Tab để chuyển field tiếp theo
```


### 4. Smart Session Merge Logic
**Vấn đề giải quyết:** Xung đột dữ liệu khi tái sử dụng và chỉnh sửa

**Tính năng:**
- **3-level analysis**: NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
- **Cross-file deduplication**: Tự động loại bỏ dữ liệu trùng lặp
- **Versioned keys**: Tạo timestamp key khi có modification
- **Smart merge**: Merge ONLY_ADDITIONS, tạo version mới cho MODIFICATIONS
- **Special fields**: HTSD và Loai_Dat_D không ảnh hưởng merge logic

**Logic hoạt động:**
```
Tái sử dụng INFO:
├─ Không thay đổi → NO_CHANGE → Không tạo session mới
├─ Thêm field mới → ONLY_ADDITIONS → Merge vào INFO gốc
├─ Sửa field cũ → HAS_MODIFICATIONS → Tạo INFO_timestamp mới
└─ Sửa HTSD → Không coi là modification → Sync với INFO gốc
```

### 5. Base Type Matching cho HTSD
**Vấn đề giải quyết:** INFO và INFO2 không sync HTSD với nhau

**Tính năng:**
- **Base type comparison**: So sánh base type thay vì exact match
- **Smart grouping**: INFO, INFO2, INFO3... đều là base type "INFO"
- **Cross-suffix sync**: Thay đổi HTSD trong INFO2 → Sync với INFO gốc
- **Type isolation**: INFO và MEN không sync với nhau (khác base type)

**Ví dụ:**
```
File A: INFO có HTSD = "Sử dụng riêng"
File A: INFO2 có HTSD = "Sử dụng chung"
File B: Tái sử dụng INFO2 cho form INFO
       → Sửa HTSD thành "Sử dụng riêng"
       → INFO2 trong File A cũng thành "Sử dụng riêng" (sync)
```

### 6. Improved Validation System
**Vấn đề giải quyết:** Validation không rõ ràng, khó tìm lỗi

**Tính năng:**
- **Visual feedback**: Red border + pink background + shake animation
- **Auto navigation**: Tự động chuyển tab và scroll đến lỗi đầu tiên
- **Grouped errors**: Lỗi được nhóm theo section/subgroup
- **Auto-clear**: Xóa styling lỗi khi user bắt đầu gõ
- **HTSD validation**: Kiểm tra printMode (không được "both") và value

**Error types:**
```
- Required field empty
- CCCD format invalid (phải 9 hoặc 12 số)
- Phone format invalid (phải 10 số)
- Email format invalid
- Address incomplete (thiếu Tỉnh hoặc Xã)
- HTSD printMode = "both" (không hợp lệ)
- HTSD không có printMode
```

---


## 🔧 Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js >= 14.x
- npm >= 6.x
- 4GB RAM (khuyến nghị 8GB)
- 500MB dung lượng trống
- **Template Word phải định dạng .docx** (không phải .doc)

### Cài Đặt Nhanh

```bash
# Clone repository
git clone https://github.com/LuuTung0102/TheWord.git
cd TheWord

# Cài đặt dependencies
npm install

# Chạy ứng dụng
npm start
```

### Build Production

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 📖 Hướng Dẫn Sử Dụng

### 1. Chọn Folder Template
1. Mở TheWord
2. Panel bên phải (màu cam): Chọn folder template
3. Hệ thống tự động load tất cả file **.docx** trong folder
   - **Lưu ý**: Chỉ hỗ trợ .docx, không hỗ trợ .doc

### 2. Chọn File Word
1. Click folder để mở rộng và xem các file
2. Click file để chọn
3. Form tự động tạo từ placeholder trong file

### 3. Điền Form
1. Panel bên trái (màu xanh): Điền tất cả trường bắt buộc
2. Sử dụng tính năng thông minh:
   - **Date Picker**: Click field để chọn ngày
   - **Address Select**: 4 cấp cascading dropdown với nhập thủ công
     - Tỉnh & Xã: Chọn từ dropdown
     - Thôn/Xóm: Chọn từ dropdown HOẶC gõ thủ công nếu không có
   - **Land Type**: Dropdown với autocomplete
   - **HTSD**: Toggle Loại 1 (dropdown) hoặc Loại 2 (diện tích)
   - **CCCD**: Tự động format khi gõ
   - **Money**: Tự động format với dấu phẩy ngăn cách

### 4. Sử Dụng HTSD (Hình Thức Sử Dụng Đất)
1. Tìm field "Hình thức sử dụng đất"
2. **Loại 1** (Dropdown):
   - Click toggle "Loại 1"
   - Chọn "Sử dụng chung" hoặc "Sử dụng riêng"
3. **Loại 2** (Diện tích):
   - Click toggle "Loại 2"
   - Nhập m² Chung và m² Riêng
4. **Cả 2**: Bật cả 2 toggle để xuất cả 2 loại
5. Khi tái sử dụng, HTSD tự động sync với session gốc


### 5. Tái Sử Dụng Dữ Liệu (Optional)
1. Tìm dropdown "Tái Sử Dụng"
2. Chọn từ dữ liệu trước hoặc người đã lưu
3. Form tự động điền với dữ liệu đã chọn
4. Chỉnh sửa nếu cần
5. **HTSD tự động sync**: Thay đổi HTSD sẽ cập nhật vào session gốc

### 6. Quản Lý Người (Optional)
1. Click "⚙️ Quản Lý" ở header
2. Chọn "👥 Quản Lý Dữ Liệu"
3. Thêm/Sửa/Xóa người
4. Họ xuất hiện để chọn nhanh trong form

### 7. Xuất Văn Bản
1. Kiểm tra tất cả trường bắt buộc đã điền
2. Click "📤 XUẤT WORD"
3. Chọn thư mục lưu
4. Đợi xử lý (< 5 giây)
5. Dialog thành công với tùy chọn mở thư mục

---

## 🗺️ Hướng Dẫn Nhập Địa Chỉ

### Cách Sử Dụng Trường Địa Chỉ

**Chọn Tỉnh:**
1. Click hoặc focus vào trường Tỉnh
2. Gõ để tìm kiếm (ví dụ: "Đắk Lắk")
3. Dùng phím mũi tên để điều hướng gợi ý
4. Enter hoặc click để chọn

**Chọn Xã:**
1. Sau khi chọn Tỉnh, trường Xã active
2. Gõ để tìm trong tỉnh đã chọn
3. Chọn từ dropdown

**Nhập Thôn/Xóm (Linh Hoạt):**
1. Sau khi chọn Xã, trường Thôn/Xóm active
2. **Tùy chọn A - Chọn từ danh sách:**
   - Nếu xã có thôn/xóm trong database, dropdown hiện gợi ý
   - Gõ để lọc, chọn từ danh sách
3. **Tùy chọn B - Nhập thủ công:**
   - Nếu không có gợi ý HOẶC thôn/xóm không có trong danh sách
   - Đơn giản gõ tên thôn/xóm trực tiếp
   - Enter hoặc Tab để chuyển field tiếp theo
4. **Nhập thủ công sẽ được lưu** và có thể tái sử dụng sau

**Mẹo:**
- Dùng Tab để chuyển nhanh giữa các trường
- Esc để đóng dropdown
- Nhập thôn/xóm thủ công được hỗ trợ đầy đủ trong tái sử dụng
- Định dạng địa chỉ lưu: "Thôn/Xóm, Xã, Tỉnh"

---


## 🏗️ Kiến Trúc Hệ Thống

### Cấu Trúc Project
```
TheWord/
├── renderer/
│   ├── config/              # Constants & configuration
│   │   ├── baseConstants.js
│   │   ├── regexConstants.js
│   │   ├── config.json
│   │   ├── local_storage.json
│   │   ├── land_types.json
│   │   └── address.json
│   ├── core/                # Core services
│   │   ├── stateManager.js
│   │   ├── formValidator.js
│   │   ├── notificationManager.js
│   │   ├── personDataService.js
│   │   ├── sessionStorageManager.js  ← Smart merge & HTSD sync
│   │   └── ... (utilities khác)
│   ├── handlers/            # UI handlers
│   │   ├── genericFormHandler.js
│   │   ├── exportHandler.js
│   │   ├── fileManager.js
│   │   ├── personManager.js
│   │   └── ... (handlers khác)
│   └── mainApp.js           # Main application
├── logic/
│   ├── generate.js          # Word document generation
│   └── placeholder.js       # Placeholder extraction
├── templates/               # Template folders với configs
├── index.html               # Main HTML
├── main.js                  # Electron main process
└── style.css                # Styles
```

### Luồng Dữ Liệu

**Render Form:**
1. User chọn template file
2. `templateManager.js` load config
3. `genericFormHandler.js` render form fields
4. Setup event listeners cho tất cả inputs
5. Auto-load session data trước nếu có

**Validation Flow:**
1. User click "Xuất Word"
2. `formValidator.js` thu thập và validate form data
3. Nếu có lỗi:
   - Highlight error fields (viền đỏ + nền hồng)
   - Hiện grouped error notification
   - Tự động chuyển đến tab lỗi đầu tiên
   - Smooth scroll đến field lỗi đầu tiên
4. Nếu hợp lệ, tiến hành export

**Export Flow:**
1. Thu thập form data từ tất cả inputs
2. Xử lý data (auto-convert, format, cleanup)
3. Lưu vào session storage với smart merge
4. Gọi `logic/generate.js` để tạo Word file
5. Hiện success notification với tùy chọn mở folder

**Data Reuse Flow:**
1. Khi export, session storage lưu data với merge logic
2. Form tiếp theo hiện dropdown "Tái Sử Dụng" với saved data
3. Chọn dropdown option để auto-fill form
4. Auto-convert land types để match template format
5. HTSD tự động sync với session gốc khi thay đổi


### Session Storage Manager - Chi Tiết

**Smart Merge Logic:**
```javascript
analyzeChanges(sourceData, currentData) {
  // Bỏ qua HTSD và Loai_Dat_D (không ảnh hưởng merge)
  // So sánh các field khác
  // Return: NO_CHANGE | ONLY_ADDITIONS | HAS_MODIFICATIONS
}
```

**HTSD Sync Logic:**
```javascript
// Khi tái sử dụng và chỉnh sửa HTSD:
1. Thu thập HTSD value và printMode từ DOM
2. So sánh base type (INFO, INFO2 → cùng base "INFO")
3. Nếu cùng base type → Sync với session gốc
4. Nếu khác base type → Không sync
```

**Merge Strategy:**
```
NO_CHANGE:
  → Không tạo session mới
  → Reference đến data gốc

ONLY_ADDITIONS:
  → Merge vào session gốc
  → Không tạo versioned key

HAS_MODIFICATIONS:
  → Tạo versioned key mới (GROUP_timestamp)
  → Giữ nguyên data gốc
```

---

## 📁 Hỗ Trợ Định Dạng File

### ✅ Định Dạng Hỗ Trợ
- **.docx** (Office Open XML) - Word 2007 trở lên
- Đây là **DUY NHẤT** định dạng được hỗ trợ

### ❌ KHÔNG Hỗ Trợ
- **.doc** (Office 97-2003 Binary Format)
- **.rtf** (Rich Text Format)
- **.odt** (OpenDocument Text)
- **.pdf** (Portable Document Format)

### Tại Sao Chỉ .docx?
1. **Chuẩn hiện đại**: .docx là chuẩn Microsoft Word từ 2007
2. **Dựa trên XML**: .docx là ZIP archive chứa XML, dễ parse và modify
3. **Hỗ trợ thư viện**: Docxtemplater chỉ hỗ trợ .docx
4. **Tính năng tốt hơn**: .docx hỗ trợ nhiều tính năng và đáng tin cậy hơn .doc cũ

### Cách Chuyển Đổi .doc sang .docx

**Dùng Microsoft Word:**
1. Mở file .doc trong Microsoft Word
2. Click **File** → **Save As**
3. Chọn **Word Document (*.docx)** từ dropdown format
4. Click **Save**

**Dùng LibreOffice (Miễn phí):**
1. Tải và cài đặt [LibreOffice](https://www.libreoffice.org/)
2. Mở file .doc trong LibreOffice Writer
3. Click **File** → **Save As**
4. Chọn **Office Open XML Text (.docx)** từ dropdown format
5. Click **Save**

**Chuyển đổi hàng loạt:**
- Dùng tính năng batch conversion của Microsoft Word
- Hoặc dùng online converters (cẩn thận với văn bản nhạy cảm)

---


## 💻 Công Nghệ

### Core
- **Electron** 38.2.2 - Desktop application framework
- **Node.js** - Runtime environment
- **Vanilla JavaScript** - Không dependencies framework

### Document Processing
- **Docxtemplater** 3.66.7 - Word template engine (**.docx only**)
- **PizZip** 3.2.0 - ZIP file handling cho .docx archives
- **SAX** 1.4.3 - XML streaming parser
- **xmldom** 0.6.0 - XML DOM parser

### UI Components
- **Flatpickr** 4.6.13 - Date picker với Vietnamese locale
- **Custom CSS** - Responsive design system

### Utilities
- **adm-zip** 0.5.16 - ZIP archive creation
- **angular-expressions** 1.5.1 - Expression parser

---

## 🐛 Troubleshooting

### Hệ thống chỉ chấp nhận file .docx, không phải .doc
- **TheWord chỉ hỗ trợ định dạng .docx** (Office Open XML)
- **File .doc (Office 97-2003) KHÔNG được hỗ trợ**
- **Giải pháp**: Chuyển đổi .doc sang .docx:
  - Mở file .doc trong Microsoft Word
  - File → Save As → Chọn "Word Document (*.docx)"
  - Hoặc dùng LibreOffice Writer (miễn phí) để chuyển đổi

### Form không điền đúng
- Placeholder có thể bị tách ra nhiều text runs trong Word
- Giải pháp: Xóa và gõ lại placeholder không format
- Không dùng bold/italic trên placeholder

### Lỗi validation CCCD
- Phải chính xác 9 hoặc 12 số
- Giải pháp: Xóa tất cả ký tự không phải số
- Auto-formatting xảy ra khi nhập

### Session data không lưu
- Kiểm tra browser localStorage đã bật
- Xóa cache và khởi động lại app
- Kiểm tra dung lượng đĩa còn trống

### Thôn/xóm không điền khi tái sử dụng
- Đảm bảo xã đã được chọn trước
- Nhập thôn/xóm thủ công giờ đã được hỗ trợ đầy đủ
- Kiểm tra định dạng address string đúng (Thôn/Xóm, Xã, Tỉnh)

### HTSD không sync
- Kiểm tra base type có giống nhau không (INFO vs INFO2 → OK, INFO vs MEN → Không)
- Đảm bảo đã bật ít nhất 1 toggle (Loại 1 hoặc Loại 2)
- Kiểm tra printMode không phải "both" (không hợp lệ)

### Export rất chậm
- Template lớn (> 50MB) mất nhiều thời gian hơn
- Đóng các ứng dụng không dùng
- Dùng SSD để I/O file nhanh hơn

---


## 📝 Lịch Sử Phiên Bản

### v6.0 - HTSD System & Smart Session Sync (Current)
- **Hệ thống HTSD** với dual-mode input (Loại 1 + Loại 2)
- **Smart HTSD sync** với base type matching
- **Tự động khôi phục session** khi khởi động lại
- **Nhập thôn/xóm thủ công** khi không có trong database
- **Improved validation** với HTSD printMode check
- **Base type comparison** cho cross-suffix sync (INFO, INFO2, INFO3...)
- **Special field handling**: HTSD và Loai_Dat_D không ảnh hưởng merge logic

### v5.6 - Flexible Village Input System
- **Manual village input** khi không có trong database
- **Smart dropdown behavior**: Hiện gợi ý khi có, cho phép gõ khi không
- **Improved data reuse**: Village values được bảo toàn đúng khi reuse
- **Better UX**: Cập nhật placeholder "Chọn hoặc nhập thôn/xóm..."
- **No data loss**: Manual entries được lưu và khôi phục đúng

### v5.5 - Smart Land Type Storage & Auto-Conversion
- Đơn giản hóa logic loại đất với auto 3-format generation
- Smart conversion dựa trên template type
- Không mất dữ liệu khi reuse
- Cải thiện session merge strategy

### v5.4 - Enhanced Reuse Dropdown & Land Type Conversion
- Fixed dropdown event listener management
- Smart land type conversion giữa các formats
- Improved UI với styling và animations tốt hơn
- Better responsiveness khi chuyển tab

### v5.3 - Smart Validation System
- Visual error highlighting với animations
- Auto tab switching đến vị trí lỗi
- Regex constants centralization
- DOM element caching (70% cải thiện hiệu năng)
- Address field special handling

### v5.2 - Notification System Overhaul
- Professional toast notifications
- Confirm dialogs với overlay
- HTML-safe notification system
- Auto-dismiss với manual close option

### v5.1 - File Manager & Config Wizard
- Auto placeholder detection và classification
- Smart config generation
- File manager với add/delete/view
- Session storage với smart merge logic

### v5.0 - Person Management System
- LocalStorage cho quản lý người
- CRUD operations với validation
- Auto-generate IDs và names
- Label management bằng tiếng Việt

### v4.0+ - Previous versions
- Session storage và data reuse
- Land type detail system (D/F/Basic formats)
- Dynamic subgroup management

---

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Mở Pull Request

---

## 📄 License

ISC License - Xem file LICENSE để biết chi tiết

---

## 👨‍💻 Tác Giả

**LuuTung0102**
- GitHub: [@LuuTung0102](https://github.com/LuuTung0102)

---


**Made with ❤️ by LuuTung0102**
