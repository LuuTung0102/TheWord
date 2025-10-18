function setupExportButton() {
  document.getElementById("btnExport").addEventListener("click", async () => {
    const exportType = confirm("OK: file ZIP, Cancel: File Word")
      ? "zip"
      : "word";
    
    // Validate form first
    if (typeof validateForm === 'function' && !validateForm()) {
      return;
    }
    
    // Collect form data
    const data = typeof collectFormData === 'function' ? collectFormData() : {};
    
    // Get selected templates
    const selectedTemplates = typeof getSelectedTemplates === 'function' ? getSelectedTemplates() : (window.selectedTemplates || []);
    
    try {
      const result = await window.ipcRenderer.invoke("export-word", {
        files: selectedTemplates,
        data,
        exportType,
      });

      if (!result) {
        alert("❌ Xuất file thất bại!");
      } else {
        alert(`✅ Đã xuất file tại: \n${result}`);
      }
    } catch (err) {
      alert("❌ Xuất file thất bại!");
    }
  });
}

// Make export handler functions available globally
window.setupExportButton = setupExportButton;
