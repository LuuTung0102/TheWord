const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");
const { generateDocx } = require("./logic/generate");
const { getPlaceholders } = require("./logic/placeholder");


function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 900,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  win.loadFile("index.html");
  win.webContents.session.webSecurity = false;
  win.webContents.on("console-message", (event, level, message) => {
    if (message.includes("Autofill")) return;
  });
}

app.whenReady().then(createWindow);

ipcMain.handle("load-placeholders", async (event, fileNames) => {
  try {
    const placeholders = {};
    for (const fileName of fileNames) {
      const filePath = path.join(__dirname, "templates", fileName);
      placeholders[fileName] = getPlaceholders(filePath);
    }
    return placeholders;
  } catch (err) {
    console.error("❌ Lỗi khi đọc placeholder:", err);
    return {};
  }
});

ipcMain.handle("get-templates-root", async () => {
  console.log(`🔍 get-templates-root: Returning root path: ${__dirname}`);
  return __dirname;
});

ipcMain.handle("get-templates", async () => {
  try {
    const templatesDir = path.join(__dirname, "templates");
    console.log("🔍 get-templates: Checking folder:", templatesDir);
  
    if (!fs.existsSync(templatesDir)) {
      console.log("🔍 get-templates: Creating folder:", templatesDir);
      fs.mkdirSync(templatesDir);
    }
    
    const items = fs.readdirSync(templatesDir);
    const folders = [];
    
    for (const item of items) {
      const itemPath = path.join(templatesDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        const filesInFolder = fs.readdirSync(itemPath).filter(f => f.endsWith(".docx"));
        
        folders.push({
          name: item,
          fileCount: filesInFolder.length,
          files: filesInFolder
        });
      }
    }
    
    console.log("🔍 get-templates: Found folders:", folders);
    return folders;
  } catch (err) {
    console.error("❌ Lỗi get-templates:", err);
    return [];
  }
});

ipcMain.handle("load-addresses", async () => {
  try {
    const addressPath = path.join(__dirname, "data", "address.json");
  
    if (!fs.existsSync(addressPath)) {
      console.error("❌ File address.json không tồn tại tại:", addressPath);
      return [];
    }
    const data = fs.readFileSync(addressPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Lỗi load address.json:", err);
    return [];
  }
});

ipcMain.handle("add-template", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "Word", extensions: ["docx"] }],
    properties: ["openFile", "multiSelections"],
  });
  if (canceled || !filePaths.length) return null;
  const destDir = path.join(__dirname, "templates");
  filePaths.forEach((fp) => {
    const dest = path.join(destDir, path.basename(fp));
    fs.copyFileSync(fp, dest);
  
  });
  return filePaths;
});

ipcMain.handle("save-temp-file", async (event, { buffer, fileName }) => {
  try {
    const os = require('os');
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, fileName);
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    console.log(`✅ Saved temp file: ${tempPath}`);
    return tempPath;
  } catch (error) {
    console.error("❌ Error saving temp file:", error);
    throw error;
  }
});

ipcMain.handle("upload-template", async (event, filePath) => {
  try {
    const destDir = path.join(__dirname, "templates");
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const fileName = path.basename(filePath);
    const dest = path.join(destDir, fileName);
    let finalDest = dest;
    let counter = 1;
    while (fs.existsSync(finalDest)) {
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      finalDest = path.join(destDir, `${name}_${counter}${ext}`);
      counter++;
    }
    fs.copyFileSync(filePath, finalDest);
    console.log(`✅ Uploaded template: ${path.basename(finalDest)}`);
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.warn("⚠️ Could not clean up temp file:", cleanupError);
    }
    return path.basename(finalDest);
  } catch (error) {
    console.error("❌ Error uploading template:", error);
    throw error;
  }
});

ipcMain.handle("delete-template", async (event, fileName) => {
  const filePath = path.join(__dirname, "templates", fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    
  }
  return true;
});

ipcMain.handle("open-template-file", async (event, fileName) => {
  try {
    const { shell } = require('electron');
    const filePath = path.join(__dirname, "templates", fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('File không tồn tại');
    }
    
    await shell.openPath(filePath);
    console.log(`✅ Opened template file: ${fileName}`);
    return true;
  } catch (error) {
    console.error("❌ Error opening template file:", error);
    throw error;
  }
});

ipcMain.handle("export-word", async (event, { folderName, data, exportType }) => {
  try {
    const tempDir = path.join(app.getPath("temp"), "word_exports");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const generatedPaths = [];
    const folderPath = path.join(__dirname, "templates", folderName);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".docx"));
    console.log(`📤 Xuất ${files.length} files từ folder "${folderName}"`);
    for (const file of files) {
      const inputPath = path.join(folderPath, file);
      const outputPath = path.join(
        tempDir,
        `${path.parse(file).name}_filled.docx`
      );
      await generateDocx(inputPath, data, outputPath);
      generatedPaths.push(outputPath);
      console.log(`  ✅ ${file} → ${path.basename(outputPath)}`);
    }

    if (exportType === "zip") {
      const { filePath } = await dialog.showSaveDialog({
        title: "Chọn nơi lưu file ZIP",
        defaultPath: `${folderName}.zip`,
        filters: [{ name: "Zip Files", extensions: ["zip"] }],
      });
      if (!filePath) return null;

      const zip = new AdmZip();
      for (const docPath of generatedPaths) zip.addLocalFile(docPath);
      zip.writeZip(filePath);
      generatedPaths.forEach((p) => fs.unlinkSync(p));

      console.log(`📦 Đã tạo ZIP: ${filePath}`);
      return filePath;
    } else {
      const { filePaths } = await dialog.showOpenDialog({
        title: "Chọn thư mục lưu file Word",
        properties: ["openDirectory"],
      });
      if (!filePaths || !filePaths[0]) return null;

      const saveDir = filePaths[0];
      for (const file of generatedPaths) {
        const dest = path.join(saveDir, path.basename(file));
        fs.copyFileSync(file, dest);
        fs.unlinkSync(file);
      }

      console.log(`📁 Đã lưu ${generatedPaths.length} files vào: ${saveDir}`);
      return saveDir;
    }
  } catch (err) {
    console.error("❌ Lỗi xuất file:", err);
    return null;
  }
});


ipcMain.handle("load-main-config", async () => {
  try {
    const configPath = path.join(__dirname, "renderer", "config", "config.json");
    console.log("📋 load-main-config: Loading from:", configPath);
    
    if (!fs.existsSync(configPath)) {
      console.warn("⚠️ load-main-config: Config file not found:", configPath);
      return null;
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    console.log("📋 load-main-config: Loaded config:", config);
    return config;
    
  } catch (err) {
    console.error("❌ load-main-config: Error:", err);
    return null;
  }
});


ipcMain.handle("check-folder-exists", async (event, folderPath) => {
  try {
    console.log("📁 check-folder-exists: Checking:", folderPath);
    const exists = fs.existsSync(folderPath);
    console.log("📁 check-folder-exists: Result:", exists);
    return exists;
  } catch (err) {
    console.error("❌ check-folder-exists: Error:", err);
    return false;
  }
});


ipcMain.handle("get-files-in-folder", async (event, folderPath) => {
  try {
    console.log("📁 get-files-in-folder: Loading from:", folderPath);
    
    if (!fs.existsSync(folderPath)) {
      console.warn("⚠️ get-files-in-folder: Folder not found:", folderPath);
      return [];
    }
    
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.docx'));
    console.log(`📁 get-files-in-folder: Found ${files.length} files:`, files);
    return files;
    
  } catch (err) {
    console.error("❌ get-files-in-folder: Error:", err);
    return [];
  }
});


ipcMain.handle("get-file-placeholders", async (event, folderPath, fileName) => {
  try {
    console.log("📋 get-file-placeholders: Loading from:", folderPath, "file:", fileName);
    
    if (!fs.existsSync(folderPath)) {
      console.warn("⚠️ get-file-placeholders: Folder not found:", folderPath);
      return [];
    }
    
    const filePath = path.join(folderPath, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ get-file-placeholders: File not found:", filePath);
      return [];
    }
    
    const placeholders = getPlaceholders(filePath);
    console.log(`📋 get-file-placeholders: Found ${placeholders.length} placeholders for ${fileName}`);
    return placeholders;
    
  } catch (err) {
    console.error("❌ get-file-placeholders: Error:", err);
    return [];
  }
});


ipcMain.handle("get-template-placeholders", async (event, folderPath) => {
  try {
    console.log("📋 get-placeholders: Loading from:", folderPath);
    
    if (!fs.existsSync(folderPath)) {
      console.warn("⚠️ get-placeholders: Folder not found:", folderPath);
      return [];
    }
    
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.docx'));
    const allPlaceholders = new Set();
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const placeholders = getPlaceholders(filePath);
      placeholders.forEach(ph => allPlaceholders.add(ph));
    }
    
    const result = Array.from(allPlaceholders);
    console.log(`📋 get-placeholders: Found ${result.length} placeholders`);
    return result;
    
  } catch (err) {
    console.error("❌ get-placeholders: Error:", err);
    return [];
  }
});


ipcMain.handle("export-single-document", async (event, { folderPath, fileName, formData, options }) => {
  try {
    console.log("📤 export-single-document: Starting export for:", folderPath, "file:", fileName);
    console.log("📤 export-single-document: Form data:", formData);
    
    const projectRoot = __dirname;
    const fullFolderPath = path.join(projectRoot, folderPath);
    console.log(`📤 export-single-document: Full folder path: ${fullFolderPath}`);
    const filePath = path.join(fullFolderPath, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileName} in ${folderPath}`);
    }
    
    const { app } = require('electron');
    const defaultFolder = global.lastOutputFolder || app.getPath('downloads');
    
    const result = await dialog.showOpenDialog({
      title: 'Chọn thư mục lưu văn bản',
      defaultPath: defaultFolder,
      properties: ['openDirectory', 'createDirectory']
    });
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      throw new Error('User canceled folder selection');
    }
    
    const outputFolder = result.filePaths[0];
    global.lastOutputFolder = outputFolder;
    const outputFileName = fileName; 
    const outputPath = path.join(outputFolder, outputFileName);
    
    const generateOptions = options ? {
      phMapping: options.phMapping || {},
      visibleSubgroups: options.visibleSubgroups ? new Set(options.visibleSubgroups) : new Set()
    } : {};
    
    await generateDocx(filePath, formData, outputPath, generateOptions);
    
    if (!fs.existsSync(outputPath)) {
      throw new Error('Document generation failed');
    }
    
    console.log(`📤 export-single-document: Generated document: ${outputPath}`);
    
    return {
      success: true,
      outputPath: outputPath,
      generatedPath: outputPath, 
      fileName: path.basename(outputPath)
    };
    
  } catch (err) {
    console.error("❌ export-single-document: Error:", err);
    return {
      success: false,
      error: err.message
    };
  }
});

ipcMain.handle("export-documents", async (event, { templateName, formData }) => {
  try {
    console.log("📤 export-documents: Starting export for:", templateName);
    console.log("📤 export-documents: Form data:", formData);
    
    const templatesRoot = path.join(__dirname, "templates");
    const folderPath = path.join(templatesRoot, templateName);
    
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Template folder not found: ${templateName}`);
    }
    
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.docx'));
    
    if (files.length === 0) {
      throw new Error(`No Word documents found in ${templateName}`);
    }
    
    const generatedPaths = [];
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const outputPath = await generateDocx(filePath, formData);
      if (outputPath) {
        generatedPaths.push(outputPath);
      }
    }
    
    if (generatedPaths.length === 0) {
      throw new Error('No documents were generated');
    }
    
    console.log(`📤 export-documents: Generated ${generatedPaths.length} documents`);
    
    return {
      success: true,
      generatedPaths: generatedPaths,
      count: generatedPaths.length
    };
    
  } catch (err) {
    console.error("❌ export-documents: Error:", err);
    return {
      success: false,
      error: err.message
    };
  }
});


ipcMain.handle("write-local-storage", async (event, data) => {
  try {
    const localStoragePath = path.join(__dirname, "renderer", "config", "local_storage.json");
    console.log("💾 write-local-storage: Writing to:", localStoragePath);
    fs.writeFileSync(localStoragePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log("✅ write-local-storage: Successfully saved");
    return { success: true };
  } catch (err) {
    console.error("❌ write-local-storage: Error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("open-output-folder", async (event, filePath) => {
  try {
    const { shell } = require("electron");
    
    if (!filePath) {
      const outputDir = path.join(__dirname, "output");
      if (fs.existsSync(outputDir)) {
        await shell.openPath(outputDir);
        return { success: true };
      }
      return { success: false, error: 'Output folder not found' };
    }
    
    const folderPath = path.dirname(filePath);
    if (fs.existsSync(folderPath)) {
      await shell.openPath(folderPath);
      return { success: true };
    } else {
      return { success: false, error: 'Folder not found' };
    }
  } catch (err) {
    console.error("❌ open-output-folder: Error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("copy-file-to-folder", async (event, { sourcePath, targetFolder, fileName }) => {
  try {
    console.log("📋 copy-file-to-folder: Copying from:", sourcePath);
    console.log("📋 copy-file-to-folder: To folder:", targetFolder);
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Source file not found');
    }
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    let targetPath = path.join(targetFolder, fileName);
    let finalFileName = fileName;
    let counter = 1;
    
    while (fs.existsSync(targetPath)) {
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      finalFileName = `${name}_${counter}${ext}`;
      targetPath = path.join(targetFolder, finalFileName);
      counter++;
    }
    
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ copy-file-to-folder: Copied to: ${targetPath}`);
    
    try {
      fs.unlinkSync(sourcePath);
    } catch (cleanupError) {
      console.warn("⚠️ Could not clean up temp file:", cleanupError);
    }
    
    return finalFileName;
  } catch (err) {
    console.error("❌ copy-file-to-folder: Error:", err);
    throw err;
  }
});

ipcMain.handle("open-file-path", async (event, filePath) => {
  try {
    const { shell } = require("electron");
    console.log("👁️ open-file-path: Opening:", filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    await shell.openPath(filePath);
    console.log("✅ open-file-path: Opened successfully");
    return { success: true };
  } catch (err) {
    console.error("❌ open-file-path: Error:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-file-path", async (event, filePath) => {
  try {
    console.log("🗑️ delete-file-path: Deleting:", filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    fs.unlinkSync(filePath);
    console.log("✅ delete-file-path: Deleted successfully");
    return { success: true };
  } catch (err) {
    console.error("❌ delete-file-path: Error:", err);
    return { success: false, error: err.message };
  }
});