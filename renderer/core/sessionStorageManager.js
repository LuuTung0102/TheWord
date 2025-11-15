(function () {
  const STORAGE_KEY = "theword_session_data";

  function normalizeDataForComparison(data) {
    const normalized = {};
    Object.keys(data).forEach((key) => {
      if (key === 'Loai_Dat_F' && data.Loai_Dat_D) return;
      if (key === 'Loai_Dat' && (data.Loai_Dat_D || data.Loai_Dat_F)) return;
      
      let value = data[key];
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
    
    if (differences.length > 0) {}

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

  function getGroupType(groupKey) {
    if (groupKey.startsWith('MEN')) return 'MEN';
    if (groupKey === 'INFO') return 'INFO';
    return groupKey; // For other groups, treat the key itself as the type
  }

  // --- helper: merge duplicates into existingData ---
  function mergeDuplicateGroupsAcrossFiles(dataGroups, existingData, fileName) {
    if (!dataGroups || !existingData) return;
    const groupsToDelete = new Set();

    for (const [groupKey, groupData] of Object.entries(dataGroups)) {
      const normalizedCurrent = normalizeDataForComparison(groupData);
      const currentType = getGroupType(groupKey);

      // compare with all saved files
      for (const [otherFile, otherFileData] of Object.entries(existingData)) {
        if (!otherFileData || !otherFileData.dataGroups) continue;

        for (const [otherGroupKey, otherGroupData] of Object.entries(otherFileData.dataGroups)) {
          // skip if same file (we'll handle same-file logic elsewhere)
          if (otherFile === fileName) continue;

          const otherType = getGroupType(otherGroupKey);
          if (currentType !== otherType) continue;

          const normalizedOther = normalizeDataForComparison(otherGroupData);
          const changeAnalysis = analyzeChanges(normalizedOther, normalizedCurrent);

          // if identical or current only adds fields -> merge into other file
          if (changeAnalysis.type === "NO_CHANGE" || changeAnalysis.type === "ONLY_ADDITIONS") {
            existingData[otherFile].dataGroups[otherGroupKey] = {
              ...normalizedOther,
              ...normalizedCurrent
            };
            groupsToDelete.add(groupKey);
            console.log(`🔄 Merged ${groupKey} (from ${fileName}) --> ${otherGroupKey} (in ${otherFile})`);
            // don't `return` here — continue checking other groups
            break; // stop scanning other groups in this otherFile for this groupKey
          }
        }
        if (groupsToDelete.has(groupKey)) break; // go next groupKey
      }
    }

    // perform deletions after scanning
    for (const g of groupsToDelete) {
      delete dataGroups[g];
    }
  }

  // --- corrected saveFormData ---
  function saveFormData(fileName, formData, reusedGroups, reusedGroupSources, config) {
    try {
      console.log('💾 saveFormData called:', { fileName, formData });

      const existingData = getAllSessionData();
      let dataGroups = parseFormDataToGroups(formData, config);
      console.log('📦 Parsed data groups:', dataGroups);

      // First: remove groups that are supplied from localStorage via config
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

      // NEW: merge duplicates across existingData BEFORE creating a new session entry
      mergeDuplicateGroupsAcrossFiles(dataGroups, existingData, fileName);

      // Process reusedGroups (existing logic) - keep but ensure it uses updated dataGroups & existingData
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

          if (changeAnalysis.type === "NO_CHANGE" && !isSameFile) {
            groupsToRemove.push(groupKey);
          } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
            if (!isSameFile && existingData[sourceFileName]) {
              // merge into source file and remove current
              existingData[sourceFileName].dataGroups = existingData[sourceFileName].dataGroups || {};
              existingData[sourceFileName].dataGroups[sourceGroupKey] = {
                ...normalizedSource,
                ...normalizedCurrent
              };
              groupsToRemove.push(groupKey);
            } else {
              dataGroups[groupKey] = { ...normalizedSource, ...normalizedCurrent };
            }
          }
          // HAS_MODIFICATIONS => keep current (no automatic override)
        });
      }

      // delete groups marked by reusedGroups
      groupsToRemove.forEach(g => delete dataGroups[g]);

      // Deduplicate remaining groups against existingData (if any left)
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
            // identical -> remove current group
            delete dataGroups[groupKey];
            break;
          } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
            // merge into existing other file and remove current
            existingData[otherFileName].dataGroups[groupKey] = {
              ...normalizedOther,
              ...normalizedCurrent
            };
            delete dataGroups[groupKey];
            break;
          }
          // HAS_MODIFICATIONS -> keep current
        }
      }

      // cleanup: remove empty files in existingData
      Object.keys(existingData).forEach(f => {
        const fd = existingData[f];
        if (fd?.dataGroups && Object.keys(fd.dataGroups).length === 0) delete existingData[f];
      });

      // If nothing to save for current file, still persist existingData (because merges may have happened)
      if (Object.keys(dataGroups).length === 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
        console.log('⚠️ No data groups to save for current file after merging/deduplication.');
        return false;
      }

      // Save resulting state (new or updated file)
      existingData[fileName] = {
        fileName,
        dataGroups,
        rawData: formData
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
      console.log('✅ Session storage saved successfully (with merges applied).');

      return true;
    } catch (err) {
      console.error('saveFormData error', err);
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