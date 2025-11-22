# Known Issues - Word File Config Wizard

## Issue #1: Create New Group Feature Temporarily Disabled

### Status
⚠️ **TEMPORARILY DISABLED**

### Description
The "Create New Group" button in ConfigWizard is temporarily disabled because Electron does not support the `prompt()` function used for user input.

### Impact
- **Severity**: LOW
- **Workaround Available**: YES
- Users can still use all existing groups from config.json
- Users can manually edit config.json to add new groups

### Workaround
To add a new group:
1. Close the application
2. Open `templates/[folder-name]/config.json`
3. Add new group to the `groups` array:
```json
{
  "id": "NEW_GROUP_ID",
  "label": "Group Display Name",
  "description": "Group description",
  "order": 6
}
```
4. Save the file
5. Restart the application

### Planned Fix
Implement a custom modal dialog to replace `prompt()` function. This will require:
- Creating a reusable InputDialog component
- Updating handleCreateNewGroup() to use the new dialog
- Testing the new implementation

### Priority
**LOW** - This is a convenience feature. Core functionality (adding files, configuring templates) works perfectly without it.

---

## Testing Status After Bug Fixes

### ✅ Fixed Issues
1. **ConfigGenerator class not accessible** - FIXED
2. **Syntax errors from PowerShell escape characters** - FIXED
3. **Method naming conflict (show vs open)** - FIXED
4. **templateEntry undefined** - FIXED

### ✅ Working Features
- ✅ Add new Word file
- ✅ ConfigWizard opens successfully
- ✅ Auto-detect placeholders
- ✅ Auto-create subgroups
- ✅ Select groups
- ✅ Add/remove subgroups
- ✅ Edit subgroup labels
- ✅ Toggle subgroup visibility
- ✅ Save configuration
- ✅ Cancel operation
- ✅ Validation (template name, groups, subgroups)
- ✅ Duplicate subgroup prevention

### ⚠️ Temporarily Disabled
- ⚠️ Create new group (workaround available)

---

## Recommendations

### For Users
- Use existing groups from config.json
- If you need a new group, edit config.json manually
- All core features work perfectly

### For Developers
- Implement custom InputDialog component
- Replace all `prompt()` and `confirm()` calls with custom dialogs
- Consider using a UI library like SweetAlert2 for better dialogs

---

## Summary

The Word File Config Wizard is **fully functional** for its core purpose:
- Adding Word files to folders
- Configuring templates with placeholders
- Managing subgroups and field mappings

The only limitation is creating new groups, which has an easy workaround.

**Overall Status**: ✅ **READY FOR PRODUCTION USE**
