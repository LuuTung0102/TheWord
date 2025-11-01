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
    const currentKeys = Object.keys(currentData);
    const differences = [];
    
    for (const key of currentKeys) {
      const sourceValue = sourceData[key];
      const currentValue = currentData[key];

      const sourceEmpty = isEmpty(sourceValue);
      const currentEmpty = isEmpty(currentValue);
      if (!sourceEmpty && !currentEmpty && sourceValue !== currentValue) {
        hasModifications = true;
        differences.push({ key, type: 'MODIFICATION', source: sourceValue, current: currentValue });
      }
      else if (sourceEmpty && !currentEmpty) {
        hasAdditions = true;
        differences.push({ key, type: 'ADDITION', source: sourceValue || '(undefined)', current: currentValue });
      }
      else if (!sourceEmpty && currentEmpty) {
        hasModifications = true;
        differences.push({ key, type: 'DELETION', source: sourceValue, current: currentValue || '(empty)' });
      }
    }
    
    if (differences.length > 0) {
      console.log(`   🔍 Found ${differences.length} differences:`, differences);
    }

    if (!hasModifications && !hasAdditions)
      return { type: "NO_CHANGE" };
    if (!hasModifications && hasAdditions)
      return { type: "ONLY_ADDITIONS" };
    return { type: "HAS_MODIFICATIONS" };
  }

  function isSubgroupInConfig(groupKey, config) {
    if (!config || !config.fieldMappings) return false;
    
    for (const mapping of config.fieldMappings) {
      if (mapping.subgroups && Array.isArray(mapping.subgroups)) {
        for (const subgroup of mapping.subgroups) {
          const subgroupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
          if (subgroupId === groupKey) {
            return true;
          }
        }
      }
    }
    return false;
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
          const sourceGroupKey = sourceInfo.sourceGroupKey; 
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
          const isSubgroup = isSubgroupInConfig(groupKey, config);
          if (isSubgroup) {
            if (changeAnalysis.type === "NO_CHANGE") {
              if (isSameFile) {
                console.log(`📘 ${groupKey}: Copy không sửa + cùng file → Giữ nguyên session`);
              } else {
                console.log(`📘 ${groupKey}: Copy không sửa + khác file → Không lưu duplicate`);
                groupsToRemove.push(groupKey);
              }
            } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
              if (isSameFile) {
                console.log(`📘 ${groupKey}: Copy và thêm field mới + cùng file → Gộp dữ liệu`);
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
              } else {
                console.log(`📘 ${groupKey}: Copy và thêm field mới + khác file → Tạo session mới, xóa session cũ`);
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
              console.log(`📘 ${groupKey}: Copy và sửa → Giữ cả 2 sessions (không merge)`);
            }
          } else {
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

 
      const remainingGroups = Object.keys(dataGroups);
      const processedReusedKeys = new Set(Array.from(reusedGroups || []).map(key => 
        key.startsWith("localStorage:") ? key.replace("localStorage:", "") : key
      ));
      
      remainingGroups.forEach(groupKey => {
        if (processedReusedKeys.has(groupKey)) return;
        const isSubgroup = isSubgroupInConfig(groupKey, config);
        if (isSubgroup) return;
        
        const currentGroupData = dataGroups[groupKey];
        const normalizedCurrent = normalizeDataForComparison(currentGroupData);
        for (const [otherFileName, otherFileData] of Object.entries(existingData)) {
          if (otherFileName === fileName) continue; 
          const otherGroups = otherFileData.dataGroups || {};
          if (otherGroups[groupKey]) {
            const otherGroupData = otherGroups[groupKey];
            const normalizedOther = normalizeDataForComparison(otherGroupData);
            const changeAnalysis = analyzeChanges(normalizedOther, normalizedCurrent);
            if (changeAnalysis.type === "NO_CHANGE") {
              console.log(`🔍 ${groupKey} not in reusedGroups but matches ${otherFileName} → NO_CHANGE, removing duplicate`);
              groupsToRemove.push(groupKey);
              delete dataGroups[groupKey];
              break;
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
        const groupKey = suffixToGroupMap[""] || "OTHER";
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
      const groups = fileData.dataGroups;

      if (groups) {
        Object.keys(groups).forEach(groupKey => {
          const groupData = groups[groupKey];
          const shortFileName = fileName.replace('.docx', '');

          let displayName;
          if (groupKey.startsWith('MEN')) {
            displayName = `${groupData.Name || groupData.name || 'Chưa có tên'} (${shortFileName})`;
          } else if (groupKey === 'INFO') {
            displayName = `TT Đất (${shortFileName})`;
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
      const groups = allData[fileName].dataGroups;
      if (groups && groups[menKey]) {
        return groups[menKey];
      }
    }
    return null;
  }

  function getAllSessionData() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
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
      clearAllSessionData,
    };
  }
})();
