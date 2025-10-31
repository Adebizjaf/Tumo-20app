# Speech Recognition Secure Context Fix

## Problem
The speech recognition feature fails with error:
```
🚫 Speech recognition service not allowed. 
⚠️ Common causes: 
1. NOT using HTTPS or localhost 
2. Browser doesn't support speech recognition 
3. Browser settings blocking microphone 
4. Using private/incognito mode
```

## Root Cause
Web Speech API (SpeechRecognition) requires a **secure context**. This means:
- ✅ `https://tumoo.netlify.app` (HTTPS - secure)
- ✅ `http://localhost:8080` (localhost - trusted)
- ✅ `http://127.0.0.1:8080` (loopback - trusted)
- ❌ `http://example.com` (HTTP - insecure, blocked)

Production sites MUST use HTTPS. Local development can use localhost.

## Solution Applied

### 1. Enhanced Error Messages
**File**: `/client/hooks/use-dual-speech-recognition.ts`
- Added detailed troubleshooting for speech recognition errors
- Specific error mapping with actionable solutions
- Clear distinction between HTTPS requirements and browser support

**File**: `/client/pages/Conversations.tsx`
- Added secure context (HTTPS/localhost) detection before accessing Speech API
- Shows protocol and hostname for debugging
- Warns users if not on HTTPS and not on localhost

### 2. Security Headers
**File**: `/netlify.toml`
- Added `Permissions-Policy` header allowing microphone access
- Added `Content-Security-Policy` with `upgrade-insecure-requests`
- Added `Strict-Transport-Security` to enforce HTTPS

**File**: `/server/index.ts`
- Added Express middleware for same security headers in development

These headers ensure:
- Browser knows microphone is allowed on this site
- Automatic redirect from HTTP to HTTPS (when possible)
- Secure context is enforced

### 3. Production URL Redirect
**File**: `/netlify.toml`
- Added HTTP to HTTPS redirect at server level
- Ensures all requests use secure HTTPS protocol

## Testing the Fix

### Production Site (https://tumoo.netlify.app)
1. ✅ Go to https://tumoo.netlify.app
2. ✅ Click "Live Conversation Mode"
3. ✅ Allow microphone access when prompted
4. ✅ Click the large microphone button
5. ✅ Speak to test the speech recognition

### Local Development (http://localhost:8080)
1. ✅ Run `npm run dev`
2. ✅ Open http://localhost:8080
3. ✅ Navigate to Conversations page
4. ✅ Test speech recognition (works on localhost)

## Troubleshooting

### Error: "Speech recognition service not allowed"

**Check 1: Verify HTTPS (Production)**
- ❌ If URL starts with `http://` (without 's'), change to `https://`
- ✅ Correct: `https://tumoo.netlify.app`
- ❌ Wrong: `http://tumoo.netlify.app`

**Check 2: Browser Support**
- ✅ Works: Chrome, Edge, Safari
- ❌ Doesn't work: Firefox (no Web Speech API support)

**Check 3: Microphone Permissions**
1. Look for the 🔒 lock icon in your browser address bar
2. Click it to open site settings
3. Find "Microphone" in the permissions list
4. Change from "Block" to "Allow"
5. Reload the page

**Check 4: Private/Incognito Mode**
- Try regular browsing mode (not private/incognito)
- Some browsers restrict APIs in private mode

**Check 5: Browser Console**
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Look for messages like:
   - `🔒 Secure Context Check: isSecureContext=true, protocol=https:, hostname=tumoo.netlify.app`
   - `✅ Speech Recognition API available`
   - Error messages with details

### Error: "No microphone found"
- Connect a microphone or headset to your device
- Check Windows Settings → Sound → Input to verify microphone is detected
- Try unplugging and replugging the microphone
- Restart your browser

### Error: "Microphone is busy"
- Close other apps using the microphone (Zoom, Teams, Discord, etc.)
- Restart your browser
- Try again

### Error: "Microphone access denied"
1. Click the 🔒 lock icon in address bar
2. Find "Microphone" setting
3. Change from "Blocked" to "Ask" or "Allow"
4. Reload the page
5. Click allow when prompted

## Technical Details

### Secure Context Requirements
[Web Speech API MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

A secure context is a requirement for:
- getUserMedia() (microphone access)
- SpeechRecognition API
- SpeechSynthesis API

Only HTTPS (or localhost) provides a secure context. This is a browser security feature to protect user privacy.

### Headers Explanation

| Header | Purpose |
|--------|---------|
| `Permissions-Policy: microphone=*` | Allows microphone access on this site |
| `Content-Security-Policy: upgrade-insecure-requests` | Automatically upgrade HTTP to HTTPS |
| `Strict-Transport-Security` | Forces HTTPS for all future requests |

### Code Changes

**Conversations.tsx - Secure context check:**
```typescript
const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
if (!isSecureContext && hostname !== 'localhost') {
  alert(`🚫 Speech recognition requires HTTPS`);
}
```

**use-dual-speech-recognition.ts - Enhanced error mapping:**
```typescript
const errorMapping: Record<string, string> = {
  'not-allowed': '🚫 Speech recognition service not allowed. ...',
  'service-not-allowed': '🚫 Speech recognition service not allowed. ...',
  // ... more error types
};
```

## Rollout Status

✅ Enhanced error messages deployed
✅ Secure context detection added
✅ Security headers added to Netlify
✅ Security headers added to Express server
✅ All TypeScript validations passing

## Next Steps for Users

1. **Production Users**: Visit https://tumoo.netlify.app (HTTPS required)
2. **Local Developers**: Use http://localhost:8080
3. **Check Browser Console** (F12) for debug messages
4. **Allow microphone** when prompted
5. **Report issues** with exact error messages from console

## References

- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Secure Context - MDN](https://developer.mozilla.org/en-US/docs/Glossary/Secure_context)
- [getUserMedia API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
