# 📄 TheWord - Hệ Thống Tự Động Hóa Văn Bản

> **Tạo văn bản Word chuyên nghiệp trong 1 phút** - Chọn file → Điền form → Xuất ngay

---

## ✨ Tính Năng Nổi Bật

🚀 **Tự động hóa 100%** - Từ template Word đến văn bản hoàn chỉnh  
📝 **Form thông minh** - Auto-format CCCD, tiền, ngày tháng, địa chỉ  
🔄 **Tái sử dụng dữ liệu** - Lưu thông tin, dùng lại cho văn bản khác  
💾 **LocalStorage & SessionStorage** - Lưu người dùng thường xuyên  
🗑️ **Tự động dọn dẹp** - Xóa dòng trống, format đẹp  
⚡ **Nhanh chóng** - Xuất văn bản trong < 5 giây  
🎨 **UI hiện đại** - Taskbar, dropdown, date picker, address cascading

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

```bash
# Clone repository
git clone https://github.com/yourusername/theword.git

# Install dependencies
cd theword
npm install

# Run app
npm start
```

### **2. Sử Dụng Cơ Bản**

1. **Chọn folder** (panel bên phải)
2. **Chọn file Word** trong folder
3. **Điền thông tin** vào form (bên trái)
4. **Nhấn "Xuất Word"** → Chọn thư mục lưu
5. **Mở file Word** → Văn bản hoàn chỉnh! ✅

### **3. Tính Năng Nâng Cao**

#### **🔄 Tái sử dụng dữ liệu (Session Storage)**

```
Scenario: Tạo nhiều văn bản cho cùng một người

1. Điền "HĐ chuyển nhượng" cho ông A
2. Xuất văn bản
3. Mở "Giấy ủy quyền"
4. Dropdown "Tái sử dụng" → Chọn "MEN1 - Nguyễn Văn A"
5. Form tự động điền ✅
```

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

---

## 📂 Cấu Trúc Dự Án

```
TheWord/
├── main.js                       # Electron main process
├── index.html                    # App entry point
├── style.css                     # Global styles
├── renderer/
│   ├── config/
│   │   ├── config.json          # Main config (folders)
│   │   ├── baseConstants.js     # Default field types
│   │   ├── configLoader.js      # Config parser
│   │   ├── address.json         # VN address data
│   │   ├── land_types.json      # Land type definitions
│   │   └── local_storage.json   # Saved people
│   ├── handlers/
│   │   ├── genericFormHandler.js    # Form renderer
│   │   ├── formHandler.js           # Legacy handler
│   │   └── exportHandler.js         # Export logic
│   ├── core/
│   │   ├── formHelpers.js           # Input formatters
│   │   ├── utils.js                 # Utilities
│   │   ├── localStorageLoader.js    # Load saved people
│   │   └── sessionStorageManager.js # Session data manager
│   └── mainApp.js               # App controller
├── logic/
│   └── generate.js              # Docx generation
└── templates/
    ├── HĐ chuyển nhượng/
    │   ├── config.json          # Template config
    │   └── *.docx               # Word templates
    ├── Giấy Ủy Quyền/
    └── HĐ phân chia tài sản/
```

---

## 🎨 Kiến Trúc Hệ Thống

### **1. Config-based System**

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

### **3. Data Flow**

```
User Input → Form → collectGenericFormData()
                ↓
        sessionStorage (tái sử dụng)
                ↓
         main.js (IPC)
                ↓
        logic/generate.js
                ↓
         Docxtemplater
                ↓
         Output Word ✅
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

### **Tự động sinh (MENx_Ly)**

```
{MEN1_L1} → "Ông NGUYỄN VĂN A sinh ngày: 01/01/1990"
{MEN1_L2} → "CCCD số: 123.456.789.012, do CA T. Đắk Lắk cấp, ngày 01/01/2020"
{MEN1_L3} → "Địa chỉ thường trú tại: Xã ABC, H. XYZ, T. Đắk Lắk"
```

---

## ⚙️ Tạo Template Mới

### **Bước 1: Tạo file Word**

```
1. Tạo file .docx trong folder templates/
2. Chèn placeholders: {PlaceholderName}
3. Format đẹp (font, spacing, alignment)
```

### **Bước 2: Cập nhật config.json**

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
          "type": "text"
        }
      ]
    }
  }
}
```

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

## 🚀 Roadmap

### **v2.0** ✅ (Current)
- [x] Config-based system
- [x] Session storage reuse
- [x] LocalStorage integration
- [x] Address cascading
- [x] Auto-format (CCCD, Money, Date)

### **v2.1** (Next)
- [ ] Export history
- [ ] Multiple file export (ZIP)
- [ ] Template preview
- [ ] Data validation rules

### **v3.0** (Future)
- [ ] Cloud sync
- [ ] Excel import/export
- [ ] Template visual editor
- [ ] Multi-language support

---

## 🤝 Contributing

Contributions welcome!

1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

**Private** - All rights reserved

---

## 💻 Tech Stack

- **Platform:** Electron 28.x
- **Template Engine:** Docxtemplater 3.x
- **UI Framework:** Vanilla JS (no framework)
- **Date Picker:** Flatpickr
- **File Processing:** Node.js fs, path
- **Document Generation:** PizZip, Docxtemplater

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/theword/issues)
- **Email:** support@theword.app
- **Docs:** See `/docs` folder

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
```

---

**Made with ❤️ for Vietnamese Document Automation**

**Happy Document Generation! 🚀📄✨**
