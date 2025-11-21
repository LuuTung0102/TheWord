(function() {
  let savedPeopleCache = null;
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

  function clearSavedPeopleCache() {
    savedPeopleCache = null;
  }

  if (typeof window !== 'undefined') {
    window.loadSavedPeople = loadSavedPeople;
    window.getPersonById = getPersonById;
    window.clearSavedPeopleCache = clearSavedPeopleCache;
  }
})();

