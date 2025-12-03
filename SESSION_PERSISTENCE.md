# Tính năng lưu trữ Session

## Mô tả
Hệ thống tự động lưu dữ liệu session vào localStorage khi đóng ứng dụng và khôi phục khi mở lại.

## Cách hoạt động

### 1. Khi đóng ứng dụng
- Sự kiện `beforeunload` được kích hoạt
- Dữ liệu từ `sessionStorage` được tự động lưu vào `localStorage`
- Key sử dụng: `theword_session_data`

### 2. Khi mở lại ứng dụng
- Hệ thống kiểm tra xem có dữ liệu trong `localStorage` không
- Nếu có, hiển thị modal hỏi người dùng:
  - **Khôi phục**: Giữ nguyên dữ liệu đã khôi phục vào sessionStorage
  - **Làm mới**: Xóa toàn bộ dữ liệu session và localStorage

### 3. API mới trong sessionStorageManager

```javascript
// Lưu sessionStorage vào localStorage
window.sessionStorageManager.saveToLocalStorage()

// Khôi phục từ localStorage vào sessionStorage
window.sessionStorageManager.restoreFromLocalStorage()

// Xóa dữ liệu trong localStorage
window.sessionStorageManager.clearLocalStorage()
```

## Lợi ích
- Người dùng không mất dữ liệu khi tắt ứng dụng nhầm
- Có thể tiếp tục công việc từ lần trước
- Linh hoạt cho phép người dùng chọn làm mới nếu muốn bắt đầu lại
