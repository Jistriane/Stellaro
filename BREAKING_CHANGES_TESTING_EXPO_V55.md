# Expo v55 Upgrade — Breaking Changes & Testing Plan

**Date:** 2026-05-02  
**Upgraded from:** Expo ~54.0.33  
**Upgraded to:** Expo ~55.0.19  
**Impact:** React Native mobile app (iOS, Android, Web)

## Critical Breaking Changes in Expo SDK 55

### 1. **React Native Version Bump**
- **Issue:** Expo 55 may require React Native 0.85.x or later; we currently have 0.81.5.
- **Action Required:** Update `react-native` and verify compatibility with Expo ecosystem.
- **Test:** Build and run on both iOS and Android.

### 2. **Module Changes & Deprecations**
- **Issue:** Some Expo modules may have breaking API changes (e.g., `expo-web-browser`, `expo-status-bar`).
- **Action Required:** Review module changelogs and check deprecation warnings during build.
- **Test:** Build warnings during `expo build` or EAS build.

### 3. **Navigation Stack Changes**
- **Issue:** `@react-navigation` packages may have breaking changes in v7.x.
- **Action Required:** Verify `@react-navigation/native`, `@react-navigation/bottom-tabs` work with Expo 55.
- **Test:** Navigation flow tests (see below).

### 4. **WebAuthn / Authentication Changes**
- **Issue:** `@simplewebauthn/browser` and Freighter SDK may need updates for Expo 55 compatibility.
- **Action Required:** Test biometric login and Freighter wallet integration.
- **Test:** Authentication flow tests.

### 5. **Build & Bundling Changes**
- **Issue:** Metro bundler behavior may change; build output size/performance may differ.
- **Action Required:** Monitor bundle size; run profiling if performance critical.
- **Test:** Production build size and startup time.

### 6. **Native Bindings**
- **Issue:** iOS/Android native libraries may require rebuild with new Expo SDK.
- **Action Required:** Rebuild native dependencies; test on real devices.
- **Test:** Install on physical iPhone/Android device.

## Testing Checklist

### Phase 1: Build & Dependency Validation ✅
- [ ] `npm install` completes without errors
- [ ] `expo doctor` returns green status (if available)
- [ ] No unresolved peer dependency warnings
- [ ] TypeScript type-check passes for mobile app

### Phase 2: Web Build 🌐
- **Command:**
  ```bash
  cd apps/mobile
  npm run web
  ```
- [ ] Web app builds without errors
- [ ] Web app runs on `localhost:19006` (or configured port)
- [ ] Navigation works on web
- [ ] API calls succeed
- [ ] Layout responsive on mobile viewport

### Phase 3: iOS Build & Test 📱
- **Setup:**
  ```bash
  cd apps/mobile
  npm run ios
  ```
  Or via EAS:
  ```bash
  eas build --platform ios --local
  ```
- [ ] iOS app builds without errors
- [ ] Simulator launches app successfully
- [ ] Main screen renders correctly
- [ ] Navigation between tabs works
- [ ] Bottom tab bar displays all tabs
- [ ] API communication works (check logs with `expo logs`)
- [ ] WebAuthn/Freighter login flow works

### Phase 4: Android Build & Test 🤖
- **Setup:**
  ```bash
  cd apps/mobile
  npm run android
  ```
  Or via EAS:
  ```bash
  eas build --platform android --local
  ```
- [ ] Android app builds without errors
- [ ] Emulator launches app successfully
- [ ] Main screen renders correctly
- [ ] Navigation between tabs works
- [ ] Bottom tab bar displays all tabs
- [ ] API communication works
- [ ] WebAuthn/Freighter login flow works
- [ ] Check for ANR (Application Not Responding) issues

### Phase 5: Critical User Flows 🔄
- [ ] **Authentication:** Biometric login works (if enabled)
- [ ] **Wallet Integration:** Freighter connection works
- [ ] **Ride Request:** Can request ride (if applicable)
- [ ] **Payments:** Payment flow works end-to-end
- [ ] **Navigation:** All navigation paths work
- [ ] **Data Fetching:** React Query caching works correctly
- [ ] **State Management:** Zustand state persists/resets correctly

### Phase 6: Performance & Stability 🚀
- [ ] App startup time < expected baseline (measure with `expo-perf` or Xcode/Android Studio)
- [ ] Memory usage is stable (no memory leaks detected)
- [ ] Background tasks don't crash (if applicable)
- [ ] App doesn't crash when backgrounded/foregrounded
- [ ] Long-running operations don't timeout

### Phase 7: Physical Device Testing 📲
- **Devices:**
  - [ ] iPhone 14+ (or latest available)
  - [ ] Android 12+ phone
- **Tests:**
  - [ ] App installs without errors
  - [ ] All features work as expected
  - [ ] Camera/location permissions work (if used)
  - [ ] Network conditions (WiFi, 4G/5G)
  - [ ] Offline mode (if applicable)

## Known Compatibility Issues & Workarounds

| Package | Issue | Workaround |
|---------|-------|-----------|
| `react-native` | May need 0.85+ | Update in separate PR after Expo 55 stabilization |
| `@simplewebauthn/browser` | May need version bump | Check compatibility; upgrade if needed |
| `expo-web-browser` | Potential API changes | Test Freighter integration flows |

## Rollback Plan

If critical issues found:

1. Revert Expo to 54.0.33 in `apps/mobile/package.json`
2. Run `npm install` to restore lockfile
3. Rebuild and test:
   ```bash
   npm run web
   npm run ios
   npm run android
   ```

**Full Rollback:**
```bash
cd apps/mobile
npm install expo@54 --save
npm install
npm run ios  # or android/web
```

## Recommended Merge Strategy

1. **Web Build First:** Ensure web builds and runs without errors
2. **iOS/Android Build:** Build on both platforms locally or via EAS
3. **Device Testing:** Test on at least one iOS and one Android physical device
4. **Performance Check:** Verify no major performance regression
5. **Code Review:** Get approval from mobile team lead
6. **Canary Deploy:** Deploy to TestFlight (iOS) and internal testing (Android) first
7. **Merge:** Only after canary passes without issues

## Expo v55 Resources

- [Expo SDK 55 Release Notes](https://github.com/expo/expo/releases/tag/sdk-55.0.0)
- [Expo Upgrade Guide](https://docs.expo.dev/eas-update/introduction/)
- [React Native 0.85 Release Notes](https://github.com/facebook/react-native/releases)
- [Expo Documentation](https://docs.expo.dev)

## Notes

- Expo 55 may include performance improvements and security patches
- Monitor EAS build times; they may change with new SDK
- Consider running `expo doctor --fix-dependencies` to auto-fix some issues
- Test with real devices before production release; simulators don't catch all issues

---

**Owner:** Mobile Team  
**Priority:** High (major version bump)  
**Status:** Ready for review and testing
