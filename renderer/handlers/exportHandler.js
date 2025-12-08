function setupExportButton() {
  const exportBtn = document.getElementById("btnExport");
  
  if (!exportBtn) {
    return;
  }
  
  exportBtn.addEventListener("click", async () => {
    const exportType = confirm("OK: file ZIP, Cancel: File Word")
      ? "zip"
      : "word";
    if (typeof validateForm === 'function' && !validateForm()) {
      return;
    }
    if (typeof showLoading === 'function') {
      showLoading();
    }
    
    const data = typeof window.collectGenericFormData === 'function' 
      ? window.collectGenericFormData() 
      : {};
    const selectedTemplates = typeof getSelectedTemplates === 'function' ? getSelectedTemplates() : (window.selectedTemplates || []);
    
    if (selectedTemplates.length === 0) {
      showError("Vui lòng chọn ít nhất 1 folder!");
      if (typeof hideLoading === 'function') hideLoading();
      return;
    }
    
    if (selectedTemplates.length > 1) {
      showWarning("Chỉ cho phép xuất 1 folder tại 1 thời điểm!");
      if (typeof hideLoading === 'function') hideLoading();
      return;
    }
    
    const folderName = selectedTemplates[0];
    

    try {
      const result = await window.ipcRenderer.invoke("export-word", {
        folderName: folderName,
        data,
        exportType,
      });

      if (typeof hideLoading === 'function') {
        hideLoading();
      }

      if (!result) {
        showError("Xuất file thất bại!");
      } else {
        showSuccess(`Đã xuất file tại: ${result}`);
      }
    } catch (err) {
      if (typeof hideLoading === 'function') {
        hideLoading();
      }
      
      showError("Xuất file thất bại!");
    }
  });
}

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

window.setupExportButton = setupExportButton;
window.updateExportButtonState = updateExportButtonState;
