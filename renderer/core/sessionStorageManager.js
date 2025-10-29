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

  function saveFormData(fileName, formData, reusedGroups, reusedGroupSources, config) {
    try {
      const existingData = getAllSessionData();
      let menGroups = parseFormDataToMenGroups(formData);
      
      if (config && config.fieldMappings) {
        config.fieldMappings.forEach(mapping => {
          if (mapping.source === 'localStorage' && mapping.subgroups) {
            mapping.subgroups.forEach(subgroup => {
              const groupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
              if (menGroups[groupId]) delete menGroups[groupId];
            });
          }
        });
      }
      
      const groupsToRemove = [];
      if (reusedGroups && reusedGroups.size > 0) {
        reusedGroups.forEach(reusedKey => {
          const isFromLocalStorage = reusedKey.startsWith('localStorage:');
          const groupKey = isFromLocalStorage ? reusedKey.replace('localStorage:', '') : reusedKey;
          
          if (menGroups[groupKey]) {
            if (isFromLocalStorage) {
              groupsToRemove.push(groupKey);
              return;
            }
            
            const sourceData = window.sessionStorageManager.findGroupDataFromAnyFile(groupKey);
            if (sourceData) {
              const normalizedCurrent = normalizeDataForComparison(menGroups[groupKey]);
              const normalizedSource = normalizeDataForComparison(sourceData);
              
              if (JSON.stringify(normalizedCurrent) === JSON.stringify(normalizedSource)) {
                groupsToRemove.push(groupKey);
              }
            }
          }
        });
      }
      
      groupsToRemove.forEach(groupKey => delete menGroups[groupKey]);
      
      if (Object.keys(menGroups).length === 0) {
        return false;
      }
      
      existingData[fileName] = {
        fileName: fileName,
        menGroups: menGroups,
        rawData: formData
      };
      
      if (reusedGroupSources && reusedGroupSources.size > 0) {
        reusedGroupSources.forEach((sourceInfo, targetGroupKey) => {
          const { sourceFileName, sourceGroupKey, sourceData } = sourceInfo;
          if (!sourceFileName || !sourceGroupKey || !sourceData) return;
          
          const targetData = menGroups[targetGroupKey];
          if (!targetData) return;
          
          const sourceFields = Object.keys(sourceData).filter(k => sourceData[k] && sourceData[k] !== '');
          const targetFields = Object.keys(targetData).filter(k => targetData[k] && targetData[k] !== '');
          
          if (targetFields.length > sourceFields.length) {
            if (existingData[sourceFileName] && existingData[sourceFileName].menGroups[sourceGroupKey]) {
              delete existingData[sourceFileName].menGroups[sourceGroupKey];
              
              if (Object.keys(existingData[sourceFileName].menGroups).length === 0) {
                delete existingData[sourceFileName];
              }
            }
          }
        });
      }
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
      return true;
    } catch (error) {
      console.error('❌ Error saving session data:', error);
      return false;
    }
  }

  function parseFormDataToMenGroups(formData) {
    const groups = {};
    Object.keys(formData).forEach(key => {
      const matchWithSuffix = key.match(/^([A-Za-z_]+?)(\d+)$/);
      if (matchWithSuffix) {
        const groupKey = `MEN${matchWithSuffix[2]}`;
        if (!groups[groupKey]) groups[groupKey] = {};
        groups[groupKey][matchWithSuffix[1]] = formData[key];
      } else {
        const groupKey = determineGroupByFieldName(key);
        if (!groups[groupKey]) groups[groupKey] = {};
        groups[groupKey][key] = formData[key];
      }
    });
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
      if (fileData.menGroups) {
        Object.keys(fileData.menGroups).forEach(groupKey => {
          const groupData = fileData.menGroups[groupKey];
          const shortFileName = fileName.replace('.docx', '');
          
          const displayName = groupKey.startsWith('MEN')
            ? `${groupData.Name || groupData.name || 'Chưa có tên'} (${shortFileName})`
            : `${groupKey} (${shortFileName})`;
          
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
    if (allData[fileName] && allData[fileName].menGroups && allData[fileName].menGroups[menKey]) {
      return allData[fileName].menGroups[menKey];
    }
    return null;
  }

  function findGroupDataFromAnyFile(groupKey) {
    const allData = getAllSessionData();
    for (const fileName in allData) {
      const fileData = allData[fileName];
      if (fileData.menGroups && fileData.menGroups[groupKey]) {
        return fileData.menGroups[groupKey];
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

