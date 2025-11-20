# 📄 TheWord - Hệ Thống Tự Động Hóa Văn Bản

## 📋 Mục Lục
- [Giới Thiệu](#giới-thiệu)
- [Tính Năng Nổi Bật](#tính-năng-nổi-bật)
- [Cài Đặt](#cài-đặt)
- [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
- [Tính Năng Chi Tiết](#tính-năng-chi-tiết)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Tech Stack](#tech-stack)

---

## 🎯 Giới Thiệu

**TheWord** là hệ thống tự động hóa văn bản được xây dựng trên nền tảng Electron, giúp tạo văn bản Word từ template một cách nhanh chóng và chính xác. Hệ thống được thiết kế đặc biệt cho các văn bản pháp lý, hành chính với khả năng quản lý dữ liệu thông minh và tái sử dụng thông tin.

### 🎯 Workflow Cơ Bản
```
1️⃣ Chọn folder template → 2️⃣ Chọn file Word → 3️⃣ Điền form → 4️⃣ Xuất văn bản ✅
```

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

#### 🔄 SessionStorage - Tái Sử Dụng Dữ Liệu
- **Lưu dữ liệu tạm thời** giữa các lần xuất văn bản
- **Merge thông minh**: Tự động gộp dữ liệu trùng lặp
- **Dropdown "Tái sử dụng"**: Chọn dữ liệu từ các file trước
- **Phát hiện thay đổi**: Chỉ lưu khi có sự khác biệt
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

### 1. Chọn Folder Template

1. Mở ứng dụng TheWord
2. Ở panel bên phải (màu cam), chọn folder template
3. Hệ thống sẽ tự động load các file Word trong folder

### 2. Điền Form

1. Panel bên trái (màu xanh) hiển thị form nhập liệu
2. Điền thông tin vào các trường
3. Sử dụng các tính năng:
   - **Date picker**: Click vào trường ngày để chọn
   - **Address select**: Chọn Tỉnh → Huyện → Xã → Thôn
   - **Land type**: Nhập hoặc chọn từ dropdown
   - **CCCD**: Tự động format khi nhập

### 3. Quản Lý PERSON

1. Click nút "⚙️ Quản lý" ở header
2. Dialog hiển thị danh sách PERSON
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

### 4. Tái Sử Dụng Dữ Liệu

1. Khi điền form, tìm dropdown "Tái sử dụng dữ liệu"
2. Chọn dữ liệu từ:
   - **PERSON đã lưu** (từ localStorage)
   - **Dữ liệu từ file trước** (từ sessionStorage)
3. Dữ liệu sẽ tự động điền vào form
4. Có thể chỉnh sửa sau khi tái sử dụng

### 5. Xuất Văn Bản

1. Sau khi điền đầy đủ thông tin
2. Click nút "📤 XUẤT WORD" ở cuối panel phải
3. Chọn thư mục lưu file
4. Đợi hệ thống xử lý (< 5 giây)
5. Dialog thành công hiển thị
6. Click "Mở thư mục" để xem file

---

## 🔍 Tính Năng Chi Tiết

### 1. Hệ Thống Template

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

### 5. Session Storage Logic

#### Lưu Dữ Liệu
```javascript
// Tự động lưu khi xuất văn bản
sessionStorageManager.saveFormData(fileName, formData, reusedGroups, reusedGroupSources, config);
```

#### Merge Logic
1. **NO_CHANGE**: Dữ liệu giống hệt → Không lưu duplicate
2. **ONLY_ADDITIONS**: Chỉ thêm field mới → Merge vào file cũ
3. **HAS_MODIFICATIONS**: Có thay đổi → Lưu riêng

#### Tái Sử Dụng
```javascript
// Lấy danh sách dữ liệu có thể tái sử dụng
const available = sessionStorageManager.getAvailableMenGroups();

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
│   │   ├── local_storage.json  # PERSON data
│   │   ├── land_types.json  # Danh sách loại đất
│   │   └── address.json     # Dữ liệu địa chỉ VN
│   ├── core/
│   │   ├── utils.js         # Utility functions
│   │   ├── personDataService.js  # CRUD PERSON
│   │   ├── sessionStorageManager.js  # Session storage
│   │   ├── formValidator.js  # Validation logic
│   │   └── formHelpers.js   # Form helper functions
│   ├── handlers/
│   │   ├── genericFormHandler.js  # Form rendering
│   │   ├── templateManager.js     # Template management
│   │   ├── exportHandler.js       # Export logic
│   │   ├── personManager.js       # PERSON UI
│   │   └── fileManager.js         # File operations
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
└── package.json             # Dependencies
```

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

### v5.0 (Current)
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


**Made with ❤️ by LuuTung0102**
