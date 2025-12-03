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

  Relation: {
    type: "select",
    options: ["Con", "Vợ", "Chồng"],
    order: 3
  },
  
  Date: {
    type: "date",
    order: 4
  },

  Date_Die:{
    type: "date",
    order: 4
  },

  Sex:{
    type: "select",
    options: ["Nam", "Nữ"],
    order: 5
  },

  Folk:{
    type: "text",
    order: 6
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

  QDLHS: {
    type: "text",
    order: 11
  },

  Ngay_CapHN: {
  type:"date",
  order: 12
  },
  

  Noi_CapHN:{
    type: "textarea",
    order: 13
  },

  Ngay_CapDie: {
  type:"date",
  order: 14
  },

  Noi_CapDie:{
    type: "textarea",
    order: 15
  },

  Address: {
    type: "address-select",
    order: 16
  },

  ///////////////////////////////////////////////////////////////////
  
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
  
  Noi_CapD: {
    type: "text",
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

  Plant: {
    type: "text",
    order: 8
  },

  Mat_do: {
    type: "number",
    order: 8
  },

  SV: {
    type: "editable-select",
    order: 8
  },
  
  Loai_Dat: {
    type: "land-type",
    validation: {
      pattern: "^[A-Z]+(\\+[A-Z]+)*$"
    },
    order: 9
  },

   Loai_Dat_F: {
    order: 9
  },

  Loai_Dat_D: {
    order: 9
  },
  
  VTTD: {
    type: "textarea",
    order: 10
  },

  AddressQS: {
    type: "address-select",
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
  
    Money: {
    type: "currency",
    validation: {
      min: 1000,
      max: 1000000000000000000000000000000000000000
    },
    order: 13
  },

  NG: {
    type: "text",
    order: 14
  },

  AddressD: {
    type: "address-select",
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

  Sum_A: {
    type: "text-or-dots",
    order: 18
  },

  Sum_B: {
    type: "text-or-dots",
    order: 18
  },

  Sum_C: {
    type: "text-or-dots",
    order: 18
  },

  Exp: {
    type: "textarea",
    order: 19
  },
  
  Note: {
    type: "textarea",
    order: 20
  },
};

if (typeof window !== 'undefined') {
  window.BASE_PLACEHOLDERS = BASE_PLACEHOLDERS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BASE_PLACEHOLDERS
  };
}