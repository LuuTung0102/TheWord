# 📄 TheWord - Automated Document Generation System

## 📋 Quick Navigation
- [Overview](#overview)
- [Key Features](#key-features)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)

---

## 🎯 Overview

**TheWord** is an Electron-based document automation system that generates Word files from templates quickly and accurately. Designed for legal and administrative documents with intelligent data management and reuse capabilities.

### Core Workflow
```
Select Template Folder → Choose .docx File → Fill Form → Export Document ✅
```

### 100% Offline
- No internet required after installation
- All data stored locally
- Full privacy control

### ⚠️ Important Note
- **Only .docx format is supported** (Word 2007+)
- **.doc files (Word 97-2003) will NOT work**
- See [File Format Support](#-file-format-support) section for conversion guide

---

## ✨ Key Features

### 📝 Intelligent Form Generation
- **Auto-generate forms** from template placeholders
- **15+ field types**: text, number, date, select, address, money, land-type, and more
- **Smart validation** with visual feedback and auto tab-switching
- **Auto-format**: CCCD (9/12 digits), Money (1,000,000), Dates, Phone numbers
- **Flexible address input**: Auto-suggest from database OR manual input for villages

### 🏷️ Advanced Land Type System
- **3 intelligent formats**:
  - `Loai_Dat`: Basic codes (CLN+NST)
  - `Loai_Dat_F`: With area (CLN 1236.5m²)
  - `Loai_Dat_D`: Detailed with location (CLN|Location|1236.5)
- **Smart auto-sync** between formats
- **Automatic conversion** when reusing across templates

### 🗺️ Flexible Address System
- **4-level cascading selection**: Province → Ward → Village → Street
- **Smart dropdown behavior**:
  - Province & Ward: Must select from database
  - Village: **Select from list OR type manually** if not available
- **Auto-suggest with search**: Type to filter matching entries
- **Keyboard navigation**: Arrow keys, Enter, Tab support
- **Data preservation**: Manual entries saved and restored correctly
- **Reuse support**: All address components including manual villages

### 👥 Person Data Management
- **LocalStorage** for frequently used people (PERSON1, PERSON2, ...)
- **CRUD operations** with validation
- **Quick selection** with visual preview
- **Auto-generated IDs** and Vietnamese labels

### 🔄 Smart Data Reuse
- **SessionStorage** for temporary data with intelligent merge logic
- **Auto-Restore** - automatically saves and restores session on app restart
- **Cross-file deduplication** to prevent duplicate data
- **3-level merge strategy**: NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
- **Dropdown "Tái Sử Dụng"** with timestamps for data version tracking

### 🗂️ Dynamic Subgroup Management
- **Add/Remove** subgroups (people, sections) dynamically
- **Visibility control** without data loss
- **Auto-refresh** UI after changes
- **Proper event listener cleanup** to prevent memory leaks

### 📊 Professional UI/UX
- **2-Color Layout**: Green panel (data entry) + Orange panel (folder selection)
- **Taskbar navigation** for quick section switching
- **Responsive design** for all screen sizes
- **Toast notifications** replacing old alert/confirm dialogs
- **Loading overlays** during export
- **Smart input fields**: Auto-suggest with manual fallback for maximum flexibility

### ⚡ Performance Optimized
- **Form rendering**: < 200ms
- **Validation**: < 50ms
- **Export**: < 5 seconds
- **Memory usage**: ~100-150MB with templates

### 🛡️ Smart Validation System
- **Visual error highlighting**: Red border + pink background + shake animation
- **Auto tab switching** to error location
- **Auto scroll & focus** for better UX
- **Grouped error notifications** by section
- **Auto remove** error styling when user starts typing
- **Regex constants** for consistent validation patterns
- **Address field special handling** (4-level dropdown validation)

---

## 🔧 Installation

### System Requirements
- Node.js >= 14.x
- npm >= 6.x
- 4GB RAM (8GB recommended)
- 500MB free disk space
- **Word templates must be in .docx format** (not .doc)

### Quick Start

```bash
# Clone repository
git clone https://github.com/LuuTung0102/TheWord.git
cd TheWord

# Install dependencies
npm install

# Run application
npm start
```

### Build for Production

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 📖 Usage Guide

### 1. Select Template Folder
1. Open TheWord
2. Right panel (orange): Select a template folder
3. System automatically loads all **.docx** files in that folder
   - **Note**: Only .docx format is supported, not .doc

### 2. Choose Word File
1. Click folder to expand and see available files
2. Click file to select
3. Form automatically generates from placeholders in the file

### 3. Fill Form
1. Left panel (green): Fill in all required fields
2. Use smart features:
   - **Date Picker**: Click field to select date
   - **Address Select**: 4-level cascading dropdowns with manual input support
     - Province & Ward: Select from dropdown
     - Village: Select from dropdown OR type manually if not in list
   - **Land Type**: Dropdown with autocomplete
   - **CCCD**: Auto-formats when typing
   - **Money**: Auto-formats with thousand separator

### 4. Reuse Data (Optional)
1. Look for "Tái Sử Dụng" dropdown
2. Select from previous data or saved people
3. Form auto-fills with selected data
4. Edit if needed

### 5. Manage People (Optional)
1. Click "⚙️ Quản Lý" at header
2. Select "👥 Quản Lý Dữ Liệu"
3. Add/Edit/Delete people
4. They appear as quick selection in forms

### 6. Export Document
1. Verify all required fields are filled
2. Click "📤 XUẤT WORD"
3. Choose save folder
4. Wait for processing (< 5 seconds)
5. Success dialog with option to open folder

---

## 🗺️ Address Input Guide

### How to Use Address Fields

**Province Selection:**
1. Click or focus on Province field
2. Type to search (e.g., "Đắk Lắk")
3. Use Arrow keys to navigate suggestions
4. Press Enter or click to select

**Ward Selection:**
1. After selecting Province, Ward field becomes active
2. Type to search within selected province
3. Select from dropdown

**Village Input (Flexible):**
1. After selecting Ward, Village field becomes active
2. **Option A - Select from list:**
   - If ward has villages in database, dropdown shows suggestions
   - Type to filter, select from list
3. **Option B - Manual input:**
   - If no suggestions OR village not in list
   - Simply type the village name directly
   - Press Enter or Tab to move to next field
4. **Your manual entry will be saved** and can be reused later

**Tips:**
- Use Tab key to quickly move between fields
- Press Escape to close dropdown
- Manual village entries are fully supported in data reuse
- Address format saved as: "Village, Ward, Province"

---

## 🏗️ Architecture

### Project Structure
```
TheWord/
├── renderer/
│   ├── config/              # Constants & configuration
│   │   ├── baseConstants.js
│   │   ├── regexConstants.js
│   │   ├── config.json
│   │   ├── local_storage.json
│   │   ├── land_types.json
│   │   └── address.json
│   ├── core/                # Core services
│   │   ├── stateManager.js
│   │   ├── formValidator.js
│   │   ├── notificationManager.js
│   │   ├── personDataService.js
│   │   ├── sessionStorageManager.js
│   │   └── ... (other utilities)
│   ├── handlers/            # UI handlers
│   │   ├── genericFormHandler.js
│   │   ├── exportHandler.js
│   │   ├── fileManager.js
│   │   ├── personManager.js
│   │   └── ... (other handlers)
│   └── mainApp.js           # Main application
├── logic/
│   ├── generate.js          # Word document generation
│   └── placeholder.js       # Placeholder extraction
├── templates/               # Template folders with configs
├── index.html               # Main HTML
├── main.js                  # Electron main process
└── style.css                # Styles
```

### Data Flow Architecture

**Form Rendering:**
1. User selects template file
2. `templateManager.js` loads config
3. `genericFormHandler.js` renders form fields
4. Event listeners setup for all inputs
5. Previous session data auto-loads if available

**Validation Flow:**
1. User clicks "Xuất Word"
2. `formValidator.js` collects and validates form data
3. If errors found:
   - Highlight error fields (red border + pink background)
   - Show grouped error notification
   - Auto switch to first error tab
   - Smooth scroll to first error field
4. If valid, proceed to export

**Export Flow:**
1. Collect form data from all inputs
2. Process data (auto-convert, format, cleanup)
3. Save to session storage with smart merge
4. Call `logic/generate.js` to create Word file
5. Show success notification with open folder option

**Data Reuse Flow:**
1. On export, session storage saves data with merge logic
2. Next form shows "Tái Sử Dụng" dropdown with saved data
3. Select dropdown option to auto-fill form
4. Auto-convert land types to match template format

---

## � File Ftormat Support

### ✅ Supported Format
- **.docx** (Office Open XML) - Word 2007 and later
- This is the **ONLY** supported format

### ❌ NOT Supported
- **.doc** (Office 97-2003 Binary Format)
- **.rtf** (Rich Text Format)
- **.odt** (OpenDocument Text)
- **.pdf** (Portable Document Format)

### Why Only .docx?
1. **Modern Standard**: .docx is the current Microsoft Word standard since 2007
2. **XML-Based**: .docx files are ZIP archives containing XML, making them easy to parse and modify
3. **Library Support**: Docxtemplater library only supports .docx format
4. **Better Features**: .docx supports more features and is more reliable than old .doc format

### How to Convert .doc to .docx

**Using Microsoft Word:**
1. Open your .doc file in Microsoft Word
2. Click **File** → **Save As**
3. Choose **Word Document (*.docx)** from format dropdown
4. Click **Save**

**Using LibreOffice (Free):**
1. Download and install [LibreOffice](https://www.libreoffice.org/)
2. Open your .doc file in LibreOffice Writer
3. Click **File** → **Save As**
4. Choose **Office Open XML Text (.docx)** from format dropdown
5. Click **Save**

**Batch Conversion:**
- For multiple files, use Microsoft Word's batch conversion feature
- Or use online converters (be careful with sensitive documents)

---

## 💻 Tech Stack

### Core
- **Electron** 38.2.2 - Desktop application framework
- **Node.js** - Runtime environment
- **Vanilla JavaScript** - No framework dependencies

### Document Processing
- **Docxtemplater** 3.66.7 - Word template engine (**.docx only**)
- **PizZip** 3.2.0 - ZIP file handling for .docx archives
- **SAX** 1.4.3 - XML streaming parser
- **xmldom** 0.6.0 - XML DOM parser

### UI Components
- **Flatpickr** 4.6.13 - Date picker with Vietnamese locale
- **Custom CSS** - Responsive design system

### Utilities
- **adm-zip** 0.5.16 - ZIP archive creation
- **angular-expressions** 1.5.1 - Expression parser

---

## 📁 Key Files Overview

### Core Services

**stateManager.js**
- Centralized state management
- DOM element caching (70% reduction in queries)
- Global state for render parameters

**formValidator.js**
- Smart validation with visual feedback
- CCCD format validation
- Address field special handling
- Auto tab switching and error notification

**regexConstants.js**
- Centralized regex patterns
- Helper functions for formatting
- Consistent validation across app

**sessionStorageManager.js**
- Smart data merge logic
- Cross-file deduplication
- Version control with timestamps
- Auto-restore on app restart

**personDataService.js**
- CRUD operations for people
- CCCD validation
- Auto-generate IDs and names
- Label management in Vietnamese

### Handlers

**genericFormHandler.js**
- Dynamic form rendering
- Support for 15+ field types
- Event setup and cleanup
- Subgroup management

**exportHandler.js**
- Export validation and processing
- Auto-convert placeholders
- Data collection and formatting
- File generation

**fileManager.js**
- Add/delete Word files
- Auto placeholder analysis
- Config generation
- UI refresh

**personManager.js**
- Person CRUD UI
- Modal dialogs
- Form validation
- Cache management

---

## 🔄 Validation System

### Smart Validation Features

**Visual Feedback**
- Red border (2px) + pink background (#fff5f5)
- Shake animation (0.3s) to attract attention
- Auto-remove when user starts typing

**Error Grouping**
- Errors grouped by section/subgroup
- Clear notification with bullet points
- Auto-dismiss after 5 seconds

**Auto Navigation**
- Automatically switch to tab with first error
- Smooth scroll to error field
- Auto focus for immediate editing

**Format Validation**
- CCCD: 9 or 12 digits only
- Phone: 10 digits format
- Email: Basic email format
- Address: Province and Ward required, Village can be selected or manually entered

**Smart Placeholder Checking**
- Only validate fields in template
- Skip hidden/invisible fields
- Skip fields without placeholder

### Validation API

```javascript
// Main validation entry point
window.validateForm()           // Returns true/false

// Validate form data object
window.validateFormData()       // Returns errors array

// Validate single field
window.validateField()          // Returns validation result
```

---

## 🔐 Data Management

### LocalStorage (PERSON)
- Frequently used people stored permanently
- Auto-generate: PERSON1, PERSON2, PERSON3...
- Full CRUD with validation
- Backup on app restart

### SessionStorage (Data Reuse)
- Temporary data between exports
- Smart merge: NO_CHANGE, ONLY_ADDITIONS, HAS_MODIFICATIONS
- Cross-file deduplication
- Auto-restore on app restart
- Clear with "Làm Mới" button

### Auto-Restore on Restart
- Automatically saves session before closing
- Modal asks on app restart: Restore or New Session
- Preserves all work if app crashes
- Can be disabled with: `localStorage.setItem('disable_auto_restore', 'true')`

---

## 🐛 Troubleshooting

### System only accepts .docx files, not .doc
- **TheWord only supports .docx format** (Office Open XML)
- **.doc files (Office 97-2003) are NOT supported**
- **Solution**: Convert .doc to .docx:
  - Open .doc file in Microsoft Word
  - File → Save As → Choose "Word Document (*.docx)"
  - Or use LibreOffice Writer (free) to convert

### Form not filling correctly
- Placeholders might be split across text runs in Word
- Solution: Delete and retype placeholder without formatting
- Don't use bold/italic on placeholders

### CCCD validation errors
- Must be exactly 9 or 12 digits
- Solution: Remove all non-digit characters
- Auto-formatting happens during input

### Session data not saving
- Check browser localStorage is enabled
- Clear cache and restart app
- Check disk space available

### Village not filling when reusing data
- Ensure ward is selected first
- Manual village entries are now fully supported
- Check that address string format is correct (Village, Ward, Province)

### Export very slow
- Large templates (> 50MB) take longer
- Close unused applications
- Use SSD for faster file I/O

---

## 📝 Version History

### v5.6 - Flexible Village Input System
- **Manual village input** when not in database
- **Smart dropdown behavior**: Show suggestions when available, allow typing when not
- **Improved data reuse**: Village values preserved correctly during reuse
- **Better UX**: Updated placeholder "Chọn hoặc nhập thôn/xóm..."
- **No data loss**: Manual entries saved and restored properly

### v5.5 - Smart Land Type Storage & Auto-Conversion
- Simplified land type logic with auto 3-format generation
- Smart conversion based on template type
- No data loss during reuse
- Improved session merge strategy

### v5.4 - Enhanced Reuse Dropdown & Land Type Conversion
- Fixed dropdown event listener management
- Smart land type conversion between formats
- Improved UI with better styling and animations
- Better responsiveness on tab switching

### v5.3 - Smart Validation System
- Visual error highlighting with animations
- Auto tab switching to error location
- Regex constants centralization
- DOM element caching (70% performance improvement)
- Address field special handling

### v5.2 - Notification System Overhaul
- Professional toast notifications
- Confirm dialogs with overlay
- HTML-safe notification system
- Auto-dismiss with manual close option

### v5.1 - File Manager & Config Wizard
- Auto placeholder detection and classification
- Smart config generation
- File manager with add/delete/view
- Session storage with smart merge logic

### v5.0 - Person Management System
- LocalStorage for people management
- CRUD operations with validation
- Auto-generate IDs and names
- Label management in Vietnamese

### v4.0+ - Previous versions
- Session storage and data reuse
- Land type detail system (D/F/Basic formats)
- Dynamic subgroup management

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

---

## 📄 License

ISC License - See LICENSE file for details

---

## 👨‍💻 Author

**LuuTung0102**
- GitHub: [@LuuTung0102](https://github.com/LuuTung0102)

---

**Made with ❤️ by LuuTung0102**
