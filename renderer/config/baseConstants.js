const BASE_PLACEHOLDERS = {
  Gender: {
    type: "select",
    options: ["Ông", "Bà"],
    order: 1
  },
  
  Name: {
    type: "text",
    order: 3
  },
  
  Date: {
    type: "date",
    order: 4
  },
  
  CCCD: {
    type: "number",
    maxLength: 12,
    order: 5
  },
  
  Noi_Cap: {
    type: "select",
    options: ["Cục Cảnh sát QLHC về TTXH cấp", "Công an T. Đắk Lắk cấp"],
    order: 6
  },
  
  Ngay_Cap: {
    type: "date",
    order: 7
  },
  
  // Địa chỉ - Base cho tất cả các trường địa chỉ
  Address: {
    type: "address-select",
    order: 8
  },
  
  // Thông tin bổ sung (thường ẩn)
  MST: {
    type: "number",
    maxLength: 13,
    order: 9
  },
  
  SDT: {
    type: "tel",
    maxLength: 10,
    hidden: true,
    order: 10
  },
  
  EMAIL: {
    type: "email",
    hidden: true,
    order: 11
  },
  
  // Quan hệ (dùng cho phân chia tài sản)
  Relation: {
    type: "select",
    options: ["Con", "Vợ", "Chồng"],
    order: 2
  },
  
  // ===== THỬA ĐẤT =====
  QSH: {
    type: "text",
    order: 1
  },
  
  So_so: {
    type: "text",
    validation: {
      pattern: "^[A-Z0-9/-]+$"
    },
    order: 2
  },
  
  Ngay_CapD: {
    type: "date",
    order: 3
  },
  
  Thua_dat_so: {
    type: "text",
    order: 4
  },
  
  Ban_do_so: {
    type: "text",
    order: 5
  },
  
  S: {
    type: "number",
    validation: {
      min: 1,
      max: 1000000000000000000000,
      decimalPlaces: 2
    },
    order: 6
  },
  
  Loai_Dat: {
    type: "land-type",
    validation: {
      pattern: "^[A-Z]+(\\+[A-Z]+)*$"
    },
    order: 7
  },
  
  VTTD: {
    type: "textarea",
    order: 8
  },
  
 
  HTSD: {
    type: "select",
    options: ["Sử dụng chung", "Sử dụng riêng"],
    order: 9
  },
  
  Responsibility: {
    type: "select",
    options: ["A", "B"],
    order: 10
  },
  
  AddressD: {
    type: "address-select",
    order: 11
  },
  
  Money: {
    type: "currency",
    validation: {
      min: 1000,
      max: 1000000000000000000000000000000000000000
    },
    order: 12
  },

  THSD: {
    type: "textarea",
    order: 13
  },
   
  TTGLVD: {
    type: "textarea",
    order: 14
  },
  
  Note: {
    type: "textarea",
    order: 15
  },
};

// Export
if (typeof window !== 'undefined') {
  window.BASE_PLACEHOLDERS = BASE_PLACEHOLDERS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BASE_PLACEHOLDERS
  };
}