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
      console.error('Error analyzing placeholders:', error);
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
        return schema.applicableTo[0];
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
    
    for (const placeholder of placeholders) {
      const { baseName, suffix } = this.parsePlaceholder(placeholder);
      const group = this.findGroupFromFieldSchemas(baseName, fieldSchemas);
      
      if (!group) {
        continue;
      }
      
      const fieldMapping = fieldMappings.find(fm => fm.group === group);
      if (!fieldMapping) {
        continue;
      }
      
      let subgroup;
      if (suffix && fieldMapping.suffixes) {
        const suffixIndex = fieldMapping.suffixes.indexOf(suffix);
        if (suffixIndex >= 0) {
          subgroup = fieldMapping.subgroups[suffixIndex].id;
        } else {
          const newSubgroup = this.createNewSubgroup(group, suffix, fieldMapping);
          subgroup = newSubgroup.id;
          autoCreatedSubgroups.push({
            groupId: group,
            subgroupId: newSubgroup.id,
            label: newSubgroup.label,
            visible: newSubgroup.visible
          });
        }
      } else {
        subgroup = fieldMapping.subgroups[0].id;
      }
      
      if (!suggestedMapping[group]) {
        suggestedMapping[group] = {};
      }
      if (!suggestedMapping[group][subgroup]) {
        suggestedMapping[group][subgroup] = [];
      }
      suggestedMapping[group][subgroup].push(placeholder);
      placeholderToSubgroup[placeholder] = {
        group: group,
        subgroup: subgroup
      };
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
