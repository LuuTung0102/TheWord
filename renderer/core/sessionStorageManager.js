(function () {
  const STORAGE_KEY = "theword_session_data";

  function normalizeDataForComparison(data) {
    const normalized = {};
    const isEmpty = (val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === 'string' && val.trim() === '') return true;
      return false;
    };
    
    Object.keys(data).forEach((key) => {
      // Bỏ qua _landOriginalFields nếu có
      if (key === '_landOriginalFields') return;
      
      let value = data[key];
      if (isEmpty(value)) return;
      if (key.includes("CCCD") && typeof value === "string") {
        value = value.replace(/\./g, "");
      } else if (key.includes("Money") && typeof value === "string") {
        value = value.replace(/,/g, "");
      } else if (key.includes("SDT") && typeof value === "string") {
        value = value.replace(/\./g, "");
      } else if (key.includes("MST") && typeof value === "string") {
        value = value.replace(/\./g, "");
      }
      
      normalized[key] = value;
    });
    return normalized;
  }

  function analyzeChanges(sourceData, currentData) {
    const isEmpty = (val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === 'string' && val.trim() === '') return true;
      return false;
    };
    
    let hasModifications = false;
    let hasAdditions = false;
    const allKeys = new Set([
      ...Object.keys(sourceData || {}),
      ...Object.keys(currentData || {})
    ]);
    
    for (const key of allKeys) {
      const sourceValue = sourceData?.[key];
      const currentValue = currentData?.[key];
      const sourceEmpty = isEmpty(sourceValue);
      const currentEmpty = isEmpty(currentValue);
      
      if (sourceEmpty && currentEmpty) {
        continue;
      }
      
      if (key === '_landOriginalFields') {
        continue;
      }
      
      // Bỏ qua các trường land type vì đã so sánh riêng
      if (key === 'Loai_Dat' || key === 'Loai_Dat_F' || key === 'Loai_Dat_D') {
        continue;
      }
      
      if (!sourceEmpty && !currentEmpty) {
        if (sourceValue !== currentValue) {
          hasModifications = true;
        }
      }
      
      else if (sourceEmpty && !currentEmpty) {
        hasAdditions = true;
      }
      
      else if (!sourceEmpty && currentEmpty) {
      }
    }

    if (!hasModifications && !hasAdditions) return { type: "NO_CHANGE" };
    if (!hasModifications && hasAdditions) return { type: "ONLY_ADDITIONS" };
    return { type: "HAS_MODIFICATIONS" };
  }

  function generateTimestamp(includeMilliseconds = false) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    if (includeMilliseconds) {
      const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
      return `${year}${month}${day}_${hours}${minutes}${seconds}${milliseconds}`;
    }
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  function generateVersionedKey(baseKey, existingGroups) {
    const MAX_KEY_LENGTH = 255;
    const TIMESTAMP_WITH_MS_LENGTH = 18;
    
    let truncatedBaseKey = baseKey;
    if (baseKey.length + TIMESTAMP_WITH_MS_LENGTH + 1 > MAX_KEY_LENGTH) {
      const maxBaseLength = MAX_KEY_LENGTH - TIMESTAMP_WITH_MS_LENGTH - 1;
      truncatedBaseKey = baseKey.substring(0, maxBaseLength);
    }
    
    let timestamp = generateTimestamp(false);
    let versionedKey = `${truncatedBaseKey}_${timestamp}`;
    
    if (existingGroups[versionedKey]) {
      timestamp = generateTimestamp(true);
      versionedKey = `${truncatedBaseKey}_${timestamp}`;
    }
    
    return versionedKey;
  }

  function formatTimestampForDisplay(timestamp) {
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hours = timestamp.substring(9, 11);
    const minutes = timestamp.substring(11, 13);
    
    if (timestamp.length > 15) {
      const seconds = timestamp.substring(13, 15);
      const milliseconds = timestamp.substring(15);
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  function extractBaseKey(groupKey) {
    const timestampMatch = groupKey.match(/^(.+)_(\d{8}_\d{6,9})$/);
    
    if (timestampMatch) {
      return {
        baseKey: timestampMatch[1],
        timestamp: timestampMatch[2],
        isVersioned: true
      };
    }
    
    return {
      baseKey: groupKey,
      timestamp: null,
      isVersioned: false
    };
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

  function getGroupType(groupKey) {
    if (groupKey.startsWith('MEN')) return 'MEN';
    if (groupKey === 'INFO') return 'INFO';
    return groupKey; 
  }

  function mergeDuplicateGroupsAcrossFiles(dataGroups, existingData, fileName) {
    if (!dataGroups || !existingData) return;
    const groupsToDelete = new Set();

    for (const [groupKey, groupData] of Object.entries(dataGroups)) {
      const normalizedCurrent = normalizeDataForComparison(groupData);
      const currentType = getGroupType(groupKey);

      for (const [otherFile, otherFileData] of Object.entries(existingData)) {
        if (!otherFileData || !otherFileData.dataGroups) continue;

        for (const [otherGroupKey, otherGroupData] of Object.entries(otherFileData.dataGroups)) {
          if (otherFile === fileName) continue;

          const otherType = getGroupType(otherGroupKey);
          if (currentType !== otherType) continue;

          const normalizedOther = normalizeDataForComparison(otherGroupData);
          const normalizedCurrent = normalizeDataForComparison(groupData);
          const changeAnalysis = analyzeChanges(normalizedOther, normalizedCurrent);
          const differences = [];
          const allKeys = new Set([...Object.keys(normalizedOther), ...Object.keys(normalizedCurrent)]);
          const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
          
          for (const key of allKeys) {
            const otherVal = normalizedOther[key];
            const currentVal = normalizedCurrent[key];
            
            if (!isEmpty(otherVal) && !isEmpty(currentVal) && otherVal !== currentVal) {
              differences.push({ field: key, other: otherVal, current: currentVal, type: 'MODIFIED' });
            } else if (isEmpty(otherVal) && !isEmpty(currentVal)) {
              differences.push({ field: key, other: otherVal, current: currentVal, type: 'ADDED' });
            } else if (!isEmpty(otherVal) && isEmpty(currentVal)) {
              differences.push({ field: key, other: otherVal, current: currentVal, type: 'REMOVED' });
            }
          }
         
          if (differences.length > 0) {
          }
          if (changeAnalysis.type === "NO_CHANGE") {
            groupsToDelete.add(groupKey);
            break;
          } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
            existingData[otherFile].dataGroups[otherGroupKey] = {
              ...otherGroupData,
              ...groupData 
            };
            groupsToDelete.add(groupKey);
            break;
          }
        }
        if (groupsToDelete.has(groupKey)) break;
      }
    }
    for (const g of groupsToDelete) {
      delete dataGroups[g];
    }
  }

  function saveFormData(fileName, formData, reusedGroups, reusedGroupSources, config) { 
    try {
      const existingData = getAllSessionData();
      let dataGroups = parseFormDataToGroups(formData, config);
      if (config?.fieldMappings) {
        config.fieldMappings.forEach((mapping) => {
          if (mapping.source === "localStorage" && mapping.subgroups) {
            mapping.subgroups.forEach((subgroup) => {
              const groupId = typeof subgroup === "string" ? subgroup : subgroup.id;
              if (dataGroups[groupId]) delete dataGroups[groupId];
            });
          }
        });
      }
      mergeDuplicateGroupsAcrossFiles(dataGroups, existingData, fileName);
      const groupsToRemove = [];
      if (reusedGroups?.size > 0) {
        reusedGroups.forEach((reusedKey) => {
          const isFromLocalStorage = reusedKey.startsWith("localStorage:");
          const groupKey = isFromLocalStorage ? reusedKey.replace("localStorage:", "") : reusedKey;
          if (!dataGroups[groupKey]) return;
          if (isFromLocalStorage) {
            groupsToRemove.push(groupKey);
            return;
          }
          const sourceInfo = reusedGroupSources?.get?.(reusedKey);
          if (!sourceInfo || !sourceInfo.sourceData) return;
          const sourceFileName = sourceInfo.sourceFileName;
          const sourceGroupKey = sourceInfo.sourceGroupKey;
          const sourceData = sourceInfo.sourceData;
          const isSameFile = sourceFileName === fileName;
          const normalizedCurrent = normalizeDataForComparison(dataGroups[groupKey]);
          const normalizedSource = normalizeDataForComparison(sourceData);
          const changeAnalysis = analyzeChanges(normalizedSource, normalizedCurrent);

          if (changeAnalysis.type === "NO_CHANGE") {
            groupsToRemove.push(groupKey);
          } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
            dataGroups[groupKey] = { 
              ...sourceData,
              ...dataGroups[groupKey]  
            };
          } else {
          }
        });
      }
      groupsToRemove.forEach(g => delete dataGroups[g]);
      const processedReusedKeys = new Set(Array.from(reusedGroups || []).map(k =>
        k.startsWith("localStorage:") ? k.replace("localStorage:", "") : k
      ));

      for (const groupKey of Object.keys(dataGroups)) {
        if (processedReusedKeys.has(groupKey)) continue;
        if (isSubgroupInConfig(groupKey, config)) continue;
        const normalizedCurrent = normalizeDataForComparison(dataGroups[groupKey]);
        for (const [otherFileName, otherFileData] of Object.entries(existingData)) {
          if (otherFileName === fileName) continue;
          const otherGroups = otherFileData.dataGroups || {};
          if (!otherGroups[groupKey]) continue;
          const normalizedOther = normalizeDataForComparison(otherGroups[groupKey]);
          const changeAnalysis = analyzeChanges(normalizedOther, normalizedCurrent);
          if (changeAnalysis.type === "NO_CHANGE") {
            delete dataGroups[groupKey];
            break;
          } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
            existingData[otherFileName].dataGroups[groupKey] = {
              ...normalizedOther,
              ...normalizedCurrent
            };
            delete dataGroups[groupKey];
            break;
          }
        }
      }
      Object.keys(existingData).forEach(f => {
        const fd = existingData[f];
        if (fd?.dataGroups && Object.keys(fd.dataGroups).length === 0) delete existingData[f];
      });
      if (Object.keys(dataGroups).length === 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
        return false;
      }
      const oldDataGroups = existingData[fileName]?.dataGroups || {};
      const mergedDataGroups = { ...oldDataGroups };
      Object.keys(dataGroups).forEach(groupKey => {
        const newData = dataGroups[groupKey];
        if (!mergedDataGroups[groupKey]) {
          mergedDataGroups[groupKey] = newData;
        } else {
          const oldData = mergedDataGroups[groupKey];
          try {
            if (!oldData || typeof oldData !== 'object') {
              const versionedKey = generateVersionedKey(groupKey, mergedDataGroups);
              mergedDataGroups[versionedKey] = newData;
              return;
            }
            const normalizedOld = normalizeDataForComparison(oldData);
            const normalizedNew = normalizeDataForComparison(newData);          
            const changeAnalysis = analyzeChanges(normalizedOld, normalizedNew);
            if (typeof console !== 'undefined' && console.log) {
              const differences = [];
              const allKeys = new Set([...Object.keys(normalizedOld), ...Object.keys(normalizedNew)]);
              for (const key of allKeys) {
                const oldVal = normalizedOld[key];
                const newVal = normalizedNew[key];
                const isEmpty = (v) => v === undefined || v === null || v === "";
                
                if (!isEmpty(oldVal) && !isEmpty(newVal) && oldVal !== newVal) {
                  differences.push({
                    field: key,
                    old: oldVal,
                    new: newVal,
                    type: 'MODIFIED'
                  });
                } else if (isEmpty(oldVal) && !isEmpty(newVal)) {
                  differences.push({
                    field: key,
                    old: oldVal,
                    new: newVal,
                    type: 'ADDED'
                  });
                } else if (!isEmpty(oldVal) && isEmpty(newVal)) {
                  differences.push({
                    field: key,
                    old: oldVal,
                    new: newVal,
                    type: 'REMOVED'
                  });
                }
              }
              
              if (differences.length > 0) {
                console.table(differences);
              }
            }
            if (changeAnalysis.type === "NO_CHANGE") {
            } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
              const merged = {
                ...oldData,
                ...newData
              };
              mergedDataGroups[groupKey] = merged;
            } else {
              const versionedKey = generateVersionedKey(groupKey, mergedDataGroups);
              mergedDataGroups[versionedKey] = newData;
            }
          } catch (error) {
            const versionedKey = generateVersionedKey(groupKey, mergedDataGroups);
            mergedDataGroups[versionedKey] = newData;
          }
        }
      });
      existingData[fileName] = {
        fileName,
        dataGroups: mergedDataGroups,
        rawData: formData
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
      return true;
    } catch (err) {
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
          const timestampMatch = groupKey.match(/^(.+)_(\d{8}_\d{6,9})$/);
          let displayName; 
          if (timestampMatch) {
            const baseKey = timestampMatch[1];
            const timestamp = timestampMatch[2];
            const formattedTime = formatTimestampForDisplay(timestamp);  
            if (baseKey.startsWith('MEN')) {
              displayName = `${groupData.Name || groupData.name || 'Chưa có tên'} (${shortFileName} - ${formattedTime})`;
            } else if (baseKey === 'INFO') {
              displayName = `TT Đất (${shortFileName} - ${formattedTime})`;
            } else {
              displayName = `${baseKey} (${shortFileName} - ${formattedTime})`;
            }
          } else {
            if (groupKey.startsWith('MEN')) {
              displayName = `${groupData.Name || groupData.name || 'Chưa có tên'} (${shortFileName})`;
            } else if (groupKey === 'INFO') {
              displayName = `TT Đất (${shortFileName})`;
            } else {
              displayName = `${groupKey} (${shortFileName})`;
            }
          }
          available.push({
            fileName,
            groupKey,
            menKey: groupKey,
            data: groupData,
            displayName,
            timestamp: timestampMatch ? timestampMatch[2] : null
          });
        });
      }
    });
    
    available.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return b.timestamp.localeCompare(a.timestamp);
      }
      if (a.timestamp) return -1;
      if (b.timestamp) return 1;
      return a.displayName.localeCompare(b.displayName);
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

  // Lưu sessionStorage vào localStorage
  function persistSessionToLocalStorage() {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        localStorage.setItem(STORAGE_KEY, sessionData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error persisting session to localStorage:', error);
      return false;
    }
  }

  // Khôi phục sessionStorage từ localStorage
  function restoreSessionFromLocalStorage() {
    try {
      const persistedData = localStorage.getItem(STORAGE_KEY);
      if (persistedData) {
        sessionStorage.setItem(STORAGE_KEY, persistedData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error restoring session from localStorage:', error);
      return false;
    }
  }

  // Xóa dữ liệu đã lưu trong localStorage
  function clearPersistedSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing persisted session:', error);
      return false;
    }
  }

  // Kiểm tra xem có session đã lưu không
  function hasPersistedSession() {
    try {
      const persistedData = localStorage.getItem(STORAGE_KEY);
      return !!persistedData;
    } catch (error) {
      return false;
    }
  }

  // Tự động lưu trước khi đóng cửa sổ
  if (typeof window !== "undefined") {
    window.addEventListener('beforeunload', () => {
      persistSessionToLocalStorage();
    });
  }

  if (typeof window !== "undefined") {
    window.sessionStorageManager = {
      saveFormData,
      getAllSessionData,
      getAvailableMenGroups,
      getMenGroupData,
      clearAllSessionData,
      persistSessionToLocalStorage,
      restoreSessionFromLocalStorage,
      clearPersistedSession,
      hasPersistedSession,
    };
  }
})();