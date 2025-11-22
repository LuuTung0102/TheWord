# 📄 TheWord - Hệ Thống Tự Động Hóa Văn Bản

## 📋 Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Tính Năng Nổi Bật](#tính-năng-nổi-bật)
- [Cài Đặt](#cài-đặt)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [Tính Năng Chi Tiết](#tính-năng-chi-tiết)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Tech Stack](#tech-stack)
- [Danh Sách Chức Năng Đầy Đủ](#danh-sách-chức-năng-đầy-đủ)

---

## 🎯 Giới Thiệu

**TheWord** là hệ thống tự động hóa văn bản được xây dựng trên nền tảng Electron, giúp tạo văn bản Word từ template một cách nhanh chóng và chính xác. Hệ thống được thiết kế đặc biệt cho các văn bản pháp lý, hành chính với khả năng quản lý dữ liệu thông minh và tái sử dụng thông tin.

### 🎯 Workflow Cơ Bản
```
1️⃣ Chọn folder template → 2️⃣ Chọn file Word → 3️⃣ Điền form → 4️⃣ Xuất văn bản ✅
```

### 🌟 Điểm Nổi Bật
- **100% Offline**: Hoạt động hoàn toàn không cần internet
- **Tự động hóa thông minh**: Tự động format, chuyển đổi và xử lý dữ liệu
- **Quản lý dữ liệu**: LocalStorage cho người dùng thường xuyên, SessionStorage cho tái sử dụng
- **Xử lý văn bản nâng cao**: Streaming XML cho file lớn, tự động dọn dẹp format
- **Giao diện thân thiện**: 2-color UI, taskbar navigation, responsive design

---

## ✨ Tính Năng Nổi Bật

### 🚀 Tự Động Hóa Hoàn Toàn
- **Tự động điền placeholder** từ template Word
- **Tự động format** CCCD, tiền, ngày tháng, địa chỉ, diện tích
- **Tự động chuyển đổi** Money → MoneyText, Name → NameT
- **Tự động dọn dẹp** dòng trống và dấu phẩy thừa
- **Xuất văn bản** trong < 5 giây

### 📝 Form Thông Minh
- **Auto-format CCCD**: Tự động format 9 hoặc 12 số với dấu chấm
- **Auto-format tiền**: Format số tiền với dấu phẩy (1,000,000)
- **Date picker**: Chọn ngày tháng với giao diện tiếng Việt
- **Address select**: Chọn địa chỉ theo cấp Tỉnh/Huyện/Xã/Thôn
- **Land type**: Chọn loại đất với dropdown thông minh
- **Validation**: Kiểm tra dữ liệu đầu vào tự động

### 💾 Quản Lý Dữ Liệu Thông Minh

#### 👥 LocalStorage - Quản lý PERSON
- **Lưu trữ người dùng thường xuyên** (PERSON1, PERSON2, ...)
- **Giao diện quản lý trực quan** với nút "⚙️ Quản lý" ở header
- **CRUD operations**: Thêm/Sửa/Xóa người dùng
- **Labels tiếng Việt**: "Họ và tên", "Số CMND/CCCD", "Địa chỉ thường trú"...
- **Validation đầy đủ**: Kiểm tra các trường bắt buộc
- **Auto-refresh**: Cập nhật danh sách tự động

#### 🔄 SessionStorage - Tái Sử Dụng Dữ Liệu Thông Minh
- **Lưu dữ liệu tạm thời** giữa các lần xuất văn bản
- **Merge thông minh 3 cấp độ**:
  - **NO_CHANGE**: Dữ liệu giống hệt → Không lưu duplicate
  - **ONLY_ADDITIONS**: Chỉ thêm fields mới → Merge vào session cũ
  - **HAS_MODIFICATIONS**: Có thay đổi giá trị → Tạo version mới với timestamp
- **Cross-file Merge**: Tự động gộp dữ liệu giống nhau giữa các files
- **Smart Comparison**: Chỉ so sánh fields có ở cả 2 bên (bỏ qua fields không tồn tại)
- **Dropdown "Tái sử dụng"**: Chọn dữ liệu từ các file trước với timestamp
- **Nút "Làm mới"**: Xóa tất cả session data

### 🏷️ Xử Lý Loại Đất Đặc Biệt

#### Loai_Dat (Basic)
- Format: `CLN+NST+BCS`
- Output: `Đất cây lâu năm và Đất sản xuất nông nghiệp và Đất bằng chưa sử dụng`

#### Loai_Dat_F (With Size)
- Format: `CLN 1236.5; NST 431.1`
- Output: `1236.5m² CLN; 431.1m² NST`
- Tự động thêm m² và format số

#### Loai_Dat_D (Detailed)
- Format: `CLN|Vị trí 2|1236.5;NST|Vị trí 1|431.1`
- Output:
```
+ Loại đất 1: CLN:   Vị trí 2                     Diện tích: 1236.5m².
+ Loại đất 2: NST:   Vị trí 1                     Diện tích: 431.1m².
```
- **Priority**: Loai_Dat_D > Loai_Dat_F > Loai_Dat
- **Auto-sync**: Tự động đồng bộ giữa các trường

### 🗑️ Quản Lý Subgroup Động
- **Thêm subgroup**: Nút "➕ Thêm" để thêm người/thông tin mới
- **Xóa subgroup**: Nút "❌ Xóa" để xóa subgroup không cần
- **Ẩn/hiện subgroup**: Toggle visibility không mất dữ liệu
- **Xóa dòng trống**: Tự động xóa dòng có placeholder trống

### 🎨 Giao Diện Hiện Đại
- **2-Color UI**: Panel trái (xanh) - nhập dữ liệu, Panel phải (cam) - chọn folder
- **Taskbar navigation**: Chuyển đổi nhanh giữa các nhóm
- **Responsive design**: Tự động điều chỉnh theo kích thước màn hình
- **Loading overlay**: Hiển thị tiến trình khi xuất văn bản

---

## 🔧 Cài Đặt

### Yêu Cầu Hệ Thống
- **Node.js**: >= 14.x
- **npm**: >= 6.x
- **OS**: Windows, macOS, Linux

### Cài Đặt Nhanh

```bash
# Clone repository
git clone https://github.com/LuuTung0102/TheWord.git

# Di chuyển vào thư mục
cd TheWord

# Cài đặt dependencies
npm install

# Chạy ứng dụng
npm start
```

### Build Production

```bash
# Build cho Windows
npm run build:win

# Build cho macOS
npm run build:mac

# Build cho Linux
npm run build:linux
```

---

## 📖 Hướng Dẫn Sử Dụng

### 1. Quản Lý File Word

#### Mở File Manager
1. Click nút "⚙️ Quản lý" ở header
2. Chọn "📄 Quản lý File Word"
3. Dialog File Manager hiển thị

#### Thêm File Word Mới
1. Trong File Manager, chọn folder từ danh sách bên trái
2. Click nút "➕ Thêm File" ở header
3. Chọn file Word (.docx) từ máy tính
4. **Config Wizard tự động mở**:
   - Hiển thị thông tin file và placeholders phát hiện được
   - Tự động phân loại placeholders vào groups/subgroups
   - Cho phép chỉnh sửa tên template, mô tả
   - Chọn groups cần sử dụng
   - Gán subgroups cho từng group
   - Chỉnh sửa labels và visibility
5. Click "✅ Lưu cấu hình"
6. File được copy vào folder và config.json được cập nhật tự động
7. UI tự động refresh, file mới xuất hiện trong dropdown

#### Xem/Mở File
1. Click nút "👁️" để mở file Word trong ứng dụng mặc định
2. Xem và chỉnh sửa template nếu cần

#### Xóa File
1. Click nút "🗑️" để xóa file
2. Xác nhận xóa
3. File và config liên quan được xóa

### 2. Chọn Folder Template

1. Mở ứng dụng TheWord
2. Ở panel bên phải (màu cam), chọn folder template
3. Hệ thống sẽ tự động load các file Word trong folder

### 3. Điền Form

1. Panel bên trái (màu xanh) hiển thị form nhập liệu
2. Điền thông tin vào các trường
3. Sử dụng các tính năng:
   - **Date picker**: Click vào trường ngày để chọn
   - **Address select**: Chọn Tỉnh → Huyện → Xã → Thôn
   - **Land type**: Nhập hoặc chọn từ dropdown
   - **CCCD**: Tự động format khi nhập

### 4. Quản Lý PERSON

1. Click nút "⚙️ Quản lý" ở header
2. Chọn "👥 Quản lý Dữ liệu"
3. Dialog hiển thị danh sách PERSON
3. **Thêm mới**:
   - Click "➕ Thêm PERSON mới"
   - Điền form (Họ tên, CCCD, Địa chỉ...)
   - Click "💾 Lưu"
4. **Sửa**:
   - Click "✏️ Sửa" trên PERSON cần sửa
   - Chỉnh sửa thông tin
   - Click "💾 Lưu"
5. **Xóa**:
   - Click "🗑️ Xóa" trên PERSON cần xóa
   - Xác nhận xóa

### 5. Tái Sử Dụng Dữ Liệu

1. Khi điền form, tìm dropdown "Tái sử dụng dữ liệu"
2. Chọn dữ liệu từ:
   - **PERSON đã lưu** (từ localStorage)
   - **Dữ liệu từ file trước** (từ sessionStorage)
3. Dữ liệu sẽ tự động điền vào form
4. Có thể chỉnh sửa sau khi tái sử dụng

### 6. Xuất Văn Bản

1. Sau khi điền đầy đủ thông tin
2. Click nút "📤 XUẤT WORD" ở cuối panel phải
3. Chọn thư mục lưu file
4. Đợi hệ thống xử lý (< 5 giây)
5. Dialog thành công hiển thị
6. Click "Mở thư mục" để xem file

---

## 🔍 Tính Năng Chi Tiết

### 1. File Manager & Config Wizard

#### File Manager
**Giao diện quản lý file Word trực quan** với 2 panel:
- **Panel trái**: Danh sách folders
- **Panel phải**: Danh sách files trong folder đã chọn

**Chức năng:**
- ➕ **Thêm file**: Upload file Word mới
- 👁️ **Xem file**: Mở file trong ứng dụng mặc định
- 🗑️ **Xóa file**: Xóa file và config liên quan
- 🔄 **Auto refresh**: Tự động cập nhật UI sau mỗi thao tác

#### Config Wizard - Tự Động Tạo Config

**Bước 1: Phân Tích Placeholder**
```javascript
// Tự động quét và phân tích placeholders
PlaceholderAnalyzer.analyzePlaceholders(filePath)
// Returns: {
//   placeholders: ["Name1", "CCCD1", "Name2", "CCCD2", "Loai_Dat", "S"],
//   patterns: { withSuffix: Map, withoutSuffix: [] },
//   groups: { MEN1: [...], MEN2: [...], INFO: [...] }
// }
```

**Bước 2: Tự Động Phân Loại**
- **Phát hiện suffix**: Name1, Name2 → suffix "1", "2"
- **Match với schema**: Name, CCCD → PersonalInfo schema
- **Tạo subgroups**: MEN1, MEN2 cho suffix "1", "2"
- **Gán vào groups**: BCN, BNCN, LAND dựa trên applicableTo

**Bước 3: Config Wizard UI**
```
┌─────────────────────────────────────────┐
│ ⚙️ Cấu hình Template                    │
├─────────────────────────────────────────┤
│ 📄 Thông tin cơ bản                     │
│   Tên template: [___________________]   │
│   Mô tả: [_________________________]   │
│                                          │
│ 🔖 Subgroups được tạo tự động           │
│   • MEN1 (5 fields)                     │
│   • MEN2 (5 fields)                     │
│   • INFO (8 fields)                     │
│                                          │
│ 📋 Chọn Groups và gán Subgroups         │
│   ☑ BCN - Bên chuyển nhượng            │
│     Subgroups: [MEN1 ▼] [➕ Thêm]      │
│     • MEN1 [✏️ Sửa] [👁️ Hiện] [🗑️ Xóa] │
│                                          │
│   ☑ LAND - Thông tin đất đai           │
│     Subgroups: [INFO ▼] [➕ Thêm]      │
│     • INFO [✏️ Sửa] [👁️ Hiện] [🗑️ Xóa] │
│                                          │
│ [❌ Hủy]              [✅ Lưu cấu hình] │
└─────────────────────────────────────────┘
```

**Bước 4: Lưu Config**
- Cập nhật `config.json` với template entry mới
- Thêm/cập nhật fieldMappings nếu có subgroups mới
- Thêm groups mới nếu cần
- Tạo backup trước khi lưu
- Restore từ backup nếu có lỗi

**Bước 5: Auto Refresh**
- Copy file vào folder template
- Reload templates trong mainApp
- Render lại file list
- File mới xuất hiện ngay trong dropdown

#### Xử Lý Trường Hợp Đặc Biệt

**File không có placeholder:**
```
⚠️ Cảnh báo: File không có placeholder

File "example.docx" không chứa placeholder nào.

Bạn có muốn tiếp tục tạo cấu hình không?

[OK] [Cancel]
```

**File đã tồn tại:**
```
⚠️ Cảnh báo: File đã tồn tại

File "example.docx" đã có cấu hình trong config.json.

Bạn có muốn cập nhật cấu hình hiện tại không?

[OK - Cập nhật] [Cancel - Giữ nguyên]
```

**Validation:**
- Tên template không được trống (min 3 ký tự)
- Phải chọn ít nhất 1 group
- Mỗi group phải có ít nhất 1 subgroup
- Không cho phép HTML tags trong tên/mô tả

### 2. Hệ Thống Template

#### Cấu Trúc Folder Template
```
templates/
├── Biến động đất đai/
│   ├── config.json
│   ├── file1.docx
│   └── file2.docx
├── Giấy Ủy Quyền/
│   ├── config.json
│   └── file.docx
└── ...
```

#### File config.json
```json
{
  "groups": [
    {
      "id": "INFO",
      "label": "Thông tin đất",
      "order": 1
    }
  ],
  "fieldSchemas": {
    "PersonInfo": {
      "description": "Thông tin cá nhân",
      "fields": [
        {
          "name": "Name",
          "label": "Họ và tên",
          "type": "text",
          "required": true
        }
      ]
    }
  },
  "fieldMappings": [
    {
      "group": "MEN",
      "source": "localStorage",
      "schema": "PersonInfo",
      "subgroups": ["MEN1", "MEN2"],
      "suffixes": ["1", "2"]
    }
  ]
}
```

### 2. Placeholder System

#### Cú Pháp Placeholder
```
{{PlaceholderName}}
```

#### Các Loại Placeholder

**Basic Placeholders:**
- `{{Name}}` - Tên người
- `{{CCCD}}` - Số CMND/CCCD
- `{{Date}}` - Ngày tháng
- `{{Address}}` - Địa chỉ

**Numbered Placeholders:**
- `{{Name1}}`, `{{Name2}}` - Nhiều người
- `{{CCCD1}}`, `{{CCCD2}}` - Nhiều CCCD

**Auto-Convert Placeholders:**
- `{{Money}}` → `{{MoneyText}}` - Số tiền → Chữ
- `{{S}}` → `{{S_Text}}` - Diện tích → Chữ
- `{{Name}}` → `{{NameT}}` - Tên → Title Case

**Land Type Placeholders:**
- `{{Loai_Dat}}` - Loại đất cơ bản
- `{{Loai_Dat_F}}` - Loại đất + diện tích
- `{{Loai_Dat_D}}` - Loại đất chi tiết (vị trí + diện tích)

### 3. Form Field Types

#### text
```json
{
  "name": "Name",
  "label": "Họ và tên",
  "type": "text",
  "placeholder": "Nhập họ và tên",
  "required": true
}
```

#### number
```json
{
  "name": "CCCD",
  "label": "Số CMND/CCCD",
  "type": "number",
  "maxLength": 12,
  "required": true
}
```

#### date
```json
{
  "name": "Date",
  "label": "Ngày sinh",
  "type": "date",
  "required": true
}
```

#### select
```json
{
  "name": "Gender",
  "label": "Giới tính",
  "type": "select",
  "options": ["Ông", "Bà"],
  "defaultValue": "Ông"
}
```

#### address-select
```json
{
  "name": "Address",
  "label": "Địa chỉ thường trú",
  "type": "address-select",
  "required": true
}
```

#### money
```json
{
  "name": "Money",
  "label": "Số tiền",
  "type": "money",
  "required": true
}
```

#### land-type
```json
{
  "name": "Loai_Dat",
  "label": "Loại đất",
  "type": "land-type",
  "required": false
}
```

#### land_type_size
```json
{
  "name": "Loai_Dat_F",
  "label": "Loại đất và diện tích",
  "type": "land_type_size",
  "required": false
}
```

#### land_type_detail
```json
{
  "name": "Loai_Dat_D",
  "label": "Thông tin đất chi tiết",
  "type": "land_type_detail",
  "required": false
}
```

#### text-or-dots
```json
{
  "name": "Sum_A",
  "label": "Tổng số loại cây A",
  "type": "text-or-dots",
  "required": false,
  "dotPlaceholder": "..........."
}
```

**Mô tả**: Field type đặc biệt cho phép người dùng nhập text hoặc để trống. Nếu để trống, văn bản xuất ra sẽ tự động thay thế bằng chuỗi dấu chấm (mặc định: "...........").

**Thuộc tính**:
- `dotPlaceholder` (optional): Chuỗi thay thế tùy chỉnh khi field để trống. Mặc định là "..........." (11 dấu chấm).

**Ví dụ sử dụng**:
```json
{
  "name": "Note",
  "label": "Ghi chú",
  "type": "text-or-dots",
  "required": false,
  "dotPlaceholder": "___________"
}
```

**Hành vi**:
- Nếu người dùng nhập text → Giữ nguyên text đã nhập
- Nếu để trống hoặc chỉ có khoảng trắng → Thay thế bằng `dotPlaceholder`
- Hữu ích cho các trường không bắt buộc mà người dùng có thể điền tay sau khi in

### 4. Data Processing

#### CCCD Formatting
```
Input:  123456789
Output: 123.456.789

Input:  123456789012
Output: 123.456.789.012
```

#### Money Formatting
```
Input:  1000000
Output: 1,000,000

MoneyText: Một triệu đồng
```

#### Date Formatting
```
Input:  15/03/2024
Output: 15/03/2024

DateText: Ngày mười lăm tháng ba năm hai nghìn không trăm hai mươi bốn
```

#### Land Type Processing
```
Loai_Dat:
Input:  CLN+NST
Output: Đất cây lâu năm và Đất sản xuất nông nghiệp

Loai_Dat_F:
Input:  CLN 1236.5; NST 431.1
Output: 1236.5m² CLN; 431.1m² NST

Loai_Dat_D:
Input:  CLN|Vị trí 2|1236.5;NST|Vị trí 1|431.1
Output: 
+ Loại đất 1: CLN:   Vị trí 2                     Diện tích: 1236.5m².
+ Loại đất 2: NST:   Vị trí 1                     Diện tích: 431.1m².
```

### 5. Session Storage Logic - Smart Data Merge

#### Lưu Dữ Liệu
```javascript
// Tự động lưu khi xuất văn bản
sessionStorageManager.saveFormData(fileName, formData, reusedGroups, reusedGroupSources, config);
```

#### Merge Logic Chi Tiết

**1. NO_CHANGE - Dữ liệu giống hệt**
```javascript
// Source: { Name: "Nguyễn Văn A", CCCD: "123456789" }
// Current: { Name: "Nguyễn Văn A", CCCD: "123456789" }
// Result: Không lưu duplicate, giữ nguyên session cũ
```

**2. ONLY_ADDITIONS - Chỉ thêm fields mới**
```javascript
// Source: { Name: "Nguyễn Văn A", CCCD: "123456789" }
// Current: { Name: "Nguyễn Văn A", CCCD: "123456789", MST: "0123456789", SDT: "0987654321" }
// Result: Merge vào session cũ
// Output: { Name: "Nguyễn Văn A", CCCD: "123456789", MST: "0123456789", SDT: "0987654321" }
```

**3. HAS_MODIFICATIONS - Có thay đổi giá trị**
```javascript
// Source: { Name: "Nguyễn Văn A", CCCD: "123456789" }
// Current: { Name: "Trần Văn B", CCCD: "123456789" }
// Result: Tạo version mới với timestamp
// Output: MEN1_20251122_153251
```

#### Smart Comparison Rules
- **Chỉ so sánh fields có ở cả 2 bên**: Nếu source có field mà current không có → BỎ QUA (không coi là xóa)
- **Empty fields được bỏ qua**: Fields rỗng không tham gia so sánh
- **Normalize trước khi so sánh**: CCCD, Money, SDT được chuẩn hóa format

#### Cross-File Deduplication
```javascript
// File A có: { Name: "Nguyễn Văn A", CCCD: "123456789" }
// File B thêm: { Name: "Nguyễn Văn A", CCCD: "123456789", MST: "0123456789" }
// Result: Merge vào File A, không tạo duplicate trong File B
```

#### Tái Sử Dụng
```javascript
// Lấy danh sách dữ liệu có thể tái sử dụng
const available = sessionStorageManager.getAvailableMenGroups();
// Returns: [
//   { fileName: "Thuế.docx", groupKey: "MEN1", displayName: "Nguyễn Văn A (Thuế - 22/11/2025 15:32)" },
//   { fileName: "Thuế.docx", groupKey: "MEN1_20251122_153251", displayName: "Trần Văn B (Thuế - 22/11/2025 15:32:51)" }
// ]

// Lấy dữ liệu cụ thể
const data = sessionStorageManager.getMenGroupData(fileName, menKey);
```

### 6. Validation System

#### Required Fields
```javascript
// Tự động validate các trường required
const validation = formValidator.validate(formData, config);
if (!validation.isValid) {
  alert(validation.errors.join('\n'));
}
```

#### CCCD Validation
```javascript
// Phải là 9 hoặc 12 số
const cccdValue = cccd.trim().replace(/\D/g, '');
if (!/^\d{9}$|^\d{12}$/.test(cccdValue)) {
  errors.push('CCCD phải là 9 hoặc 12 số');
}
```

---

## 📁 Cấu Trúc Dự Án

```
TheWord/
├── logic/
│   ├── generate.js          # Xử lý tạo Word document
│   └── placeholder.js       # Đọc placeholder từ template
├── renderer/
│   ├── config/
│   │   ├── config.json      # Main config
│   │   ├── constants.js     # ⭐ Constants & magic numbers
│   │   ├── local_storage.json  # PERSON data
│   │   ├── land_types.json  # Danh sách loại đất
│   │   └── address.json     # Dữ liệu địa chỉ VN
│   ├── core/
│   │   ├── baseModal.js     # Base modal class
│   │   ├── configGenerator.js  # Config generation
│   │   ├── configManager.js    # Config CRUD operations
│   │   ├── placeholderAnalyzer.js  # Placeholder analysis
│   │   ├── utils.js         # Utility functions
│   │   ├── personDataService.js  # CRUD PERSON
│   │   ├── sessionStorageManager.js  # ⭐ Smart session storage
│   │   ├── formValidator.js  # Validation logic
│   │   └── formHelpers.js   # Form helper functions
│   ├── handlers/
│   │   ├── genericFormHandler.js  # Form rendering
│   │   ├── templateManager.js     # Template management
│   │   ├── exportHandler.js       # Export logic
│   │   ├── personManager.js       # PERSON UI
│   │   ├── fileManager.js         # ⭐ File operations + auto refresh
│   │   ├── configWizard.js        # Config wizard UI
│   │   └── managementPage.js      # Management page
│   └── mainApp.js           # Main application
├── templates/
│   ├── Biến động đất đai/
│   ├── Giấy Ủy Quyền/
│   ├── HĐ chuyển nhượng/
│   ├── HĐ phân chia tài sản/
│   ├── Thuế/
│   └── Xác nhận hôn nhân/
├── index.html               # Main HTML
├── main.js                  # Electron main process
├── style.css                # Styles
├── package.json             # Dependencies
├── CODE_CLEANUP_REPORT.md   # ⭐ Code cleanup analysis report
└── CLEANUP_SUMMARY.md       # ⭐ Cleanup summary
```

**⭐ = Mới thêm/cập nhật trong v5.1**

---

## 💻 Tech Stack

### Core Technologies
- **Electron**: 38.2.2 - Desktop application framework
- **Node.js**: Runtime environment
- **Vanilla JavaScript**: No framework dependencies

### Document Processing
- **Docxtemplater**: 3.66.7 - Word template engine
- **PizZip**: 3.2.0 - ZIP file handling
- **SAX**: 1.4.3 - XML streaming parser
- **xmldom**: 0.6.0 - XML DOM parser

### UI Components
- **Flatpickr**: 4.6.13 - Date picker with Vietnamese locale
- **Custom CSS**: Responsive 2-color design

### Utilities
- **adm-zip**: 0.5.16 - ZIP archive creation
- **angular-expressions**: 1.5.1 - Expression parser

---

## 🔌 Offline Capability

✅ **100% Offline** - Ứng dụng chạy hoàn toàn offline sau khi cài đặt

### Không Cần Internet Cho:
- Tạo văn bản Word
- Quản lý PERSON
- Lưu/tải dữ liệu
- Tất cả tính năng core

### Dữ Liệu Local:
- `renderer/config/local_storage.json` - PERSON data
- `sessionStorage` - Temporary data
- `templates/` - Word templates

---

## 🐛 Troubleshooting

### Lỗi Thường Gặp

#### 1. Placeholder không được thay thế
**Nguyên nhân**: Placeholder bị tách ra nhiều text run trong Word
**Giải pháp**: 
- Xóa và gõ lại placeholder
- Không format (bold, italic) placeholder
- Sử dụng Find & Replace trong Word

#### 2. CCCD không format đúng
**Nguyên nhân**: Nhập ký tự không phải số
**Giải pháp**: Chỉ nhập số, hệ thống tự động format

#### 3. Session data không lưu
**Nguyên nhân**: Browser cache hoặc localStorage bị disable
**Giải pháp**: 
- Clear cache và restart
- Check localStorage permission

#### 4. Loại đất không hiển thị
**Nguyên nhân**: Thiếu file `land_types.json`
**Giải pháp**: Đảm bảo file tồn tại trong `renderer/config/`

---

## 📝 Version History

### v5.1 (Current)
- ✅ **File Manager**: Quản lý file Word với UI trực quan
- ✅ **Config Wizard**: Tự động tạo config cho file Word mới
- ✅ **Auto Placeholder Detection**: Tự động phát hiện và phân loại placeholders
- ✅ **Smart Config Generation**: Tự động tạo groups, subgroups, field mappings
- ✅ **Code Cleanup**: Giảm 32.5% code (xóa 14 debug files)
- ✅ **Session Storage Logic**: Smart merge với NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
- ✅ **Auto Refresh**: Tự động cập nhật UI sau khi thêm file Word mới
- ✅ **Constants Management**: Centralized configuration trong constants.js
- ✅ **Improved Comparison**: Chỉ so sánh fields có ở cả 2 bên
- ✅ **Cross-file Merge**: Merge dữ liệu thông minh giữa các files

### v5.0
- ✅ Person Data Management System
- ✅ PersonDataService với CRUD operations
- ✅ PersonManager UI với modal dialog
- ✅ Label Management tiếng Việt
- ✅ Auto-refresh person buttons
- ✅ Cache Management
- ✅ Global access button ở header
- ✅ 2-Color UI design

### v4.0
- Session Storage Manager
- Smart data reuse
- Merge duplicate detection
- Dropdown "Tái sử dụng"

### v3.0
- Land Type Detail (Loai_Dat_D)
- Auto-sync between land fields
- Priority system for land types

### v2.0
- Dynamic subgroup management
- Add/Remove subgroups
- Hide/Show subgroups

### v1.0
- Initial release
- Basic template processing
- Form generation
- Word export

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**LuuTung0102**

- GitHub: [@LuuTung0102](https://github.com/LuuTung0102)

---

## 🙏 Acknowledgments

- Docxtemplater team for the amazing template engine
- Electron team for the desktop framework
- Flatpickr for the date picker component
- All contributors and users


---

## 📚 Danh Sách Chức Năng Đầy Đủ

### 🎨 Giao Diện & Điều Hướng

#### 1. Two-Panel Layout
- **Panel Trái (Xanh)**: Khu vực nhập dữ liệu với form động
- **Panel Phải (Cam)**: Khu vực chọn folder và file template
- **Responsive Design**: Tự động điều chỉnh theo kích thước màn hình

#### 2. Taskbar Navigation
- **Chuyển đổi nhanh**: Click để chuyển giữa các nhóm dữ liệu
- **Active State**: Hiển thị rõ section đang active
- **Smooth Transition**: Chuyển đổi mượt mà giữa các section

#### 3. Header Controls
- **Nút "⚙️ Quản lý"**: Truy cập nhanh vào quản lý PERSON
- **Status Indicator**: Hiển thị trạng thái file đã chọn
- **Template Counter**: Đếm số lượng folder template

#### 4. Loading & Modal System
- **Loading Overlay**: Hiển thị tiến trình khi xuất văn bản
- **Success Modal**: Thông báo thành công với nút "Mở thư mục"
- **Error Modal**: Hiển thị lỗi chi tiết khi có vấn đề

---

### 📝 Quản Lý Template

#### 5. Folder Template System
- **Cấu trúc phân cấp**: Folder → Files → Placeholders
- **Config.json**: Cấu hình chi tiết cho từng folder
- **Auto-detection**: Tự động phát hiện file .docx trong folder
- **File Counter**: Hiển thị số lượng file trong mỗi folder

#### 6. Template Selection
- **Expand/Collapse**: Click folder để mở rộng/thu gọn
- **File List**: Hiển thị danh sách file trong folder
- **Visual Feedback**: Highlight folder và file đã chọn
- **Icon System**: Icon phân biệt folder và file

#### 7. Placeholder Detection
- **Auto-scan**: Tự động quét placeholder trong file Word
- **Merge Broken Tags**: Gộp placeholder bị tách ra nhiều text run
- **Clean Invalid**: Xóa placeholder không hợp lệ
- **Validation**: Kiểm tra cú pháp {{PlaceholderName}}

---

### 📋 Form Generation & Management

#### 8. Dynamic Form Rendering
- **Auto-generate**: Tự động tạo form từ placeholder và config
- **Field Mapping**: Map placeholder với field definition
- **Group Organization**: Tổ chức theo groups và subgroups
- **Order Control**: Sắp xếp theo thứ tự định nghĩa

#### 9. Field Types Support
- **text**: Input text cơ bản
- **number**: Input số với validation
- **date**: Date picker với tiếng Việt
- **select**: Dropdown với options
- **editable-select**: Dropdown có thể nhập và tìm kiếm
- **address-select**: Chọn địa chỉ 4 cấp (Tỉnh/Huyện/Xã/Thôn)
- **money**: Input tiền tệ với auto-format
- **tel**: Input số điện thoại
- **email**: Input email với validation
- **textarea**: Text area nhiều dòng
- **land-type**: Chọn loại đất cơ bản
- **land_type_size**: Loại đất + diện tích
- **land_type_detail**: Loại đất chi tiết (code|vị trí|diện tích)
- **text-or-dots**: Text hoặc dấu chấm nếu để trống
- **options**: Dropdown với options động

#### 10. Field Validation
- **Required Fields**: Đánh dấu và validate trường bắt buộc
- **Format Validation**: Kiểm tra format CCCD, email, phone
- **Length Validation**: Giới hạn độ dài input
- **Custom Validation**: Validation tùy chỉnh theo field type

#### 11. Auto-Format Features
- **CCCD**: 123456789 → 123.456.789 hoặc 123.456.789.012
- **Money**: 1000000 → 1,000,000
- **Phone**: Tự động format số điện thoại
- **Date**: Format ngày tháng theo chuẩn dd/mm/yyyy

---

### 👥 Quản Lý PERSON (LocalStorage)

#### 12. PERSON CRUD Operations
- **Create**: Thêm người dùng mới với đầy đủ thông tin
- **Read**: Xem danh sách và chi tiết người dùng
- **Update**: Chỉnh sửa thông tin người dùng
- **Delete**: Xóa người dùng với xác nhận

#### 13. PERSON Data Structure
- **Unique ID**: Mỗi person có ID duy nhất
- **Full Data**: Lưu trữ đầy đủ thông tin (Name, CCCD, Address, etc.)
- **Labels**: Nhãn tiếng Việt cho từng field
- **Validation**: Kiểm tra dữ liệu trước khi lưu

#### 14. PERSON UI Management
- **Modal Dialog**: Giao diện quản lý trong modal
- **Person List**: Danh sách người dùng với nút Sửa/Xóa
- **Add Form**: Form thêm mới với validation
- **Edit Form**: Form chỉnh sửa với dữ liệu có sẵn
- **Preview**: Xem trước thông tin đã chọn

#### 15. PERSON Selection
- **Button Grid**: Hiển thị danh sách person dạng button
- **Active State**: Highlight person đã chọn
- **Auto-fill**: Tự động điền form khi chọn person
- **Preview Panel**: Hiển thị thông tin chi tiết

#### 16. PERSON Cache Management
- **Auto-refresh**: Tự động cập nhật khi có thay đổi
- **Cache Invalidation**: Xóa cache khi cần
- **Lazy Loading**: Load dữ liệu khi cần thiết

---

### 🔄 Session Storage & Data Reuse

#### 17. Session Data Management
- **Auto-save**: Tự động lưu khi xuất văn bản
- **Smart Merge**: Gộp dữ liệu trùng lặp thông minh
- **Version Control**: Tạo version mới khi có thay đổi
- **Timestamp**: Đánh dấu thời gian cho mỗi version

#### 18. Data Comparison Logic
- **NO_CHANGE**: Dữ liệu giống hệt → Không lưu duplicate
- **ONLY_ADDITIONS**: Chỉ thêm field mới → Merge vào data cũ
- **HAS_MODIFICATIONS**: Có thay đổi → Tạo version mới

#### 19. Reuse Data Dropdown
- **Available Groups**: Hiển thị danh sách dữ liệu có thể tái sử dụng
- **Display Name**: Tên hiển thị với timestamp
- **Source Tracking**: Theo dõi nguồn gốc dữ liệu
- **Auto-fill**: Tự động điền form khi chọn

#### 20. Cross-File Deduplication
- **Detect Duplicates**: Phát hiện dữ liệu trùng lặp giữa các file
- **Merge Strategy**: Chiến lược merge thông minh
- **Reference Tracking**: Theo dõi tham chiếu giữa các file

#### 21. Clear Session Data
- **Nút "Làm mới"**: Xóa tất cả session data
- **Confirmation**: Xác nhận trước khi xóa
- **Auto-hide**: Ẩn nút khi không có data

---

### 🏷️ Xử Lý Loại Đất Đặc Biệt

#### 22. Loai_Dat (Basic)
- **Format**: CLN+NST+BCS
- **Output**: Đất cây lâu năm và Đất sản xuất nông nghiệp và Đất bằng chưa sử dụng
- **Land Type Map**: Mapping từ code sang tên đầy đủ

#### 23. Loai_Dat_F (With Size)
- **Format**: CLN 1236.5; NST 431.1
- **Output**: 1236.5m² CLN; 431.1m² NST
- **Tag System**: Quản lý nhiều loại đất dạng tag
- **Add/Remove**: Thêm/xóa tag động

#### 24. Loai_Dat_D (Detailed)
- **Format**: CLN|Vị trí 2|1236.5;NST|Vị trí 1|431.1
- **Output**: 
  ```
  + Loại đất 1: CLN:   Vị trí 2                     Diện tích: 1236.5m².
  + Loại đất 2: NST:   Vị trí 1                     Diện tích: 431.1m².
  ```
- **3-Step Input**: Code → Location → Area
- **Visual Feedback**: Hiển thị tag với đầy đủ thông tin

#### 25. Land Type Priority System
- **Priority**: Loai_Dat_D > Loai_Dat_F > Loai_Dat
- **Auto-skip**: Tự động bỏ qua field có priority thấp hơn
- **Hidden Fields**: Tạo hidden input để sync dữ liệu

#### 26. Land Type Sync
- **Loai_Dat_D → Loai_Dat_F**: Tự động sync khi nhập
- **Loai_Dat_F → Loai_Dat**: Tự động sync khi nhập
- **Bidirectional**: Sync 2 chiều giữa các field

#### 27. Land Type Dropdown
- **Autocomplete**: Tự động gợi ý khi nhập
- **Filter**: Lọc theo text đã nhập
- **Keyboard Navigation**: Điều hướng bằng phím
- **Click Selection**: Chọn bằng click chuột

#### 28. Dynamic SV Field Population
- **Auto-extract**: Tự động trích xuất diện tích từ Loai_Dat
- **Populate Options**: Điền options cho field SV
- **Format Display**: Hiển thị với đơn vị m²

---

### 🗂️ Subgroup Management

#### 29. Dynamic Subgroup Addition
- **Nút "➕ Thêm"**: Thêm subgroup mới
- **Auto-render**: Tự động render form cho subgroup mới
- **Scroll to View**: Tự động scroll đến subgroup mới
- **Event Setup**: Setup events cho subgroup mới

#### 30. Subgroup Removal
- **Nút "❌ Xóa"**: Xóa subgroup không cần
- **Confirmation**: Xác nhận trước khi xóa
- **Data Cleanup**: Xóa dữ liệu liên quan
- **Visibility Control**: Chỉ hiển thị nút xóa khi có thể xóa

#### 31. Subgroup Visibility
- **Default Visible**: Subgroup đầu tiên mặc định hiển thị
- **Hidden State**: Các subgroup khác ẩn mặc định
- **Toggle**: Bật/tắt hiển thị không mất dữ liệu
- **Persistent**: Dữ liệu được giữ khi ẩn

#### 32. Subgroup Styling
- **Border**: Viền màu xanh phân biệt
- **Background**: Nền màu nhạt
- **Spacing**: Khoảng cách hợp lý
- **Header**: Tiêu đề với nút điều khiển

---

### 📍 Address Selection System

#### 33. 4-Level Address Hierarchy
- **Tỉnh/Thành phố**: Cấp 1
- **Quận/Huyện**: Cấp 2
- **Phường/Xã**: Cấp 3
- **Thôn/Buôn**: Cấp 4

#### 34. Cascading Dropdowns
- **Auto-load**: Tự động load options cho cấp tiếp theo
- **Reset Children**: Reset các cấp con khi thay đổi cấp cha
- **Preserve Selection**: Giữ lựa chọn khi có thể

#### 35. Address Data Management
- **JSON Database**: Dữ liệu địa chỉ Việt Nam đầy đủ
- **Fast Lookup**: Tra cứu nhanh theo cấp
- **Memory Efficient**: Chỉ load dữ liệu cần thiết

#### 36. Address Format Output
- **Full Address**: Ghép đầy đủ 4 cấp
- **Separator**: Phân cách bằng dấu phẩy
- **Trim**: Loại bỏ khoảng trắng thừa

---

### 💾 Data Processing & Export

#### 37. Form Data Collection
- **Collect All**: Thu thập tất cả dữ liệu từ form
- **Group by Suffix**: Nhóm theo suffix (1, 2, 3...)
- **Normalize**: Chuẩn hóa dữ liệu trước khi lưu
- **Validation**: Validate trước khi export

#### 38. Auto-Convert Placeholders
- **Money → MoneyText**: 1000000 → "Một triệu đồng"
- **S → S_Text**: 1236.5 → "Một nghìn hai trăm ba mươi sáu phẩy năm"
- **Name → NameT**: "nguyễn văn a" → "Nguyễn Văn A"
- **Date → DateText**: 15/03/2024 → "Ngày mười lăm tháng ba năm hai nghìn không trăm hai mươi bốn"

#### 39. Text-or-Dots Processing
- **Empty Check**: Kiểm tra field có trống không
- **Dot Replacement**: Thay thế bằng dấu chấm nếu trống
- **Custom Placeholder**: Cho phép tùy chỉnh chuỗi thay thế
- **Preserve Input**: Giữ nguyên nếu có nhập

#### 40. XML Streaming Processing
- **Large File Support**: Xử lý file Word > 10MB
- **SAX Parser**: Parse XML theo stream
- **Memory Efficient**: Không load toàn bộ vào memory
- **Fast Processing**: Xử lý nhanh hơn DOM parser

#### 41. Placeholder Merging
- **Detect Split**: Phát hiện placeholder bị tách
- **Merge Tags**: Gộp các text run lại
- **Clean XML**: Dọn dẹp XML structure
- **Preserve Format**: Giữ nguyên format Word

#### 42. Empty Line Removal
- **Detect Empty**: Phát hiện dòng có placeholder trống
- **Remove Paragraph**: Xóa paragraph không có dữ liệu
- **Subgroup Check**: Kiểm tra visibility của subgroup
- **Smart Removal**: Chỉ xóa khi cần thiết

#### 43. Comma Cleanup
- **Detect Multiple**: Phát hiện dấu phẩy liên tiếp
- **Clean Pattern**: Xóa pattern ", , ," → ""
- **Preserve Valid**: Giữ dấu phẩy hợp lệ
- **Post-render**: Xử lý sau khi render

#### 44. M² Symbol Conversion
- **m2 → m²**: Chuyển đổi tự động
- **Multiple Occurrences**: Xử lý tất cả vị trí
- **XML Safe**: Đảm bảo an toàn trong XML

---

### 📤 Export & Output

#### 45. Single Document Export
- **Select Output Folder**: Chọn thư mục lưu
- **Remember Last**: Nhớ thư mục lần trước
- **Original Filename**: Giữ nguyên tên file
- **Overwrite Confirm**: Xác nhận nếu file đã tồn tại

#### 46. Export Options
- **phMapping**: Truyền mapping cho xử lý
- **visibleSubgroups**: Truyền danh sách subgroup hiển thị
- **Custom Options**: Tùy chỉnh options khác

#### 47. Output Folder Management
- **Open Folder**: Mở thư mục sau khi export
- **Shell Integration**: Tích hợp với file explorer
- **Cross-platform**: Hoạt động trên Windows/Mac/Linux

#### 48. Export Validation
- **Pre-export Check**: Kiểm tra trước khi export
- **Form Validation**: Validate form data
- **File Existence**: Kiểm tra file template tồn tại
- **Error Handling**: Xử lý lỗi chi tiết

---

### 🔧 Configuration System

#### 49. Config.json Structure
- **folders**: Danh sách folder template
- **groups**: Định nghĩa các nhóm dữ liệu
- **fieldSchemas**: Schema cho các field
- **fieldMappings**: Mapping giữa placeholder và field

#### 50. Field Schema Definition
- **name**: Tên field
- **label**: Nhãn hiển thị
- **type**: Loại field
- **required**: Bắt buộc hay không
- **options**: Options cho select/dropdown
- **defaultValue**: Giá trị mặc định
- **placeholder**: Placeholder text
- **maxLength**: Độ dài tối đa
- **hidden**: Ẩn field hay không

#### 51. Field Mapping System
- **group**: Nhóm chứa field
- **source**: Nguồn dữ liệu (localStorage/sessionStorage)
- **schema**: Schema sử dụng
- **subgroups**: Danh sách subgroup
- **suffixes**: Suffix cho mỗi subgroup

#### 52. Template Matching
- **filename**: Tên file template
- **groups**: Danh sách group sử dụng
- **Auto-filter**: Tự động lọc config theo template

---

### 🎯 Advanced Features

#### 53. Event Listener Management
- **Setup**: Setup events cho tất cả input
- **Cleanup**: Dọn dẹp events khi re-render
- **Delegation**: Sử dụng event delegation
- **Performance**: Tối ưu performance

#### 54. Date Picker Integration
- **Flatpickr**: Sử dụng Flatpickr library
- **Vietnamese Locale**: Ngôn ngữ tiếng Việt
- **Format**: dd/mm/yyyy
- **Keyboard Support**: Hỗ trợ phím tắt

#### 55. Money Input Formatting
- **Thousand Separator**: Dấu phẩy phân cách nghìn
- **Auto-format**: Format tự động khi nhập
- **Remove on Submit**: Xóa format khi submit
- **Preserve Value**: Giữ nguyên giá trị số

#### 56. CCCD Input Formatting
- **9 or 12 Digits**: Hỗ trợ 2 format
- **Dot Separator**: 123.456.789 hoặc 123.456.789.012
- **Auto-detect**: Tự động phát hiện format
- **Validation**: Validate số chữ số

#### 57. Phone Input Formatting
- **10 Digits**: Giới hạn 10 số
- **Auto-format**: Format tự động
- **Validation**: Validate format

#### 58. Editable Select
- **Type to Search**: Nhập để tìm kiếm
- **Dropdown Options**: Hiển thị options phù hợp
- **Free Text**: Cho phép nhập text tự do
- **Keyboard Navigation**: Điều hướng bằng phím

#### 59. Form Field Sorting
- **Priority Order**: Sắp xếp theo priority
- **Required First**: Field bắt buộc lên đầu
- **Alphabetical**: Sắp xếp theo alphabet
- **Custom Order**: Cho phép tùy chỉnh

#### 60. Responsive Form Layout
- **3-Column Grid**: 3 field mỗi hàng
- **Full-width Fields**: Field đặc biệt chiếm full width
- **Auto-adjust**: Tự động điều chỉnh theo màn hình
- **Mobile Support**: Hỗ trợ mobile

---

### 🛡️ Error Handling & Validation

#### 61. Form Validation
- **Required Check**: Kiểm tra field bắt buộc
- **Format Check**: Kiểm tra format dữ liệu
- **Length Check**: Kiểm tra độ dài
- **Custom Rules**: Validation tùy chỉnh

#### 62. Error Display
- **Inline Errors**: Hiển thị lỗi ngay tại field
- **Modal Errors**: Hiển thị lỗi trong modal
- **Error List**: Danh sách tất cả lỗi
- **Clear Errors**: Xóa lỗi khi sửa

#### 63. Export Error Handling
- **Template Errors**: Lỗi từ template
- **Data Errors**: Lỗi từ dữ liệu
- **File Errors**: Lỗi file system
- **Detailed Messages**: Thông báo lỗi chi tiết

#### 64. Graceful Degradation
- **Fallback**: Dự phòng khi có lỗi
- **Partial Success**: Xử lý thành công một phần
- **Recovery**: Khôi phục sau lỗi
- **User Feedback**: Thông báo cho người dùng

---

### 🔍 Debug & Development

#### 65. Console Logging
- **Structured Logs**: Log có cấu trúc
- **Log Levels**: Debug/Info/Warn/Error
- **Context Info**: Thông tin ngữ cảnh
- **Performance Logs**: Log thời gian xử lý

#### 66. Data Inspection
- **Form Data**: Xem dữ liệu form
- **Session Data**: Xem session storage
- **Config Data**: Xem configuration
- **Placeholder Data**: Xem placeholders

#### 67. Development Tools
- **Hot Reload**: Reload nhanh khi dev
- **DevTools**: Chrome DevTools integration
- **Source Maps**: Debug code gốc
- **Error Stack**: Stack trace chi tiết

---

### 🚀 Performance Optimization

#### 68. Lazy Loading
- **Load on Demand**: Chỉ load khi cần
- **Defer Non-critical**: Trì hoãn tác vụ không quan trọng
- **Progressive Enhancement**: Tăng cường dần dần

#### 69. Caching Strategy
- **Person Cache**: Cache danh sách person
- **Config Cache**: Cache configuration
- **Template Cache**: Cache template data
- **Smart Invalidation**: Invalidate cache thông minh

#### 70. Memory Management
- **Cleanup**: Dọn dẹp memory không dùng
- **Event Removal**: Xóa event listeners
- **DOM Cleanup**: Dọn dẹp DOM elements
- **Garbage Collection**: Hỗ trợ GC

#### 71. Rendering Optimization
- **RequestAnimationFrame**: Sử dụng RAF
- **Batch Updates**: Cập nhật theo batch
- **Virtual Scrolling**: Scroll ảo cho list dài
- **Debounce/Throttle**: Giới hạn tần suất xử lý

---

### 🔐 Data Security & Privacy

#### 72. Local Data Storage
- **No Server**: Không gửi dữ liệu lên server
- **Local Only**: Dữ liệu chỉ lưu local
- **User Control**: Người dùng kiểm soát hoàn toàn

#### 73. Data Validation
- **Input Sanitization**: Làm sạch input
- **XSS Prevention**: Ngăn chặn XSS
- **SQL Injection**: Không áp dụng (no database)

#### 74. File System Security
- **Path Validation**: Validate đường dẫn file
- **Permission Check**: Kiểm tra quyền truy cập
- **Safe Operations**: Thao tác file an toàn

---

### 📱 Cross-Platform Support

#### 75. Windows Support
- **Native Integration**: Tích hợp với Windows
- **File Explorer**: Mở file explorer
- **Shell Commands**: Thực thi lệnh shell

#### 76. macOS Support
- **Native Integration**: Tích hợp với macOS
- **Finder**: Mở Finder
- **Shell Commands**: Thực thi lệnh shell

#### 77. Linux Support
- **Native Integration**: Tích hợp với Linux
- **File Manager**: Mở file manager
- **Shell Commands**: Thực thi lệnh shell

---

### 🎨 UI/UX Features

#### 78. Visual Feedback
- **Hover Effects**: Hiệu ứng khi hover
- **Active States**: Trạng thái active rõ ràng
- **Loading States**: Hiển thị trạng thái loading
- **Success/Error**: Feedback thành công/lỗi

#### 79. Accessibility
- **Keyboard Navigation**: Điều hướng bằng phím
- **Focus Management**: Quản lý focus
- **ARIA Labels**: Nhãn cho screen reader
- **Color Contrast**: Độ tương phản màu sắc

#### 80. Responsive Design
- **Mobile First**: Thiết kế mobile trước
- **Breakpoints**: Điểm ngắt responsive
- **Flexible Layout**: Layout linh hoạt
- **Touch Support**: Hỗ trợ touch

---

**Made with ❤️ by LuuTung0102**
