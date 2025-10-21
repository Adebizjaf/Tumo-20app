# Voice Input Troubleshooting Guide

## "Could not capture audio" Error - Solutions

### 🎤 Common Causes & Fixes

#### 1. **Microphone Permission Not Granted** ⚠️
**Most Common Issue**

**Solution:**
1. Click the microphone icon in your browser's address bar (🎤)
2. Select "Always allow" for microphone access
3. Refresh the page
4. Try voice input again

**Chrome/Edge:**
- Settings → Privacy and security → Site Settings → Microphone
- Find your site and set to "Allow"

**Firefox:**
- Click the lock icon → Permissions → Microphone → Allow

**Safari:**
- Safari → Settings for This Website → Microphone → Allow

#### 2. **No Microphone Detected** 🎧

**Check:**
- Is your microphone properly connected?
- Is it selected as the default device?

**Windows:**
- Settings → System → Sound → Input
- Select your microphone
- Test microphone

**macOS:**
- System Preferences → Sound → Input
- Select your microphone
- Check input level

#### 3. **HTTPS Requirement** 🔒

The Web Speech API requires HTTPS (except on localhost).

**Current Status:**
- ✅ `localhost:8080` - Works (development)
- ✅ `https://your-site.netlify.app` - Works (production)
- ❌ `http://192.168.x.x:8080` - May not work (network address)

**Solution:**
- Use `localhost:8080` for development
- Deploy to Netlify/Vercel for production (HTTPS automatic)

#### 4. **Browser Compatibility** 🌐

**Supported Browsers:**
- ✅ **Chrome** (Desktop & Android) - Best support
- ✅ **Edge** (Desktop) - Best support
- ✅ **Safari** (Desktop & iOS 14.5+) - Good support
- ❌ **Firefox** (Desktop) - Limited/No support
- ❌ **Opera** - Limited support

**Recommendation:** Use Chrome or Edge for best experience

## 🔧 Enhanced Error Messages

The app now provides specific error messages:

| Error | Meaning | Solution |
|-------|---------|----------|
| "Microphone permission denied" | User blocked mic access | Grant permission in browser settings |
| "No microphone found" | No mic detected | Connect a microphone |
| "No speech detected" | Mic working but no sound | Speak louder or closer to mic |
| "Network error" | Internet issue | Check internet connection |
| "Speech recognition not supported" | Browser incompatible | Use Chrome, Edge, or Safari |

## ✅ Quick Checklist

Before using voice input:

- [ ] Using Chrome, Edge, or Safari browser
- [ ] Microphone is connected and working
- [ ] Microphone permission granted to the website
- [ ] Using HTTPS or localhost
- [ ] Microphone is not muted
- [ ] No other app is using the microphone

## 🧪 Testing Your Microphone

### Test 1: Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for messages like:
   - "Speech recognition started" ✅
   - "Speech recognition error: audio-capture" ❌

### Test 2: Browser Settings
1. Go to your site
2. Click the microphone icon in voice input
3. Check if browser asks for permission
4. If no prompt appears, check site settings

### Test 3: System Microphone
1. Test mic in another app (Zoom, Discord, etc.)
2. If it doesn't work there, it's a system issue
3. Fix system settings first

## 🎯 Step-by-Step: Grant Microphone Permission

### Chrome/Edge:
1. Click 🎤 icon in address bar (or 🔒 lock icon)
2. Click "Microphone"
3. Select "Allow"
4. Refresh page (F5)
5. Try voice input again

### Safari:
1. Safari menu → Settings for This Website
2. Find "Microphone"
3. Change to "Allow"
4. Refresh page
5. Try voice input again

### Firefox (Limited Support):
Firefox may not support the Web Speech API in all regions.
**Recommendation:** Use Chrome instead.

## 💡 Pro Tips

### For Best Results:
1. **Use a good microphone** - Headset mics work better than built-in
2. **Quiet environment** - Reduce background noise
3. **Speak clearly** - Normal speaking pace
4. **Check language** - Make sure source language matches what you're speaking
5. **Test first** - Try saying "hello" before long text

### Common Mistakes:
- ❌ Using Firefox (limited support)
- ❌ Not granting microphone permission
- ❌ Using HTTP instead of HTTPS
- ❌ Microphone muted in system settings
- ❌ Wrong language selected

## 🚀 After Deployment (Netlify/Vercel)

Once deployed, voice input will work if:
- ✅ Site uses HTTPS (automatic on Netlify/Vercel)
- ✅ User grants microphone permission
- ✅ Using supported browser

## 📱 Mobile Support

### iOS (Safari):
- ✅ Works on iOS 14.5+
- Must use Safari browser
- Microphone permission required

### Android (Chrome):
- ✅ Works well
- Must use Chrome browser
- Microphone permission required

## 🆘 Still Not Working?

1. **Check browser console** for error messages
2. **Try incognito/private mode** (rules out extension conflicts)
3. **Test on different browser** (Chrome recommended)
4. **Check microphone in system settings**
5. **Restart browser**
6. **Restart computer** (if mic not working anywhere)

## 🔍 Debug Information

When voice input fails, check the console for:

```javascript
Speech recognition error: {error type}
```

Common error types:
- `not-allowed` → Permission issue
- `audio-capture` → No microphone
- `no-speech` → No sound detected
- `network` → Internet problem
- `aborted` → User stopped it

## ✨ Expected Behavior

When working correctly:
1. Click microphone button
2. Browser asks for permission (first time)
3. Microphone icon becomes active
4. Speak into microphone
5. Text appears in real-time
6. Final text is added to input field

## 📖 Additional Resources

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Browser Compatibility](https://caniuse.com/speech-recognition)
- [Microphone Troubleshooting](https://support.google.com/chrome/answer/2693767)
