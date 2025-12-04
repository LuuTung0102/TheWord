(function() {
  async function loadSavedPeople() {
    if (!window.personDataService) {
      return [];
    }
    
    await window.personDataService.loadPeople();
    return window.personDataService.people;
  }

  function getPersonById(personId) {
    if (!window.personDataService || !window.personDataService.isLoaded) {
      return null;
    }
    
    return window.personDataService.getPerson(personId);
  }

  if (typeof window !== 'undefined') {
    window.loadSavedPeople = loadSavedPeople;
    window.getPersonById = getPersonById;
  }
})();

