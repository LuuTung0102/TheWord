(function() {
  class PersonDataService {
    constructor() {
      this.people = [];
      this.labels = new Map();
      this.isLoaded = false;
      this.labelsLoaded = false;
    }

    /**
     * Load tất cả PERSON từ local_storage.json
     * @returns {Promise<Array>} Array of PERSON objects
     */
    async loadPeople() {
      try {
        const response = await fetch('renderer/config/local_storage.json');
        
        if (!response.ok) {
          console.error('❌ Failed to load local_storage.json');
          this.people = [];
          return [];
        }
        
        const data = await response.json();
        this.people = data.saved_people || [];
        
        if (data.label_config) {
          Object.entries(data.label_config).forEach(([key, label]) => {
            this.labels.set(key, label);
          });
          this.labelsLoaded = true;
          console.log(`✅ Loaded ${this.labels.size} labels from local_storage.json`);
        }
        
        this.isLoaded = true;
        
        console.log(`✅ Loaded ${this.people.length} people from local_storage.json`);
        return this.people;
      } catch (error) {
        console.error('❌ Error loading people:', error);
        this.people = [];
        return [];
      }
    }

    /**
     * Lưu danh sách PERSON vào local_storage.json
     * @param {Array} people - Array of PERSON objects
     * @returns {Promise<boolean>} Success status
     */
    async savePeople(people) {
      try {
        if (!window.ipcRenderer) {
          console.error('❌ IPC not available');
          return false;
        }

        const labelConfig = {};
        this.labels.forEach((value, key) => {
          labelConfig[key] = value;
        });

        const data = {
          label_config: labelConfig,
          saved_people: people
        };

        const result = await window.ipcRenderer.invoke('write-local-storage', data);
        
        if (result.success) {
          this.people = people;
          this.clearCache();
          console.log('✅ Saved people to local_storage.json');
          return true;
        } else {
          console.error('❌ Failed to save:', result.error);
          return false;
        }
      } catch (error) {
        console.error('❌ Error saving people:', error);
        return false;
      }
    }

    /**
     * Lấy một PERSON theo id
     * @param {string} id - PERSON id (e.g., "PERSON1")
     * @returns {Object|null} PERSON object or null
     */
    getPerson(id) {
      if (!this.isLoaded) {
        console.warn('⚠️ Data not loaded yet');
        return null;
      }
      
      const person = this.people.find(p => p.id === id);
      return person || null;
    }

    /**
     * Thêm PERSON mới
     * @param {Object} data - PERSON data object
     * @returns {Object} New PERSON object with generated id and name
     */
    addPerson(data) {
      const newId = this.generatePersonId();
      const newName = this.generatePersonName();
      
      const newPerson = {
        id: newId,
        name: newName,
        data: { ...data }
      };
      
      this.people.push(newPerson);
      this.savePeople(this.people);
      
      console.log(`✅ Added new person: ${newId} - ${newName}`);
      return newPerson;
    }

    /**
     * Cập nhật giá trị PERSON (chỉ values, không thay đổi keys)
     * @param {string} id - PERSON id
     * @param {Object} newData - New data values
     * @returns {boolean} Success status
     */
    updatePerson(id, newData) {
      const person = this.getPerson(id);
      
      if (!person) {
        console.error(`❌ Person not found: ${id}`);
        return false;
      }
      
      person.data = { ...person.data, ...newData };
      
      this.savePeople(this.people);
      console.log(`✅ Updated person: ${id}`);
      return true;
    }

    /**
     * Xóa PERSON khỏi danh sách
     * @param {string} id - PERSON id
     * @returns {boolean} Success status
     */
    deletePerson(id) {
      const index = this.people.findIndex(p => p.id === id);
      
      if (index === -1) {
        console.error(`❌ Person not found: ${id}`);
        return false;
      }
      
      const deletedPerson = this.people[index];
      this.people.splice(index, 1);
      
      this.savePeople(this.people);
      console.log(`✅ Deleted person: ${id} - ${deletedPerson.name}`);
      return true;
    }

    /**
     * Tạo id mới cho PERSON
     * @returns {string} New PERSON id (e.g., "PERSON4")
     */
    generatePersonId() {
      if (this.people.length === 0) {
        return 'PERSON1';
      }
      
      const numbers = this.people
        .map(p => {
          const match = p.id.match(/PERSON(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      const maxNumber = Math.max(...numbers, 0);
      return `PERSON${maxNumber + 1}`;
    }

    /**
     * Tạo name mới cho PERSON
     * @returns {string} New PERSON name (e.g., "Người 4")
     */
    generatePersonName() {
      if (this.people.length === 0) {
        return 'Người 1';
      }
      
      const numbers = this.people
        .map(p => {
          const match = p.name.match(/Người (\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);
      
      const maxNumber = Math.max(...numbers, 0);
      return `Người ${maxNumber + 1}`;
    }

    /**
     * Validate dữ liệu PERSON
     * @param {Object} data - PERSON data object
     * @returns {Object} Validation result {isValid: boolean, errors: Array}
     */
    validatePersonData(data) {
      const errors = [];
      const requiredFields = ['Name', 'Gender', 'Date', 'CCCD', 'Noi_Cap', 'Ngay_Cap', 'Address'];
      
      requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
          const label = this.getLabel(field);
          errors.push(`${label} không được để trống`);
        }
      });
      
      if (data.CCCD && data.CCCD.trim() !== '') {
        const cccdValue = data.CCCD.trim().replace(/\D/g, '');
        if (!/^\d{9}$|^\d{12}$/.test(cccdValue)) {
          const label = this.getLabel('CCCD');
          errors.push(`${label} phải là 9 hoặc 12 số`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }

    /**
     * Lấy label tiếng Việt cho property key
     * @param {string} key - Property key (e.g., "Name", "CCCD")
     * @returns {string} Vietnamese label or key as fallback
     */
    getLabel(key) {
      return this.labels.get(key) || key;
    }

    clearCache() {
      if (window.clearSavedPeopleCache) {
        window.clearSavedPeopleCache();
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.personDataService = new PersonDataService();
    console.log('✅ PersonDataService initialized');
  }
})();
