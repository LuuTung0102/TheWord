(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BD_FIELD_MAPPINGS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Centralized mapping between MEN1/MEN7 fields and BD fields
  return {
    MEN1: {
      BD_Gender: 'Gender1',
      BD_Name: 'Name1',
      BD_CCCD: 'CCCD1',
      BD_Date: 'Date1',
      BD_Noi_Cap: 'Noi_Cap1',
      BD_Ngay_Cap: 'Ngay_Cap1',
      BD_SDT: 'SDT_MEN1',
      BD_Address: 'Address1',
      BD_Email: 'EMAIL_MEN1',
    },
    MEN7: {
      BD_Gender: 'Gender7',
      BD_Name: 'Name7',
      BD_CCCD: 'CCCD7',
      BD_Date: 'Date7',
      BD_Noi_Cap: 'Noi_Cap7',
      BD_Ngay_Cap: 'Ngay_Cap7',
      BD_Address: 'Address2',
      BD_SDT: 'SDT_MEN7',
      BD_Email: 'EMAIL_MEN7',
    },
  };
});


