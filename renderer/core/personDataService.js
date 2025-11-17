(function() {
  class PersonDataService {
    constructor() {
      this.people = [];
      this.labels = new Map();
      this.isLoaded = false;
      this.labelsLoaded = false;
    }

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

    getPerson(id) {
      if (!this.isLoaded) {
        console.warn('⚠️ Data not loaded yet');
        return null;
      }
      
      const person = this.people.find(p => p.id === id);
      return person || null;
    }

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
