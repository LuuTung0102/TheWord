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

    const allKeys = new Set([
      ...Object.keys(sourceData),
      ...Object.keys(currentData),
    ]);

    for (const key of allKeys) {
      const sourceValue = sourceData[key];
      const currentValue = currentData[key];

      const sourceEmpty = isEmpty(sourceValue);
      const currentEmpty = isEmpty(currentValue);

      if (!sourceEmpty && !currentEmpty && sourceValue !== currentValue) {
        hasModifications = true;
      } else if (sourceEmpty && !currentEmpty) {
        hasAdditions = true;
      }
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

      if (reusedGroups?.size > 0) {
        reusedGroups.forEach((reusedKey) => {
          const isFromLocalStorage = reusedKey.startsWith("localStorage:");
          const groupKey = isFromLocalStorage
            ? reusedKey.replace("localStorage:", "")
            : reusedKey;

          if (!dataGroups[groupKey]) return;

          // Nếu lấy từ localStorage -> không lưu
          if (isFromLocalStorage) {
            groupsToRemove.push(groupKey);
            return;
          }

          // 🔍 Lấy thông tin source từ reusedGroupSources
          const sourceInfo = reusedGroupSources?.get?.(reusedKey); // {sourceFileName, sourceGroupKey, sourceData}
          
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

          console.log(`📊 ${sourceGroupKey} (${sourceFileName}) → ${groupKey} (${fileName})`);
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
              // HAS_MODIFICATIONS → Giữ session nguồn, tạo session mới
              console.log(`📘 MEN: Copy và sửa → Giữ cả 2 sessions (không merge)`);
              // dataGroups[groupKey] giữ nguyên current data (không merge source)
              // Session nguồn vẫn tồn tại trong file nguồn
            }
          }

          // ======== Xử lý LAND ==========
          else if (groupKey.startsWith("LAND")) {
            if (changeAnalysis.type === "NO_CHANGE") {
              if (isSameFile) {
                console.log(`🌍 LAND: Copy không sửa + cùng file → Giữ nguyên session`);
                // Không xóa, giữ nguyên session
              } else {
                console.log(`🌍 LAND: Copy không sửa + khác file → Không lưu duplicate`);
                groupsToRemove.push(groupKey);
              }
            } else if (changeAnalysis.type === "ONLY_ADDITIONS") {
              if (isSameFile) {
                console.log(`🌍 LAND: Copy và thêm field mới + cùng file → Gộp dữ liệu`);
                dataGroups[groupKey] = {
                  ...normalizedSource,
                  ...normalizedCurrent,
                };
              } else {
                console.log(`🌍 LAND: Copy và thêm field mới + khác file → Tạo session mới, xóa session cũ`);
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
              // HAS_MODIFICATIONS → Giữ session nguồn, tạo session mới
              console.log(`🌍 LAND: Copy và sửa → Giữ cả 2 sessions (không merge)`);
              // dataGroups[groupKey] giữ nguyên current data (không merge source)
            }
          }

          // ======== Nhóm khác (INFO, OTHER...) ==========
          else {
            if (changeAnalysis.type === "NO_CHANGE") {
              if (isSameFile) {
                console.log(`📦 ${groupKey}: Copy không sửa + cùng file → Giữ nguyên session`);
                // Không xóa, giữ nguyên session
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
              // HAS_MODIFICATIONS → Giữ session nguồn, tạo session mới
              console.log(`📦 ${groupKey}: Copy và sửa → Giữ cả 2 sessions (không merge)`);
              // dataGroups[groupKey] giữ nguyên current data (không merge source)
            }
          }
        });
      }

      // ❌ Xoá nhóm không cần lưu
      groupsToRemove.forEach((groupKey) => delete dataGroups[groupKey]);

      // 🧹 Cleanup: Xóa files không còn session nào
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
