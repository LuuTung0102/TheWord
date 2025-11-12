const BASE_PLACEHOLDERS = {
  Gender: {
    type: "select",
    options: ["Ông", "Bà"],
    order: 1
  },
  
  Name: {
    type: "text",
    order: 2
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
    
  MST: {
    type: "number",
    maxLength: 13,
    order: 8
  },
  
  SDT: {
    type: "tel",
    maxLength: 10,
    order: 9
  },
  
  Email: {
    type: "email",
    order: 10
  },
  
  Address: {
    type: "address-select",
    order: 11
  },

  ///////////////////////////////////////////////////////////////////

  Relation: {
    type: "select",
    options: ["Con", "Vợ", "Chồng"],
    order: 3
  },
  
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

  Noi_CapD: {
    type: "text",
    order: 3
  },

  Ngay_CapD: {
    type: "date",
    order: 4
  },

  TDCSPL: {
    type: "date",
    order: 5
  },
  
  Thua_dat_so: {
    type: "text",
    order: 6
  },
  
  Ban_do_so: {
    type: "text",
    order: 7
  },
  
  S: {
    type: "number",
    validation: {
      min: 1,
      max: 1000000000000000000000,
      decimalPlaces: 2
    },
    order: 8
  },    
  
  Loai_Dat: {
    type: "land-type",
    validation: {
      pattern: "^[A-Z]+(\\+[A-Z]+)*$"
    },
    order: 9
  },
  
  VTTD: {
    type: "textarea",
    order: 10
  },
  
 
  HTSD: {
    type: "select",
    options: ["Sử dụng chung", "Sử dụng riêng"],
    order: 11
  },
  
  Responsibility: {
    type: "select",
    options: ["A", "B"],
    order: 12
  },
  
  AddressD: {
    type: "address-select",
    order: 13
  },
  
  Money: {
    type: "currency",
    validation: {
      min: 1000,
      max: 1000000000000000000000000000000000000000
    },
    order: 14
  },

  NG: {
    type: "text",
    order: 15
  },

  THSD: {
    type: "textarea",
    order: 16
  },
   
  TTGLVD: {
    type: "textarea",
    order: 17
  },
  
  Note: {
    type: "textarea",
    order: 18
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