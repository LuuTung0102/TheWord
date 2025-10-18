
window.idToPh = {};
window.allTemplates = [];
window.selectedTemplates = [];
window.addressData = [];

// Initialize application
async function initializeApp() {
  try {
    console.log("🚀 Starting application initialization...");
    
    // Load addresses
    if (typeof loadAddresses === 'function') {
      await loadAddresses();
      console.log("✅ Addresses loaded");
    } else {
      console.error("❌ loadAddresses function not available");
    }
    
    // Load templates
    if (typeof loadTemplates === 'function') {
      await loadTemplates();
      console.log("✅ Templates loaded");
    } else {
      console.error("❌ loadTemplates function not available");
    }
    
    // Setup search functionality
    if (typeof setupSearch === 'function') {
      setupSearch();
      console.log("✅ Search functionality setup");
    } else {
      console.error("❌ setupSearch function not available");
    }

    // Setup template popovers
    if (typeof setupTemplatePopovers === 'function') {
      setupTemplatePopovers();
      console.log("✅ Template popovers setup");
    } else {
      console.error("❌ setupTemplatePopovers function not available");
    }
    
    // Setup export button
    if (typeof setupExportButton === 'function') {
      setupExportButton();
      console.log("✅ Export button setup");
    } else {
      console.error("❌ setupExportButton function not available");
    }
    if (typeof setupFormChangeListeners === 'function') {
      setupFormChangeListeners();
      console.log("✅ Form change listeners setup");
    } else {
      console.error("❌ setupFormChangeListeners function not available");
    }
    
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