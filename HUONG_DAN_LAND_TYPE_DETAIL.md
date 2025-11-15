# Hướng dẫn sử dụng Land Type Detail

## 1. Thêm vào config.json

Trong phần `fieldSchemas` > `LandInfo` > `fields`, thêm:

```json
{
  "name": "Loai_Dat_D",
  "label": "Thông tin đất chi tiết",
  "type": "land_type_detail",
  "required": false
}
```

## 2. Sử dụng trong Word

Trong file Word template, thêm placeholder:

```
{{Loai_Dat_D}}
```

## 3. Cách nhập liệu

Giao diện nhập liệu giống như `Loai_Dat_F` (land_type_size):

1. **Chọn loại đất**: Nhập hoặc chọn từ dropdown (CLN, NST, BCS, v.v.)
2. **Nhập vị trí**: Sau khi chọn loại đất, các trường vị trí và diện tích sẽ hiện ra
3. **Nhập diện tích**: Nhập số (có thể có dấu thập phân, ví dụ: 1236.5)
4. **Nhấn nút +**: Để thêm entry vào danh sách
5. **Chỉnh sửa**: Click vào tag để chỉnh sửa
6. **Xóa**: Click nút × trên tag để xóa

## 4. Format output

Khi người dùng nhập:
- Entry 1: Loại đất = CLN, Vị trí = Vị trí 2, Diện tích = 1236.5
- Entry 2: Loại đất = NST, Vị trí = Vị trí 1, Diện tích = 431.1

Output trong Word sẽ là:
```
+ Loại đất 1: CLN:   Vị trí 2                     Diện tích: 1236.5m².
+ Loại đất 2: NST:   Vị trí 1                     Diện tích: 431.1m².
```

## 5. Format lưu trữ

Dữ liệu được lưu trong format:
```
CODE|LOCATION|AREA;CODE|LOCATION|AREA
```

Ví dụ:
```
CLN|Vị trí 2|1236.5;NST|Vị trí 1|431.1
```

## 6. Ví dụ hoàn chỉnh

### config.json
```json
{
  "fieldSchemas": {
    "LandInfo": {
      "description": "Thông tin đất đai",
      "applicableTo": ["LAND"],
      "fields": [
        {
          "name": "Loai_Dat_D",
          "label": "Thông tin đất chi tiết",
          "type": "land_type_detail",
          "required": true
        }
      ]
    }
  }
}
```

### Word template
```
Thông tin các thửa đất:
{{Loai_Dat_D}}
```

## 7. Lưu ý

- Trường này đã được implement trong folder **Thuế** (templates/Thuế/config.json)
- Giao diện tương tự `Loai_Dat_F` nhưng có thêm trường vị trí
- Có thể để trống vị trí hoặc diện tích nếu không cần
- Output tự động format với khoảng trắng căn chỉnh đẹp
