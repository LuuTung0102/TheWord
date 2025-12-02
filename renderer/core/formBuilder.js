(function() {
  class FormBuilder {

    static buildField(config) {
      const {
        type = 'text',
        id,
        label,
        value = '',
        placeholder = '',
        required = false,
        options = [],
        fullWidth = false,
        className = 'person-form'
      } = config;

      const requiredMark = required ? ' *' : '';
      const widthClass = fullWidth ? ' full-width' : '';

      if (type === 'select') {
        const optionsHTML = options.map(opt => {
          const selected = opt.value === value ? 'selected' : '';
          return `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
        }).join('');

        return `
          <div class="${className}-field${widthClass}">
            <label class="${className}-label">${label}${requiredMark}</label>
            <select id="${id}" class="${className}-select">
              ${optionsHTML}
            </select>
          </div>
        `;
      }

      return `
        <div class="${className}-field${widthClass}">
          <label class="${className}-label">${label}${requiredMark}</label>
          <input type="${type}" id="${id}" class="${className}-input" 
                 value="${value}" placeholder="${placeholder}">
        </div>
      `;
    }

    static buildPersonFormFields(mode = 'add', personData = {}) {
      const prefix = mode === 'edit' ? 'edit' : 'add';
      const data = personData || {};

      const genderLabel = window.personDataService?.getLabel('Gender') || 'Giới tính';
      const nameLabel = window.personDataService?.getLabel('Name') || 'Họ và tên';
      const dateLabel = window.personDataService?.getLabel('Date') || 'Ngày sinh';
      const cccdLabel = window.personDataService?.getLabel('CCCD') || 'Số CCCD';
      const noiCapLabel = window.personDataService?.getLabel('Noi_Cap') || 'Nơi cấp';
      const ngayCapLabel = window.personDataService?.getLabel('Ngay_Cap') || 'Ngày cấp';
      const addressLabel = window.personDataService?.getLabel('Address') || 'Địa chỉ';

      const fields = [
        {
          type: 'select',
          id: `${prefix}Gender`,
          label: genderLabel,
          value: data.Gender || 'Ông',
          required: true,
          options: [
            { value: 'Ông', label: 'Ông' },
            { value: 'Bà', label: 'Bà' }
          ]
        },
        {
          type: 'text',
          id: `${prefix}Name`,
          label: nameLabel,
          value: data.Name || '',
          placeholder: 'Nhập họ và tên',
          required: true
        },
        {
          type: 'text',
          id: `${prefix}Date`,
          label: dateLabel,
          value: data.Date || '',
          placeholder: 'dd/mm/yyyy',
          required: true
        },
        {
          type: 'text',
          id: `${prefix}CCCD`,
          label: cccdLabel,
          value: data.CCCD || '',
          placeholder: 'Nhập số CCCD',
          required: true
        },
        {
          type: 'select',
          id: `${prefix}NoiCap`,
          label: noiCapLabel,
          value: data.Noi_Cap || 'Cục Cảnh sát QLHC về TTXH',
          required: true,
          options: [
            { value: 'Cục Cảnh sát QLHC về TTXH', label: 'Cục Cảnh sát QLHC về TTXH' },
            { value: 'Công an T. Đắk Lắk', label: 'Công an T. Đắk Lắk' }
          ]
        },
        {
          type: 'text',
          id: `${prefix}NgayCap`,
          label: ngayCapLabel,
          value: data.Ngay_Cap || '',
          placeholder: 'dd/mm/yyyy',
          required: true
        },
        {
          type: 'text',
          id: `${prefix}Address`,
          label: addressLabel,
          value: data.Address || '',
          placeholder: 'Nhập hộ khẩu thường trú',
          required: true,
          fullWidth: true
        }
      ];

      return fields.map(field => this.buildField(field)).join('');
    }

    static buildPersonForm(mode = 'add', personData = {}, personId = null) {
      const title = mode === 'edit' 
        ? `✏️ Sửa ${personId} - ${personData.Name || ''}` 
        : '➕ Thêm PERSON mới';

      return `
        <div class="person-form-container">
          <div class="person-form-title">${title}</div>
          <div id="personFormError" class="person-error-message" style="display: none;"></div>
          <div class="person-form-grid">
            ${this.buildPersonFormFields(mode, personData)}
          </div>
          <div class="person-form-actions">
            <button class="person-form-cancel">Hủy</button>
            <button class="person-form-save">💾 Lưu</button>
          </div>
        </div>
      `;
    }

    static collectPersonFormData(mode = 'add') {
      const prefix = mode === 'edit' ? 'edit' : 'add';

      return {
        Gender: document.getElementById(`${prefix}Gender`)?.value || '',
        Name: document.getElementById(`${prefix}Name`)?.value.trim() || '',
        Date: document.getElementById(`${prefix}Date`)?.value.trim() || '',
        CCCD: document.getElementById(`${prefix}CCCD`)?.value.trim() || '',
        Noi_Cap: document.getElementById(`${prefix}NoiCap`)?.value || '',
        Ngay_Cap: document.getElementById(`${prefix}NgayCap`)?.value.trim() || '',
        Address: document.getElementById(`${prefix}Address`)?.value.trim() || ''
      };
    }

    static showFormError(message) {
      const errorDiv = document.getElementById('personFormError');
      if (errorDiv) {
        errorDiv.innerHTML = message;
        errorDiv.style.display = 'block';
      }
    }

    static hideFormError() {
      const errorDiv = document.getElementById('personFormError');
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.FormBuilder = FormBuilder;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormBuilder };
  }
})();
