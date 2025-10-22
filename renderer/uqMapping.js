(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const mappings = factory();
    module.exports = mappings.UQ_FIELD_MAPPINGS;
    if (typeof global !== 'undefined') {
      global.UQ_BENB_FIELD_MAPPINGS = mappings.UQ_BENB_FIELD_MAPPINGS;
    }
  } else {
    const mappings = factory();
    root.UQ_FIELD_MAPPINGS = mappings.UQ_FIELD_MAPPINGS;
    root.UQ_BENB_FIELD_MAPPINGS = mappings.UQ_BENB_FIELD_MAPPINGS;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Centralized mapping between MEN1/MEN7 fields and UQA fields (Bên A - người ủy quyền)
  const UQ_FIELD_MAPPINGS = {
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

  // Centralized mapping for UQ Bên B (người được ủy quyền)
  const UQ_BENB_FIELD_MAPPINGS = {
    MEN1: {
      UQ_Gender: 'Gender1',
      UQ_Name: 'Name1',
      UQ_CCCD: 'CCCD1',
      UQ_Date: 'Date1',
      UQ_Noi_Cap: 'Noi_Cap1',
      UQ_Ngay_Cap: 'Ngay_Cap1',
      UQ_Address: 'Address1',
    },
    MEN2: {
      UQ_Gender: 'Gender2',
      UQ_Name: 'Name2',
      UQ_CCCD: 'CCCD2',
      UQ_Date: 'Date2',
      UQ_Noi_Cap: 'Noi_Cap2',
      UQ_Ngay_Cap: 'Ngay_Cap2',
      UQ_Address: 'Address1', // MEN2 usually shares address with MEN1
    },
    MEN7: {
      UQ_Gender: 'Gender7',
      UQ_Name: 'Name7',
      UQ_CCCD: 'CCCD7',
      UQ_Date: 'Date7',
      UQ_Noi_Cap: 'Noi_Cap7',
      UQ_Ngay_Cap: 'Ngay_Cap7',
      UQ_Address: 'Address2',
    },
  };

  return {
    UQ_FIELD_MAPPINGS,
    UQ_BENB_FIELD_MAPPINGS
  };
});



