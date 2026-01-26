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
| StandbySelectionBackground | | |
| SelectionForeground | | |
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
| BrowserSampleWaveform | | |
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
| AutomationColor | | |
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
| LoopColor | | |
| OffGridLoopColor | | |

### Waveforms & MIDI

| Parameter | Affected Controls | Notes |
|-----------|-------------------|-------|
| WaveformColor | | |
| DimmedWaveformColor | | |
| VelocityColor | | |
| VelocitySelectedOrHovered | | |
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
| RetroDisplayBackground | | |
| RetroDisplayBackgroundLine | | |
| RetroDisplayForeground | | |
| RetroDisplayForeground2 | | |
| RetroDisplayForegroundDisabled | | |
| RetroDisplayGreen | | |
| RetroDisplayRed | | |
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

<!-- Example entry:
### 2025-01-25 - ChosenDefault
- **Changed to**: #FF00FF
- **Observed effects**:
  - Tuner display color
  - Selected item highlights
- **Unexpected effects**:
  - Also changed X, Y, Z
-->
