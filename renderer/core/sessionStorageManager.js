(function() {
  const STORAGE_KEY = 'theword_session_data';

  function normalizeDataForComparison(data) {
    const normalized = {};
    Object.keys(data).forEach(key => {
      let value = data[key];
      if (key.includes('CCCD') && typeof value === 'string') {
        value = value.replace(/\./g, '');
      } else if (key.includes('Money') && typeof value === 'string') {
        value = value.replace(/,/g, '');
      }
      normalized[key] = value;
    });
    return normalized;
  }

  /**
   * Phân tích thay đổi giữa source data và current data
   * @param {Object} sourceData - Dữ liệu gốc (từ session)
   * @param {Object} currentData - Dữ liệu hiện tại (form data)
   * @returns {Object} - {type: 'NO_CHANGE' | 'ONLY_ADDITIONS' | 'HAS_MODIFICATIONS', details: {...}}
   */
  function analyzeChanges(sourceData, currentData) {
    const isEmpty = (val) => val === undefined || val === null || val === '';
    
    let hasModifications = false;  // Có sửa đổi giá trị đã có
    let hasAdditions = false;      // Có thêm giá trị mới vào field trống
    
    const allKeys = new Set([...Object.keys(sourceData), ...Object.keys(currentData)]);
    
    for (const key of allKeys) {
      const sourceValue = sourceData[key];
      const currentValue = currentData[key];
      
      const sourceEmpty = isEmpty(sourceValue);
      const currentEmpty = isEmpty(currentValue);
      
      if (!sourceEmpty && !currentEmpty && sourceValue !== currentValue) {
        // Đã có giá trị → Thay đổi giá trị khác = SỬA ĐỔI
        hasModifications = true;
      } else if (sourceEmpty && !currentEmpty) {
        // Trước đó trống → Giờ có giá trị = THÊM MỚI
        hasAdditions = true;
      } else if (!sourceEmpty && currentEmpty) {
        // Trước đó có → Giờ xóa đi = SỬA ĐỔI
        hasModifications = true;
      }
    }
    
    if (!hasModifications && !hasAdditions) {
      return { type: 'NO_CHANGE', hasModifications: false, hasAdditions: false };
    } else if (!hasModifications && hasAdditions) {
      return { type: 'ONLY_ADDITIONS', hasModifications: false, hasAdditions: true };
    } else {
      return { type: 'HAS_MODIFICATIONS', hasModifications: true, hasAdditions };
    }
  }

  function saveFormData(fileName, formData, reusedGroups, reusedGroupSources, config) {
    try {
      const existingData = getAllSessionData();
      let dataGroups = parseFormDataToGroups(formData, config);
      
      if (config && config.fieldMappings) {
        config.fieldMappings.forEach(mapping => {
          if (mapping.source === 'localStorage' && mapping.subgroups) {
            mapping.subgroups.forEach(subgroup => {
              const groupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
              if (dataGroups[groupId]) delete dataGroups[groupId];
            });
          }
        });
      }
      
      // ✅ NEW LOGIC: Phân biệt "Copy không sửa" vs "Copy và sửa" vs "Copy và thêm"
      const groupsToRemove = [];
      if (reusedGroups && reusedGroups.size > 0) {
        reusedGroups.forEach(reusedKey => {
          const isFromLocalStorage = reusedKey.startsWith('localStorage:');
          const groupKey = isFromLocalStorage ? reusedKey.replace('localStorage:', '') : reusedKey;
          
          if (dataGroups[groupKey]) {
            if (isFromLocalStorage) {
              // LocalStorage data: Không bao giờ lưu vào session
              groupsToRemove.push(groupKey);
              return;
            }
            
            const sourceData = window.sessionStorageManager.findGroupDataFromAnyFile(groupKey);
            if (sourceData) {
              const normalizedCurrent = normalizeDataForComparison(dataGroups[groupKey]);
              const normalizedSource = normalizeDataForComparison(sourceData);
              
              // Phân tích thay đổi
              const changeAnalysis = analyzeChanges(normalizedSource, normalizedCurrent);
              
              console.log(`📊 Change analysis for ${groupKey}:`, changeAnalysis);
              
              if (changeAnalysis.type === 'NO_CHANGE') {
                // ✅ Case 1: Copy không sửa → KHÔNG lưu session mới (xóa khỏi dataGroups)
                console.log(`  → Case 1: Copy không sửa → Không lưu session mới`);
                groupsToRemove.push(groupKey);
              } else if (changeAnalysis.type === 'ONLY_ADDITIONS') {
                // ✅ Case 3: Copy và thêm → GỘP dữ liệu (merge source + current)
                console.log(`  → Case 3: Copy và thêm → Gộp dữ liệu`);
                // Merge: Keep all fields from both source and current
                dataGroups[groupKey] = { ...normalizedSource, ...normalizedCurrent };
              } else {
                // ✅ Case 2: Copy và sửa → Giữ cả 2 sessions (không xóa gì cả)
                console.log(`  → Case 2: Copy và sửa → Giữ cả 2 sessions`);
                // Không xóa gì, cả source và current đều được giữ lại
              }
            }
          }
        });
      }
      
      groupsToRemove.forEach(groupKey => delete dataGroups[groupKey]);
      
      if (Object.keys(dataGroups).length === 0) {
        return false;
      }
      
      existingData[fileName] = {
        fileName: fileName,
        dataGroups: dataGroups,
        rawData: formData
      };
      
      // ✅ NEW: KHÔNG bao giờ xóa session gốc khi reuse
      // Lý do: 
      // - Case "Copy không sửa": Không lưu session mới (đã xử lý ở trên)
      // - Case "Copy và sửa": Giữ cả 2 sessions (gốc + mới)
      // - Case "Copy và thêm": Merge rồi lưu session mới, giữ gốc
      //
      // → Không cần xóa session gốc trong mọi trường hợp!
      
      // ❌ REMOVED: Old logic that deleted source session
      // if (reusedGroupSources && reusedGroupSources.size > 0) {
      //   reusedGroupSources.forEach((sourceInfo, targetGroupKey) => {
      //     if (hasChanges) {
      //       delete existingData[sourceFileName].menGroups[sourceGroupKey];
      //     }
      //   });
      // }
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error('❌ Error saving session data:', error);
      return false;
    }
  }

  /**
   * Parse form data into groups based on config schema
   * @param {Object} formData - Form data with keys like Name1, CCCD1, QSH, etc.
   * @param {Object} config - Config object with fieldMappings
   * @returns {Object} - Groups object like { MEN1: {...}, MEN2: {...}, LAND: {...}, INFO: {...} }
   */
  function parseFormDataToGroups(formData, config) {
    const groups = {};
    
    // Build suffix to group mapping from config
    const suffixToGroupMap = {};  // { "1": "MEN1", "2": "MEN2", "": "LAND", ... }
    
    if (config && config.fieldMappings) {
      config.fieldMappings.forEach(mapping => {
        if (mapping.subgroups) {
          mapping.subgroups.forEach((subgroupDef, index) => {
            const subgroupId = typeof subgroupDef === 'string' ? subgroupDef : subgroupDef.id;
            const suffix = (mapping.suffixes && mapping.suffixes[index]) ? mapping.suffixes[index] : '';
            suffixToGroupMap[suffix] = subgroupId;
          });
        }
      });
    }
    
    console.log('📋 suffixToGroupMap:', suffixToGroupMap);
    
    // Parse form data into groups
    Object.keys(formData).forEach(key => {
      // Try to match field with suffix (e.g., Name1 → Name + suffix "1")
      const matchWithSuffix = key.match(/^([A-Za-z_]+?)(\d+)$/);
      
      if (matchWithSuffix) {
        const fieldName = matchWithSuffix[1];
        const suffix = matchWithSuffix[2];
        const groupKey = suffixToGroupMap[suffix] || `UNKNOWN_${suffix}`;
        
        if (!groups[groupKey]) groups[groupKey] = {};
        groups[groupKey][fieldName] = formData[key];
      } else {
        // Field without suffix → determine group by field name
        const groupKey = determineGroupByFieldName(key);
        if (!groups[groupKey]) groups[groupKey] = {};
        groups[groupKey][key] = formData[key];
      }
    });
    
    console.log('📊 Parsed dataGroups:', Object.keys(groups));
    return groups;
  }

  function determineGroupByFieldName(fieldName) {
    const landFields = ['QSH', 'So_so', 'Ngay_CapD', 'Thua_dat_so', 'Ban_do_so', 
                        'S', 'Loai_Dat', 'HTSD', 'THSD', 'AddressD', 'TTGLVD', 
                        'Money', 'MoneyText', 'Responsibility', 'Note', 'VTTD'];
    return landFields.includes(fieldName) ? 'LAND' : 'OTHER';
  }

  function getAllSessionData() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  function getAvailableMenGroups() {
    const allData = getAllSessionData();
    const available = [];
    
    Object.keys(allData).forEach(fileName => {
      const fileData = allData[fileName];
      const groups = fileData.dataGroups || fileData.menGroups;  // Backward compatibility
      
      if (groups) {
        Object.keys(groups).forEach(groupKey => {
          const groupData = groups[groupKey];
          const shortFileName = fileName.replace('.docx', '');
          
          // Display name based on group type
          let displayName;
          if (groupKey.startsWith('MEN')) {
            displayName = `${groupData.Name || groupData.name || 'Chưa có tên'} (${shortFileName})`;
          } else if (groupKey === 'LAND') {
            displayName = `Đất (${groupData.AddressD || groupData.Thua_dat_so || 'Chưa có địa chỉ'}) (${shortFileName})`;
          } else if (groupKey === 'INFO') {
            displayName = `INFO (${shortFileName})`;
          } else {
            displayName = `${groupKey} (${shortFileName})`;
          }
          
          available.push({
            fileName,
            groupKey,
            menKey: groupKey,  // Keep for backward compatibility
            data: groupData,
            displayName
          });
        });
      }
    });
    return available;
  }

  function getMenGroupData(fileName, menKey) {
    const allData = getAllSessionData();
    if (allData[fileName]) {
      const groups = allData[fileName].dataGroups || allData[fileName].menGroups;  // Backward compatibility
      if (groups && groups[menKey]) {
        return groups[menKey];
      }
    }
    return null;
  }

  function findGroupDataFromAnyFile(groupKey) {
    const allData = getAllSessionData();
    for (const fileName in allData) {
      const fileData = allData[fileName];
      const groups = fileData.dataGroups || fileData.menGroups;  // Backward compatibility
      if (groups && groups[groupKey]) {
        return groups[groupKey];
      }
    }
    return null;
  }

  function clearAllSessionData() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  if (typeof window !== 'undefined') {
    window.sessionStorageManager = {
      saveFormData,
      getAllSessionData,
      getAvailableMenGroups,
      getMenGroupData,
      findGroupDataFromAnyFile,
      clearAllSessionData
    };
  }
})();

