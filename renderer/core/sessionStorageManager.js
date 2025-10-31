(function () {
  const STORAGE_KEY = "theword_session_data";

  function normalizeDataForComparison(data) {
    const normalized = {};
    Object.keys(data).forEach((key) => {
      let value = data[key];
      if (key.includes("CCCD") && typeof value === "string") {
        value = value.replace(/\./g, "");
      } else if (key.includes("Money") && typeof value === "string") {
        value = value.replace(/,/g, "");
      }
      normalized[key] = value;
    });
    return normalized;
  }

  function analyzeChanges(sourceData, currentData) {
    const isEmpty = (val) => val === undefined || val === null || val === "";

    let hasModifications = false;
    let hasAdditions = false;

    // Chỉ so sánh các key có trong currentData (template mới có thể có ít trường hơn)
    // Bỏ qua các trường có trong sourceData nhưng không có trong currentData
    const currentKeys = Object.keys(currentData);
    
    // Debug: Track các field có vấn đề
    const differences = [];
    
    for (const key of currentKeys) {
      const sourceValue = sourceData[key];
      const currentValue = currentData[key];

      const sourceEmpty = isEmpty(sourceValue);
      const currentEmpty = isEmpty(currentValue);

      // Nếu cả 2 đều có giá trị và khác nhau → modification
      if (!sourceEmpty && !currentEmpty && sourceValue !== currentValue) {
        hasModifications = true;
        differences.push({ key, type: 'MODIFICATION', source: sourceValue, current: currentValue });
      }
      // Nếu source rỗng (hoặc không có) nhưng current có giá trị → addition
      else if (sourceEmpty && !currentEmpty) {
        hasAdditions = true;
        differences.push({ key, type: 'ADDITION', source: sourceValue || '(undefined)', current: currentValue });
      }
      // Nếu source có giá trị nhưng current rỗng → modification (xóa dữ liệu)
      else if (!sourceEmpty && currentEmpty) {
        hasModifications = true;
        differences.push({ key, type: 'DELETION', source: sourceValue, current: currentValue || '(empty)' });
      }
      // Nếu cả 2 đều rỗng hoặc không có → không thay đổi (không làm gì)
    }
    
    // Debug log nếu có differences
    if (differences.length > 0) {
      console.log(`   🔍 Found ${differences.length} differences:`, differences);
    }

    if (!hasModifications && !hasAdditions)
      return { type: "NO_CHANGE" };
    if (!hasModifications && hasAdditions)
      return { type: "ONLY_ADDITIONS" };
    return { type: "HAS_MODIFICATIONS" };
  }

  function saveFormData(fileName, formData, reusedGroups, reusedGroupSources, config) {
    try {
      const existingData = getAllSessionData();
      let dataGroups = parseFormDataToGroups(formData, config);

      if (config?.fieldMappings) {
        config.fieldMappings.forEach((mapping) => {
          if (mapping.source === "localStorage" && mapping.subgroups) {
            mapping.subgroups.forEach((subgroup) => {
              const groupId =
                typeof subgroup === "string" ? subgroup : subgroup.id;
              if (dataGroups[groupId]) delete dataGroups[groupId];
            });
          }
        });
      }

      const groupsToRemove = [];

      console.log(`📋 Reused groups:`, Array.from(reusedGroups || []));
      
      if (reusedGroups?.size > 0) {
        reusedGroups.forEach((reusedKey) => {
          console.log(`   🔄 Processing reusedKey: ${reusedKey}`);
          const isFromLocalStorage = reusedKey.startsWith("localStorage:");
          const groupKey = isFromLocalStorage
            ? reusedKey.replace("localStorage:", "")
            : reusedKey;

          console.log(`   🔍 Checking groupKey: ${groupKey}, dataGroups keys:`, Object.keys(dataGroups));
          
          if (!dataGroups[groupKey]) {
            console.log(`   ⚠️ groupKey ${groupKey} not found in dataGroups, skipping`);
            return;
          }
          
          console.log(`   ✅ Found ${groupKey} in dataGroups`);

          if (isFromLocalStorage) {
            groupsToRemove.push(groupKey);
            return;
          }

        
          const sourceInfo = reusedGroupSources?.get?.(reusedKey); 
          
          if (!sourceInfo || !sourceInfo.sourceData) {
            console.warn(`⚠️ No source info for ${reusedKey}, skipping analysis`);
            return;
          }
          
          const sourceFileName = sourceInfo.sourceFileName;
          const sourceGroupKey = sourceInfo.sourceGroupKey; // MEN7, MEN2, LAND...
          const sourceData = sourceInfo.sourceData;
          const isSameFile = sourceFileName === fileName;

          const normalizedCurrent = normalizeDataForComparison(
            dataGroups[groupKey]
          );
          const normalizedSource = normalizeDataForComparison(sourceData);
          
         
          
          const changeAnalysis = analyzeChanges(
            normalizedSource,
            normalizedCurrent
          );

          console.log(`   Change type: ${changeAnalysis.type}`);
          console.log(`   Same file: ${isSameFile}`);
          
        
       

          // ======== Xử lý MEN ==========
          if (groupKey.startsWith("MEN")) {
            if (changeAnalysis.type === "NO_CHANGE") {
              if (isSameFile) {
                console.log(`📘 MEN: Copy không sửa + cùng file → Giữ nguyên session`);
                // Không xóa, giữ nguyên session
              } else {
                console.log(`📘 MEN: Copy không sửa + khác file → Không lưu duplicate`);
                groupsToRemove.push(groupKey);
              }
            } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
              if (isSameFile) {
                console.log(`📘 MEN: Copy và thêm field mới + cùng file → Gộp dữ liệu`);
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
              } else {
                console.log(`📘 MEN: Copy và thêm field mới + khác file → Tạo session mới, xóa session cũ`);
                // Merge để giữ tất cả fields
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
                // Xóa session cũ từ file nguồn
                if (existingData[sourceFileName]?.dataGroups?.[sourceGroupKey]) {
                  delete existingData[sourceFileName].dataGroups[sourceGroupKey];
                  console.log(`   🗑️ Đã xóa ${sourceGroupKey} từ ${sourceFileName}`);
                }
              }
            } else {
              console.log(`📘 MEN: Copy và sửa → Giữ cả 2 sessions (không merge)`);
            }
          }

          // ======== Xử lý INFO (subgroup của LAND) ==========
          else if (groupKey === "INFO") {
            if (changeAnalysis.type === "NO_CHANGE") {
              if (isSameFile) {
                console.log(`📋 INFO: Copy không sửa + cùng file → Giữ nguyên session`);
                // Không xóa, giữ nguyên session
              } else {
                console.log(`📋 INFO: Copy không sửa + khác file → Không lưu duplicate`);
                groupsToRemove.push(groupKey);
                console.log(`   ✅ Added ${groupKey} to groupsToRemove`);
              }
            } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
              if (isSameFile) {
                console.log(`📋 INFO: Copy và thêm field mới + cùng file → Gộp dữ liệu`);
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
              } else {
                console.log(`📋 INFO: Copy và thêm field mới + khác file → Tạo session mới, xóa session cũ`);
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
                if (existingData[sourceFileName]?.dataGroups?.[sourceGroupKey]) {
                  delete existingData[sourceFileName].dataGroups[sourceGroupKey];
                  console.log(`   🗑️ Đã xóa ${sourceGroupKey} từ ${sourceFileName}`);
                }
              }
            } else {
              console.log(`📋 INFO: Copy và sửa → Giữ cả 2 sessions (không merge)`);
            }
          }

          else {
            if (changeAnalysis.type === "NO_CHANGE") {
              if (isSameFile) {
                console.log(`📦 ${groupKey}: Copy không sửa + cùng file → Giữ nguyên session`);
              } else {
                console.log(`📦 ${groupKey}: Copy không sửa + khác file → Không lưu duplicate`);
                groupsToRemove.push(groupKey);
              }
            } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
              if (isSameFile) {
                console.log(`📦 ${groupKey}: Copy và thêm field mới + cùng file → Gộp dữ liệu`);
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
              } else {
                console.log(`📦 ${groupKey}: Copy và thêm field mới + khác file → Tạo session mới, xóa session cũ`);
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
                if (existingData[sourceFileName]?.dataGroups?.[sourceGroupKey]) {
                  delete existingData[sourceFileName].dataGroups[sourceGroupKey];
                  console.log(`   🗑️ Đã xóa ${sourceGroupKey} từ ${sourceFileName}`);
                }
              }
            } else {
              console.log(`📦 ${groupKey}: Copy và sửa → Giữ cả 2 sessions (không merge)`);
            }
          }
        });
      }

      console.log(`🗑️ Groups to remove:`, groupsToRemove);
      groupsToRemove.forEach((groupKey) => {
        console.log(`   🗑️ Removing ${groupKey} from dataGroups`);
        delete dataGroups[groupKey];
      });
      console.log(`📊 Remaining groups after removal:`, Object.keys(dataGroups));

      // ✅ Xử lý các groups không được reuse nhưng có thể trùng với session cũ
      // Đặc biệt: INFO là subgroup của LAND, nếu INFO đã được xử lý trong reusedGroups
      // thì có thể LAND cũng cần được kiểm tra tương tự
      const remainingGroups = Object.keys(dataGroups);
      const processedReusedKeys = new Set(Array.from(reusedGroups || []).map(key => 
        key.startsWith("localStorage:") ? key.replace("localStorage:", "") : key
      ));
      
      remainingGroups.forEach(groupKey => {
        // Bỏ qua nếu đã được xử lý trong reusedGroups
        if (processedReusedKeys.has(groupKey)) return;
        
        // Đặc biệt: INFO là subgroup của LAND, nếu INFO đã được xử lý trong reusedGroups
        // thì LAND (nếu có) cũng cần được kiểm tra tương tự
        // Nhưng thường LAND sẽ được xử lý thông qua INFO
        
        // Tìm xem có session nào của group này từ file khác không
        const currentGroupData = dataGroups[groupKey];
        const normalizedCurrent = normalizeDataForComparison(currentGroupData);
        
        // Kiểm tra tất cả files trong existingData
        for (const [otherFileName, otherFileData] of Object.entries(existingData)) {
          if (otherFileName === fileName) continue; // Bỏ qua cùng file
          
          const otherGroups = otherFileData.dataGroups || {};
          if (otherGroups[groupKey]) {
            const otherGroupData = otherGroups[groupKey];
            const normalizedOther = normalizeDataForComparison(otherGroupData);
            
            const changeAnalysis = analyzeChanges(normalizedOther, normalizedCurrent);
            
            // Nếu NO_CHANGE → không lưu duplicate
            if (changeAnalysis.type === "NO_CHANGE") {
              console.log(`🔍 ${groupKey} not in reusedGroups but matches ${otherFileName} → NO_CHANGE, removing duplicate`);
              groupsToRemove.push(groupKey);
              delete dataGroups[groupKey];
              break; // Chỉ cần match với 1 file là đủ
            }
          }
        }
      });

      Object.keys(existingData).forEach(file => {
        const fileData = existingData[file];
        if (fileData.dataGroups && Object.keys(fileData.dataGroups).length === 0) {
          delete existingData[file];
          console.log(`🗑️ Đã xóa file ${file} (không còn session nào)`);
        }
      });

      if (Object.keys(dataGroups).length === 0) return false;

      existingData[fileName] = {
        fileName,
        dataGroups,
        rawData: formData,
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
      console.log(`✅ Saved session for ${fileName}:`, Object.keys(dataGroups));
      return true;
    } catch (error) {
      console.error("❌ Error saving session data:", error);
      return false;
    }
  }

  function parseFormDataToGroups(formData, config) {
    const groups = {};
    const suffixToGroupMap = {};

    if (config?.fieldMappings) {
      config.fieldMappings.forEach((mapping) => {
        if (mapping.subgroups) {
          mapping.subgroups.forEach((subgroupDef, index) => {
            const subgroupId =
              typeof subgroupDef === "string" ? subgroupDef : subgroupDef.id;
            const suffix =
              mapping.suffixes && mapping.suffixes[index]
                ? mapping.suffixes[index]
                : "";
            suffixToGroupMap[suffix] = subgroupId;
          });
        }
      });
    }

    Object.keys(formData).forEach((key) => {
      const match = key.match(/^([A-Za-z_]+?)(\d+)$/);
      if (match) {
        const fieldName = match[1];
        const suffix = match[2];
        const groupKey = suffixToGroupMap[suffix] || `UNKNOWN_${suffix}`;
        if (!groups[groupKey]) groups[groupKey] = {};
        groups[groupKey][fieldName] = formData[key];
      } else {
        const groupKey = determineGroupByFieldName(key);
        if (!groups[groupKey]) groups[groupKey] = {};
        groups[groupKey][key] = formData[key];
      }
    });

    console.log("📊 Parsed dataGroups:", Object.keys(groups));
    return groups;
  }

  function getAvailableMenGroups() {
    const allData = getAllSessionData();
    const available = [];

    Object.keys(allData).forEach(fileName => {
      const fileData = allData[fileName];
      const groups = fileData.dataGroups || fileData.menGroups;

      if (groups) {
        Object.keys(groups).forEach(groupKey => {
          const groupData = groups[groupKey];
          const shortFileName = fileName.replace('.docx', '');

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
            menKey: groupKey,
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
      const groups = allData[fileName].dataGroups || allData[fileName].menGroups;
      if (groups && groups[menKey]) {
        return groups[menKey];
      }
    }
    return null;
  }

  function determineGroupByFieldName(fieldName) {
    const landFields = [
      "QSH",
      "So_so",
      "Ngay_CapD",
      "Thua_dat_so",
      "Ban_do_so",
      "S",
      "Loai_Dat",
      "HTSD",
      "THSD",
      "AddressD",
      "TTGLVD",
      "Money",
      "MoneyText",
      "Responsibility",
      "Note",
      "VTTD",
    ];
    return landFields.includes(fieldName) ? "LAND" : "OTHER";
  }

  function getAllSessionData() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  function findGroupDataFromAnyFile(groupKey) {
    const allData = getAllSessionData();
    for (const fileName in allData) {
      const fileData = allData[fileName];
      const groups = fileData.dataGroups || fileData.menGroups; // Backward compatibility
      if (groups && groups[groupKey]) return groups[groupKey];
    }
    return null;
  }

  function clearAllSessionData() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  if (typeof window !== "undefined") {
    window.sessionStorageManager = {
      saveFormData,
      getAllSessionData,
      getAvailableMenGroups,
      getMenGroupData,
      findGroupDataFromAnyFile,
      clearAllSessionData,
    };
  }
})();
