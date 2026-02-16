# Windows Testing Checklist

Items to verify on a Windows machine before release.

## Ableton Themes Directory Detection
- [ ] App correctly detects the Ableton Live 12 themes directory
- [ ] Detected path matches the actual install location (expected: `C:\ProgramData\Ableton\Live 12 <Edition>\Resources\Themes`)
- [ ] Settings view displays the correct path and edition name
- [ ] Clicking the path opens the directory in Windows Explorer
- [ ] If Ableton is not installed, the "not found" state is shown correctly
