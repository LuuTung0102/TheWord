# 📄 TheWord - Hệ Thống Tự Động Hóa Văn Bản

## ✨ Tính Năng Nổi Bật

🚀 **Tự động hóa 100%** - Từ template Word đến văn bản hoàn chỉnh  
📝 **Form thông minh** - Auto-format CCCD, tiền, ngày tháng, địa chỉ, diện tích  
🔄 **Tái sử dụng dữ liệu** - Merge & tái sử dụng dữ liệu thông minh giữa các template  
💾 **LocalStorage & SessionStorage** - Lưu người dùng thường xuyên và session data  
🗑️ **Quản lý linh hoạt** - Xóa dòng, xóa placeholder riêng lẻ, thêm/xóa subgroup động  
👁️ **Ẩn/hiện nhóm** - Toggle subgroup để form gọn gàng, không mất dữ liệu khi thêm/xóa  
✅ **Smart Validation** - Single source of truth từ config.json, chỉ validate subgroup visible  
📊 **Tự động chuyển đổi** - Money → MoneyText, S (diện tích) → S_Text (bằng chữ), Name → NameT (Title Case)  
🧹 **Tự động dọn dẹp** - Xóa dòng trống của subgroup ẩn khi xuất Word  
🏷️ **Loại đất thông minh** - Loai_Dat (tên đầy đủ) và Loai_Dat_F (code + diện tích với m²)  
² **Superscript tự động** - Tự động chuyển m2 → m² (Unicode superscript) trong Word  
🧹 **Cleanup dấu phẩy thừa** - Tự động xóa dấu phẩy thừa (", ,", ", , ,"...) từ placeholder rỗng  
⚡ **Nhanh chóng** - Xuất văn bản trong < 5 giây  
🎨 **UI hiện đại** - Taskbar, dropdown, date picker, address cascading  
📂 **Mở thư mục** - Mở trực tiếp thư mục output sau khi xuất  
🔌 **100% Offline** - Không cần kết nối internet
## 🎯 Workflow
1️⃣ Chọn folder → 2️⃣ Chọn file Word → 3️⃣ Điền form → 4️⃣ Xuất văn bản ✅
### **Chi tiết:**
📁 Chọn folder (vd: "HĐ chuyển nhượng")
  └─ 📄 Chọn file (vd: "HĐ chuyển nhượng quyền sử dụng đất.docx")
      └─ 📝 Form tự động render theo placeholders trong file
          └─ ✅ Nhấn "Xuất Word" → Chọn nơi lưu → Hoàn tất!

## 📖 Quick Start
### **1. Cài Đặt**
**Yêu cầu hệ thống:**
- Windows 10/11
- Node.js 16.x hoặc mới hơn
- 200MB dung lượng trống
**Cài đặt:**
```bash
git clone https://github.com/LuuTung0102/TheWord.git
cd TheWord
npm install
npm start
```

**✅ Sau khi chạy `npm install`, có thể dùng offline hoàn toàn!**

### **2. Sử Dụng Cơ Bản**

1. **Chọn folder** (panel bên phải)
2. **Chọn file Word** trong folder
3. **Điền thông tin** vào form (bên trái)
4. **Nhấn "Xuất Word"** → Chọn thư mục lưu
5. **Mở file Word** → Văn bản hoàn chỉnh! ✅

### **3. Tính Năng Nâng Cao**

#### **🔄 Tái sử dụng dữ liệu (Session Storage)**

**Scenario:** Tạo nhiều văn bản cho cùng một người
1. Điền "HĐ chuyển nhượng" cho ông A
2. Xuất văn bản
3. Mở "Giấy ủy quyền"
4. Dropdown "Tái sử dụng" → Chọn "MEN1 - Nguyễn Văn A"
5. Form tự động điền ✅ (merge thông minh với dữ liệu hiện tại)

**Tính năng:**
- ✅ **Auto-merge**: Tự động kết hợp dữ liệu cũ với form mới
- ✅ **Smart detect**: Nhận diện và map đúng subgroup (MEN1, INFO...)
- ✅ **Preserve data**: Giữ nguyên dữ liệu đã điền, chỉ fill chỗ trống
- ✅ **No duplicate**: Không tạo session duplicate khi copy không sửa + khác file
- ✅ **Config-based**: Tự động nhận diện subgroup từ config.json

**Logic tái sử dụng:**
- Subgroup được xác định tự động từ `config.fieldMappings`
- Kiểm tra thay đổi thông minh: NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
- Tự động merge khi có thêm field mới (ONLY_ADDITIONS)
- Xóa duplicate khi copy không sửa + khác file (NO_CHANGE)

#### **💾 Lưu người dùng (Local Storage)**
File: renderer/config/local_storage.json

Thêm người dùng thường xuyên:
{
  "id": "person1",
  "name": "Nguyễn Văn A",
  "data": {
    "Gender": "Ông",
    "Name": "NGUYỄN VĂN A",
    "CCCD": "123.456.789.012",
    "Address": "Xã ABC, H. XYZ, T. Đắk Lắk"
  }
}

→ Chọn từ dropdown trong form (nhóm có source: "localStorage")
#### **🗑️ Quản lý dữ liệu linh hoạt**
✅ Thêm/xóa subgroup: Click "➕ Thêm" để thêm subgroup mới, "❌ Xóa" để xóa
   → Không mất dữ liệu đã nhập (DOM manipulation, không reload)
✅ Xóa dòng: Click [X] bên cạnh dòng để xóa toàn bộ dữ liệu dòng đó
✅ Xóa placeholder: Click [🗑️] trên từng field để xóa riêng lẻ
✅ Ẩn/hiện subgroup: Toggle để form gọn gàng, dễ điều hướng
#### **📊 Tự động chuyển đổi số sang chữ**

✅ Money → MoneyText:
   - Nhập: 1234567
   - UI hiển thị: 1,234,567
   - Word nhận: 1,234,567
   - MoneyText tự động: "một triệu hai trăm ba mươi bốn nghìn năm trăm sáu mươi bảy đồng chẵn"

✅ S (diện tích) → S_Text:
   - Nhập: 500
   - UI hiển thị: 500 (có thể có dấu phẩy: 5,000)
   - Word nhận: 500 (số thuần, không dấu phẩy)
   - S_Text tự động: "năm trăm mét vuông"

   

✅ Name → NameT (Title Case):
   - Nhập Name1: "LƯU THANH TÙNG"
   - NameT1 tự động: "Lưu Thanh Tùng"
   - Áp dụng cho tất cả Name fields (Name1, Name2, Name3...)

#### **📂 Mở thư mục nhanh**
Sau khi xuất file Word thành công:
→ Nhấn "Mở thư mục" để mở trực tiếp folder chứa file vừa tạo
→ Tiết kiệm thời gian tìm kiếm file output
## ✅ Smart Validation (Single Source of Truth)

**🎯 Nguyên tắc: Một nguồn dữ liệu (`config.json`) — dùng cho cả:**
1. **Hiển thị dấu `*` trong UI** (visual indicator)
2. **Kiểm tra hợp lệ trước khi xuất** (validation)

**1️⃣ Single Source of Truth - `config.json`:**

```json
{
  "fieldSchemas": {
    "PersonalInfo": {
      "fields": [
        { 
          "name": "Name", 
          "label": "Họ và tên", 
          "type": "text", 
          "required": true   
        },
        { 
          "name": "Note", 
          "label": "Ghi chú", 
          "type": "textarea", 
          "required": false   
        }
      ]
    }
  }
}
```

**2️⃣ UI tự động đọc từ config:**
```javascript
const isRequired = fieldDef.required === true;
const requiredClass = isRequired ? ' class="required"' : '';
// → <label class="required"><b>Họ và tên</b></label>
```  

## 📂 Cấu Trúc Dự Án
```
TheWord/
├── main.js                       # Electron main process
├── index.html                    # App entry point
├── style.css                     # Global styles
├── package.json                  # Dependencies & scripts
├── renderer/
│   ├── config/
│   │   ├── config.json          # Main config (folders)
│   │   ├── baseConstants.js     # Default field types
│   │   ├── configLoader.js      # Config parser
│   │   ├── address.json         # VN address data (63 tỉnh/thành)
│   │   ├── land_types.json      # Land type definitions
│   │   └── local_storage.json   # Saved people
│   ├── handlers/
│   │   ├── genericFormHandler.js    # Universal form renderer
│   │   ├── templateManager.js       # Template selector
│   │   └── exportHandler.js         # Export logic
│   ├── core/
│   │   ├── formHelpers.js           # Input formatters
│   │   ├── formValidator.js         # Smart validation (visibility-based)
│   │   ├── utils.js                 # Utilities
│   │   ├── localStorageLoader.js    # Load saved people
│   │   ├── sessionStorageManager.js # Session data manager (reuse logic)
│   │   └── electron-imports.js      # Electron IPC bridge
│   └── mainApp.js               # App controller
├── logic/
│   ├── generate.js              # Docx generation
│   └── placeholder.js           # Placeholder extraction
└── templates/
    ├── HĐ chuyển nhượng/
    │   ├── config.json          # Template config
    │   └── *.docx               # Word templates
    ├── Giấy Ủy Quyền/
    ├── HĐ phân chia tài sản/
    ├── Giấy tờ khác/
    └── Thuế/
```

**🗂️ Các file quan trọng:**
- `genericFormHandler.js`: Core form rendering
- `formValidator.js`: Smart validation theo visibility
- `sessionStorageManager.js`: Quản lý tái sử dụng dữ liệu với logic config-based
- `generate.js`: Logic sinh file Word với pre-processing XML
## 🎨 Kiến Trúc Hệ Thống
### **1. Single Source of Truth Architecture**
**Flow: `config.json` → UI + Validation**
┌─────────────────────────────────────────────────────────────────┐
│  config.json (SINGLE SOURCE OF TRUTH)                           │
├─────────────────────────────────────────────────────────────────┤
│  {                                                               │
│    "fieldSchemas": {                                             │
│      "PersonalInfo": {                                           │
│        "fields":                                                 │
│          { "name": "Name", "required": true },                   │
│          { "name": "CCCD", "required": true },                   │
│          { "name": "Note", "required": false }                   │
│        ]                                                         │
│      }                                                           │
│    },                                                            │
│    "fieldMappings": []                                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ├──────────────────────────┬───────────────────────
                           │                          │
                           ▼                          ▼
        ┌──────────────────────────────┐  ┌──────────────────────────────┐
        │  UI Rendering                │  │  Form Validation             │
        │  (genericFormHandler.js)     │  │  (formValidator.js)          │
        ├──────────────────────────────┤  ├──────────────────────────────┤
        │  Đọc fieldDef.required       │  │  Đọc field.required          │
        │  → Hiển thị dấu * cho field  │  │  → Check value nếu required  │
        │                               │  │                              │
        │  if (field.required) {       │  │  if (field.required &&       │
        │    class="required"           │  │      !value) {               │
        │  }                            │  │    errors.push(...)          │
        │                               │  │  }                            │
        │  → "Họ và tên *"              │  │  → Báo lỗi nếu trống         │
        └──────────────────────────────┘  └──────────────────────────────┘

✅ Chỉnh sửa 1 lần trong config.json → UI + Validation tự động sync
### **2. Config-based System**
Mỗi folder template có `config.json`:
```json
{
  "folder": {
    "id": "chuyen-nhuong",
    "name": "HĐ chuyển nhượng",
    "icon": "📜"
  },
  "templates": [{
    "id": "hd-cn",
    "filename": "HĐ chuyển nhượng quyền sử dụng đất.docx",
    "groups": ["BCN", "NCN", "LAND"],
    "placeholders": {
      "BCN": ["Gender1", "Name1", "CCCD1", "Address1"],
      "NCN": ["Gender7", "Name7", "CCCD7", "Address7"],
      "LAND": ["QSH", "S", "AddressD", "Money"]
    }
  }],
  "groups": [...],
  "fieldSchemas": {...},
  "fieldMappings": [{
    "group": "LAND",
    "schema": "LandInfo",
    "subgroups": [
      { "id": "INFO", "label": "Thông tin đất đai", "visible": true }
    ]
  }]
}
### **3. Dynamic Form Rendering**
```
config.json → configLoader.js → genericFormHandler.js → Form UI
```
- **Không cần code mới** cho file Word mới
- Chỉ cần cập nhật `config.json`
- Form tự động render theo config
- **Thêm/xóa subgroup động** - DOM manipulation, không reload, giữ nguyên dữ liệu
### **4. Auto-Format & Conversion**
**Money field:**
- Input: Số thuần (1234567)
- UI: Format với dấu phẩy (1,234,567)
- Word: Giữ format với dấu phẩy
- MoneyText: Tự động tạo "một triệu hai trăm ba mươi bốn nghìn năm trăm sáu mươi bảy đồng chẵn"
**S (Area) field:**
- Input: Số thuần (500)
- UI: Format với dấu phẩy nếu > 1000 (5,000)
- Word: Số thuần không dấu phẩy (5000) - để dễ tính toán
- S_Text: Tự động tạo "năm nghìn mét vuông"
**Land Type fields:**
- `Loai_Dat` (land_type): Chọn loại đất → Xuất tên đầy đủ (ví dụ: "Đất ở tại đô thị")
- `Loai_Dat_F` (land_type_size): Tags với code + diện tích → Xuất format "440m² ONT; 450m² CHN"
- Tự động chuyển m2 → m² (Unicode superscript) trong Word
### **5. Session Storage Management**
**Logic tái sử dụng dữ liệu:**
1. Parse formData → dataGroups (dựa vào config.fieldMappings)
   - Field có suffix (Name1) → map vào subgroup theo suffix
   - Field không suffix (QSH, Money) → map vào subgroup với suffix = ""
2. Kiểm tra reusedGroups từ UI
   - Subgroup được xác định tự động bằng isSubgroupInConfig()
   - Phân tích thay đổi: NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
3. Xử lý theo logic:
   - NO_CHANGE + cùng file → Giữ nguyên session
   - NO_CHANGE + khác file → Không lưu duplicate ✅
   - ONLY_ADDITIONS → Merge data, xóa session cũ nếu khác file
   - HAS_MODIFICATIONS → Giữ cả 2 sessions
### **6. Smart Line Removal (Auto-cleanup)**
**Logic xóa dòng tự động khi xuất Word:**
1. Subgroup có visible = false (ẩn):
   → Xóa dòng nếu TẤT CẢ placeholders của subgroup đều rỗng
2. Subgroup có visible = true (hiện):
   → KHÔNG xóa dòng
   → Placeholder rỗng thay bằng "" (empty string)
   → Dòng vẫn giữ nguyên trong Word
**Ví dụ:**
- Template có MEN1 (visible), MEN2-6 (hidden)
- Người dùng không thêm MEN2 → Tất cả placeholders MEN2 rỗng
- → Dòng chứa {Name2}, {CCCD2}... sẽ bị xóa tự động ✅
- MEN1 có Name1="Nguyễn Văn A" nhưng CCCD1 rỗng
- → Dòng vẫn giữ, CCCD1 = "" ✅
**Technical:**
- Logic subgroup-based: Xử lý tất cả subgroups dựa trên config (MEN, BCN, BCT, MP, LAND, v.v.)
- Sử dụng `phMapping` và `visibleSubgroups` để xác định subgroup
- Pre-process XML trước khi render với Docxtemplater
- Chỉ xóa paragraph nếu TẤT CẢ subgroups trong đó đều thỏa điều kiện xóa
- Không còn logic riêng cho MEN2-6 (đã được thay thế bởi logic subgroup-based)
### **7. Comma Cleanup (Xóa dấu phẩy thừa)**
**Logic cleanup dấu phẩy thừa từ placeholder rỗng:**
**2 giai đoạn:**
1. **PRE-RENDER (Trước khi render):**
   - Quét tất cả paragraph trong Word template
   - Đánh dấu paragraph có chứa `{{placeholder}}` bằng attribute `data-has-placeholder="true"`
   - Paragraph không có placeholder → không đánh dấu

2. **POST-RENDER (Sau khi render):**
   - Chỉ xử lý paragraph có attribute `data-has-placeholder`
   - Kiểm tra pattern dấu phẩy thừa: `, ,`, `, , ,`, `, , , ,`... (2+ dấu phẩy liên tiếp)
   - Xóa hoàn toàn: `(,\s*){2,}` → `` (empty string)
   - Paragraph không có placeholder → bỏ qua, giữ nguyên

**Ví dụ:**
- Template: `"Chúng tôi gồm: {{NameT1}}, {{NameT2}}, được nhận"`
- NameT1 = "Lưu Thanh Tùng", NameT2 = "" (rỗng)
- Sau render: `"Chúng tôi gồm: Lưu Thanh Tùng, , được nhận"`
- Sau cleanup: `"Chúng tôi gồm: Lưu Thanh Tùng được nhận"` ✅

**Technical:**
- Pre-render: Tag paragraph với `data-has-placeholder` attribute
- Post-render: Chỉ cleanup paragraph đã được tag
- Regex: `(,\s*){2,}` match 2+ dấu phẩy liên tiếp (có thể có khoảng trắng)
- Xóa hoàn toàn, không thay bằng khoảng trắng
- An toàn: Không động vào paragraph không có placeholder
## ⚙️ Tạo Template Mới
### **Bước 1: Tạo file Word**
1. Tạo file .docx trong folder templates/
2. Chèn placeholders: {PlaceholderName}
3. Format đẹp (font, spacing, alignment)

### **Bước 2: Cập nhật config.json**
**✅ Single Source of Truth - Định nghĩa `required` 1 lần duy nhất:**
```json
{
  "templates": [
    {
      "id": "new-doc",
      "filename": "New Document.docx",
      "groups": ["GROUP1", "GROUP2"],
      "placeholders": {
        "GROUP1": ["Field1", "Field2"],
        "GROUP2": ["Field3", "Field4"]
      }
    }
  ],
  "fieldSchemas": {
    "SchemaName": {
      "fields": [
        {
          "name": "Field1",
          "label": "Label hiển thị",
          "type": "text",
          "required": true     
        },
        {
          "name": "Field2",
          "label": "Ghi chú",
          "type": "textarea",
          "required": false   
        }
      ]
    }
  },
  "fieldMappings": [
    {
      "group": "GROUP1",
      "schema": "SchemaName",
      "subgroups": [
        { "id": "MEN1", "label": "Thông tin cá nhân", "visible": true }
      ],
      "suffixes": ["1"]
    },
    {
      "group": "LAND",
      "schema": "LandInfo",
      "subgroups": [
        { "id": "INFO", "label": "Thông tin đất đai", "visible": true }
      ]
    }
  ]
}

**Kết quả:**
- UI tự động hiển thị "Label hiển thị *" (có dấu sao đỏ)
- Validator tự động check Field1 trước khi xuất
- Field2 không bắt buộc → không có * → không validate
- **Chỉnh 1 lần** trong config → UI + Validation đồng bộ ✅

### **Bước 3: Khởi động TheWord**
npm start → Template sẵn sàng! ✅
## 🔧 Field Types
| Type | Description | Example |
|------|-------------|---------|
| `text` | Text input | Name, Address |
| `number` | Number input | CCCD, Phone, S (diện tích) |
| `date` | Date picker | Birth date |
| `select` | Dropdown | Gender, Options |
| `address-select` | Cascading address | Province → District → Ward |
| `land_type` | Land type selector | ONT, LUK, TSC (xuất tên đầy đủ) |
| `land_type_size` | Land type + area | ONT 440 → 440m² ONT (tags + dropdown) |
| `currency` | Money input | 1,000,000 (tự động tạo MoneyText) |
| `textarea` | Multi-line text | Notes |
---
## 🐛 Troubleshooting
### **App không khởi động**
```bash
rm -rf node_modules
npm install
npm start
```
### **Form không hiển thị**
✅ F12 → Console → Xem lỗi
✅ Kiểm tra config.json syntax (JSONLint.com)
✅ Restart app (Ctrl+R)
```
### **Export ra Word lỗi**
✅ Kiểm tra placeholders trong Word: {Name} (không phải {{Name}})
✅ Kiểm tra file Word không bị corrupt
✅ Xem console logs trong terminal
```
### **Validation báo lỗi dù đã điền đủ**
✅ Check console: window.visibleSubgroups có chứa subgroup đang điền không?
✅ Kiểm tra field có đúng data-ph attribute không
✅ F12 → Console → Xem validateFormData() output
✅ Reload app (Ctrl+R) để reset visible state
```
### **Tái sử dụng dữ liệu không hoạt động**
✅ Check console: window.__reusedGroups có chứa subgroup đã chọn không?
✅ Kiểm tra config.json có định nghĩa subgroup đúng không
✅ Xem console logs: analyzeChanges() type là gì?
✅ Subgroup phải được định nghĩa trong fieldMappings
```
## 📊 Performance Benchmarks
| Task | Time |
|------|------|
| App startup | ~2s |
| Template scan (5 folders) | ~100ms |
| Form render | ~300ms |
| Export 1 Word | ~2s |
| Load session data | ~50ms |
---
## 🚀 Version History
### **v4.4** ✅ (Current)
**🎯 Major Changes:**
- [x] **Auto-generate NameT (Title Case)** - Tự động tạo NameT1, NameT2... từ Name1, Name2... (UPPERCASE → Title Case)
- [x] **Comma cleanup 2 giai đoạn** - Pre-render tagging + Post-render cleanup, chỉ xử lý paragraph có placeholder
- [x] **Xóa dấu phẩy thừa** - Tự động xóa ", ,", ", , ,"... (2+ dấu phẩy liên tiếp) từ placeholder rỗng
**✨ Improvements:**
- [x] NameT tự động generate từ Name với toTitleCase() function
- [x] Cleanup an toàn: Chỉ xử lý paragraph có `data-has-placeholder` attribute
- [x] Xóa hoàn toàn dấu phẩy thừa (không thay bằng khoảng trắng)
- [x] Không động vào paragraph không có placeholder
### **v4.3** ✅
**🎯 Major Changes:**
- [x] **Tách biệt Loai_Dat và Loai_Dat_F** - Loai_Dat xuất tên đầy đủ, Loai_Dat_F xuất code + diện tích với m²
- [x] **Unicode superscript m²** - Tự động chuyển m2 → m² (Unicode U+00B2) trong data và template
- [x] **Land type size component** - Tags + dropdown cho Loai_Dat_F, input ẩn/hiện khi cần
- [x] **Loại bỏ logic MEN riêng** - Chỉ dùng logic subgroup-based, code gọn hơn
**✨ Improvements:**
- [x] Format Loai_Dat_F với code ngắn gọn (440m² ONT) thay vì tên đầy đủ
- [x] Tự động tạo Loai_Dat từ Loai_Dat_F nếu chưa có
- [x] Xử lý nhiều format input: "ONT 440", "440m2 ONT", "440m² Đất bằng..." → chuẩn hóa
- [x] An toàn: Không post-process XML sau render (tránh phá hỏng cấu trúc)
- [x] Logic xóa dòng tập trung: chỉ dùng subgroup-based, không còn logic MEN riêng
### **v4.2** ✅
**🎯 Major Changes:**
- [x] **S_Text tự động** - Field `S` (diện tích) tự động tạo `S_Text` (bằng chữ) tương tự MoneyText
- [x] **Dynamic form không reload** - Thêm/xóa subgroup không làm mất dữ liệu, chỉ DOM manipulation
- [x] **Auto-remove empty lines** - Tự động xóa dòng chứa placeholders trống của subgroup ẩn (visible=false)
- [x] **S field không format** - Xuất số thuần (không dấu phẩy) cho field S trong Word
**✨ Improvements:**
- [x] UI vẫn format S với dấu phẩy (1,234) nhưng xuất Word là số thuần (1234)
- [x] Subgroup visible = true: placeholder rỗng thay bằng "" (không xóa dòng)
- [x] Subgroup visible = false: xóa dòng nếu tất cả placeholders đều rỗng
- [x] Preserve data khi thêm/xóa subgroup - không mất dữ liệu đã nhập
- [x] Tối ưu performance - DOM manipulation thay vì full re-render
### **v4.1** ✅
**🎯 Major Changes:**
- [x] **Rút gọn code session** - Xóa code không dùng (findGroupDataFromAnyFile, menGroups backward compatibility)
- [x] **Config-based subgroup detection** - Tự động nhận diện subgroup từ config.json
- [x] **Cải thiện logic tái sử dụng** - Xử lý thông minh cho NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
- [x] **Xóa determineGroupByFieldName** - Thay bằng logic dựa trên config (suffixToGroupMap)
**✨ Improvements:**
- [x] Session storage logic dựa hoàn toàn vào config.json
- [x] Tự động map field không suffix vào subgroup với suffix = ""
- [x] Code gọn hơn, dễ maintain hơn
### **v4.0** ✅
**🎯 Major Changes:**
- [x] **Clean code architecture** - Giảm 60% code (4,600 → 2,800 dòng)
- [x] **Universal form renderer** - genericFormHandler.js thay thế formHandler.js cũ
**✨ New Features:**
- [x] **Tái sử dụng dữ liệu** - Merge thông minh, auto-detect, preserve data
- [x] **Xóa dòng** - Click [X] để xóa toàn bộ dữ liệu dòng
- [x] **Xóa placeholder** - Click [🗑️] để xóa từng field riêng lẻ
- [x] **Ẩn/hiện subgroup** - Toggle để form gọn gàng
- [x] **Mở thư mục output** - Button mở trực tiếp folder sau khi xuất
- [x] **Smart validation** - Chỉ validate subgroup visible, không validate ẩn
### **v5.0** (Future)
- [ ] Electron-builder setup (đóng gói .exe)
- [ ] Export history (lịch sử văn bản đã tạo)
- [ ] Multiple file export (ZIP)
- [ ] Template preview
- [ ] Auto-update mechanism
---
## 📄 License
**Private** - All rights reserved
---
## 💻 Tech Stack
- **Platform:** Electron 38.2.2
- **Template Engine:** Docxtemplater 3.66.7
- **UI Framework:** Vanilla JS (no framework, lightweight)
- **Date Picker:** Flatpickr 4.6.13 (Vietnamese locale)
- **File Processing:** Node.js fs, path, adm-zip
- **Document Generation:** PizZip 3.2.0, Docxtemplater
- **Expressions:** Angular-expressions 1.5.1
---
## 🔌 Offline Capability
### **✅ 100% Offline - Hoàn toàn có thể sử dụng offline**
**Đã cài đặt dependencies:**
```bash
npm install  # Chạy 1 lần khi setup
npm start    # Chạy offline mãi mãi ✅
```
**Không cần internet vì:**
- ✅ Tất cả libraries load từ `node_modules/` (local)
- ✅ Tất cả data file đều local (`address.json`, `land_types.json`)
- ✅ Không có API calls, không có external requests
- ✅ Template files đều nằm trong project
**Copy sang máy khác:**
```bash
1. Copy toàn bộ folder TheWord
2. npm install (nếu chưa có node_modules)
3. npm start
```
