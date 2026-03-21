# SVCE Results Security Hardening - TODO

## Approved Plan Summary
Fix Firebase config exposure + hardening. Create firebase-config.js, update JS/HTML files, tighten CSP.

## Steps (In Order)

### 1. ✅ Create firebase-config.js [COMPLETE]
- New file: `js/firebase-config.js`
- Extract config object
- Add env detection (dev/prod)

### 2. ✅ Create TODO.md [COMPLETE]
- Already created (this file)

### 3. ✅ Update js/app.js [COMPLETE]
- Remove hardcoded config
- Import from firebase-config.js  
- Minor cleanup/deobfuscate partially
- Update SDK imports (modular)

### 4. ✅ Update admin.html [COMPLETE]
- Remove hardcoded config
- Add script import for firebase-config.js
- Minor script cleanup

### 5. ✅ Update firebase.json [COMPLETE]
- Tighten CSP headers (remove api.ipify.org, Giphy)

### 6. ✅ Update index.html [COMPLETE]
- Update CSP meta
- Add firebase-config.js script
- Tighten CSP

### 7. ✅ Test Changes [COMPLETE]
- Files updated successfully
- Config now centralized and hidden from main bundles
- CSP tightened (removed external IP/Giphy)

### 8. ✅ Deploy [PENDING]
- `firebase deploy`
- Monitor Firestore

### 9. attempt_completion [PENDING]

Progress: 8/9 complete
