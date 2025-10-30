# 📄 TheWord - Hệ Thống Tự Động Hóa Văn Bản

> **Tạo văn bản Word chuyên nghiệp trong 1 phút** - Chọn file → Điền form → Xuất ngay
<<<<<<< HEAD

## ✨ Tính Năng Nổi Bật

🚀 **Tự động hóa 100%** - Từ template Word đến văn bản hoàn chỉnh  
📝 **Form thông minh** - Auto-format CCCD, tiền, ngày tháng, địa chỉ  
🔄 **Tái sử dụng dữ liệu VR2** - Merge & tái sử dụng dữ liệu thông minh  
💾 **LocalStorage & SessionStorage** - Lưu người dùng thường xuyên  
🗑️ **Quản lý linh hoạt** - Xóa dòng, xóa placeholder riêng lẻ  
👁️ **Ẩn/hiện nhóm** - Toggle subgroup để form gọn gàng hơn  
✅ **Smart Validation** - Single source of truth từ config.json  
⚡ **Nhanh chóng** - Xuất văn bản trong < 5 giây  
🎨 **UI hiện đại** - Taskbar, dropdown, date picker, address cascading  
📂 **Mở thư mục** - Mở trực tiếp thư mục output sau khi xuất  
🔌 **100% Offline** - Không cần kết nối internet

---

## 🎯 Workflow

```
1️⃣ Chọn folder → 2️⃣ Chọn file Word → 3️⃣ Điền form → 4️⃣ Xuất văn bản ✅
```

### **Chi tiết:**

```
📁 Chọn folder (vd: "HĐ chuyển nhượng")
  └─ 📄 Chọn file (vd: "HĐ chuyển nhượng quyền sử dụng đất.docx")
      └─ 📝 Form tự động render theo placeholders trong file
          └─ ✅ Nhấn "Xuất Word" → Chọn nơi lưu → Hoàn tất!
```

---

## 📖 Quick Start

### **1. Cài Đặt**

**Yêu cầu hệ thống:**
- Windows 10/11
- Node.js 16.x hoặc mới hơn
- 200MB dung lượng trống

**Cài đặt:**
```bash
# Clone repository (hoặc download ZIP)
git clone https://github.com/LuuTung0102/TheWord.git

# Install dependencies
cd TheWord
npm install

# Run app
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

#### **🔄 Tái sử dụng dữ liệu VR2 (Session Storage)**

```
Scenario: Tạo nhiều văn bản cho cùng một người

1. Điền "HĐ chuyển nhượng" cho ông A
2. Xuất văn bản
3. Mở "Giấy ủy quyền"
4. Dropdown "Tái sử dụng" → Chọn "MEN1 - Nguyễn Văn A"
5. Form tự động điền ✅ (merge thông minh với dữ liệu hiện tại)
```

**Tính năng VR2:**
- ✅ **Auto-merge**: Tự động kết hợp dữ liệu cũ với form mới
- ✅ **Smart detect**: Nhận diện và map đúng group (MEN1 → BCN)
- ✅ **Preserve data**: Giữ nguyên dữ liệu đã điền, chỉ fill chỗ trống

#### **💾 Lưu người dùng (Local Storage)**

```
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
```

#### **🗑️ Quản lý dữ liệu linh hoạt**

```
✅ Xóa dòng: Click [X] bên cạnh dòng để xóa toàn bộ dữ liệu dòng đó
✅ Xóa placeholder: Click [🗑️] trên từng field để xóa riêng lẻ
✅ Ẩn/hiện subgroup: Toggle để form gọn gàng, dễ điều hướng
```

#### **📂 Mở thư mục nhanh**

```
Sau khi xuất file Word thành công:
→ Nhấn "Mở thư mục" để mở trực tiếp folder chứa file vừa tạo
→ Tiết kiệm thời gian tìm kiếm file output
```

#### **✅ Smart Validation (Single Source of Truth)**

**🎯 Nguyên tắc: Một nguồn dữ liệu (`config.json`) — dùng cho cả:**
1. **Hiển thị dấu `*` trong UI** (visual indicator)
2. **Kiểm tra hợp lệ trước khi xuất** (validation)

**Vấn đề cũ:**
- Tất cả MEN (MEN1, MEN2, MEN3...) đều bị yêu cầu nhập đầy đủ
- Dù người dùng không bật MEN2, MEN3 trên giao diện
- Gây khó chịu khi chỉ cần 1 người thừa kế
- Dấu `*` hard-coded trong UI, không sync với validation

**Giải pháp mới (v4.0):**

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
          "required": true    // ← Nguồn dữ liệu duy nhất
        },
        { 
          "name": "Note", 
          "label": "Ghi chú", 
          "type": "textarea", 
          "required": false   // ← Không bắt buộc
        }
      ]
    }
  }
}
```

**2️⃣ UI tự động đọc từ config:**
```javascript
// ✅ Đọc từ config.json
const isRequired = fieldDef.required === true;
const requiredClass = isRequired ? ' class="required"' : '';

// Render label
<label class="required"><b>Họ và tên</b></label>  // → "Họ và tên *"
```

**3️⃣ Validator đọc cùng config + check visibility:**
```javascript
// ✅ CHỈ validate subgroup VISIBLE
function validateFormData(formData, fieldMappings, fieldSchemas) {
  for (const mapping of fieldMappings) {
    const schema = fieldSchemas[mapping.schema]; // ← Đọc từ config.json
    
    for (const subgroup of mapping.subgroups) {
      if (!visibleSubgroups.has(subgroup.id)) {
        continue; // ⚠️ Bỏ qua subgroup ẩn
      }
      
      for (const field of schema.fields) {
        if (field.required && !data[field.name]) {  // ← Check required từ config
          errors.push({ ... });
        }
      }
    }
  }
}
```

**Cách hoạt động - 3 Layers Validation:**

**Layer 1: Schema (config.json)**
- ✅ Field có `required: true` trong schema
- ✅ Nếu field không có `required: true` → Skip validation hoàn toàn

**Layer 2: Visibility**
- ✅ Subgroup phải trong `visibleSubgroups` (user đã thêm)
- ✅ Default: Chỉ subgroup có `visible = true` (hoặc subgroup đầu tiên nếu không có explicit visible)
- ✅ Reset `visibleSubgroups` khi load file mới (tránh state cũ)
- ✅ Nếu subgroup hidden → Skip validation toàn bộ subgroup đó

**Layer 3: Template Placeholders**
- ✅ Placeholder phải **TỒN TẠI** trong template Word file
- ✅ Ví dụ: 
  - Schema có `Address` + suffix `2` = `Address2`
  - Nhưng template Word **KHÔNG** khai báo `{Address2}` placeholder
  - → **KHÔNG validate** cho `Address2` ✅
- ✅ Layer này bảo vệ khỏi validate fields không tồn tại

**Result:**
- ✅ **UI**: Label có dấu `*` nếu `required: true`
- ✅ **Validator**: Check `required` ∧ `visible` ∧ `exists in template`
- ✅ Subgroup ẩn → không validate
- ✅ Placeholder không có trong template Word → không validate
- ✅ Field không required → không validate
- ✅ Scroll tự động đến field lỗi đầu tiên
- ✅ Highlight field lỗi với màu đỏ + animation shake

**Validation Flow Diagram:**
```
Field: "Address2" (from Schema "Address" + suffix "2")
│
├─ Layer 1: Schema Check
│  ├─ ❓ field.required === true?
│  │   ├─ ✅ YES → Continue to Layer 2
│  │   └─ ❌ NO → ⏭️ SKIP (không validate)
│
├─ Layer 2: Visibility Check
│  ├─ ❓ visibleSubgroups.has("MEN2")?
│  │   ├─ ✅ YES (user đã thêm) → Continue to Layer 3
│  │   └─ ❌ NO (MEN2 hidden) → ⏭️ SKIP (không validate)
│
├─ Layer 3: Template Check
│  ├─ ❓ template.placeholders có "Address2"?
│  │   ├─ ✅ YES (có trong Word file) → ✅ VALIDATE
│  │   └─ ❌ NO (không có trong Word) → ⏭️ SKIP
│
└─ Result: Validate chỉ khi CẢ 3 layers đều PASS
```

**UX Examples:**

**Example 1: Chỉ có 1 người**
```
Config:
  Schema: Address (required: true)
  Subgroups: [MEN1, MEN2]
  Template: {Address1}, {Address2}

State:
  visibleSubgroups = ["MEN1"]  ← MEN2 chưa được thêm

Validation:
  Address1: ✅ ✅ ✅ → VALIDATE (required + visible + in template)
  Address2: ✅ ❌ ⏭️ → SKIP (required + NOT visible)
  
Result: ✅ Chỉ validate Address1, không yêu cầu Address2
```

**Example 2: Thêm người thứ 2**
```
User click "Thêm người"
→ visibleSubgroups = ["MEN1", "MEN2"]

Validation:
  Address1: ✅ ✅ ✅ → VALIDATE
  Address2: ✅ ✅ ✅ → VALIDATE
  
Result: ✅ Phải điền cả Address1 và Address2
```

**Example 3: Template không có Address2**
```
Config:
  Schema: Address (required: true)
  Subgroups: [MEN1, MEN2]
  Template: {Address1}  ← KHÔNG có Address2

State:
  visibleSubgroups = ["MEN1", "MEN2"]

Validation:
  Address1: ✅ ✅ ✅ → VALIDATE
  Address2: ✅ ✅ ❌ → SKIP (không có trong template)
  
Result: ✅ Chỉ validate Address1, dù MEN2 visible
```

**Config Tips:**
```javascript
// Muốn field không bắt buộc:
{ "name": "Note", "required": false }  // ← Layer 1 SKIP

// Muốn subgroup visible mặc định:
{
  "subgroups": [
    { "id": "MEN1", "visible": true },
    { "id": "MEN2", "visible": true }  // ← Force visible
  ]
}

// Nếu không có "visible", chỉ subgroup đầu tiên visible:
{
  "subgroups": [
    { "id": "MEN1" },  // ← visible (index 0)
    { "id": "MEN2" }   // ← hidden (index 1)
  ]
}
```

---

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
│   │   ├── genericFormHandler.js    # 🆕 Universal form renderer
│   │   ├── templateManager.js       # Template selector
│   │   └── exportHandler.js         # Export logic
│   ├── core/
│   │   ├── formHelpers.js           # Input formatters
│   │   ├── formValidator.js         # 🆕 Smart validation (visibility-based)
│   │   ├── utils.js                 # Utilities
│   │   ├── localStorageLoader.js    # Load saved people
│   │   ├── sessionStorageManager.js # Session data manager
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
- `genericFormHandler.js`: ❤️ Core form rendering (thay thế formHandler.js cũ)
- `formValidator.js`: ✅ Smart validation theo visibility
- `sessionStorageManager.js`: Quản lý tái sử dụng dữ liệu VR2
- `generate.js`: Logic sinh file Word với pre-processing XML

---

## 🎨 Kiến Trúc Hệ Thống

### **1. Single Source of Truth Architecture**

**Flow: `config.json` → UI + Validation**

```
┌─────────────────────────────────────────────────────────────────┐
│  config.json (SINGLE SOURCE OF TRUTH)                           │
├─────────────────────────────────────────────────────────────────┤
│  {                                                               │
│    "fieldSchemas": {                                             │
│      "PersonalInfo": {                                           │
│        "fields": [                                               │
│          { "name": "Name", "required": true },  ← Định nghĩa 1 lần│
│          { "name": "CCCD", "required": true },                   │
│          { "name": "Note", "required": false }                   │
│        ]                                                         │
│      }                                                           │
│    },                                                            │
│    "fieldMappings": [...]                                        │
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
        │                               │  │  }                           │
        │  → "Họ và tên *"              │  │  → Báo lỗi nếu trống        │
        └──────────────────────────────┘  └──────────────────────────────┘

✅ Chỉnh sửa 1 lần trong config.json → UI + Validation tự động sync
```

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
  "fieldMappings": [...]
}
```

### **2. Dynamic Form Rendering**

```
config.json → configLoader.js → genericFormHandler.js → Form UI
```

- **Không cần code mới** cho file Word mới
- Chỉ cần cập nhật `config.json`
- Form tự động render theo config

### **3. Data Flow with Validation**

```
┌─────────────────────────────────────────────────────────────────┐
│  User Input → Form                                               │
└─────────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Tạo văn bản"                                       │
└─────────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────────┐
│  validateForm()                                                  │
│  ├─ Đọc config.json (fieldSchemas + fieldMappings)              │
│  ├─ Check window.visibleSubgroups                               │
│  └─ Validate only visible + required fields                     │
└─────────────────────────────────────────────────────────────────┘
                ↓
        ┌───────┴──────┐
        │              │
    ❌ Errors      ✅ Valid
        │              │
        ▼              ▼
┌─────────────┐  ┌─────────────────────────────────────────────┐
│ Show alert  │  │  collectGenericFormData()                   │
│ Highlight   │  │           ↓                                  │
│ Scroll to   │  │  sessionStorage (tái sử dụng)               │
│ first error │  │           ↓                                  │
│ STOP ⛔     │  │  main.js (IPC)                              │
└─────────────┘  │           ↓                                  │
                 │  logic/generate.js                           │
                 │           ↓                                  │
                 │  Docxtemplater                               │
                 │           ↓                                  │
                 │  Output Word ✅                              │
                 └─────────────────────────────────────────────┘
```

---

## 💡 Ví Dụ Placeholders

### **Thông tin người (MEN)**

| Placeholder | Type | Input | Output |
|------------|------|-------|--------|
| `{Gender1}` | select | Ông/Bà | Ông |
| `{Name1}` | text | nguyễn văn a | NGUYỄN VĂN A |
| `{Date1}` | date | 01/01/2025 | 01/01/2025 |
| `{CCCD1}` | number | 123456789012 | 123.456.789.012 |
| `{Address1}` | address-select | Cascading dropdown | Xã ABC, H. XYZ, T. Đắk Lắk |

### **Thửa đất (LAND)**

| Placeholder | Description | Example |
|------------|-------------|---------|
| `{QSH}` | Quyền sử dụng | AA 150 |
| `{S}` | Diện tích (m²) | 500 |
| `{Loai_Dat}` | Loại đất | ONT → "Đất ở nông thôn" |
| `{Money}` | Giá (VNĐ) | 1000000 → "1,000,000" |
| `{MoneyText}` | Giá (chữ) | → "một triệu đồng chẵn" |

<<<<<<< HEAD
---

=======
>>>>>>> 09418c90d5577af22195beb70a05670cb6741149
## ⚙️ Tạo Template Mới

### **Bước 1: Tạo file Word**

```
1. Tạo file .docx trong folder templates/
2. Chèn placeholders: {PlaceholderName}
3. Format đẹp (font, spacing, alignment)
```

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
          "required": true     // ← UI sẽ hiện *, Validator sẽ check
        },
        {
          "name": "Field2",
          "label": "Ghi chú",
          "type": "textarea",
          "required": false    // ← UI không có *, Validator bỏ qua
        }
      ]
    }
  }
}
```

**Kết quả:**
- UI tự động hiển thị "Label hiển thị *" (có dấu sao đỏ)
- Validator tự động check Field1 trước khi xuất
- Field2 không bắt buộc → không có * → không validate
- **Chỉnh 1 lần** trong config → UI + Validation đồng bộ ✅

### **Bước 3: Khởi động TheWord**

```
npm start → Template sẵn sàng! ✅
```

---

## 🔧 Field Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Text input | Name, Address |
| `number` | Number input | CCCD, Phone |
| `date` | Date picker | Birth date |
| `select` | Dropdown | Gender, Options |
| `address-select` | Cascading address | Province → District → Ward |
| `land_type` | Land type selector | ONT, LUK, TSC |
| `currency` | Money input | 1,000,000 |
| `textarea` | Multi-line text | Notes |

---

## 🐛 Troubleshooting

### **App không khởi động**

```bash
# Clear cache
rm -rf node_modules
npm install
npm start
```

### **Form không hiển thị**

```
✅ F12 → Console → Xem lỗi
✅ Kiểm tra config.json syntax (JSONLint.com)
✅ Restart app (Ctrl+R)
```

### **Export ra Word lỗi**

```
✅ Kiểm tra placeholders trong Word: {Name} (không phải {{Name}})
✅ Kiểm tra file Word không bị corrupt
✅ Xem console logs trong terminal
```

### **Address dropdown không load**

```
✅ Kiểm tra renderer/config/address.json tồn tại
✅ F12 → Network → address.json có load không?
✅ Xem console: window.addressData có data không?
```

### **Validation báo lỗi dù đã điền đủ**

```
✅ Check console: window.visibleSubgroups có chứa subgroup đang điền không?
✅ Kiểm tra field có đúng data-ph attribute không
✅ F12 → Console → Xem validateFormData() output
✅ Reload app (Ctrl+R) để reset visible state
```

### **Validation yêu cầu MEN2, MEN3 dù chưa thêm**

**Nguyên nhân:** 
- Subgroups bị set visible mặc định, HOẶC
- visibleSubgroups không reset khi chuyển file

**Giải pháp:**
```
✅ Reload app (Ctrl+R) → visibleSubgroups được reset
✅ Check console: window.visibleSubgroups chỉ có MEN1
✅ Check config.json: Không có "visible": true cho MEN2
✅ Rule mặc định: CHỈ subgroup đầu tiên visible
✅ MEN1 → visible (mặc định)
✅ MEN2, MEN3... → hidden (phải click "Thêm người")

Nếu muốn tất cả visible ngay từ đầu:
{
  "subgroups": [
    { "id": "MEN1", "visible": true },
    { "id": "MEN2", "visible": true }  // Explicit
  ]
}
```

### **Validation yêu cầu Address2 dù config không có**

**Giải thích:**
```
Config chỉ định nghĩa:
  Schema: { "name": "Address", "required": true }
  Suffixes: ["1", "2"]

Validator tự động tạo:
  Address + suffix "1" = Address1 ✅
  Address + suffix "2" = Address2 ✅

Placeholders trong template Word:
  "BCN": ["Address1", "Address2"]  ← Address2 CÓ trong template!

→ Validator validate Address2 nếu MEN2 visible
→ KHÔNG phải bug, mà là logic đúng!
```

**Giải pháp:**
```
✅ Nếu không muốn Address2: Xóa khỏi template Word file
✅ Nếu không muốn validate MEN2: Đừng click "Thêm người"
✅ MEN2 hidden → Address2 không được validate ✅
```

### **Test Layer 3 - Template Placeholders Check**

**Để verify layer 3 hoạt động:**

**Bước 1: Kiểm tra console khi load file**
```javascript
// Mở F12 → Console, tìm dòng:
✅ Layer 3: Template has X actual placeholders: [...]
// → Xem danh sách placeholders thực tế từ template
```

**Bước 2: Kiểm tra khi export**
```javascript
// Click "Tạo văn bản", xem console:
⏭️ Layer 3 SKIP: Address2 (field "Địa chỉ thường trú") not in template placeholders
// → Field này BỊ SKIP vì không có trong template Word

✅ Layer 3 PASS: Address1 exists in template → will validate
// → Field này SẼ validate vì có trong template
```

**Test Case: Template KHÔNG có Address2**
```
1. Mở config.json:
   "placeholders": {
     "BCN": ["Name1", "Address1", "Name2"]  ← KHÔNG có Address2
   }

2. Set MEN2 visible (click "Thêm người")

3. Click "Tạo văn bản" với Address2 trống

4. Xem console:
   ⏭️ Layer 3 SKIP: Address2 not in template
   
5. Result: ✅ KHÔNG báo lỗi Address2 (layer 3 đã skip!)
```

**Debug Commands:**
```javascript
// Paste vào console để check:
console.log('currentTemplate:', window.currentTemplate);
console.log('placeholders:', window.currentTemplate?.selectedFile?.placeholders);
console.log('visibleSubgroups:', Array.from(window.visibleSubgroups || []));
```

### **Không muốn validate field nào đó**

```
Trong config.json:
{
  "name": "Note",
  "label": "Ghi chú",
  "type": "textarea",
  "required": false  // ← Đặt false để không validate
}
```

---

## 📊 Performance Benchmarks

| Task | Time |
|------|------|
| App startup | ~2s |
| Template scan (5 folders) | ~100ms |
| Form render | ~300ms |
| Export 1 Word | ~2s |
| Load session data | ~50ms |

---

## 🚀 Roadmap & Version History

### **v4.0** ✅ (Current - Oct 29, 2025)

**🎯 Major Changes:**
- [x] **Clean code architecture** - Giảm 60% code (4,600 → 2,800 dòng)
  - Xóa `formHandler.js` (1,661 dòng)
  - Mở rộng `genericFormHandler.js` (+293 dòng) - Universal form renderer
  - Tối ưu `generate.js` (giảm ~459 dòng)
  - Refactor `sessionStorageManager.js` (~213 dòng)
  - ❌ **Loại bỏ** tự động sinh `MENx_Ly` (thay bằng pre-processing XML)

**✨ New Features:**
- [x] **Tái sử dụng dữ liệu VR2** - Merge thông minh, auto-detect, preserve data
- [x] **Xóa dòng** - Click [X] để xóa toàn bộ dữ liệu dòng
- [x] **Xóa placeholder** - Click [🗑️] để xóa từng field riêng lẻ
- [x] **Ẩn/hiện subgroup** - Toggle để form gọn gàng
- [x] **Mở thư mục output** - Button mở trực tiếp folder sau khi xuất
- [x] **Smart validation** - Chỉ validate subgroup visible, không validate ẩn
- [x] **Update land_types** - Cập nhật theo chuẩn mới

**🔧 Improvements:**
- [x] Config-based system - Không cần code mới cho template mới
- [x] Session storage reuse - Tái sử dụng dữ liệu giữa các file
- [x] LocalStorage integration - Lưu người dùng thường xuyên
- [x] Address cascading - 63 tỉnh/thành với dropdown 3 cấp
- [x] Auto-format - CCCD (xxx.xxx.xxx.xxx), Money (1,000,000), Date
- [x] 100% offline capability - Không cần internet

**📊 Performance:**
- Code size: -1,715 dòng (-60%)
- Load time: Không đổi (~2s)
- Export time: Không đổi (~2s)

### **v4.1** (Next - Planning)
- [ ] Electron-builder setup (đóng gói .exe)
- [ ] Export history (lịch sử văn bản đã tạo)
- [ ] Multiple file export (ZIP)
- [ ] Template preview
- [ ] Data validation rules
- [ ] Auto-update mechanism

### **v5.0** (Future)
- [ ] Cloud sync (đồng bộ dữ liệu)
- [ ] Excel import/export
- [ ] Template visual editor


## 📄 License

**Private** - All rights reserved

---

## 💻 Tech Stack

- **Platform:** Electron 38.2.2 (Oct 2025)
- **Template Engine:** Docxtemplater 3.66.7
- **UI Framework:** Vanilla JS (no framework, lightweight)
- **Date Picker:** Flatpickr 4.6.13 (Vietnamese locale)
- **File Processing:** Node.js fs, path, adm-zip
- **Document Generation:** PizZip 3.2.0, Docxtemplater
- **Expressions:** Angular-expressions 1.5.1

---

## 🔌 Offline Capability & Deployment

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
# Cách 1: Copy cả thư mục (cần Node.js trên máy đích)
1. Copy toàn bộ folder TheWord
2. npm install (nếu chưa có node_modules)
3. npm start

# Cách 2: Đóng gói .exe (đang trong roadmap v4.1)
1. npm run build  # (sẽ được thêm)
2. Copy file .exe sang máy khác
3. Chạy trực tiếp, không cần Node.js ✅
```

### **📦 Đóng Gói thành .EXE (Coming in v4.1)**

**Hiện trạng:**
- ❌ Chưa có `electron-builder` configuration
- ❌ Chưa có build scripts

**Sẽ được thêm trong v4.1:**
```json
{
  "scripts": {
    "build": "electron-builder build --win --x64",
    "build:portable": "electron-builder build --win portable"
  }
}
```

**Kết quả sau khi setup:**
- ✅ File `.exe` standalone (~150-200MB)
- ✅ Chạy trên Windows không cần cài Node.js
- ✅ Có thể tạo installer hoặc portable version
- ✅ Hoàn toàn offline

---


---

## 🎉 Acknowledgments

- **Docxtemplater** - Powerful Word template engine
- **Electron** - Cross-platform desktop framework
- **Flatpickr** - Beautiful date picker
- **Vietnamese Address Dataset** - Comprehensive địa chỉ Việt Nam

---

## 📸 Screenshots

### **Main Interface**

```
┌─────────────────────────────────────────────────────────────┐
│  TheWord - Document Automation                              │
├───────────────────────────┬─────────────────────────────────┤
│  📝 Form Input            │  📁 Folders                     │
│                           │                                 │
│  Bên chuyển nhượng       │  📜 HĐ chuyển nhượng           │
│  ┌──────────────────┐    │    └─ HĐ chuyển nhượng....docx│
│  │ Giới tính: Ông ▼│    │                                 │
│  │ Họ tên: [____]  │    │  📄 Giấy ủy quyền              │
│  │ CCCD: [____]    │    │    └─ Giấy ủy quyền.docx      │
│  └──────────────────┘    │                                 │
│                           │  🏛️ HĐ phân chia tài sản      │
│  [Xuất Word]             │                                 │
└───────────────────────────┴─────────────────────────────────┘
```

### **Reuse Data Feature**

```
┌──────────────────────────────────────┐
│  Bên chuyển nhượng (MEN1)           │
│                                      │
│  🔄 Tái sử dụng dữ liệu:            │
│  ┌────────────────────────────────┐ │
│  │ MEN1 - Nguyễn Văn A (HĐ CN)  ▼│ │
│  │ MEN2 - Trần Thị B (HĐ CN)     │ │
│  │ LAND - Xã ABC (HĐ CN)         │ │
│  └────────────────────────────────┘ │
│                                      │
│  → Form tự động điền!               │
└──────────────────────────────────────┘

### [v4.0] - 2025-10-29 - **Major Clean Code Update**


**Files Changed:**
- 17 files changed
- +1,085 insertions
- -2,800 deletions
- **Net: -1,715 dòng (-60%)**

**Key Changes:**
- ❌ Deleted: `renderer/handlers/formHandler.js` (1,661 dòng)
- ✅ Enhanced: `renderer/handlers/genericFormHandler.js` (+293 dòng)
- ⚡ Optimized: `logic/generate.js` (giảm ~459 dòng)
- 🔄 Refactored: `renderer/core/sessionStorageManager.js`
- ❌ Removed: Auto-generate `MENx_Ly` placeholders (replaced with XML pre-processing)

### [v2.20] - 2025-10-27
- Tái sử dụng dữ liệu cơ bản
- LocalStorage integration
- Address cascading

---

**Made with ❤️ for Vietnamese Document Automation**

**System by THANHTUNG | Happy Document Generation! 🚀📄✨**
