const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const AdmZip = require("adm-zip");
const { generateDocx } = require("./logic/generate");
const { getPlaceholders } = require("./logic/placeholder");


function getTemplatesDir() {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'templates');
  } else {
    return path.join(__dirname, 'templates');
  }
}

function getConfigDir() {
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'renderer', 'config');
  } else {
    return path.join(__dirname, 'renderer', 'config');
  }
}

function ensureTemplatesDir() {
  const templatesDir = getTemplatesDir();
  
  const needsCopy = !fs.existsSync(templatesDir) || 
                    fs.readdirSync(templatesDir).length === 0;
  
  if (needsCopy && app.isPackaged) {
    const resourceTemplatesDir = path.join(process.resourcesPath, 'templates');
    
    if (fs.existsSync(resourceTemplatesDir)) {
      console.log('Copying templates from resources to:', templatesDir);
      
      if (!fs.existsSync(templatesDir)) {
        fs.mkdirSync(templatesDir, { recursive: true });
      }
      
      copyFolderRecursive(resourceTemplatesDir, templatesDir);
      console.log('Templates copied successfully');
    } else {
      console.warn('Resource templates directory not found:', resourceTemplatesDir);
    }
  } else if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  return templatesDir;
}

function ensureConfigDir() {
  const configDir = getConfigDir();
  
  if (!fs.existsSync(configDir) && app.isPackaged) {
    const resourceConfigDir = path.join(process.resourcesPath, 'renderer', 'config');
    
    if (fs.existsSync(resourceConfigDir)) {
      console.log('Copying config from resources to:', configDir);
      fs.mkdirSync(configDir, { recursive: true });
      copyFolderRecursive(resourceConfigDir, configDir);
      console.log('Config copied successfully');
    }
  } else if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  return configDir;
}

function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 900,
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    frame: true,
    show: false,
    titleBarStyle: 'default',
    webPreferences: { 
      nodeIntegration: true, 
      contextIsolation: false 
    },
  });
  
  win.once('ready-to-show', () => {
    win.show();
  });
  
  win.loadFile("index.html");
  win.webContents.session.webSecurity = false;
}

app.whenReady().then(() => {
  ensureTemplatesDir();
  ensureConfigDir();
  
  createWindow();
});

ipcMain.handle("load-placeholders", async (event, fileNames) => {
  try {
    const placeholders = {};
    const templatesDir = getTemplatesDir();
    for (const fileName of fileNames) {
      const filePath = path.join(templatesDir, fileName);
      placeholders[fileName] = getPlaceholders(filePath);
    }
    return placeholders;
  } catch (err) {
    return {};
  }
});

ipcMain.handle("get-templates-root", async () => {
  return path.dirname(getTemplatesDir());
});

ipcMain.handle("get-templates", async () => {
  try {
    const templatesDir = ensureTemplatesDir();
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
    return folders;
  } catch (err) {
    return [];
  }
});

ipcMain.handle("load-addresses", async () => {
  try {
    const addressPath = path.join(__dirname, "data", "address.json");
    if (!fs.existsSync(addressPath)) {
      return [];
    }
    const data = fs.readFileSync(addressPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
});

ipcMain.handle("add-template", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "Word", extensions: ["docx"] }],
    properties: ["openFile", "multiSelections"],
  });
  if (canceled || !filePaths.length) return null;
  const destDir = getTemplatesDir();
  filePaths.forEach((fp) => {
    const dest = path.join(destDir, path.basename(fp));
    fs.copyFileSync(fp, dest);
  
  });
  return filePaths;
});

ipcMain.handle("save-temp-file", async (event, { buffer, fileName }) => {
  try {
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, fileName);
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    return tempPath;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("upload-template", async (event, filePath) => {
  try {
    const destDir = ensureTemplatesDir();
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
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
    }
    return path.basename(finalDest);
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("delete-template", async (event, fileName) => {
  const templatesDir = getTemplatesDir();
  const filePath = path.join(templatesDir, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
});

ipcMain.handle("open-template-file", async (event, fileName) => {
  try {
    const templatesDir = getTemplatesDir();
    const filePath = path.join(templatesDir, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('File không tồn tại');
    }
    await shell.openPath(filePath);
    return true;
  } catch (error) {
    throw error;
  }
});

ipcMain.handle("export-word", async (event, { folderName, data, exportType }) => {
  try {
    const tempDir = path.join(app.getPath("temp"), "word_exports");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const generatedPaths = [];
    const templatesDir = getTemplatesDir();
    const folderPath = path.join(templatesDir, folderName);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".docx"));
    for (const file of files) {
      const inputPath = path.join(folderPath, file);
      const outputPath = path.join(
        tempDir,
        `${path.parse(file).name}_filled.docx`
      );
      await generateDocx(inputPath, data, outputPath);
      generatedPaths.push(outputPath);
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
      return saveDir;
    }
  } catch (err) {
    return null;
  }
});


ipcMain.handle("load-main-config", async () => {
  try {
    const configDir = getConfigDir();
    const configPath = path.join(configDir, "config.json");
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    return config;
  } catch (err) {
    return null;
  }
});


ipcMain.handle("check-folder-exists", async (event, folderPath) => {
  try {
    const exists = fs.existsSync(folderPath);
    return exists;
  } catch (err) {
    return false;
  }
});


ipcMain.handle("get-files-in-folder", async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.docx'));
    return files;  
  } catch (err) {
    return [];
  }
});


ipcMain.handle("get-file-placeholders", async (event, folderPath, fileName) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    const filePath = path.join(folderPath, fileName);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const placeholders = getPlaceholders(filePath);
    return placeholders;
  } catch (err) {
    return [];
  }
});


ipcMain.handle("get-template-placeholders", async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
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
    return result;
  } catch (err) {
    return [];
  }
});


ipcMain.handle("export-single-document", async (event, { folderPath, fileName, formData, options }) => {
  try {
    
    const projectRoot = path.dirname(getTemplatesDir());
    const fullFolderPath = path.join(projectRoot, folderPath);
    const filePath = path.join(fullFolderPath, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileName} in ${folderPath}`);
    }
    
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
    
    return {
      success: true,
      outputPath: outputPath,
      generatedPath: outputPath, 
      fileName: path.basename(outputPath)
    };    
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});

ipcMain.handle("export-documents", async (event, { templateName, formData }) => {
  try {
    const templatesRoot = getTemplatesDir();
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
    return {
      success: true,
      generatedPaths: generatedPaths,
      count: generatedPaths.length
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});


ipcMain.handle("read-local-storage", async (event) => {
  try {
    const configDir = getConfigDir();
    const userLocalStoragePath = path.join(configDir, "local_storage.json");
    if (fs.existsSync(userLocalStoragePath)) {
      const data = fs.readFileSync(userLocalStoragePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    }
    const defaultPath = path.join(__dirname, "renderer", "config", "local_storage.json");
    if (fs.existsSync(defaultPath)) {
      const defaultData = fs.readFileSync(defaultPath, 'utf8');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(userLocalStoragePath, defaultData, 'utf8');
      
      return { success: true, data: JSON.parse(defaultData) };
    }
    return { success: true, data: { saved_people: [], label_config: {} } };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("write-local-storage", async (event, data) => {
  try {
    const configDir = getConfigDir();
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    const localStoragePath = path.join(configDir, "local_storage.json");
    fs.writeFileSync(localStoragePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("open-output-folder", async (event, filePath) => {
  try {
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
    return { success: false, error: err.message };
  }
});

ipcMain.handle("copy-file-to-folder", async (event, { sourcePath, targetFolder, fileName }) => {
  try {
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
    try {
      fs.unlinkSync(sourcePath);
    } catch (cleanupError) {
    } 
    return finalFileName;
  } catch (err) {
    throw err;
  }
});

ipcMain.handle("open-file-path", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    await shell.openPath(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-file-path", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("read-folder-config", async (event, folderPath) => {
  try {
    const configPath = path.join(folderPath, "config.json");
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const data = fs.readFileSync(configPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    throw new Error(`Failed to read config: ${err.message}`);
  }
});

ipcMain.handle("write-folder-config", async (event, folderPath, config) => {
  try {
    const configPath = path.join(folderPath, "config.json");
    
    // Custom formatter: compact arrays of objects
    const formatConfig = (obj, indent = 0) => {
      const spaces = '  '.repeat(indent);
      const nextSpaces = '  '.repeat(indent + 1);
      
      if (Array.isArray(obj)) {
        if (obj.length === 0) return '[]';
        
        // Check if array contains only primitives (strings, numbers, booleans)
        const isPrimitiveArray = obj.every(item => 
          typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean' || item === null
        );
        
        if (isPrimitiveArray) {
          // Format primitive array on one line
          return JSON.stringify(obj);
        }
        
        // Check if array contains simple objects (should be on one line)
        const isCompactArray = obj.every(item => {
          if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
          
          // Check if object has nested arrays or objects
          const values = Object.values(item);
          const hasNestedStructure = values.some(v => 
            (typeof v === 'object' && v !== null && !Array.isArray(v)) ||
            (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object')
          );
          
          return !hasNestedStructure;
        });
        
        if (isCompactArray) {
          // Format each object on one line
          const items = obj.map(item => {
            return nextSpaces + JSON.stringify(item);
          }).join(',\n');
          return '[\n' + items + '\n' + spaces + ']';
        } else {
          // Regular array formatting
          const items = obj.map(item => {
            return nextSpaces + formatConfig(item, indent + 1);
          }).join(',\n');
          return '[\n' + items + '\n' + spaces + ']';
        }
      } else if (typeof obj === 'object' && obj !== null) {
        const keys = Object.keys(obj);
        if (keys.length === 0) return '{}';
        
        const items = keys.map(key => {
          const value = obj[key];
          const formattedValue = formatConfig(value, indent + 1);
          return `${nextSpaces}"${key}": ${formattedValue}`;
        }).join(',\n');
        
        return '{\n' + items + '\n' + spaces + '}';
      } else {
        return JSON.stringify(obj);
      }
    };
    
    const formattedConfig = formatConfig(config);
    fs.writeFileSync(configPath, formattedConfig, "utf8");
    return true;
  } catch (err) {
    throw new Error(`Failed to write config: ${err.message}`);
  }
});

ipcMain.handle("backup-folder-config", async (event, folderPath) => {
  try {
    const configPath = path.join(folderPath, "config.json");
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const timestamp = Date.now();
    const backupPath = path.join(folderPath, `config.backup.${timestamp}.json`);
    fs.copyFileSync(configPath, backupPath);
    return backupPath;
  } catch (err) {
    throw new Error(`Failed to create backup: ${err.message}`);
  }
});

ipcMain.handle("restore-folder-config", async (event, backupPath, folderPath) => {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }
    const configPath = path.join(folderPath, "config.json");
    fs.copyFileSync(backupPath, configPath);
    return true;
  } catch (err) {
    throw new Error(`Failed to restore config: ${err.message}`);
  }
});

ipcMain.handle("get-placeholders", async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const placeholders = getPlaceholders(filePath);
    return placeholders;
  } catch (err) {
    return [];
  }
});