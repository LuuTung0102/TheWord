(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.UQ_FIELD_MAPPINGS = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Centralized mapping between MEN1/MEN7 fields and UQA fields (Bên A - người ủy quyền)
  return {
    MEN1: {
      UQA_Gender: 'Gender1',
      UQA_Name: 'Name1',
      UQA_CCCD: 'CCCD1',
      UQA_Date: 'Date1',
      UQA_Noi_Cap: 'Noi_Cap1',
      UQA_Ngay_Cap: 'Ngay_Cap1',
      UQA_Address: 'Address1',
    },
    MEN7: {
      UQA_Gender: 'Gender7',
      UQA_Name: 'Name7',
      UQA_CCCD: 'CCCD7',
      UQA_Date: 'Date7',
      UQA_Noi_Cap: 'Noi_Cap7',
      UQA_Ngay_Cap: 'Ngay_Cap7',
      UQA_Address: 'Address2',
    },
  };
});



