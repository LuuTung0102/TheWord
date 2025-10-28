// ========================================
// LOCAL STORAGE LOADER (Browser-compatible)
// ========================================

(function() {
  console.log('🔧 Initializing localStorageLoader...');
  
  // Cache for saved people
  let savedPeopleCache = null;

  /**
   * Load saved people from local_storage.json using fetch
   * @returns {Promise<Array>} Array of saved people
   */
  async function loadSavedPeople() {
    if (savedPeopleCache) {
      console.log('📦 Using cached saved people data');
      return savedPeopleCache;
    }

    try {
      const response = await fetch('renderer/config/local_storage.json');
      
      if (!response.ok) {
        console.warn('⚠️ local_storage.json not found or cannot be loaded');
        return [];
      }
      
      const data = await response.json();
      savedPeopleCache = data.saved_people || [];
      
      console.log(`✅ Loaded ${savedPeopleCache.length} saved people from localStorage:`, savedPeopleCache);
      return savedPeopleCache;
    } catch (error) {
      console.error('❌ Error loading local_storage.json:', error);
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
      console.warn('⚠️ savedPeopleCache not loaded yet. Call loadSavedPeople() first.');
      return null;
    }
    
    const person = savedPeopleCache.find(p => p.id === personId);
    
    if (person) {
      console.log(`✅ Found person: ${person.name} (${personId})`);
      return person;
    }
    
    console.warn(`⚠️ Person not found: ${personId}`);
    return null;
  }

  // Make functions available globally
  if (typeof window !== 'undefined') {
    window.loadSavedPeople = loadSavedPeople;
    window.getPersonById = getPersonById;
    console.log('✅ window.loadSavedPeople and window.getPersonById are now available');
  }
})();

