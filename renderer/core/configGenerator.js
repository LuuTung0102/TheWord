(function() {
  class ConfigGenerator {
    generateTemplateEntry(fileName, analysis, existingConfig = null) {
      const id = this._generateTemplateId(fileName);
      const { placeholders, patterns, groups: analyzedGroups } = analysis;
      const analyzer = new window.PlaceholderAnalyzer();
      const suggestionResult = analyzer.suggestSubgroupMapping(
        placeholders,
        existingConfig || { fieldSchemas: this._getDefaultFieldSchemas(), fieldMappings: this._getDefaultFieldMappings() }
      );
      
      const matchResult = this.matchFieldSchemas(
        placeholders, 
        existingConfig?.fieldSchemas || this._getDefaultFieldSchemas()
      );

      const groups = matchResult.groups;
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
        groups,
        placeholders: placeholdersByGroup,
        _metadata: {
          placeholderToSubgroup: suggestionResult.placeholderToSubgroup,
          autoCreatedSubgroups: suggestionResult.autoCreatedSubgroups
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

    createDefaultConfig(folderPath) {
      return {
      templates: [],
      groups: [
        {
          id: "BCN",
          label: "Bên chuyển nhượng",
          order: 1,
          description: "Người chuyển nhượng tài sản"
        },
        {
          id: "BNCN",
          label: "Bên nhận chuyển nhượng",
          order: 2,
          description: "Người nhận chuyển nhượng tài sản"
        },
        {
          id: "BCT",
          label: "Bên công trình",
          order: 3,
          description: "Người chuyển nhượng công trình"
        },
        {
          id: "NCN",
          label: "Bên nhận chuyển nhượng",
          order: 4,
          description: "Người nhận chuyển nhượng tài sản"
        },
        {
          id: "LAND",
          label: "Thông tin thửa đất",
          order: 5,
          description: "Thông tin đất đai, nhà cửa"
        }
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
    const { suggestedMapping, autoCreatedSubgroups } = suggestionResult;
    const existingMappings = existingConfig?.fieldMappings || this._getDefaultFieldMappings();
    
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
        // No placeholders for this group in the file - let user manually add subgroups
        mapping[group] = [];
      }
    }
    
    return mapping;
  }

    _getSuffixesForGroup(group, matches, existingMappings) {
      const suffixesSet = new Set();
    for (const [baseName, matchInfo] of matches.entries()) {
      if (matchInfo.applicableGroups.includes(group)) {
        matchInfo.suffixes.forEach(suffix => suffixesSet.add(suffix));
      }
    }
    
    const suffixes = Array.from(suffixesSet).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    
    if (suffixes.length === 0) {
      const existingMapping = existingMappings.find(fm => fm.group === group);
      if (existingMapping && existingMapping.suffixes) {
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
        const newSubgroup = this._generateSubgroupFromPattern(
          fieldMapping.group,
          suffix,
          existingSubgroups[0]
        );
        
        existingSubgroups.push(newSubgroup);
      }
    }
    
    existingSuffixes.sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    
    return fieldMapping;
  }

    _generateSubgroupFromPattern(group, suffix, templateSubgroup) {
      if (!templateSubgroup) {
      return {
        id: `MEN${suffix}`,
        label: "Thông tin cá nhân",
        visible: false
      };
    }
    
    const label = templateSubgroup.label;
    const id = `MEN${suffix}`;
    
    return {
      id: id,
      label: label,
      visible: false
    };
  }

    _getDefaultFieldSchemas() {
      return {
      PersonalInfo: {
        description: "Thông tin cá nhân của các bên",
        applicableTo: ["BCN", "BCT", "NCN", "BNCN"],
        fields: [
          { name: "Gender", label: "Giới tính", type: "select", options: ["Ông", "Bà"], defaultValue: "Ông", required: true },
          { name: "Name", label: "Họ và tên", type: "text", required: true },
          { name: "Date", label: "Ngày sinh", type: "date", required: true },
          { name: "CCCD", label: "CCCD", type: "number", required: true },
          { name: "MST", label: "Mã số thuế", type: "number", required: false },
          { name: "SDT", label: "Số điện thoại", type: "tel", required: false },
          { name: "Email", label: "Địa chỉ email", type: "email", required: false },
          { name: "Noi_Cap", label: "Nơi cấp", type: "select", options: ["Cục Cảnh sát QLHC về TTXH", "Công an T. Đắk Lắk"], required: true },
          { name: "Ngay_Cap", label: "Ngày cấp", type: "date", required: true },
          { name: "Address", label: "Địa chỉ thường trú", type: "address-select", required: true }
        ]
      },
      LandInfo: {
        description: "Thông tin đất đai",
        applicableTo: ["LAND"],
        fields: [
          { name: "QSH", label: "Quyền sử dụng đất", type: "text", required: true },
          { name: "So_so", label: "Số sổ", type: "text", required: true },
          { name: "Ngay_CapD", label: "Ngày cấp", type: "date", required: true },
          { name: "Thua_dat_so", label: "Thửa đất số", type: "text", required: true },
          { name: "Ban_do_so", label: "Bản đồ số", type: "text", required: true },
          { name: "S", label: "Diện tích (m²)", type: "number", required: true },
          { name: "S_Text", label: "Diện tích (chữ)", type: "text", hidden: true, required: false },
          { name: "Loai_Dat", label: "Loại đất", type: "land_type", required: true },
          { name: "Noi_CapD", label: "Nơi cấp", type: "textarea", required: true },
          { name: "NG", label: "Nguồn gốc", type: "textarea", required: true },
          { name: "Loai_Dat_F", label: "Loại đất (có diện tích)", type: "land_type_size", required: true },
          { name: "Loai_Dat_D", label: "Loại đất chi tiết", type: "land_type_detail", required: true },
          { name: "TDCSPL", label: "Thay đổi cơ sở pháp lý", type: "date", required: true },
          { name: "HTSD", label: "Hình thức sử dụng", type: "select", options: ["Sử dụng chung", "Sử dụng riêng"], required: true },
          { name: "THSD", label: "Thời hạn sử dụng", type: "textarea", required: true },
          { name: "AddressD", label: "Địa chỉ thửa đất", type: "address-select", required: true },
          { name: "TTGLVD", label: "TT tài sản gắn liền", type: "textarea" },
          { name: "AddressQS", label: "Địa chỉ giao QSDĐ", type: "address-select", required: true },
          { name: "Money", label: "Giá chuyển nhượng", type: "currency", required: true },
          { name: "MoneyText", label: "Giá chuyển nhượng (chữ)", type: "text", hidden: true },
          { name: "Responsibility", label: "Trách nhiệm thuế phí", type: "select", options: ["A", "B"], required: true },
          { name: "Note", label: "Ghi chú", type: "textarea", required: false }
        ]
      }
    };
  }

    _getDefaultFieldMappings() {
      return [
      {
        group: "BCN",
        schema: "PersonalInfo",
        subgroups: [
          { id: "MEN1", label: "Thông tin cá nhân", visible: true },
          { id: "MEN2", label: "Thông tin cá nhân", visible: false },
          { id: "MEN3", label: "Thông tin cá nhân", visible: false },
          { id: "MEN4", label: "Thông tin cá nhân", visible: false },
          { id: "MEN5", label: "Thông tin cá nhân", visible: false },
          { id: "MEN6", label: "Thông tin cá nhân", visible: false }
        ],
        suffixes: ["1", "2", "3", "4", "5", "6"],
        defaultGenders: ["Ông", "Bà"]
      },
      {
        group: "BCT",
        schema: "PersonalInfo",
        subgroups: [
          { id: "MEN1", label: "Thông tin cá nhân", visible: true },
          { id: "MEN2", label: "Thông tin cá nhân", visible: false }
        ],
        suffixes: ["1", "2"],
        defaultGenders: ["Ông", "Bà"]
      },
      {
        group: "BNCN",
        schema: "PersonalInfo",
        subgroups: [
          { id: "MEN7", label: "Thông tin cá nhân", visible: true },
          { id: "MEN8", label: "Thông tin cá nhân", visible: false }
        ],
        suffixes: ["7", "8"],
        defaultGenders: ["Ông", "Bà"]
      },
      {
        group: "NCN",
        schema: "PersonalInfo",
        subgroups: [
          { id: "MEN7", label: "Thông tin cá nhân", visible: true }
        ],
        suffixes: ["7"],
        defaultGenders: ["Ông"]
      },
      {
        group: "LAND",
        schema: "LandInfo",
        subgroups: [
          { id: "INFO", label: "Thông tin đất đai", visible: true }
        ]
      }
    ];
  }
}

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigGenerator;
  }

  if (typeof window !== 'undefined') {
    window.ConfigGenerator = ConfigGenerator;
  }
})();
