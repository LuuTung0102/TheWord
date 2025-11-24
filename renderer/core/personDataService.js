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
        }
        this.isLoaded = true;
        return this.people;
      } catch (error) {
        this.people = [];
        return [];
      }
    }

    async savePeople(people) {
      try {
        if (!window.ipcRenderer) {
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
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    }

    getPerson(id) {
      if (!this.isLoaded) {
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
      return newPerson;
    }

    updatePerson(id, newData) {
      const person = this.getPerson(id);
      if (!person) {
        return false;
      }
      person.data = { ...person.data, ...newData };
      this.savePeople(this.people);
      return true;
    }

    deletePerson(id) {
      const index = this.people.findIndex(p => p.id === id);
      if (index === -1) {
        return false;
      }
      const deletedPerson = this.people[index];
      this.people.splice(index, 1);
      this.savePeople(this.people);
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
  }
})();
