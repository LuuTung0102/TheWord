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
      
      const fieldInput = document.querySelector(`[data-ph="${key}"]`);
      const fieldType = fieldInput?.getAttribute('data-type');
      if (fieldType === 'land_type' || fieldType === 'land_type_size' || fieldType === 'land_type_detail') {
        continue;
      }
      
      if (fieldType === 'htsd_custom') {
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

    const result = !hasModifications && !hasAdditions ? "NO_CHANGE" 
                 : !hasModifications && hasAdditions ? "ONLY_ADDITIONS" 
                 : "HAS_MODIFICATIONS";
    
    return { type: result };
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
    if (groupKey.startsWith('INFO')) return 'INFO';
    return groupKey; 
  }

  function mergeDuplicateGroupsAcrossFiles(dataGroups, existingData, fileName) {
    if (!dataGroups || !existingData) return;
    const groupsToDelete = new Set();

    for (const [groupKey, groupData] of Object.entries(dataGroups)) {
      for (const [otherFile, otherFileData] of Object.entries(existingData)) {
        if (!otherFileData || !otherFileData.dataGroups) continue;

        for (const [otherGroupKey, otherGroupData] of Object.entries(otherFileData.dataGroups)) {
          if (otherFile === fileName) continue;
          const currentBase = groupKey.replace(/_\d{8}_\d{6,9}$/, '');
          const otherBase = otherGroupKey.replace(/_\d{8}_\d{6,9}$/, '');
          const isExactMatch = currentBase === otherBase;
          const currentType = getGroupType(currentBase);
          const otherType = getGroupType(otherBase);
          const isSameType = currentType === otherType;
          if (!isExactMatch && !isSameType) continue;

          const normalizedOther = normalizeDataForComparison(otherGroupData);
          const normalizedCurrent = normalizeDataForComparison(groupData);
          const changeAnalysis = analyzeChanges(normalizedOther, normalizedCurrent);
          
          if (!isExactMatch && changeAnalysis.type === "HAS_MODIFICATIONS") {
            continue;
          }
          
          if (changeAnalysis.type === "NO_CHANGE") {
            groupsToDelete.add(groupKey);
            break;
          } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
            const merged = {
              ...otherGroupData,
              ...groupData 
            };
            

            
            existingData[otherFile].dataGroups[otherGroupKey] = merged;
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
          try {
            const isFromLocalStorage = reusedKey.startsWith("localStorage:");
            const groupKey = isFromLocalStorage ? reusedKey.replace("localStorage:", "") : reusedKey;
          
          if (!dataGroups[groupKey]) {
            const sourceInfo = reusedGroupSources?.get?.(reusedKey);
            if (!sourceInfo || !sourceInfo.sourceData) {
              return;
            }
            
            const sourceFileName = sourceInfo.sourceFileName;
            const sourceGroupKey = sourceInfo.sourceGroupKey;
            
            let htsdUpdated = false;
            const htsdUpdates = {};
            const allHtsdInputs = document.querySelectorAll('[data-type="htsd_custom"]');
            
            allHtsdInputs.forEach(htsdInput => {
              const htsdFieldNameInDOM = htsdInput.getAttribute('data-ph');
              if (!htsdFieldNameInDOM) return;
              const baseFieldName = htsdFieldNameInDOM.replace(/\d+$/, '');
              const suffix = htsdFieldNameInDOM.replace(baseFieldName, '');
              const groupSuffix = groupKey.replace(/^[A-Z]+/, '');
              if (suffix !== groupSuffix) return;
              
              const fieldBelongsToGroup = sourceInfo.sourceData.hasOwnProperty(htsdFieldNameInDOM) || 
                                          sourceInfo.sourceData.hasOwnProperty(baseFieldName) ||
                                          (groupKey.startsWith('INFO') && htsdFieldNameInDOM.match(/^HTSD\d*$/));
              
              if (!fieldBelongsToGroup) return;
              
              const htsdContainer = htsdInput.closest('[data-field-type="htsd_custom"]');
              if (!htsdContainer) return;
              
              const loai1Active = htsdContainer.querySelector('.htsd-toggle-loai1')?.classList.contains('active') || false;
              const loai2Active = htsdContainer.querySelector('.htsd-toggle-loai2')?.classList.contains('active') || false;
              
              if (!loai1Active && !loai2Active) return;
              
              let printMode = null;
              if (loai1Active && !loai2Active) printMode = 'loai1';
              else if (loai2Active && !loai1Active) printMode = 'loai2';
              else if (loai1Active && loai2Active) printMode = 'both';
              
              const htsdValue = htsdInput.value.trim();
              let targetFieldName = htsdFieldNameInDOM;
              if (!sourceInfo.sourceData.hasOwnProperty(htsdFieldNameInDOM) && 
                  sourceInfo.sourceData.hasOwnProperty(baseFieldName)) {
                targetFieldName = baseFieldName;
              }
              
              htsdUpdates[targetFieldName] = {
                value: htsdValue || '',
                printMode: printMode
              };
              
              htsdUpdated = true;
            });
            
            if (htsdUpdated && existingData[sourceFileName]?.dataGroups?.[sourceGroupKey]) {
              Object.keys(htsdUpdates).forEach(htsdFieldName => {
                existingData[sourceFileName].dataGroups[sourceGroupKey][htsdFieldName] = htsdUpdates[htsdFieldName];
              });
            }
            
            return;
          }
          
          if (isFromLocalStorage) {
            groupsToRemove.push(groupKey);
            return;
          }
          const sourceInfo = reusedGroupSources?.get?.(reusedKey);
          if (!sourceInfo || !sourceInfo.sourceData) return;
          const sourceData = sourceInfo.sourceData;
          const sourceFileName = sourceInfo.sourceFileName;
          const sourceGroupKey = sourceInfo.sourceGroupKey;
          const allHtsdInputs = document.querySelectorAll('[data-type="htsd_custom"]');
          allHtsdInputs.forEach(htsdInput => {
            try {
              const htsdFieldNameInDOM = htsdInput.getAttribute('data-ph');
              if (!htsdFieldNameInDOM) return;
              let matchedFieldName = null;
              if (dataGroups[groupKey].hasOwnProperty(htsdFieldNameInDOM)) {
                matchedFieldName = htsdFieldNameInDOM;
              } else {
                const baseFieldName = htsdFieldNameInDOM.replace(/\d+$/, '');
                if (dataGroups[groupKey].hasOwnProperty(baseFieldName)) {
                  const suffix = htsdFieldNameInDOM.replace(baseFieldName, '');
                  const groupSuffix = groupKey.replace(/^[A-Z]+/, '');
                  if (suffix === groupSuffix) {
                    matchedFieldName = baseFieldName;
                  }
                }
              }
              
              if (!matchedFieldName) return;
              
              const htsdContainer = htsdInput.closest('[data-field-type="htsd_custom"]');
              if (!htsdContainer) return;
              const loai1Active = htsdContainer.querySelector('.htsd-toggle-loai1')?.classList.contains('active') || false;
              const loai2Active = htsdContainer.querySelector('.htsd-toggle-loai2')?.classList.contains('active') || false;
              if (!loai1Active && !loai2Active) return;
              let printMode = null;
              if (loai1Active && !loai2Active) printMode = 'loai1';
              else if (loai2Active && !loai1Active) printMode = 'loai2';
              else if (loai1Active && loai2Active) printMode = 'both';
              const htsdValue = htsdInput.value.trim();
              dataGroups[groupKey][matchedFieldName] = {
                value: htsdValue || '',
                printMode: printMode
              };
            } catch (err) {
              console.error('Error processing HTSD input:', err);
            }
          });
          
          const normalizedCurrent = normalizeDataForComparison(dataGroups[groupKey]);
          const normalizedSource = normalizeDataForComparison(sourceData);
          const changeAnalysis = analyzeChanges(normalizedSource, normalizedCurrent);

          if (changeAnalysis.type === "NO_CHANGE" || changeAnalysis.type === "ONLY_ADDITIONS") {
            const mergedData = { ...sourceData };
            Object.keys(dataGroups[groupKey]).forEach(key => {
              mergedData[key] = dataGroups[groupKey][key];
            });
            
            dataGroups[groupKey] = mergedData;
          } else {
          }
          } catch (err) {
            console.error(`Error processing reused group ${reusedKey}:`, err);
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
              ...otherGroups[groupKey],
              ...dataGroups[groupKey]
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
        const currentBase = groupKey.replace(/_\d{8}_\d{6,9}$/, '');
        let matchedKey = null;
        let isExactMatch = false;
        let bestMatchScore = -1;
        const candidates = [];
        if (mergedDataGroups[groupKey]) {
          candidates.push({ key: groupKey, isExact: true });
        }
        const currentType = getGroupType(currentBase);
        for (const oldKey of Object.keys(mergedDataGroups)) {
          if (oldKey === groupKey) continue;
          const oldBase = oldKey.replace(/_\d{8}_\d{6,9}$/, '');
          const oldType = getGroupType(oldBase);
          if (currentType === oldType) {
            candidates.push({ key: oldKey, isExact: false });
          }
        }
        
        for (const candidate of candidates) {
          const oldData = mergedDataGroups[candidate.key];
          const normalizedOld = normalizeDataForComparison(oldData);
          const normalizedNew = normalizeDataForComparison(newData);
          const analysis = analyzeChanges(normalizedOld, normalizedNew);
          let score = analysis.type === "NO_CHANGE" ? 100 
                    : analysis.type === "ONLY_ADDITIONS" ? 50 
                    : 0;
          if (candidate.isExact) score += 10;
          
          if (score > bestMatchScore) {
            bestMatchScore = score;
            matchedKey = candidate.key;
            isExactMatch = candidate.isExact;
          }
        }
        
        if (!matchedKey) {
          mergedDataGroups[groupKey] = newData;
        } else {
          const oldData = mergedDataGroups[matchedKey];
          try {
            if (!oldData || typeof oldData !== 'object') {
              const versionedKey = generateVersionedKey(groupKey, mergedDataGroups);
              mergedDataGroups[versionedKey] = newData;
              return;
            }
            
            const normalizedOld = normalizeDataForComparison(oldData);
            const normalizedNew = normalizeDataForComparison(newData);          
            const changeAnalysis = analyzeChanges(normalizedOld, normalizedNew);
            
            if (!isExactMatch && changeAnalysis.type === "HAS_MODIFICATIONS") {
              mergedDataGroups[groupKey] = newData;
              return;
            }
            
            if (changeAnalysis.type === "NO_CHANGE") {
              if (!isExactMatch && matchedKey !== groupKey) {
                delete dataGroups[groupKey];
              }
            } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
              const merged = {
                ...oldData,
                ...newData
              };
              mergedDataGroups[matchedKey] = merged;
              if (!isExactMatch && matchedKey !== groupKey) {
                delete dataGroups[groupKey];
              }
            } else {
              if (isExactMatch) {
                const versionedKey = generateVersionedKey(groupKey, mergedDataGroups);
                mergedDataGroups[versionedKey] = oldData;
                mergedDataGroups[groupKey] = newData;
              } else {
                mergedDataGroups[groupKey] = newData;
              }
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
    const fieldToGroupMap = {};
    const schemaToSuffixMap = {};
    
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
            if (mapping.schema) {
              if (!schemaToSuffixMap[mapping.schema]) {
                schemaToSuffixMap[mapping.schema] = {};
              }
              schemaToSuffixMap[mapping.schema][suffix] = subgroupId;
            }
            if (!suffixToGroupMap[suffix]) {
              suffixToGroupMap[suffix] = [];
            }
            suffixToGroupMap[suffix].push({groupId: subgroupId, schema: mapping.schema});
          });
        }
        
        if (mapping.schema && config.fieldSchemas && config.fieldSchemas[mapping.schema]) {
          const schemaFields = config.fieldSchemas[mapping.schema].fields || [];
          
          schemaFields.forEach(field => {
            if (!fieldToGroupMap[field.name]) {
              fieldToGroupMap[field.name] = [];
            }
            fieldToGroupMap[field.name].push({
              schema: mapping.schema,
              suffixes: mapping.suffixes || [""]
            });
          });
        }
      });
    }

    Object.keys(formData).forEach((key) => {
      const match = key.match(/^([A-Za-z_]+?)(\d+)$/);
      if (match) {
        const fieldName = match[1];
        const suffix = match[2];
        const fieldSchemas = fieldToGroupMap[fieldName];
        let groupKey = null;
        
        if (fieldSchemas && fieldSchemas.length > 0) {
          for (const fieldSchema of fieldSchemas) {
            if (schemaToSuffixMap[fieldSchema.schema] && schemaToSuffixMap[fieldSchema.schema][suffix]) {
              groupKey = schemaToSuffixMap[fieldSchema.schema][suffix];
              break;
            }
          }
        }
        if (!groupKey && suffixToGroupMap[suffix] && suffixToGroupMap[suffix].length > 0) {
          groupKey = suffixToGroupMap[suffix][0].groupId;
        }
        
        if (!groupKey) {
          groupKey = `UNKNOWN_${suffix}`;
        }
        
        if (!groups[groupKey]) groups[groupKey] = {};
        groups[groupKey][fieldName] = formData[key];
      } else {
        let groupKey = null;
        const fieldSchemas = fieldToGroupMap[key];
        
        if (fieldSchemas && fieldSchemas.length > 0) {
          for (const fieldSchema of fieldSchemas) {
            if (schemaToSuffixMap[fieldSchema.schema] && schemaToSuffixMap[fieldSchema.schema][""]) {
              groupKey = schemaToSuffixMap[fieldSchema.schema][""];
              break;
            }
          }
        }
        
        if (!groupKey && suffixToGroupMap[""] && suffixToGroupMap[""].length > 0) {
          groupKey = suffixToGroupMap[""][0].groupId;
        }
        
        if (!groupKey) {
          groupKey = "OTHER";
        }
        
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
            } else if (baseKey.startsWith('INFO')) {
              displayName = `${groupData.QSH || 'TT thửa đất'} (${shortFileName} - ${formattedTime})`;
            } else if (baseKey.startsWith('HOME')) {
              displayName = `Thông tin khác (${shortFileName} - ${formattedTime})`;
            } else {
              displayName = `${baseKey} (${shortFileName} - ${formattedTime})`;
            }
          } else {
            if (groupKey.startsWith('MEN')) {
              displayName = `${groupData.Name || groupData.name || 'Chưa có tên'} (${shortFileName})`;
            } else if (groupKey.startsWith('INFO')) {
              displayName = `${groupData.QSH || 'TT thửa đất'} (${shortFileName})`;
            } else if (groupKey.startsWith('HOME')) {
              displayName = `Thông tin khác (${shortFileName})`;
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

  function persistSessionToLocalStorage() {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        localStorage.setItem(STORAGE_KEY, sessionData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi lưu session vào localStorage:', error);
      return false;
    }
  }

  function restoreSessionFromLocalStorage() {
    try {
      const persistedData = localStorage.getItem(STORAGE_KEY);
      if (persistedData) {
        sessionStorage.setItem(STORAGE_KEY, persistedData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khôi phục session từ localStorage:', error);
      return false;
    }
  }

  function clearPersistedSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Lỗi xóa session đã lưu:', error);
      return false;
    }
  }

  function hasPersistedSession() {
    try {
      const persistedData = localStorage.getItem(STORAGE_KEY);
      return !!persistedData;
    } catch (error) {
      return false;
    }
  }

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