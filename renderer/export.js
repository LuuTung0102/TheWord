
window.idToPh = {};
window.allTemplates = [];
window.selectedTemplates = [];
window.addressData = [];

// Helper function to safely call a function if it exists (DRY principle)
function safeCall(fnName, fn, isAsync = false) {
  if (typeof fn === 'function') {
    try {
      const result = fn();
      console.log(`✅ ${fnName} completed`);
      return result;
    } catch (error) {
      console.error(`❌ Error in ${fnName}:`, error);
      return isAsync ? Promise.reject(error) : null;
    }
  } else {
    console.error(`❌ ${fnName} function not available`);
    return isAsync ? Promise.resolve() : null;
  }
}

// Initialize application
async function initializeApp() {
  try {
    console.log("🚀 Starting application initialization...");
    
    // Load addresses
    await safeCall('loadAddresses', loadAddresses, true);
    
    // Load templates
    await safeCall('loadTemplates', loadTemplates, true);
    
    // Setup search functionality
    safeCall('setupSearch', setupSearch);

    // Setup template popovers
    safeCall('setupTemplatePopovers', setupTemplatePopovers);
    
    // Setup export button
    safeCall('setupExportButton', setupExportButton);
    
    // Setup form change listeners
    safeCall('setupFormChangeListeners', setupFormChangeListeners);
    
    console.log("✅ Application initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing application:", error);
  }
}

// Initialize when DOM is loaded and all modules are ready
function waitForModules() {
  if (typeof loadTemplates === 'function' && 
      typeof loadAddresses === 'function' && 
      typeof setupSearch === 'function' && 
      typeof setupExportButton === 'function' &&
      typeof setupFormChangeListeners === 'function') {
    initializeApp();
  } else {
    setTimeout(waitForModules, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForModules);
} else {
  waitForModules();
}