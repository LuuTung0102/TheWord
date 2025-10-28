function setupExportButton() {
  const exportBtn = document.getElementById("btnExport");
  
  if (!exportBtn) {
    console.error("❌ Export button not found");
    return;
  }
  
  exportBtn.addEventListener("click", async () => {
    const exportType = confirm("OK: file ZIP, Cancel: File Word")
      ? "zip"
      : "word";
    
    // Validate form first
    if (typeof validateForm === 'function' && !validateForm()) {
      return;
    }
    
    // Show loading
    if (typeof showLoading === 'function') {
      showLoading();
    }
    
    // Collect form data
    const data = typeof collectFormData === 'function' ? collectFormData() : {};
    
    // Get selected folder (chỉ cho phép chọn 1 folder)
    const selectedTemplates = typeof getSelectedTemplates === 'function' ? getSelectedTemplates() : (window.selectedTemplates || []);
    
    if (selectedTemplates.length === 0) {
      alert("❌ Vui lòng chọn ít nhất 1 folder!");
      if (typeof hideLoading === 'function') hideLoading();
      return;
    }
    
    if (selectedTemplates.length > 1) {
      alert("⚠️ Chỉ cho phép xuất 1 folder tại 1 thời điểm!");
      if (typeof hideLoading === 'function') hideLoading();
      return;
    }
    
    const folderName = selectedTemplates[0];
    console.log(`📤 Xuất folder: ${folderName}`);
    
    try {
      const result = await window.ipcRenderer.invoke("export-word", {
        folderName: folderName,
        data,
        exportType,
      });

      // Hide loading
      if (typeof hideLoading === 'function') {
        hideLoading();
      }

      if (!result) {
        if (typeof showError === 'function') {
          showError("Xuất file thất bại!");
        } else {
          alert("❌ Xuất file thất bại!");
        }
      } else {
        if (typeof showSuccess === 'function') {
          showSuccess(`Đã xuất file tại: ${result}`);
        } else {
          alert(`✅ Đã xuất file tại: \n${result}`);
        }
      }
    } catch (err) {
      // Hide loading
      if (typeof hideLoading === 'function') {
        hideLoading();
      }
      
      if (typeof showError === 'function') {
        showError("Xuất file thất bại!");
      } else {
        alert("❌ Xuất file thất bại!");
      }
    }
  });
}


// Update export button state
function updateExportButtonState() {
  const exportBtn = document.getElementById("btnExport");
  const selectedTemplates = window.selectedTemplates || [];
  
  if (exportBtn) {
    if (selectedTemplates.length > 0) {
      exportBtn.disabled = false;
      exportBtn.classList.remove('disabled');
    } else {
      exportBtn.disabled = true;
      exportBtn.classList.add('disabled');
    }
  }
}

// Make export handler functions available globally
window.setupExportButton = setupExportButton;
window.updateExportButtonState = updateExportButtonState;
