# FinTrack — Phase 11.2 Advanced Authentication & Upload Security Audit Report

**Date:** October 2, 2026  
**Status:** PHASE 11.2 AUDIT COMPLETE  
**Code Modification Status:** NO CODE MODIFICATIONS MADE  
**Test Baseline:** 640 / 640 TESTS PASSING (Server: 268/268, Web: 112/112, Mobile: 260/260)  
**Scope of Audit:** 
1. JWT Authentication Architecture  
2. Password Security Policy  
3. File Upload / Import Security  
4. Web JWT Storage & Client Exposure  

---

## 1. Executive Summary

This Phase 11.2 security audit provides a thorough, deep-dive architectural evaluation of FinTrack's four advanced authentication, credential storage, and ingestion domains. 

The application exhibits a resilient and well-structured baseline:
* **Multi-tenant isolation** is enforced across 100% of data models and controller handlers via `req.userId`.
* **Zero-disk file ingestion** operates entirely in-memory (`multer.memoryStorage()`), preventing server-side path traversal and arbitrary code persistence.
* **3-tier defense-in-depth sanitization** prevents OTP, PIN, and password leakage from push notifications and SMS feeds.
* **Confirmed-only financial invariant** ensures that unverified or imported staging items never impact financial balance sheets, intelligence, or reports.

However, advanced enterprise considerations—such as single 7-day JWT lifespans without revocation, client-side LocalStorage token persistence, unconstrained password complexity, and absence of magic-byte file signature validation—warrant strategic architectural roadmap planning.

---

## 2. Current JWT Architecture

| Aspect | Current Implementation Details |
|---|---|
| **Token Format** | Standard signed JSON Web Token (HMAC SHA-256 via `jsonwebtoken`). |
| **Payload Claims** | `{ id: user._id }` (subject identifier only, no PII). |
| **Token Expiration** | `process.env.JWT_EXPIRE || '7d'` (7 days default lifespan). |
| **Issuance Points** | `POST /api/auth/signup` and `POST /api/auth/login` via `generateToken(user._id)`. |
| **Verification** | `protect` middleware in [`server/middleware/authMiddleware.js`](file:///d:/Major%20project/Finance-Tracker-Initial-Codes/server/middleware/authMiddleware.js) verifies `Authorization: Bearer <token>` using `process.env.JWT_SECRET`. |
| **Secret Isolation** | Backend-only environment variable (`JWT_SECRET`). Never bundled into web or mobile clients. |
| **Web Storage** | `window.localStorage.setItem('token', token)` managed via Redux [`authSlice.js`](file:///d:/Major%20project/Finance-Tracker-Initial-Codes/client/src/redux/slices/authSlice.js). |
| **Mobile Storage** | Hardware-backed `expo-secure-store` (Android EncryptedSharedPreferences / iOS Keychain) in [`mobile/src/services/secureStore.js`](file:///d:/Major%20project/Finance-Tracker-Initial-Codes/mobile/src/services/secureStore.js). |
| **Refresh Tokens** | **None.** No refresh token endpoint, token rotation mechanism, or refresh storage exists. |
| **Server-Side Invalidation** | **None.** Logout (`authSlice.logout` and `authService.logout`) is purely client-side removal of the token. |
| **Token Versioning** | **None.** The `User` model does not track a `tokenVersion` or `passwordChangedAt` timestamp. |
| **Multiple Sessions** | Supported statelessly; any valid signed token is accepted until its expiry timestamp. |
| **Password Change Invalidation** | Changing password updates the hash in MongoDB, but previously issued JWTs remain valid for their remaining duration. |
| **Account Deletion Invalidation** | Stateless token verification accepts the token signature; endpoints with subsequent `User.findById` will return 404, but endpoints querying purely by `userId` in `req.userId` would remain active until expiry. |

---

## 3. JWT Risks & Vulnerability Analysis

1. **Stateless Replay Window (7-Day Compromise Window)**:
   - *Risk:* If a client token is intercepted (via MITM on unencrypted networks, compromised client device, or malicious browser extensions), the attacker can access the API for up to 7 days.
   - *Severity:* **MEDIUM-HIGH**
   - *Mitigation:* Transition to short-lived access tokens (15–60 minutes) coupled with refresh token rotation or a `tokenVersion` check.

2. **No Immediate Revocation on Password Change / Signout**:
   - *Risk:* A user changing their password after suspecting unauthorized access cannot invalidate existing active sessions on other devices.
   - *Severity:* **MEDIUM**
   - *Mitigation:* Add `passwordChangedAt` or `tokenVersion` to the `User` schema and verify during JWT decoding.

---

## 4. Password Security Policy

| Parameter | Current Specification | Evaluation & Standard Comparison |
|---|---|---|
| **Minimum Length** | 6 characters (`minlength: [6]` in `User.js` & `authController.js`). | Below modern NIST standard (recommended: 8–12 chars). |
| **Maximum Length** | Unconstrained in schema (Bcrypt truncates at 72 bytes). | Standard; safe against basic DoS. |
| **Complexity Requirements** | None (allows passwords with all lowercase letters, e.g. `secret`). | NIST SP 800-63B recommends minimum length over complex character rules, but 8+ chars is standard. |
| **Hashing Algorithm** | Bcrypt with salt work factor of 10 (`bcrypt.genSalt(10)`). | **Industry Standard & Robust.** Resilient against GPU rainbow table attacks. |
| **Database Projection** | `select: false` on `password` field in `User.js`. | **Excellent.** Prevents accidental leakage in `.find()` or `.populate()`. |
| **Password Verification** | `bcrypt.compare(enteredPassword, this.password)`. | **Constant-Time Comparison.** Prevents timing attacks. |
| **User Enumeration Defense** | `POST /login` returns `'Invalid email or password'` for both nonexistent emails and bad passwords. | **Secure.** Zero account enumeration on login. |
| **Signup Enumeration** | `POST /signup` returns `'User already exists with this email'`. | Standard behavior for self-service SaaS signups. |
| **Password Reset Mechanism** | None currently implemented. | Out of scope for current phase. |
| **Rate Limiting** | Dedicated `authRateLimiter` (15 min window, max 10 attempts per IP). | **Protected.** Hardened in Phase 11.1. |

---

## 5. Password Risks & Vulnerability Analysis

1. **Short Minimum Length (6 Characters)**:
   - *Risk:* 6-character passwords have lower entropy and are vulnerable to targeted dictionary attacks if rate limiters are bypassed.
   - *Severity:* **LOW-MEDIUM**
   - *Mitigation:* Elevate minimum password length to 8 characters with at least one number and one letter for new signups.

2. **Lack of Password Reset Flow**:
   - *Risk:* Users forgetting passwords cannot self-recover without manual database intervention.
   - *Severity:* **INFORMATIONAL** (Feature roadmap item).

---

## 6. File Upload / Import Security

| Security Parameter | Current Implementation | Status |
|---|---|---|
| **Storage Engine** | `multer.memoryStorage()` (in-memory buffer processing). | **Secure.** Zero temporary files created on disk. |
| **Max File Size Limit** | `5 * 1024 * 1024` (5MB enforced at Multer middleware). | **Secure.** Prevents memory exhaustion / DoS. |
| **Allowed File Types** | `.csv`, `.xlsx`, `.xls` checked via `originalname.toLowerCase().endsWith(...)`. | Functional, but extension-only. |
| **File Signatures / Magic Bytes** | Not checked (no buffer header validation e.g. `PK\x03\x04` for XLSX). | **Opportunity for hardening.** |
| **Path Traversal Risk** | **Zero.** Files are never written to filesystem directories (`/tmp`, `./uploads`). | **Immune.** |
| **CSV Parser** | Streaming `Readable.from().pipe(csv())` with header mapping. | **High Performance & Safe.** |
| **XLSX Parser** | SheetJS `xlsx.read(buffer, { type: 'buffer', cellDates: true })`. | Memory bounded by 5MB upload limit. |
| **CSV Formula Injection** | Cells are read into JS strings and parsed as floats. Raw cell export back to CSV does not strip leading `=,+,-,@`. | **Low-Medium.** Staged data is safe; export sanitization recommended. |
| **Duplicate Ingestion** | Ingestion computes deterministic hash (`userId + date + amount + merchant + reference + type`) and marks duplicates. | **Protected.** |
| **Staging Invariant** | 100% of imported records enter `status: 'staged'` and require user review. Never auto-confirmed. | **Strictly Enforced.** |
| **Multi-Tenant Scoping** | All `ImportBatch` and staged `Transaction` documents are scoped by `{ userId: req.userId }`. | **Isolated.** |

---

## 7. File Upload Risks & Vulnerability Analysis

1. **Extension-Only Validation (Missing Magic-Byte Validation)**:
   - *Risk:* A user could upload an executable or HTML file renamed to `.csv` or `.xlsx`. While `multer.memoryStorage()` prevents server execution, the file would trigger a parsing error in `fileParserService.js`.
   - *Severity:* **LOW**
   - *Mitigation:* Validate buffer header bytes (e.g. XLSX zip header `50 4B 03 04`, CSV printable ASCII/UTF-8 check) before invoking parsers.

2. **CSV Formula Injection (Spreadsheet DDE)**:
   - *Risk:* If a crafted CSV containing `=CMD|'...'!A0` or `=SUM(...)` in a merchant/description field is imported and later exported to CSV/Excel for viewing in Microsoft Excel, Excel may execute the formula.
   - *Severity:* **LOW**
   - *Mitigation:* Prepend a single quote (`'`) to string fields starting with `=`, `+`, `-`, or `@` during CSV/PDF export generation.

---

## 8. Web JWT Storage & Client Exposure

| Mechanism | Web Client Implementation Details |
|---|---|
| **Storage Mechanism** | `window.localStorage.getItem('token')` / `setItem('token')`. |
| **Client Accessibility** | Fully readable by JavaScript executing in the browser context. |
| **HttpOnly Cookies** | Not used. Tokens are passed in `Authorization: Bearer <token>` header. |
| **XSS Vulnerability Analysis** | **Zero sinks detected.** Codebase contains zero instances of `dangerouslySetInnerHTML`, `eval()`, `innerHTML`, or `document.write`. |
| **React Auto-Escaping** | React 18 JSX auto-escapes all string variables rendered into the DOM. |
| **Third-Party Script Surface** | Only trusted Google Fonts preconnect (`fonts.googleapis.com`, `fonts.gstatic.com`). No 3rd-party ad or tracker scripts. |
| **Token in URLs / Referrers** | Tokens are never passed in URL query parameters; referrers cannot leak auth tokens. |
| **Token in Browser Logs** | Redux actions and API requests do not print authorization headers to `console.log`. |
| **Session Cleanup** | `authSlice.actions.logout()` actively clears `localStorage.removeItem('token')` and `localStorage.removeItem('user')`. |
| **Automatic 401 Interception** | Axios interceptor in [`client/src/services/api.js`](file:///d:/Major%20project/Finance-Tracker-Initial-Codes/client/src/services/api.js) automatically clears `localStorage` and resets session on HTTP 401. |

---

## 9. Web Storage Risks & Vulnerability Analysis

1. **LocalStorage Susceptibility to XSS**:
   - *Risk:* While FinTrack has zero current XSS sinks, any future dependency vulnerability (e.g., in a third-party npm package) could theoretically access `window.localStorage`.
   - *Severity:* **LOW-MEDIUM**
   - *Mitigation Options:*  
     *Option A (Current + Hardened):* Retain `localStorage` and enforce strict Content Security Policy (CSP) headers + dependency auditing.  
     *Option B (HttpOnly Cookies):* Migrate web session tokens to `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict`.

---

## 10. Cross-Area Threat Model & Matrix

```
[ Client Request / Upload ]
            ↓
  [ CORS & Rate Limiter ]  ──── (Blocks automated brute force & unauthorized origins)
            ↓
    [ JWT Middleware ]     ──── (Validates signature & scopes req.userId)
            ↓
  [ Controller Handler ]   ──── (Enforces multi-tenant query: { userId: req.userId })
            ↓
   [ Ingestion Staging ]   ──── (status: 'staged', isolates unconfirmed records)
            ↓
   [ Confirmed Ledger ]    ──── (Authoritative financial calculations & reports)
```

| Threat ID | Threat Vector | Target Domain | Current Protection | Residual Risk | Severity |
|---|---|---|---|---|---|
| **T-01** | Token Theft via Interception | JWT Architecture | HTTPS required in production | Token valid for 7 days if stolen | **MEDIUM** |
| **T-02** | Stolen Token Reuse After Logout | JWT Architecture | Client-side token removal | Stolen token valid until expiry | **MEDIUM** |
| **T-03** | Stolen Token After Password Change | JWT Architecture | Password updated in DB | Existing tokens not revoked | **MEDIUM** |
| **T-04** | Brute-Force Password Guessing | Password Security | `authRateLimiter` (10 / 15m) | Low password complexity (6 chars) | **LOW** |
| **T-05** | Memory Exhaustion via Big File | File Uploads | Multer 5MB memory limit | Zero disk I/O; bounded buffer | **LOW** |
| **T-06** | Path Traversal / Shell Upload | File Uploads | In-memory parser; no disk write | Malformed files fail parsing | **INFORMATIONAL** |
| **T-07** | Formula Injection in Export | File Uploads | Staged records validated | Potential DDE in external Excel | **LOW** |
| **T-08** | Token Theft via XSS | Web Storage | Zero `dangerouslySetInnerHTML` | LocalStorage readable by JS | **LOW** |
| **T-09** | Cross-Tenant Data Access | Authorization | `{ userId: req.userId }` everywhere | Zero cross-tenant data leakage | **INFORMATIONAL** |

---

## 11. Recommended Architecture Options

### Option 1: JWT Session Invalidation via `tokenVersion` (Recommended for Phase 12)
* **Concept:** Add an integer field `tokenVersion: { type: Number, default: 0 }` to the `User` model. Include `tokenVersion` in the JWT payload.
* **Mechanism:**
  - `protect` middleware compares `decoded.tokenVersion === user.tokenVersion`.
  - When user clicks "Sign Out of All Devices" or changes password, increment `user.tokenVersion++`.
  - All existing tokens across all devices are immediately and permanently invalidated server-side.
* **Benefits:** Zero Redis/database token blacklist overhead; instantaneous revocation on password change; 100% backward compatible.

### Option 2: Short-Lived Access Tokens + Refresh Token Rotation
* **Concept:** 15-minute access token paired with a cryptographically random refresh token stored in an indexed `RefreshToken` collection.
* **Mechanism:**
  - Access token expires in 15 minutes.
  - Client uses `POST /api/auth/refresh` to obtain new pair with rotation.
* **Benefits:** Minimizes stolen token window to 15 minutes.

### Option 3: Magic-Byte Buffer Header Validation for Ingestions
* **Concept:** Inspect the first 4–8 bytes of uploaded buffers before parsing:
  - `.xlsx`: Check for ZIP header `0x50 0x4B 0x03 0x04` (`PK\x03\x04`).
  - `.csv`: Validate UTF-8/ASCII printable character distribution.

### Option 4: Minimum Password Length Elevation
* **Concept:** Update minimum password length to 8 characters for new registrations while preserving existing 6-character accounts.

---

## 12. Priority Classification

| Priority | Recommendation | Target Component | Complexity |
|---|---|---|---|
| **HIGH** | JWT Revocation on Password Change (`tokenVersion`) | `server/models/User.js`, `authMiddleware.js`, `authController.js` | Low |
| **MEDIUM** | Elevate New Password Length to 8+ Characters | `server/controllers/authController.js` | Low |
| **MEDIUM** | Magic-Byte File Signature Validation | `server/services/fileParserService.js` | Low |
| **LOW** | CSV Formula Injection Sanitization on Export | `server/services/reportService.js` | Low |
| **LOW** | Short-Lived Access Tokens + Refresh Token Rotation | Full Auth Ecosystem | Medium |
| **INFORMATIONAL** | HttpOnly Cookie Migration for Web Client | `client/`, `server/` | High |

---

## 13. Files That Would Need Changes for Future Hardening

1. **`server/models/User.js`**: Add `tokenVersion: { type: Number, default: 0 }`.
2. **`server/controllers/authController.js`**: Embed `tokenVersion` in `generateToken()`; increment on password change.
3. **`server/middleware/authMiddleware.js`**: Validate `decoded.tokenVersion` against cached/loaded user.
4. **`server/services/fileParserService.js`**: Add `validateFileSignature(buffer, extension)`.
5. **`server/services/reportService.js`**: Add `sanitizeSpreadsheetFormula(text)`.

---

## 14. Expected Test Impact & Baseline Compatibility

* **Test Compatibility:** All proposed future options can be designed with 100% backward compatibility for the existing 640 tests.
* **Mongoose Models:** Adding optional/defaulted schema fields (`tokenVersion: 0`) does not alter existing model queries or fixture assertions.
* **Rate Limits & Parsers:** Test helpers can inject mock tokens or override default parameters safely.

---

## 15. Migration Risks & Mitigation

1. **Active Sessions During `tokenVersion` Deployment**:
   - Existing tokens without `tokenVersion` could either be grandfathered until expiry or require a one-time re-login.
2. **Existing Users with 6-Character Passwords**:
   - Enforcing 8+ characters must be applied only on `signup` and `changePassword`, never blocking existing users on `login`.

---

## 16. Recommended Implementation Order

1. **Step 1:** Password Policy Elevation (8+ chars on new accounts) + Magic-Byte Ingestion Validation.
2. **Step 2:** JWT `tokenVersion` revocation on password change and global logout.
3. **Step 3:** Formula Sanitization on CSV/Excel report exports.
4. **Step 4 (Optional Enterprise):** Refresh Token Rotation & HttpOnly cookie architecture.

---

## 17. Items Intentionally Deferred

> **JWT refresh token rotation, `tokenVersion` schema modifications, password complexity rule changes, magic-byte file signature validation, and HttpOnly cookie migration were intentionally deferred to a separate implementation phase.**

---

**PHASE 11.2 AUDIT COMPLETE**  
**640/640 BASELINE PRESERVED**  
**NO CODE MODIFICATIONS MADE**
