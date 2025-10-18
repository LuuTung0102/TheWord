// main.js (thêm log để debug IPC)
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const AdmZip = require("adm-zip");
const { generateDocx } = require("./logic/generate");
const { getPlaceholders } = require("./logic/placeholder");
const { getAddresses } = require("./data/address");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 1000,
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

ipcMain.handle("get-templates", async () => {
  try {
    const folder = path.join(__dirname, "templates");
  
    if (!fs.existsSync(folder)) {
      
      fs.mkdirSync(folder);
    }
    const files = fs.readdirSync(folder).filter((f) => f.endsWith(".docx"));
   
    return files;
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

ipcMain.handle("delete-template", async (event, fileName) => {
  const filePath = path.join(__dirname, "templates", fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    
  }
  return true;
});

ipcMain.handle("get-placeholders", async (event, fileName) => {
  try {
    const filePath = path.join(__dirname, "templates", fileName);
    
    return getPlaceholders(filePath);
  } catch (err) {
    console.error("❌ Lỗi đọc placeholder file:", fileName, err);
    return [];
  }
});

ipcMain.handle("export-word", async (event, { files, data, exportType }) => {
  try {
    const tempDir = path.join(app.getPath("temp"), "word_exports");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const generatedPaths = [];

    // Tạo từng file Word tạm
    for (const file of files) {
      const inputPath = path.join(__dirname, "templates", file);
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
        defaultPath: "XuatFile.zip",
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
    console.error("❌ Lỗi xuất file:", err);
    return null;
  }
});
