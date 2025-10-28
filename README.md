# 📄 TheWord - Document Automation System---

## ✨ Tính Năng Nổi Bật

🚀 **Tự động hóa 100%** - Chọn folder → Điền form → Xuất văn bản (1 phút)  
📁 **Quản lý theo Folder** - Xuất cả bộ hồ sơ cùng lúc (4-5 file Word)  
✨ **Autofill Thông Minh** - Auto-format CCCD, Phone, Name, Date, Address  
🗑️ **Tự động Xóa Dòng Trống** - Văn bản sạch đẹp, không cần chỉnh sửa  
🎨 **UI Thân Thiện** - Form tự động, validation, calendar picker  
⚡ **Nhanh** - Export 4 files trong 3-5 giây

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

### **2. Sử Dụng**
```
1. Chọn folder template (VD: "HĐ chuyển nhượng sử dụng đất")
2. Điền thông tin vào form (auto-format, validation)
3. Nhấn "Xuất văn bản"
4. Tất cả file Word được tạo → Tự động tải về ZIP
```

### **3. Tạo Template Mới**
```
1. Tạo file .docx
2. Chèn placeholders: {PlaceholderName}
   VD: {Gender1}, {Name1}, {Date1}, {CCCD1}
3. Lưu vào: templates/[Folder Name]/[File Name].docx
4. Khởi động TheWord → Template sẵn sàng!
```

---

## 📚 Documentation

📖 **[HƯỚNG DẪN SỬ DỤNG.md](./HƯỚNG%20DẪN%20SỬ%20DỤNG.md)** - Hướng dẫn chi tiết cho người dùng  
🏗️ **[MÔ TẢ HỆ THỐNG.md](./MÔ%20TẢ%20HỆ%20THỐNG.md)** - Kiến trúc và cách hoạt động kỹ thuật  
📜 **[CODE-CLEANUP-HISTORY.md](./CODE-CLEANUP-HISTORY.md)** - Lịch sử refactoring

---

## 🔧 Công Nghệ

- **Platform:** Electron 28
- **Document Engine:** Docxtemplater 3.x
- **UI:** HTML/CSS/JavaScript, Flatpickr
- **File Processing:** Node.js fs, archiver

---

## 📂 Cấu Trúc Dự Án

```
TheWord/
├── main.js                  # Electron main process
├── renderer/                # Frontend
│   ├── config/             # Placeholders config
│   ├── handlers/           # Form & export logic
│   └── core/               # Utilities
├── logic/                  # Document generation
├── templates/              # Word templates
│   ├── HĐ chuyển nhượng sử dụng đất/
│   └── HĐ phân chia tài sản/
└── package.json
```

---

## 🎯 Các Loại Văn Bản

### **1. HĐ Chuyển Nhượng Sử Dụng Đất**
- Hợp đồng chuyển nhượng
- Giấy ủy quyền
- Đơn biến động đất đai
- Tờ khai thuế

### **2. HĐ Phân Chia Tài Sản Thừa Kế**
- Hợp đồng phân chia tài sản
- Thông tin người mất, cha/mẹ
- Người thừa kế (1-7 người)

---

## 💡 Ví Dụ Placeholders

### **Thông tin cơ bản:**
```
{Gender1}      → Dropdown: Ông/Bà
{Name1}        → Text input (auto-capitalize)
{Date1}        → Calendar picker → 01/01/2025
{CCCD1}        → Number input → 123.456.789.012 (auto-format)
{Address1}     → Cascading dropdown → Thôn, Xã, Huyện, Tỉnh
```

### **Tự động sinh (MENx_Ly):**
```
{MEN3_L1}      → "Ông Nguyễn Văn C sinh ngày: 01/01/1990"
{MEN3_L2}      → "CCCD số: 123.456.789.012, do CA Đắk Lắk cấp, ngày 01/01/2020"
```

### **Thửa đất:**
```
{QSH}          → Quyền sử dụng
{Thua_dat_so}  → Số thửa
{S}            → Diện tích
{Loai_Dat}     → ONT+LUK → "Đất ở nông thôn và Đất trồng cây lâu năm"
{Money}        → 1000000 → "1,000,000" + "(Bằng chữ: một triệu đồng chẵn)"
```

---

## ⚙️ Cấu Hình

### **Thêm Placeholder Mới**

**File:** `renderer/config/constants.js` (hoặc `constants-inheritance.js`)

```javascript
phMapping = {
  NewField: {
    label: "Label hiển thị",
    type: "text",          // text, select, date, number, address
    group: "BCN",          // BCN, NCN, LAND, BD, UQ
    subgroup: "MEN1"       // MEN1-7, INFO, etc.
  }
}
```

### **Thêm Loại Đất Mới**

**File:** `renderer/config/constants.js`

```javascript
const landTypeMap = {
  "ONT": "Đất ở nông thôn",
  "NEW": "Loại đất mới",  // ← Thêm ở đây
}
```

---

## 🐛 Troubleshooting

### **Vấn đề: Export ra Word trống**
```
✅ Kiểm tra: Đã điền đầy đủ form chưa?
✅ Kiểm tra: Placeholders trong Word đúng format {Name} chưa?
✅ Thử: Restart app (Close → Open lại)
```

### **Vấn đề: Autofill không hoạt động**
```
✅ Hard reload: Ctrl+Shift+R
✅ Clear cache: Close app → Delete cache folder → Restart
✅ Check: DevTools (F12) → Console tab có lỗi không?
```

### **Vấn đề: Date picker không hiện**
```
✅ Kiểm tra: Flatpickr đã load chưa? (F12 Console)
✅ Thử: Restart app
✅ Kiểm tra: File formHelpers.js có bị lỗi không?
```

---

## 📊 Performance

- **Template Scan:** ~50ms per folder
- **Form Render:** ~200ms
- **Export 4 files:** 3-5 seconds
- **ZIP Creation:** ~500ms

---

## 🚀 Roadmap

### **v2.1 (Planned)**
- [ ] Template visual editor
- [ ] Data import from Excel/CSV
- [ ] Export history
- [ ] Cloud sync

### **v2.2 (Future)**
- [ ] More document types
- [ ] Multi-language support
- [ ] Advanced validation
- [ ] Unit tests

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Commit changes
4. Push and create a Pull Request

---

## 📄 License

Private - All rights reserved

---

## 📞 Support

**Issues:** [GitHub Issues](https://github.com/yourusername/theword/issues)  
**Documentation:** See `HƯỚNG DẪN SỬ DỤNG.md`  
**Technical:** See `MÔ TẢ HỆ THỐNG.md`

---

## 🎉 Acknowledgments

- **Docxtemplater** - Amazing Word template engine
- **Electron** - Cross-platform desktop framework
- **Flatpickr** - Beautiful date picker
- **Vietnamese Address Data** - Comprehensive địa chỉ Việt Nam

---

**Made with ❤️ for Document Automation**

---

## 📸 Screenshots

### **1. Template Selection**
```
┌─────────────────────────────────────┐
│  📁 HĐ chuyển nhượng sử dụng đất   │
│     4 files                         │
│                                     │
│  📁 HĐ phân chia tài sản           │
│     1 file                          │
└─────────────────────────────────────┘
```

### **2. Form Input**
```
┌─────────────────────────────────────┐
│  BCN | NCN | LAND | BD | UQ        │ ← Taskbar
├─────────────────────────────────────┤
│  Bên chuyển nhượng (MEN1)          │
│  ┌─────────┬─────────┬─────────┐   │
│  │ Giới tính│ Họ tên  │ Ngày sinh│  │
│  │  [Ông]  │[______]│[📅____] │   │
│  └─────────┴─────────┴─────────┘   │
└─────────────────────────────────────┘

**Happy Document Automation! 🚀**

