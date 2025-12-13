# ⚡ Quick Start - Build TheWord Desktop App

## 🎯 Mục Tiêu

Build ứng dụng TheWord thành file .exe để cài đặt trên Windows với:
- ✅ Thư mục `templates\` có sẵn và có thể chỉnh sửa
- ✅ Tất cả tính năng hoạt động như development
- ✅ Installer NSIS với options

## 🚀 3 Bước Đơn Giản

### Bước 1: Cài Đặt electron-builder

```bash
npm install --save-dev electron-builder
```

### Bước 2: Build App

```bash
npm run build:win
```

Đợi 2-5 phút...

### Bước 3: Kiểm Tra Kết Quả

```
dist/
├── TheWord Setup 5.3.2.exe    ← File installer này
└── win-unpacked/              ← Hoặc portable version này
    └── TheWord.exe
```

## 🎉 Xong!

**Installer**: `dist/TheWord Setup 5.3.2.exe`
- Double-click để cài đặt
- Chọn thư mục cài đặt (mặc định: `C:\Program Files\TheWord\`)
- Tạo desktop shortcut
- Chạy app

**Portable**: `dist/win-unpacked/TheWord.exe`
- Chạy trực tiếp không cần cài đặt
- Copy folder đi đâu cũng được

## 📁 Cấu Trúc Sau Khi Cài Đặt

```
C:\Program Files\TheWord\
├── TheWord.exe
├── resources\                 ← Resources (read-only)
│   ├── templates\            ← Template mẫu
│   └── renderer\config\      ← Config mẫu
├── templates\                 ← Tự động tạo khi chạy lần đầu (writable)
│   ├── Biến động đất đai\   ← Copy từ resources
│   │   ├── config.json
│   │   └── *.docx
│   ├── Giấy Ủy Quyền\
│   ├── Hôn nhân\
│   ├── HĐ chuyển nhượng\
│   ├── HĐ phân chia tài sản\
│   └── Thuế\
└── renderer\config\          ← Tự động tạo khi chạy lần đầu (writable)
    ├── config.json
    ├── local_storage.json    ← PERSON data
    ├── address.json
    └── land_types.json
```

**Cách hoạt động:**
1. Khi cài đặt: Templates và config được đóng gói vào `resources/`
2. Khi chạy lần đầu: App tự động copy từ `resources/` ra ngoài
3. User có thể chỉnh sửa files trong `templates/` và `renderer/config/`
4. Files trong `resources/` giữ nguyên làm backup

## ✅ Tính Năng Hoạt Động

- ✅ Chọn folder template
- ✅ Chọn file Word
- ✅ Điền form với validation
- ✅ Quản lý PERSON
- ✅ Tái sử dụng dữ liệu
- ✅ Xuất Word document
- ✅ Thêm/xóa file Word trong templates
- ✅ Config Wizard tự động

## 🔧 Tùy Chỉnh (Optional)

### Thay Icon

1. Tạo file `icon.ico` (256x256px)
2. Build lại: `npm run build:win`

### Thay Tên App

Sửa `package.json`:
```json
{
  "name": "TênMới",
  "productName": "Tên Mới"
}
```

## 📦 Distribution

### Chia Sẻ Installer

Upload `TheWord Setup 5.3.2.exe` lên:
- Google Drive
- Dropbox
- GitHub Releases
- Website

User download và cài đặt như app bình thường.

### Chia Sẻ Portable

1. Zip thư mục `dist/win-unpacked/`
2. Đổi tên: `TheWord-Portable-v5.3.2.zip`
3. User giải nén và chạy `TheWord.exe`

## 🎯 Kết Quả

User sẽ có:
- ✅ App desktop TheWord
- ✅ Thư mục templates với file Word mẫu
- ✅ Có thể thêm/xóa/sửa templates tự do
- ✅ Lưu PERSON data local
- ✅ 100% offline, không cần internet

**That's it! 🚀**

---

## 📚 Tài Liệu Chi Tiết

Xem [BUILD_GUIDE.md](BUILD_GUIDE.md) để biết thêm chi tiết về:
- Cấu hình build
- Troubleshooting
- Advanced options
- Multi-platform build

