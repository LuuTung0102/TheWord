(function() {
  class ConfigGenerator {
    generateTemplateEntry(fileName, analysis, existingConfig = null) {
      const id = this._generateTemplateId(fileName);
      const { placeholders } = analysis;
      const analyzer = new window.PlaceholderAnalyzer();
      const suggestionResult = analyzer.suggestSubgroupMapping(
        placeholders,
        existingConfig || { fieldSchemas: this._getDefaultFieldSchemas(), fieldMappings: this._getDefaultFieldMappings() }
      );
      
      const matchResult = this.matchFieldSchemas(
        placeholders, 
        existingConfig?.fieldSchemas || this._getDefaultFieldSchemas()
      );

      const placeholdersByGroup = this._createPlaceholderMapping(
        placeholders,
        matchResult,
        existingConfig,
        suggestionResult
      );
      
      return {
        id,
        filename: fileName,
        name: this._generateTemplateName(fileName),
        description: '',
        groups: [],
        placeholders: {},
        _metadata: {
          placeholderToSubgroup: suggestionResult.placeholderToSubgroup,
          autoCreatedSubgroups: suggestionResult.autoCreatedSubgroups,
          suggestedGroups: matchResult.groups,
          suggestedPlaceholders: placeholdersByGroup
        }
      };
    }

    matchFieldSchemas(placeholders, fieldSchemas) {
      const matches = new Map();
      const unmatchedPlaceholders = [];
      const pattern = /^([A-Za-z_]+?)(\d+)?$/;
      
      for (const placeholder of placeholders) {
        const match = placeholder.match(pattern);
        if (!match) {
          unmatchedPlaceholders.push(placeholder);
          continue;
        }
        
        const baseName = match[1];
        const suffix = match[2] || '';
        let foundMatch = false;
        
        for (const [schemaName, schema] of Object.entries(fieldSchemas)) {
          const field = schema.fields.find(f => f.name === baseName);
          
          if (field) {
            if (!matches.has(baseName)) {
              matches.set(baseName, {
                schema: schemaName,
                applicableGroups: schema.applicableTo || [],
                suffixes: new Set()
              });
            }
            
            if (suffix) {
              matches.get(baseName).suffixes.add(suffix);
            }
            
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          unmatchedPlaceholders.push(placeholder);
        }
      }
      
      const groupsSet = new Set();
      const schemaToGroups = new Map();
      
      for (const [baseName, matchInfo] of matches.entries()) {
        matchInfo.applicableGroups.forEach(group => {
          groupsSet.add(group);
          
          if (!schemaToGroups.has(matchInfo.schema)) {
            schemaToGroups.set(matchInfo.schema, new Set());
          }
          schemaToGroups.get(matchInfo.schema).add(group);
        });
      }
      
      return {
        groups: Array.from(groupsSet),
        matches,
        schemaToGroups,
        unmatchedPlaceholders
      };
    }

    createDefaultConfig() {
      return {
        templates: [],
        groups: [
          { id: "BCN", label: "Bên chuyển nhượng", order: 1, description: "Người chuyển nhượng" },
          { id: "BNCN", label: "Bên nhận chuyển nhượng", order: 2, description: "Người nhận chuyển nhượng" },
          { id: "BCT", label: "Bên công trình", order: 3, description: "Người chuyển nhượng công trình" },
          { id: "NCN", label: "Bên nhận", order: 4, description: "Người nhận" },
          { id: "LAND", label: "Thông tin đất", order: 5, description: "Thông tin đất đai" }
        ],
        fieldSchemas: this._getDefaultFieldSchemas(),
        fieldMappings: this._getDefaultFieldMappings()
      };
    }

    _generateTemplateId(fileName) {
      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

    _generateTemplateName(fileName) {
      return fileName.replace(/\.[^/.]+$/, '');
  }

    _createPlaceholderMapping(placeholders, matchResult, existingConfig, suggestionResult) {
      const mapping = {};
      const { groups } = matchResult;
      const { suggestedMapping } = suggestionResult;
      const existingMappings = existingConfig?.fieldMappings || [];
      
      for (const group of groups) {
        if (suggestedMapping[group]) {
          const subgroupIds = Object.keys(suggestedMapping[group]);
          mapping[group] = subgroupIds;
          
          const fieldMapping = existingMappings.find(fm => fm.group === group);
          if (fieldMapping) {
            const newSuffixes = [];
            for (const subgroupId of subgroupIds) {
              const suffixMatch = subgroupId.match(/^MEN(\d+)$/);
              if (suffixMatch) {
                const suffix = suffixMatch[1];
                if (fieldMapping.suffixes && !fieldMapping.suffixes.includes(suffix)) {
                  newSuffixes.push(suffix);
                }
              }
            }
            
            if (newSuffixes.length > 0) {
              this._expandFieldMapping(fieldMapping, newSuffixes);
            }
          }
        } else {
          mapping[group] = [];
        }
      }
      
      return mapping;
    }

    _getSuffixesForGroup(group, matches, existingMappings) {
      const suffixesSet = new Set();
      for (const [, matchInfo] of matches.entries()) {
        if (matchInfo.applicableGroups.includes(group)) {
          matchInfo.suffixes.forEach(suffix => suffixesSet.add(suffix));
        }
      }
      
      const suffixes = Array.from(suffixesSet).sort((a, b) => parseInt(a) - parseInt(b));
      
      if (suffixes.length === 0) {
        const existingMapping = existingMappings.find(fm => fm.group === group);
        if (existingMapping?.suffixes) {
          return existingMapping.suffixes.slice(0, 1);
        }
      }
      
      return suffixes;
    }

    _expandFieldMapping(fieldMapping, newSuffixes) {
      const existingSuffixes = fieldMapping.suffixes || [];
      const existingSubgroups = fieldMapping.subgroups || [];
      
      for (const suffix of newSuffixes) {
        if (!existingSuffixes.includes(suffix)) {
          existingSuffixes.push(suffix);
          existingSubgroups.push(this._generateSubgroupFromPattern(fieldMapping.group, suffix, existingSubgroups[0]));
        }
      }
      
      existingSuffixes.sort((a, b) => parseInt(a) - parseInt(b));
      return fieldMapping;
    }

    _generateSubgroupFromPattern(group, suffix, templateSubgroup) {
      return {
        id: `MEN${suffix}`,
        label: templateSubgroup?.label || "Thông tin cá nhân",
        visible: false
      };
    }

    _getDefaultFieldSchemas() {
      return {
        PersonalInfo: {
          description: "Thông tin cá nhân",
          applicableTo: ["BCN", "BCT", "NCN", "BNCN"],
          fields: [
            { name: "Gender", label: "Giới tính", type: "select", options: ["Ông", "Bà"], required: true },
            { name: "Name", label: "Họ và tên", type: "text", required: true },
            { name: "Date", label: "Ngày sinh", type: "date", required: true },
            { name: "CCCD", label: "CCCD", type: "number", required: true },
            { name: "Noi_Cap", label: "Nơi cấp", type: "text", required: true },
            { name: "Ngay_Cap", label: "Ngày cấp", type: "date", required: true },
            { name: "Address", label: "Địa chỉ", type: "address-select", required: true }
          ]
        },
        LandInfo: {
          description: "Thông tin đất đai",
          applicableTo: ["LAND"],
          fields: [
            { name: "S", label: "Diện tích (m²)", type: "number", required: true },
            { name: "Loai_Dat", label: "Loại đất", type: "text", required: true },
            { name: "Money", label: "Giá trị", type: "currency", required: true }
          ]
        }
      };
    }

    _getDefaultFieldMappings() {
      return [];
    }
}

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigGenerator;
  }

  if (typeof window !== 'undefined') {
    window.ConfigGenerator = ConfigGenerator;
  }
})();
