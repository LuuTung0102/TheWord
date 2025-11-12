(function() {
  let savedPeopleCache = null;

  /**
   * Load saved people from local_storage.json using fetch
   * @returns {Promise<Array>} Array of saved people
   */
  async function loadSavedPeople() {
    if (savedPeopleCache) {
      return savedPeopleCache;
    }

    try {
      const response = await fetch('renderer/config/local_storage.json');
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      savedPeopleCache = data.saved_people || [];
      
      
      return savedPeopleCache;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get a person's data by ID
   * @param {string} personId - Person ID (e.g., "PERSON1")
   * @returns {Object|null} Person data or null
   */
  function getPersonById(personId) {
    if (!savedPeopleCache) {
      return null;
    }
    
    const person = savedPeopleCache.find(p => p.id === personId);
    
    if (person) {
      return person;
    }
    return null;
  }

  if (typeof window !== 'undefined') {
    window.loadSavedPeople = loadSavedPeople;
    window.getPersonById = getPersonById;
  }
})();

