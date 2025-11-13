# 📄 TheWord - Hệ Thống Tự Động Hóa Văn Bản

## ✨ Tính Năng Nổi Bật

🚀 **Tự động hóa 100%** - Từ template Word đến văn bản hoàn chỉnh  
📝 **Form thông minh** - Auto-format CCCD, tiền, ngày tháng, địa chỉ, diện tích  
🔄 **Tái sử dụng dữ liệu** - Merge & tái sử dụng dữ liệu thông minh giữa các template  
💾 **Quản lý PERSON** - Lưu trữ và quản lý dữ liệu người dùng với labels tiếng Việt  
👥 **LocalStorage & SessionStorage** - Lưu người dùng thường xuyên và session data  
🗑️ **Quản lý linh hoạt** - Xóa dòng, xóa placeholder riêng lẻ, thêm/xóa subgroup động  
👁️ **Ẩn/hiện nhóm** - Toggle subgroup để form gọn gàng, không mất dữ liệu  
✅ **Smart Validation** - Single source of truth từ config.json  
📊 **Tự động chuyển đổi** - Money → MoneyText, S → S_Text, Name → NameT  
🧹 **Tự động dọn dẹp** - Xóa dòng trống và dấu phẩy thừa  
🏷️ **Loại đất thông minh** - Loai_Dat và Loai_Dat_F với m² tự động  
⚡ **Nhanh chóng** - Xuất văn bản trong < 5 giây  
🎨 **UI hiện đại** - Giao diện 2 màu phân biệt rõ ràng  
📂 **Mở thư mục** - Mở trực tiếp thư mục output sau khi xuất  
🔌 **100% Offline** - Không cần kết nối internet

## 🎯 Workflow

1️⃣ Chọn folder → 2️⃣ Chọn file Word → 3️⃣ Điền form → 4️⃣ Xuất văn bản ✅

## 📖 Quick Start

### **1. Cài Đặt**

```bash
git clone https://github.com/LuuTung0102/TheWord.git
cd TheWord
npm install
npm start
```

### **2. Sử Dụng Cơ Bản**

1. **Chọn folder** (panel bên phải - màu cam)
2. **Chọn file Word** trong folder
3. **Điền thông tin** vào form (panel bên trái - màu xanh)
4. **Nhấn "Xuất Word"** → Chọn thư mục lưu
5. **Mở file Word** → Văn bản hoàn chỉnh! ✅

## 👥 Quản lý dữ liệu PERSON (v5.0)

### **Tính năng:**
- ⚙️ **Nút "Quản lý PERSON"** ở header - mở từ bất cứ đâu
- 📝 **Thêm/Sửa/Xóa** người dùng với giao diện trực quan
- 🏷️ **Labels tiếng Việt** - "Họ và tên", "Số CMND/CCCD"...
- 💾 **Lưu trong local_storage.json** - Bao gồm cả label_config
- 🔄 **Auto-refresh** - Person buttons tự động cập nhật
- ✅ **Validation** - Kiểm tra đầy đủ các trường bắt buộc

### **Cách sử dụng:**
1. Click nút "⚙️ Quản lý PERSON" ở header
2. Dialog hiển thị danh sách PERSON hiện có
3. **Thêm mới**: Click "➕ Thêm PERSON mới" → Điền form → Lưu
4. **Sửa**: Click "✏️ Sửa" → Chỉnh sửa giá trị → Lưu
5. **Xóa**: Click "🗑️ Xóa" → Xác nhận → Xóa

## 🎨 UI Design

**Giao diện 2 màu phân biệt rõ ràng:**
- **Panel trái (Nhập dữ liệu)**: Màu xanh + viền xanh
- **Panel phải (Chọn folder)**: Màu cam + viền cam

## � Versiorn History

### **v5.0** ✅ (Current)

**🎯 Major Changes:**
- [x] **Person Data Management System** - Quản lý PERSON với UI trực quan
- [x] **PersonDataService** - Service CRUD cho PERSON data
- [x] **PersonManager UI** - Modal dialog thêm/sửa/xóa PERSON
- [x] **Label Management** - Labels tiếng Việt lưu trong local_storage.json
- [x] **Auto-refresh** - Person buttons tự động cập nhật sau thay đổi
- [x] **Cache Management** - Clear cache tự động khi save data
- [x] **Global Access** - Nút "⚙️ Quản lý PERSON" ở header
- [x] **2-Color UI** - Panel trái xanh, panel phải cam

## 💻 Tech Stack

- **Platform:** Electron 38.2.2
- **Template Engine:** Docxtemplater 3.66.7
- **UI Framework:** Vanilla JS
- **Date Picker:** Flatpickr 4.6.13

## 🔌 Offline Capability

✅ **100% Offline** - Chạy hoàn toàn offline sau khi `npm install`

---

**Made with ❤️ by LuuTung0102**
