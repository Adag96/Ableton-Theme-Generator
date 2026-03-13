# Ableton Live 12 Theme Parameter Control Mapping

This document tracks which UI controls and visual elements are affected by each color parameter in Ableton Live 12 theme files (.ask). Use this as a reference when customizing themes to understand the scope of each parameter change.

---

## Color Parameters

### Selection & Highlighting

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| ChosenDefault | **General:** Active/On state for toggles and buttons throughout the UI.<br>**Track:** Track Activator, Pre/Post Toggle, Monitoring (Auto/Off buttons).<br>**Browser:** Show/Hide Filter View, Waveform Vertical Zoom.<br>**Transport Bar:** Automation Arm, MIDI Keyboard, Draw Mode, Metronome, MIDI Overdub, Loop, Punch In/Out, Tap Tempo, External Sync, Link, Follow (all active states).<br>**Devices:** Activator button, plus most toggle buttons in active state (e.g. Limiter Auto-Release, EQ Adaptive Q/Analyze, Compressor Peak/RMS/Expand modes, Utility Mono/Phase buttons, Tuner mode switches). | Very widely used - affects most "on" toggle states |
| ChosenAlternative | | |
| ChosenAlert | | |
| ChosenPlay | | |
| ChosenRecord | | |
| ChosenPreListen | | |
| SelectionBackground | **Arrangement View:** Selected region on timeline; selection highlight for selected track; selection highlight for selected audio/MIDI clips (background only, not waveform or header).<br>**Session View:** Selection highlight for selected track; selection highlight for selected clip.<br>**Browser:** Selection highlight for selected category; selection highlight for selected item within browser.<br>**Detail View:** Selection highlight for selected device; selected region in Sample Editor; selected region in MIDI Note Editor.<br>**Menus:** Active and hover state for all dropdown menus (devices, top menu bar, settings, tracks, etc). | Primary selection color throughout the entire UI - very widely used |
| StandbySelectionBackground | **Browser:** Selection color for items once actively navigated within (passive/unfocused state).<br>**Arrangement View:** Selection region of audio/MIDI clips once navigated away from (e.g., after switching focus to Sample Editor or MIDI Note Editor).<br>**Session View:** Selection color for clips once navigated away from.<br>**Detail View:** Selection color for devices once navigated away from. | Passive/unfocused selection state - pairs with SelectionBackground |
| SelectionForeground | **Browser:** Text color of active/focused item selection; "Results" text.<br>**Arrangement View:** Text name of actively selected track.<br>**Session View:** Text name of actively selected track.<br>**Menus:** Text color for active/hovered items in all dropdowns. | Text color for active selections - pairs with SelectionBackground |
| StandbySelectionForeground | | |
| SelectionBackgroundContrast | | |
| SelectionFrame | | |
| SearchIndication | | |
| SearchIndicationStandby | | |

### Surface & Background

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| SurfaceBackground | **Browser:** Background of the entire browser panel.<br>**Arrangement:** Background of the main arrangement timeline (except actively selected track).<br>**Session View:** Background of track view (except actively selected track).<br>**Detail View:** Background of the effects/device area.<br>**Bottom Bar:** Background of status bar, Clip View selector, and Device View selector. | Primary background color for most major panels |
| SurfaceHighlight | **Arrangement:** Background of selected track.<br>**Session View:** Background of selected track and its Clip Slots; background of selected Scene (horizontal row).<br>**Info View:** Header area background. | Highlights the currently selected/focused elements |
| SurfaceArea | **Arrangement:** Borders around all tracks and their clips in Track View.<br>**Browser:** Borders around the different sections of the browser panel.<br>**Detail View:** Lines of the Clip Overview/Zooming Hotspot.<br>**Bottom Bar:** Border lines within the Clip View selector and Device View selector. | Used for structural divider lines and borders |
| SurfaceAreaFocus | | |
| Desktop | **Global:** All outer-most borders around panels (including main status/menu bar).<br>**Settings:** Header bar of the Settings pop-up; thin border between settings menu panel (left) and settings content (right).<br>**Browser:** Thin divider lines between Filter sections. | Primary border/frame color for major UI boundaries |
| DetailViewBackground | **Clip View (Audio):** Background color behind waveforms in the Sample Editor; Time Ruler above the Sample Editor.<br>**Clip View (MIDI):** Background color for the MIDI Note Editor; Time Ruler above the MIDI Note Editor. | Background for clip editing areas |
| ControlBackground | | |
| BackgroundClip | | |
| BackgroundClipFrame | | |

### Controls & UI Elements

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| ControlForeground | **General:** Primary text/icon color for most non-button UI elements.<br>**Transport Bar:** Arrangement Record button (active state only).<br>**Tracks:** Most text on tracks that isn't on a button.<br>**Browser:** All text and icons (except unavailable locations and section headers like 'Library', 'Places'), search field input text, search clear button, collection text.<br>**Devices:** Titles, knob labels, parameter values, dropdown text, value sliders - anything not on buttons or retro displays. "Drop Audio Effects Here" placeholder text.<br>**Info View:** All text and header.<br>**Settings:** Most text in settings panels (not the category sidebar). | Very widely used for general UI text |
| ControlOnForeground | | |
| ControlOffForeground | | |
| ControlOnDisabledForeground | | |
| ControlOffDisabledForeground | | |
| ControlOnAlternativeForeground | | |
| ControlDisabled | | |
| ControlFillHandle | | |
| ControlTextBack | | |
| ControlContrastFrame | | |
| ControlSelectionFrame | | |
| ControlContrastTransport | | |

### View Controls

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| ViewControlOn | | |
| ViewControlOff | | |
| ViewCheckControlEnabledOn | | |
| ViewCheckControlEnabledOff | | |
| ViewCheckControlDisabledOn | | |
| ViewCheckControlDisabledOff | | |

### Text

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| TextDisabled | | |
| ClipText | | |
| GridLabel | | |
| ProgressText | | |

### Transport

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| TransportOffBackground | | |
| TransportOffForeground | | |
| TransportOffDisabledForeground | | |
| TransportSelectionBackground | | |
| TransportProgress | | |

### Browser

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| BrowserBar | | |
| BrowserBarOverlayHintTextColor | | |
| BrowserDisabledItem | | |
| BrowserSampleWaveform | **Browser:** Waveform color for audio sample previews throughout the browser panel. | |
| BrowserTagBackground | | |

### Clips

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| Clip1 | | |
| Clip2 | | |
| Clip3 | | |
| Clip4 | | |
| Clip5 | | |
| Clip6 | | |
| Clip7 | | |
| Clip8 | | |
| Clip9 | | |
| Clip10 | | |
| Clip11 | | |
| Clip12 | | |
| Clip13 | | |
| Clip14 | | |
| Clip15 | | |
| Clip16 | | |
| ClipBorder | | |
| ClipSlotButton | | |

### Automation

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| AutomationColor | **Arrangement/Clip View:** Automation lines, breakpoint nodes, and envelope curves.<br>**Devices:** Small dots indicating automated parameters on device controls.<br>**Track Header:** Dots next to automated parameter names in the track's automation lane dropdown menu. | Primary automation indicator color throughout UI |
| AutomationGrid | | |
| AutomationDisabled | | |
| AutomationMouseOver | | |
| AutomationTransformToolFrame | | |
| AutomationTransformToolFrameActive | | |
| AutomationTransformToolHandle | | |
| AutomationTransformToolHandleActive | | |

### Arrangement & Grid

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| ArrangementRulerMarkings | | |
| DetailViewRulerMarkings | | |
| GridLineBase | | |
| ArrangerGridTiles | | |
| DetailGridTiles | | |
| GridGuideline | | |
| OffGridGuideline | | |
| LoopColor | **Arrangement Timeline:** Loop/Punch Recording Region outline at top of timeline; Loop Start/Punch-In point line; Loop End/Punch-Out point line; Locator markers. | Loop region and marker indicators |
| OffGridLoopColor | | |

### Waveforms & MIDI

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| WaveformColor | **Arrangement View:** Waveforms within audio clips; MIDI notes within MIDI clips.<br>**Clip View Selector:** Preview waveform and MIDI notes in the bottom clip overview. | Primary waveform/note display color in clips |
| DimmedWaveformColor | **Arrangement View:** Waveforms of deactivated audio clips; MIDI notes in deactivated MIDI clips.<br>**Sample Editor:** Waveform display when viewing a deactivated clip. | Waveform color for deactivated/muted clips |
| VelocityColor | | |
| VelocitySelectedOrHovered | **MIDI Editor:** Velocity bar highlight when hovering over a MIDI note; MIDI note highlight when hovering over its velocity bar. | Hover/interaction state for velocity display |
| NoteProbability | | |
| MidiNoteMaxVelocity | | |
| MidiEditorBlackKeyBackground | | |
| MidiEditorBackgroundWhiteKeySeparator | | |

### Take Lanes

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| TakeLaneTrackHighlighted | | |
| TakeLaneTrackNotHighlighted | | |

### Scrollbars

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| ScrollbarInnerHandle | | |
| ScrollbarInnerTrack | | |
| ScrollbarInnerHandleHover | | |
| ScrollbarInnerTrackHover | | |
| ScrollbarLCDHandle | | |
| ScrollbarLCDTrack | | |
| ScrollbarLCDHandleHover | | |
| ScrollbarLCDTrackHover | | |
| ScrollbarMixerShowOnScrollHandle | | |
| ScrollbarMixerShowOnScrollHandleHover | | |

### Retro Display (Devices)

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| RetroDisplayBackground | **Devices:** Primary background color of visual displays on all effect devices (EQ, Compressor, Spectrum, etc.).<br>**Clip View:** Outlines of vertical track volume meters.<br>**Devices:** Background of assignable X-Y control pads. | Main background for retro/LCD-style device displays |
| RetroDisplayBackgroundLine | **Devices:** Grid lines and outlines on retro display screens; outlines of certain buttons on device displays.<br>**Limiter:** Background of level meters.<br>**Clip View:** Center line in vertical track volume meters; line outline of Content Options button in browser. | Grid/structural lines in device displays |
| RetroDisplayForeground | | |
| RetroDisplayForeground2 | | |
| RetroDisplayForegroundDisabled | | |
| RetroDisplayGreen | | |
| RetroDisplayRed | **EQ Eight:** Main EQ curve line; filter activator toggles.<br>**Devices:** Mod buttons on Shaper, Envelope Follower, etc.; value read-outs on some devices.<br>**Reverb:** Curve lines on filter and diffusion sections. | Secondary accent color for device displays (often paired with RetroDisplayGreen) |
| RetroDisplayHandle1 | | |
| RetroDisplayHandle2 | | |
| RetroDisplayScaleText | | |
| RetroDisplayTitle | | |
| RetroDisplayControlSelectionFrame | | |

### Compressor/Dynamics Display

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| ThresholdLineColor | | |
| ThresholdLineColorHover | | |
| GainReductionLineColor | | |
| InputCurveColor | | |
| InputCurveOutlineColor | | |
| OutputCurveColor | | |
| OutputCurveOutlineColor | | |

### Spectrum Analyzer

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| SpectrumDefaultColor | | |
| SpectrumAlternativeColor | | |
| SpectrumGridLines | | |

### Operator Synth

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| Operator1 | | |
| Operator2 | | |
| Operator3 | | |
| Operator4 | | |

### Drum Rack

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| DrumRackScroller1 | | |
| DrumRackScroller2 | | |
| FilledDrumRackPad | | |

### Sampler Zones

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| KeyZoneBackground | | |
| KeyZoneCrossfadeRamp | | |
| VelocityZoneBackground | | |
| VelocityZoneCrossfadeRamp | | |
| SelectorZoneBackground | | |
| SelectorZoneCrossfadeRamp | | |

### Piano Roll

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| PianoBlackKey | | |
| PianoWhiteKey | | |
| PianoKeySeparator | | |

### Knobs & Pots

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| Poti | | |
| DeactivatedPoti | | |
| PotiNeedle | | |
| DeactivatedPotiNeedle | | |
| BipolarPotiTriangle | | |

### Tree/List Views

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| TreeColumnHeadBackground | | |
| TreeColumnHeadForeground | | |
| TreeColumnHeadSelected | | |
| TreeColumnHeadFocus | | |
| TreeColumnHeadControl | | |
| TreeRowCategoryForeground | | |
| TreeRowCategoryBackground | | |

### Range & Learning

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| RangeDefault | | |
| RangeDisabled | | |
| RangeDisabledOff | | |
| RangeEditField | | |
| RangeEditField2 | | |
| RangeEditField3 | | |
| LearnMidi | | |
| LearnKey | | |
| LearnMacro | | |

### Meters

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| MeterBackground | | |
| StandardVuMeter | | Complex element with gradient stops |
| OverloadVuMeter | | Complex element with gradient stops |
| DisabledVuMeter | | Complex element with gradient stops |
| HeadphonesVuMeter | | Complex element with gradient stops |
| SendsOnlyVuMeter | | Complex element with gradient stops |
| BipolarGainReductionVuMeter | | Complex element with gradient stops |
| OrangeVuMeter | | Complex element with gradient stops |

### Shadows & Effects

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| ShadowDark | | |
| ShadowLight | | |

### Miscellaneous

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| Alert | | |
| Progress | | |
| AbletonColor | | |
| DisplayBackground | | |
| BipolReset | | |
| ImplicitArm | | |
| SceneContrast | | |
| FreezeColor | | |
| Modulation | | |
| ModulationDisabled | | |
| ModulationMouseOver | | |
| MutedAuditionClip | | |
| LinkedTrackHover | | |
| ExpressionLaneHeaderHighlight | | |
| DeactivatedClipHeader | | |
| DeactivatedClipHeaderForeground | | |
| ScaleAwareness | | |
| MainViewFocusIndicator | | |
| PreferencesTab | | |
| WarperTimeBarRulerBackground | | |
| WarperTimeBarMarkerBackground | | |
| SecondarySelectionForeground | | |

---

## Blend Factors & Alpha Values

These parameters control opacity and blending, not colors directly:

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| DefaultBlendFactor | | Range: 0.0 - 1.0 |
| IconBlendFactor | | Range: 0.0 - 1.0 |
| ClipBlendFactor | | Range: 0.0 - 1.0 |
| NoteBorderStandbyBlendFactor | | Range: 0.0 - 1.0 |
| RetroDisplayBlendFactor | | Range: 0.0 - 1.0 |
| CheckControlNotCheckedBlendFactor | | Range: 0.0 - 1.0 |
| MixSurfaceAreaBlendFactor | | Range: 0.0 - 1.0 |
| TextFrameSegmentBlendFactor | | Range: 0.0 - 1.0 |
| NoteDisabledSelectedBlendFactor | | Range: 0.0 - 1.0 |
| MinVelocityNoteBlendFactor | | Range: 0.0 - 1.0 |
| StripedBackgroundShadeFactor | | Range: 0.0 - 1.0 |
| NonEditableAutomationAlpha | | Range: 0 - 255 |
| DisabledContextMenuIconAlpha | | Range: 0 - 255 |
| ClipBorderAlpha | | Range: 0 - 255 |
| ScrollBarAlpha | | Range: 0 - 255 |
| ScrollBarOnHoverAlpha | | Range: 0 - 255 |
| ScrollBarBackgroundAlpha | | Range: 0 - 255 |
| ClipContrastColorAdjustment | | Integer |
| SessionSlotOklabLCompensationFactor | | Integer |

## Lightness & Saturation Adjustments

These affect derived colors for take lanes and automation:

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| InaudibleTakeLightness | | |
| InaudibleTakeSaturation | | |
| InaudibleTakeNameLightness | | |
| InaudibleTakeNameSaturation | | |
| AutomationLaneClipBodyLightness | | |
| AutomationLaneClipBodySaturation | | |
| AutomationLaneHeaderLightness | | |
| AutomationLaneHeaderSaturation | | |
| TakeLaneHeaderLightness | | |
| TakeLaneHeaderSaturation | | |
| TakeLaneHeaderNameLightness | | |
| TakeLaneHeaderNameSaturation | | |
| AutomationLaneHeaderNameLightness | | |
| AutomationLaneHeaderNameSaturation | | |

---

## Investigation Log

Use this section to document findings as parameters are tested:

### 2026-03-13 - Testing Session
- **Left off at**: `RetroDisplayGreen` (set to #FFFF00 yellow) — not yet spotted in UI
- **Still active in TEST-Parameter.ask**: RetroDisplayGreen=#FFFF00, RetroDisplayBackgroundLine=#00FF00
- **Next to test**: RetroDisplayGreen visibility, then remaining Retro Display params, then VelocityColor/MidiNoteMaxVelocity mystery

<!-- Example entry:
### 2025-01-25 - ChosenDefault
- **Changed to**: #FF00FF
- **Observed effects**:
  - Tuner display color
  - Selected item highlights
- **Unexpected effects**:
  - Also changed X, Y, Z
-->
