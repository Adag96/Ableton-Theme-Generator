# Work Log

## 2026-3-20 12:40
- Fixed hue injection for WaveformColor and DimmedWaveformColor — waveforms now visibly take on the accent color for both light and dark themes
- Added hue injection for LoopColor and OffGridLoopColor — loop braces, locators, and timeline markers now take on the secondary accent color

## 2026-3-15 00:28
- Documented 7 more Ableton theme parameters: RetroDisplayGreen, RetroDisplayHandle1, RetroDisplayHandle2, ControlOnForeground, ControlOffForeground, ViewControlOn, ViewControlOff
- Updated hue injection research with new candidate parameters (WaveformColor, LoopColor, AutomationColor, etc.) and design decision to keep base algorithm faithful to Ableton's conventions
- Documented 2 more parameters: GridLineBase, ArrangementRulerMarkings
- Created tiered implementation plan for expanding hue injection to waveforms, timeline markers, grid, and browser elements


## 2026-3-13 21:50
- Redesigned theme creation view: 'Import Image' and 'Make One For Me' buttons now scale proportionally with window size
- Renamed random theme generator button to 'Make One For Me' with subtitle 'Generate a theme algorithmically'
- Window now resizes proportionally (3:2 ratio) and remembers size/position between sessions
- Hue Injection settings (enabled state and strength) now persist when saving themes and restore correctly when editing
- Theme updates now show a toast notification with instructions to switch themes in Ableton Live to see changes
- Alternate button states (Installed, Uninstall hover, Pending Review) now have consistent visual styling with color-matched glows, thicker borders, and proper visibility in both light and dark app themes
- Footer buttons improved: 'Send Love' and 'Feedback' now have matching pill styling with text labels, larger icons, and better dark mode visibility
- Added holographic shimmer effect to footer: 'Made With Love by Lonebody' text and 'Support Me' button now animate with neon gradient colors
- Documented 9 Ableton theme parameters: BrowserSampleWaveform, AutomationColor, VelocitySelectedOrHovered, WaveformColor, DimmedWaveformColor, LoopColor, RetroDisplayBackground, RetroDisplayBackgroundLine, RetroDisplayRed


## 2026-3-12 19:38
- Fixed theme library corruption issue that was causing 'My Themes' to appear empty after app restart
    - App now validates the library on load and backs up corrupted files before resetting
    - Writes are now atomic to prevent partial writes
- Preview images are now stored as separate files instead of embedded in the library, reducing file size significantly
- Tested SpectrumDefaultColor (EQ analyzer waveform) for hue injection:
    - Dark themes: noticeable color variety, included in algorithm
    - Light themes: effect is imperceptible regardless of settings, no special handling
- Community themes now load instantly when switching views instead of showing a loading spinner each time


## 2026-3-9 18:22
- Continued explorations of 'color variety' via Hue Injection:
    - detail_bg, surface_highlight, control_bg all working well and implemented into Hue Injection algorithm
    - surface_border tested but shelved due to unconvincing results
- User can now set swatches to colors from the image, regardless of whether the swatch was algorithmic or from the image directly
- Color markers now automatically remove themselves when the user manually edits a swatch to a different color


## 2026-3-6 23:59
- Tweaked default window instantiation size so no vertical scrollbar is needed
- Home and community gallery views now scale proportionally
- Implemented minimum window size to 1000x750 and maximum window size to 1600x1000
- Theme generation automatically picks theme type (dark/light) so it starts with swatches populated to clarify user experience
- Theme creator edit sliders are now retained after re-saving a theme so the user can re-visit their work
- Added small edit buttons to theme cards in 'My Themes' view
- Added 'By submitting this theme, you confirm...' statement to theme submission overlay for legal reasons and made overlay a bit wider
- Created temporary 'Image to Theme Generation Research' doc which contains an implementation plan to solve theme generation variety issues
- Replaced 'Transparent' theme generation mode with new 'Sampled' mode from phase 1 of research implementation. It more frequently derives surface colors directly from the inputted image


## 2026-3-5 19:29
- Fixed an issue where clicking in the description box of the theme submission overlay closed it
- Fixed click+drag issue that was closing overlays, was still applying to theme submission overlay
- Users can no longer re-submit themes that were already rejected
- Updated styling of approved themes to 'Featured' button
- Fixed an issue where color swatch editing pop-up would close on click interactions and not close on 'Done' button press (inverse of desired behavior)

## 2026-3-4 21:52
- Added swatch text labels to preview overlay of community themes to match 'My Themes' preview
- Removed redundant 'installed' / 'not installed' badge on My Themes previews
- Added dark/light and contrast badges to community theme preview overlays
- Added contrast level tracking in Supabase database for community themes
- Added a flag to track drag states and prevent modal close when drag exits modal area


## 2026-3-2 23:52
- Added step-through arrows on the left and right of the Ableton preview overlay when viewing themes


## 2026-2-26 22:36
- Re-formatted theme cards in Community view and My Themes view to use the same visual convention
- Unified theme ID convention so the app correctly recognizes installed themes regardless of which view you're in
- Added automatic cleanup that removes uninstalled community-downloaded themes from local storage since they can be re-downloaded anytime
- Created bug/feature request report functionality and added a Supabase table and webhook to email notification


## 2026-2-23 17:50
- Implemented a magnifying glass effect on Ableton preview images when user hovers over them
- Added 'Mood Adjustment' sliders for fine-tuning of image theme generations
- Added a 'I'm Feeling Lucky' random theme generator
- User can now click and change selected swatch colors
- Updated very outdated Feature Overview doc
- Devised a full distribution plan in 'Distribution Plan.md'
- Added All/Dark/Light filtering and sorting options to Community Themes page (same options as 'My Themes' view)
- Updated database to store dark/light states of themes
- Markers on image preview can now be dragged to change the active color
- Created themes can now be edited and re-saved
- Re-worded 'Download' button on theme overlay to 'Download .ask'


## 2026-2-22 23:50
- Moved user login status and controls to persist within main title bar instead of only Community view
- Fixed issue where sign-in overlay was not visible as it was positioned within the title bar
- Moved the community theme section to the home view in carousel format
- Added a preview overlay when a community card is clicked that contains the Ableton preview image
- Re-formatted user profile view to include bio, editable display name and social media links. Moved email address read-out to settings.
- Implemented a public-facing, read-only user profile view
- All user profile names are now hyperlinked to their read-only profile view
- Added metadata to track which user created each theme, so multiple users on the same machine have unique themes shown
- Re-formatted 'My Submissions' view:
    - View now sorts user submissions by review status
    - Users can remove submissions that are rejected or in progress
    - Created database trigger to remove community theme entry rows if the user deletes their submission
- Added a database trigger that automatically creates a profile row when new users sign up
- Added a local persistent state to keep track of whether or not community themes are installed on user's system
- Fixed an issue where install/uninstall button also caused the overlay to open when clicking on featured community theme cards
- Changed UX interactions for install/uninstall card buttons
- Fixed an issue where user profile changes couldn't be saved


## 2026-2-21 23:42
- Fixed email notification for theme submissions
- Approved theme submissions now show in community page
- Changed design aesthetic to be a bit lighter and more sleek
- Added dark/light app theme toggle


## 2026-2-20 16:32
- Added required and optional email preference checkboxes to sign up form


## 2026-2-19 18:54
- Card previews in 'My Themes' view can now be expanded to show more features (color swatches, download, rename, delete)
- Implemented a contrast pairing validation check and auto-correct feature for icons and text
- Added separate handling for installed and uninstalled themes. Uninstalling a theme now removes the .ask file from directory
- Added separate sections in 'My Themes' page for installed vs available themes
- Contrast and visibility improvements for dark theme generation:
    - Surface highlights are now at least 12% lighter than surface base (previously as low as 8%)
    - Dark themes now enforce a minimum 5% lightness for control backgrounds, preventing 'invisible controls' issue
- Created confirmation dialog overlay for deleting themes from 'My Themes' view
- Attempt to make themes match images more closely: created 'Transparent' and 'Vibrant' extraction modes
- Set up Supabase auth, database and storage buckets, as well as email notification webhook


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