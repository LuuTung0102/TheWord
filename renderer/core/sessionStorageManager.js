// ========================================
// SESSION STORAGE MANAGER
// Lưu tạm dữ liệu form để tái sử dụng
// ========================================

(function() {
  console.log('🔧 Initializing sessionStorageManager...');
  
  const STORAGE_KEY = 'theword_session_data';

  /**
   * Lưu dữ liệu form vào sessionStorage
   * @param {string} fileName - Tên file Word (vd: "Giấy ủy quyền.docx")
   * @param {object} formData - Dữ liệu form đã collect
   */
  function saveFormData(fileName, formData) {
    try {
      // Lấy data hiện có
      const existingData = getAllSessionData();
      
      // Phân tích formData thành các MEN groups
      const menGroups = parseFormDataToMenGroups(formData);
      
      // Lưu với key là fileName
      existingData[fileName] = {
        timestamp: new Date().toISOString(),
        fileName: fileName,
        menGroups: menGroups,
        rawData: formData
      };
      
      // Lưu vào sessionStorage
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
      
      console.log(`💾 Saved session data for: ${fileName}`, menGroups);
      
      return true;
    } catch (error) {
      console.error('❌ Error saving session data:', error);
      return false;
    }
  }

  /**
   * Phân tích formData thành các groups (MEN, LAND, INFO...)
   * Ví dụ: 
   * - {Name1: "A", CCCD1: "123"} → {MEN1: {Name: "A", CCCD: "123"}}
   * - {QSH: "AA", S: "100"} → {LAND: {QSH: "AA", S: "100"}}
   */
  function parseFormDataToMenGroups(formData) {
    const groups = {};
    
    Object.keys(formData).forEach(key => {
      // 1. Tìm suffix số ở cuối key (vd: Name1 → suffix=1, CCCD7 → suffix=7)
      const matchWithSuffix = key.match(/^([A-Za-z_]+?)(\d+)$/);
      
      if (matchWithSuffix) {
        const fieldName = matchWithSuffix[1]; // vd: "Name", "CCCD"
        const suffix = matchWithSuffix[2];    // vd: "1", "7"
        const groupKey = `MEN${suffix}`;
        
        if (!groups[groupKey]) {
          groups[groupKey] = {};
        }
        
        groups[groupKey][fieldName] = formData[key];
      } else {
        // 2. Không có suffix số → Group theo tên field (QSH, S, AddressD...)
        // Các field này thuộc về LAND, INFO, hoặc các group khác
        
        // Nhóm các field không có suffix vào group "LAND" (mặc định)
        // Bạn có thể mở rộng logic này dựa trên field name
        const groupKey = determineGroupByFieldName(key);
        
        if (!groups[groupKey]) {
          groups[groupKey] = {};
        }
        
        groups[groupKey][key] = formData[key];
      }
    });
    
    return groups;
  }

  /**
   * Xác định group dựa trên field name
   */
  function determineGroupByFieldName(fieldName) {
    // Các field của LAND
    const landFields = ['QSH', 'So_so', 'Ngay_CapD', 'Thua_dat_so', 'Ban_do_so', 
                        'S', 'Loai_Dat', 'HTSD', 'THSD', 'AddressD', 'TTGLVD', 
                        'Money', 'MoneyText', 'Responsibility', 'Note', 'VTTD'];
    
    if (landFields.includes(fieldName)) {
      return 'LAND';
    }
    
    // Mặc định: OTHER
    return 'OTHER';
  }

  /**
   * Lấy tất cả session data
   */
  function getAllSessionData() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Error loading session data:', error);
      return {};
    }
  }

  /**
   * Lấy danh sách các groups đã lưu (MEN1, MEN2, LAND, INFO...) từ tất cả files
   * @returns {Array} [{fileName, groupKey, data, timestamp, displayName}]
   */
  function getAvailableMenGroups() {
    const allData = getAllSessionData();
    const available = [];
    
    Object.keys(allData).forEach(fileName => {
      const fileData = allData[fileName];
      
      if (fileData.menGroups) {
        Object.keys(fileData.menGroups).forEach(groupKey => {
          const groupData = fileData.menGroups[groupKey];
          
          // Tạo display name đẹp hơn
          let displayName = groupKey;
          
          // Nếu là MEN → hiển thị tên người (nếu có)
          if (groupKey.startsWith('MEN') && groupData.Name) {
            displayName = `${groupKey} - ${groupData.Name}`;
          }
          // Nếu là LAND → hiển thị địa chỉ hoặc số thửa
          else if (groupKey === 'LAND' && groupData.AddressD) {
            displayName = `LAND - ${groupData.AddressD}`;
          }
          
          available.push({
            fileName: fileName,
            groupKey: groupKey,    // Đổi từ menKey → groupKey
            menKey: groupKey,      // Giữ menKey để backward compatible
            data: groupData,
            timestamp: fileData.timestamp,
            displayName: `${displayName} (${fileName.replace('.docx', '')})`
          });
        });
      }
    });
    
    // Sort by timestamp (newest first)
    available.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return available;
  }

  /**
   * Lấy dữ liệu của 1 MEN group cụ thể
   * @param {string} fileName 
   * @param {string} menKey - vd: "MEN1", "MEN2"
   */
  function getMenGroupData(fileName, menKey) {
    const allData = getAllSessionData();
    
    if (allData[fileName] && allData[fileName].menGroups && allData[fileName].menGroups[menKey]) {
      return allData[fileName].menGroups[menKey];
    }
    
    return null;
  }

  /**
   * Xóa toàn bộ session data
   */
  function clearAllSessionData() {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared all session data');
  }

  // Make functions available globally
  if (typeof window !== 'undefined') {
    window.sessionStorageManager = {
      saveFormData,
      getAllSessionData,
      getAvailableMenGroups,
      getMenGroupData,
      clearAllSessionData
    };
    console.log('✅ sessionStorageManager is now available');
  }
})();

