# Work Log

## 2026-2-19 01:12
- Card previews in 'My Themes' view can now be expanded to show more features (color swatches, download, rename, delete)
- Implemented a contrast pairing validation check and auto-correct feature for icons and text
- Added separate handling for installed and uninstalled themes. Uninstalling a theme now removes the .ask file from directory
- Added separate sections in 'My Themes' page for installed vs available themes


## 2026-2-18 23:25
- Added scroll functionality and card resizing to 'My Themes' view
- Added sorting and theme type filters to 'My Themes' view
- Import image feature now defaults to Pictures directory, then remembers the directory the user last loaded
- Added social media icons/links for Instagram and Youtube to bottom left of interface


## 2026-2-17 18:41
- Built a color extraction system that pulls 4 colors from an imported image and defines light or dark tone convention
- Uploaded image now shows preview thumbnail, which was broken
- Color extraction now shows swatches for the identified colors on top of the imported image
- Removed build number tracking
- Application now applies extracted colors to theme generation and downloads .ask theme file to the identified themes directory
- Generated themes are now saved to 'My Themes' view with a visual preview
- Settings view now displays the full list of identified .ask theme files within the directory
- User can now specify whether they want a Dark or Light theme to be generated prior to extracting colors
- Created 'Feature Overview' document
- Added Contrast settings for theme generation


## 2026-2-16 17:47
- Created CLAUDE.md file in root directory
- Created Claude directory with lessons and todo files
- App now automatically detects Ableton Themes directory for both Mac and PC
- Defined theme generation convention that can create fully convincing Ableton themes from only 5 input colors
- Implemented an image import feature for PNG and JPG files that supports both drag-and-drop and click to browse


## 2026-2-13 23:15
- Initial application build with placeholder buttons, versioning and build # tracking


## 2026-1-26 16:13
- Renamed repository, added Resources directory along with 'Work Log', 'Development Roadmap' and 'Product Brief' documentation
- Examined 2 Default Ableton themes and documented color usage conventions into 'Ableton Theme Convention' file
- Added control definitions for SelectionBackground, StandbySelectionBackground, and SelectionForeground color parameters