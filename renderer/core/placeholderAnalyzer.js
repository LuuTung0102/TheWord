(function() {
  class PlaceholderAnalyzer {
    async analyzePlaceholders(filePath) {
    try {
      const placeholders = await window.ipcRenderer.invoke('get-placeholders', filePath);
      
      if (!placeholders || placeholders.length === 0) {
        return {
          placeholders: [],
          patterns: {
            withSuffix: new Map(),
            withoutSuffix: []
          },
          groups: {}
        };
      }

      const patterns = this.identifyPatterns(placeholders);
      const groups = this.groupPlaceholders(placeholders);

      return {
        placeholders,
        patterns,
        groups
      };
    } catch (error) {
      return {
        placeholders: [],
        patterns: {
          withSuffix: new Map(),
          withoutSuffix: []
        },
        groups: {}
      };
    }
  }

    identifyPatterns(placeholders) {
    const withSuffix = new Map();
    const withoutSuffix = [];
    const pattern = /^([A-Za-z_]+?)(\d+)?$/;

    for (const placeholder of placeholders) {
      const match = placeholder.match(pattern);
      if (!match) {
        withoutSuffix.push(placeholder);
        continue;
      }
      const baseName = match[1];
      const suffix = match[2];
      if (suffix) {
        if (!withSuffix.has(baseName)) {
          withSuffix.set(baseName, []);
        }
        withSuffix.get(baseName).push(suffix);
      } else {
        withoutSuffix.push(placeholder);
      }
    }
    return {
      withSuffix,
      withoutSuffix
    };
  }

    groupPlaceholders(placeholders) {
    const grouped = {};
    const pattern = /^([A-Za-z_]+?)(\d+)?$/;

    for (const placeholder of placeholders) {
      const match = placeholder.match(pattern);
      if (!match) {
        if (!grouped['Other']) {
          grouped['Other'] = {};
        }
        if (!grouped['Other']['default']) {
          grouped['Other']['default'] = [];
        }
        grouped['Other']['default'].push(placeholder);
        continue;
      }
      const baseName = match[1];
      const suffix = match[2] || 'default';
      const groupKey = baseName;
      if (!grouped[groupKey]) {
        grouped[groupKey] = {};
      }
      if (!grouped[groupKey][suffix]) {
        grouped[groupKey][suffix] = [];
      }
      grouped[groupKey][suffix].push(placeholder);
    }
    return grouped;
  }

    parsePlaceholder(placeholder) {
    const match = placeholder.match(/^([A-Za-z_]+?)(\d+)$/);
    if (match) {
      return { baseName: match[1], suffix: match[2] };
    }
    return { baseName: placeholder, suffix: null };
  }

    findGroupFromFieldSchemas(baseName, fieldSchemas) {
      for (const [schemaName, schema] of Object.entries(fieldSchemas)) {
        const field = schema.fields.find(f => f.name === baseName);
        if (field && schema.applicableTo && schema.applicableTo.length > 0) {
          return schema.applicableTo;
        }
      }
      return null;
    }

    createNewSubgroup(group, suffix, fieldMapping) {
    const firstSubgroup = fieldMapping.subgroups[0];
    const label = firstSubgroup.label;
    const id = `MEN${suffix}`;
    
    return {
      id: id,
      label: label,
      visible: false
    };
  }

    suggestSubgroupMapping(placeholders, existingConfig) {
      const fieldSchemas = existingConfig.fieldSchemas || {};
      const fieldMappings = existingConfig.fieldMappings || [];
      
      const suggestedMapping = {};
      const autoCreatedSubgroups = [];
      const placeholderToSubgroup = {};
      const groupSubgroupMap = new Map();
      
      for (const placeholder of placeholders) {
        const { baseName, suffix } = this.parsePlaceholder(placeholder);
        const applicableGroups = this.findGroupFromFieldSchemas(baseName, fieldSchemas);
        
        if (!applicableGroups || applicableGroups.length === 0) {
          continue;
        }
        
        if (suffix) {
          for (const group of applicableGroups) {
            const fieldMapping = fieldMappings.find(fm => fm.group === group);
            if (!fieldMapping || !fieldMapping.suffixes) continue;
            
            const suffixIndex = fieldMapping.suffixes.indexOf(suffix);
            if (suffixIndex >= 0) {
              const subgroupId = fieldMapping.subgroups[suffixIndex].id;
              const key = `${group}:${subgroupId}`;
              
              if (!groupSubgroupMap.has(key)) {
                groupSubgroupMap.set(key, {
                  group,
                  subgroupId,
                  placeholders: []
                });
              }
              groupSubgroupMap.get(key).placeholders.push(placeholder);
              
              placeholderToSubgroup[placeholder] = {
                group,
                subgroup: subgroupId
              };
            }
          }
        } else {
          for (const group of applicableGroups) {
            const fieldMapping = fieldMappings.find(fm => fm.group === group);
            if (!fieldMapping) continue;
            
            const subgroupId = fieldMapping.subgroups[0].id;
            const key = `${group}:${subgroupId}`;
            
            if (!groupSubgroupMap.has(key)) {
              groupSubgroupMap.set(key, {
                group,
                subgroupId,
                placeholders: []
              });
            }
            groupSubgroupMap.get(key).placeholders.push(placeholder);
            
            placeholderToSubgroup[placeholder] = {
              group,
              subgroup: subgroupId
            };
          }
        }
      }
      
      for (const [key, data] of groupSubgroupMap.entries()) {
        if (!suggestedMapping[data.group]) {
          suggestedMapping[data.group] = {};
        }
        if (!suggestedMapping[data.group][data.subgroupId]) {
          suggestedMapping[data.group][data.subgroupId] = [];
        }
        suggestedMapping[data.group][data.subgroupId].push(...data.placeholders);
        
        const existingSubgroup = autoCreatedSubgroups.find(
          sg => sg.groupId === data.group && sg.subgroupId === data.subgroupId
        );
        if (!existingSubgroup) {
          const fieldMapping = fieldMappings.find(fm => fm.group === data.group);
          const subgroup = fieldMapping?.subgroups?.find(sg => sg.id === data.subgroupId);
          
          autoCreatedSubgroups.push({
            groupId: data.group,
            subgroupId: data.subgroupId,
            label: subgroup?.label || 'Thông tin',
            visible: subgroup?.visible !== undefined ? subgroup.visible : false
          });
        }
      }
      
      return {
        suggestedMapping,
        autoCreatedSubgroups,
        placeholderToSubgroup
      };
    }
}

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaceholderAnalyzer;
  }

  if (typeof window !== 'undefined') {
    window.PlaceholderAnalyzer = PlaceholderAnalyzer;
  }
})();
