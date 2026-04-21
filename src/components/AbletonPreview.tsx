import { useMemo } from 'react';
import type { SemanticColorRoles, ContrastLevel } from '../theme/types';
import { resolveRoles, buildNeutralScale } from '../theme/derivation';
import { adjustForContrast } from '../theme/contrast';

interface AbletonPreviewProps {
  colors: {
    surface_base: string;
    text_primary: string;
    accent_primary: string;
    accent_secondary: string;
  };
  tone: 'dark' | 'light';
  contrastLevel?: ContrastLevel;
}

/**
 * Stylized geometric preview of Ableton Live's interface.
 * Renders an SVG that maps semantic color roles to recognizable UI zones.
 */
export const AbletonPreview: React.FC<AbletonPreviewProps> = ({
  colors,
  tone,
  contrastLevel = 'medium',
}) => {
  const derived = useMemo(() => {
    const input: SemanticColorRoles = {
      tone,
      surface_base: colors.surface_base,
      text_primary: colors.text_primary,
      accent_primary: colors.accent_primary,
      accent_secondary: colors.accent_secondary,
      contrastLevel,
    };
    const resolved = resolveRoles(input);
    const roles = adjustForContrast(resolved);
    const scale = buildNeutralScale(roles);
    return { roles, scale };
  }, [colors, tone, contrastLevel]);

  const { roles, scale } = derived;

  // Shorthand color aliases for readability
  const c = {
    // Surfaces
    bg: roles.surface_base,
    bgHighlight: roles.surface_highlight,
    bgBorder: roles.surface_border,
    detail: roles.detail_bg,
    control: roles.control_bg,
    // Text
    text: roles.text_primary,
    textDim: roles.text_secondary,
    // Accents
    accent1: roles.accent_primary,
    accent2: roles.accent_secondary,
    selection: roles.selection_bg,
    // Scale
    deepest: scale.n0_deepest,
    deep: scale.n1_deep,
    dark: scale.n2_dark,
    area: scale.n4_area,
    midLow: scale.n9_mid_low,
    mid: scale.n9b_mid,
    midHigh: scale.n11_mid_high,
    ruler: scale.n11b_ruler,
  };

  // Layout constants (viewBox is 1000x620)
  const W = 1000;
  const H = 620;
  const R = 3; // default corner radius
  const GAP = 2; // gap between panels

  // Major zones
  const topBarH = 32;
  const browserW = 220;
  const detailH = 200;
  const statusBarH = 22;
  const mixerColW = 80;
  const trackHeaderW = 100;
  const arrangementTop = topBarH + GAP;
  const arrangementH = H - topBarH - detailH - statusBarH - GAP * 3;
  const timelineLeft = browserW + GAP;
  const timelineW = W - browserW - GAP;

  // Clip colors (fixed Ableton colors, slightly muted)
  const clipColors = ['#e8a64c', '#d4944a', '#c68544', '#5bc4a8', '#4aafb8', '#7b6fb0'];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="ableton-preview-svg"
      style={{ width: '100%', height: '100%' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width={W} height={H} fill={c.bgBorder} rx={6} />

      {/* ===== TOP BAR / TRANSPORT ===== */}
      <rect x={0} y={0} width={W} height={topBarH} fill={c.control} rx={6} />
      {/* Transport buttons area */}
      <rect x={W * 0.35} y={8} width={16} height={16} rx={2} fill={c.midLow} />
      <polygon points={`${W * 0.35 + 26},8 ${W * 0.35 + 26},24 ${W * 0.35 + 42},16`} fill={c.accent1} />
      <circle cx={W * 0.35 + 54} cy={16} r={8} fill={c.mid} />
      {/* Tempo / time display */}
      <rect x={30} y={8} width={70} height={16} rx={2} fill={c.dark} />
      <line x1={35} y1={16} x2={55} y2={16} stroke={c.textDim} strokeWidth={1.5} />
      <line x1={60} y1={16} x2={92} y2={16} stroke={c.textDim} strokeWidth={1.5} />
      {/* Right side indicators */}
      <rect x={W - 140} y={8} width={50} height={16} rx={2} fill={c.dark} />
      <line x1={W - 135} y1={16} x2={W - 95} y2={16} stroke={c.textDim} strokeWidth={1.5} />
      <rect x={W - 80} y={8} width={36} height={16} rx={3} fill={c.accent1} opacity={0.9} />
      <rect x={W - 38} y={8} width={28} height={16} rx={3} fill={c.midLow} />

      {/* ===== BROWSER SIDEBAR ===== */}
      <rect x={0} y={arrangementTop} width={browserW} height={arrangementH} fill={c.bg} rx={R} />

      {/* Browser: Collections section */}
      <rect x={6} y={arrangementTop + 6} width={browserW - 12} height={16} rx={2} fill={c.bgHighlight} />
      <line x1={14} y1={arrangementTop + 14} x2={60} y2={arrangementTop + 14} stroke={c.textDim} strokeWidth={1.5} />

      {/* Browser: Category labels */}
      {['Sounds', 'Drums', 'Instruments', 'Audio FX', 'MIDI FX'].map((_, i) => (
        <g key={`cat-${i}`}>
          {/* Folder icon */}
          <rect x={14} y={arrangementTop + 32 + i * 20} width={8} height={8} rx={1} fill={i === 0 ? c.accent2 : c.midLow} opacity={0.7} />
          {/* Label line */}
          <line
            x1={28} y1={arrangementTop + 36 + i * 20}
            x2={28 + 40 + [32, 18, 40, 28, 36][i]} y2={arrangementTop + 36 + i * 20}
            stroke={c.textDim} strokeWidth={1.5}
          />
        </g>
      ))}

      {/* Browser: Search / filter area */}
      <rect x={6} y={arrangementTop + 145} width={browserW - 12} height={18} rx={2} fill={c.control} />
      <line x1={14} y1={arrangementTop + 154} x2={50} y2={arrangementTop + 154} stroke={c.textDim} strokeWidth={1} />

      {/* Browser: File list */}
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={`file-${i}`}>
          <rect
            x={6} y={arrangementTop + 172 + i * 22}
            width={browserW - 12} height={18}
            rx={2}
            fill={i === 2 ? c.selection : 'transparent'}
            opacity={i === 2 ? 0.3 : 1}
          />
          <rect x={14} y={arrangementTop + 176 + i * 22} width={8} height={8} rx={1} fill={c.midLow} opacity={0.5} />
          <line
            x1={28} y1={arrangementTop + 181 + i * 22}
            x2={28 + 60 + [55, 72, 48, 65, 38, 60][i]} y2={arrangementTop + 181 + i * 22}
            stroke={i === 2 ? c.text : c.textDim} strokeWidth={1.5}
          />
        </g>
      ))}

      {/* ===== ARRANGEMENT / SESSION AREA ===== */}
      {/* Timeline ruler */}
      <rect x={timelineLeft} y={arrangementTop} width={timelineW} height={20} fill={c.control} rx={R} />
      {/* Bar numbers */}
      {Array.from({ length: 16 }).map((_, i) => (
        <g key={`bar-${i}`}>
          <line
            x1={timelineLeft + 30 + i * ((timelineW - 30) / 16)}
            y1={arrangementTop + 14}
            x2={timelineLeft + 30 + i * ((timelineW - 30) / 16)}
            y2={arrangementTop + 20}
            stroke={c.midLow} strokeWidth={0.5}
          />
        </g>
      ))}

      {/* Track area background */}
      <rect
        x={timelineLeft} y={arrangementTop + 22}
        width={timelineW} height={arrangementH - 22}
        fill={c.bgBorder} rx={R}
      />

      {/* Tracks */}
      {(() => {
        const trackStartY = arrangementTop + 22;
        const trackAreaH = arrangementH - 22;
        const tracks = [
          { h: 0.12, hasClip: false, label: true },
          { h: 0.22, hasClip: true, clipColor: clipColors[0], waveform: true },
          { h: 0.08, hasClip: false, label: true },
          { h: 0.08, hasClip: true, clipColor: clipColors[3], waveform: false },
          { h: 0.08, hasClip: true, clipColor: clipColors[4], waveform: false },
          { h: 0.42, hasClip: false, label: false }, // empty space
        ];

        let yOffset = 0;
        return tracks.map((track, i) => {
          const tH = track.h * trackAreaH;
          const tY = trackStartY + yOffset;
          yOffset += tH;

          return (
            <g key={`track-${i}`}>
              {/* Track header */}
              <rect x={timelineLeft} y={tY} width={trackHeaderW} height={tH - 1} fill={c.bg} rx={1} />
              {/* Track header label */}
              {track.label && (
                <line
                  x1={timelineLeft + 8} y1={tY + tH / 2}
                  x2={timelineLeft + 50 + [22, 15, 28, 10, 20, 25][i]} y2={tY + tH / 2}
                  stroke={c.textDim} strokeWidth={1.5}
                />
              )}
              {/* Track header controls: small S/M buttons */}
              {tH > 20 && (
                <>
                  <rect x={timelineLeft + trackHeaderW - 28} y={tY + 4} width={10} height={8} rx={1} fill={c.midLow} />
                  <rect x={timelineLeft + trackHeaderW - 14} y={tY + 4} width={10} height={8} rx={1} fill={c.midLow} />
                </>
              )}

              {/* Track lane background */}
              <rect
                x={timelineLeft + trackHeaderW + 1} y={tY}
                width={timelineW - trackHeaderW - 1} height={tH - 1}
                fill={c.bgBorder}
              />

              {/* Clip block */}
              {track.hasClip && track.clipColor && (
                <g>
                  <rect
                    x={timelineLeft + trackHeaderW + 20} y={tY + 2}
                    width={280} height={tH - 5}
                    rx={2} fill={track.clipColor} opacity={0.85}
                  />
                  {/* Clip title bar */}
                  <rect
                    x={timelineLeft + trackHeaderW + 20} y={tY + 2}
                    width={280} height={Math.min(14, tH * 0.3)}
                    rx={2} fill={track.clipColor}
                  />
                  {/* Clip name */}
                  <line
                    x1={timelineLeft + trackHeaderW + 26} y1={tY + 10}
                    x2={timelineLeft + trackHeaderW + 90} y2={tY + 10}
                    stroke={c.deepest} strokeWidth={1.5} opacity={0.7}
                  />
                  {/* Waveform representation */}
                  {track.waveform && tH > 30 && (
                    <g opacity={0.5}>
                      {Array.from({ length: 50 }).map((_, w) => {
                        const wX = timelineLeft + trackHeaderW + 24 + w * 5.2;
                        const amplitude = 3 + Math.sin(w * 0.8) * 6 + ((w * 7 + 3) % 11) * 0.73;
                        const centerY = tY + tH * 0.55;
                        return (
                          <line
                            key={`wave-${w}`}
                            x1={wX} y1={centerY - amplitude}
                            x2={wX} y2={centerY + amplitude}
                            stroke={c.deepest} strokeWidth={2}
                          />
                        );
                      })}
                    </g>
                  )}
                </g>
              )}
            </g>
          );
        });
      })()}

      {/* Playhead */}
      <line
        x1={timelineLeft + trackHeaderW + 200} y1={arrangementTop}
        x2={timelineLeft + trackHeaderW + 200} y2={arrangementTop + arrangementH}
        stroke={c.accent1} strokeWidth={1.5} opacity={0.8}
      />

      {/* ===== MIXER SECTION (right side, inside arrangement) ===== */}
      {(() => {
        const mixerX = W - mixerColW * 2 - 10;
        const mixerY = arrangementTop + 22;
        const mixerH = arrangementH - 22;
        const colW = mixerColW - 2;

        return (
          <g opacity={0.85}>
            {[0, 1].map((col) => {
              const x = mixerX + col * mixerColW;
              return (
                <g key={`mixer-${col}`}>
                  {/* Mixer channel background */}
                  <rect x={x} y={mixerY} width={colW} height={mixerH - 1} fill={c.bg} rx={R} />
                  {/* Channel label */}
                  <line
                    x1={x + 8} y1={mixerY + 12}
                    x2={x + 50} y2={mixerY + 12}
                    stroke={c.textDim} strokeWidth={1.5}
                  />
                  {/* Input selector */}
                  <rect x={x + 6} y={mixerY + 22} width={colW - 12} height={14} rx={2} fill={c.control} />
                  <line x1={x + 12} y1={mixerY + 29} x2={x + 45} y2={mixerY + 29} stroke={c.textDim} strokeWidth={1} />
                  {/* Volume / pan area */}
                  <rect x={x + 6} y={mixerY + 44} width={colW - 12} height={14} rx={2} fill={c.control} />
                  {/* S M buttons */}
                  <rect x={x + 6} y={mixerY + 66} width={18} height={12} rx={2} fill={c.accent2} opacity={0.7} />
                  <rect x={x + 28} y={mixerY + 66} width={18} height={12} rx={2} fill={c.midLow} />
                  <rect x={x + 50} y={mixerY + 66} width={18} height={12} rx={2} fill={c.midLow} />
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* ===== DETAIL VIEW (bottom panel) ===== */}
      {(() => {
        const detailY = H - detailH - statusBarH - GAP;
        const infoW = 170;
        const deviceAreaX = infoW + GAP;
        const deviceAreaW = W - infoW - GAP;

        return (
          <g>
            {/* Detail view info panel (left) */}
            <rect x={0} y={detailY} width={infoW} height={detailH} fill={c.bg} rx={R} />
            {/* Info panel title */}
            <rect x={6} y={detailY + 6} width={infoW - 12} height={16} rx={2} fill={c.bgHighlight} />
            <line x1={14} y1={detailY + 14} x2={70} y2={detailY + 14} stroke={c.text} strokeWidth={1.5} />
            {/* Info text lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`info-${i}`}
                x1={14} y1={detailY + 34 + i * 16}
                x2={14 + 60 + [42, 30, 55, 25, 48][i]} y2={detailY + 34 + i * 16}
                stroke={c.textDim} strokeWidth={1} opacity={0.6}
              />
            ))}

            {/* Device chain area */}
            <rect x={deviceAreaX} y={detailY} width={deviceAreaW} height={detailH} fill={c.detail} rx={R} />

            {/* Device chain: Tab bar */}
            <rect x={deviceAreaX} y={detailY} width={deviceAreaW} height={20} fill={c.bg} rx={R} />
            {/* Device tabs */}
            {['EQ Eight', 'Limiter', 'Shaper'].map((_, i) => (
              <g key={`tab-${i}`}>
                <circle cx={deviceAreaX + 20 + i * (deviceAreaW / 3)} cy={detailY + 10} r={4} fill={i === 0 ? c.accent1 : c.midLow} />
                <line
                  x1={deviceAreaX + 30 + i * (deviceAreaW / 3)}
                  y1={detailY + 10}
                  x2={deviceAreaX + 70 + i * (deviceAreaW / 3)}
                  y2={detailY + 10}
                  stroke={c.textDim} strokeWidth={1.5}
                />
              </g>
            ))}

            {/* EQ Eight device */}
            {(() => {
              const eqX = deviceAreaX + 10;
              const eqY = detailY + 28;
              const eqW = deviceAreaW * 0.35;
              const eqH = detailH - 40;

              return (
                <g>
                  {/* EQ display background */}
                  <rect x={eqX} y={eqY} width={eqW} height={eqH * 0.45} rx={2} fill={c.control} />
                  {/* EQ curve */}
                  <path
                    d={`M ${eqX + 5} ${eqY + eqH * 0.25} Q ${eqX + eqW * 0.2} ${eqY + eqH * 0.15}, ${eqX + eqW * 0.35} ${eqY + eqH * 0.22} T ${eqX + eqW * 0.65} ${eqY + eqH * 0.18} T ${eqX + eqW - 5} ${eqY + eqH * 0.3}`}
                    fill="none" stroke={c.accent2} strokeWidth={1.5} opacity={0.8}
                  />
                  {/* EQ band dots */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <circle
                      key={`eq-${i}`}
                      cx={eqX + 15 + i * (eqW - 30) / 7}
                      cy={eqY + eqH * 0.2 + Math.sin(i * 0.9) * 8}
                      r={3} fill={c.accent1} opacity={0.6}
                    />
                  ))}

                  {/* Knob row */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const knobX = eqX + 12 + i * (eqW - 24) / 7;
                    const knobY = eqY + eqH * 0.55;
                    return (
                      <g key={`knob-${i}`}>
                        {/* Knob label */}
                        <line x1={knobX - 8} y1={knobY} x2={knobX + 8} y2={knobY} stroke={c.textDim} strokeWidth={1} opacity={0.5} />
                        {/* Knob circle */}
                        <circle cx={knobX} cy={knobY + 16} r={7} fill={c.control} stroke={c.midLow} strokeWidth={1} />
                        {/* Knob indicator */}
                        <line
                          x1={knobX} y1={knobY + 10}
                          x2={knobX + Math.cos(i * 0.7) * 4} y2={knobY + 16 - 5}
                          stroke={c.text} strokeWidth={1}
                        />
                        {/* Value text */}
                        <line x1={knobX - 8} y1={knobY + 30} x2={knobX + 8} y2={knobY + 30} stroke={c.textDim} strokeWidth={1} opacity={0.4} />
                      </g>
                    );
                  })}

                  {/* Bottom row: enable buttons */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const bX = eqX + 12 + i * (eqW - 24) / 7;
                    return (
                      <rect
                        key={`btn-${i}`}
                        x={bX - 6} y={eqY + eqH - 16}
                        width={12} height={8} rx={1}
                        fill={i < 3 ? c.accent1 : c.midLow}
                        opacity={i < 3 ? 0.7 : 0.4}
                      />
                    );
                  })}
                </g>
              );
            })()}

            {/* Limiter device */}
            {(() => {
              const limX = deviceAreaX + 10 + deviceAreaW * 0.38;
              const limY = detailY + 28;
              const limW = deviceAreaW * 0.25;
              const limH = detailH - 40;

              return (
                <g>
                  {/* Device background */}
                  <rect x={limX} y={limY} width={limW} height={limH} rx={2} fill={c.bg} opacity={0.5} />
                  {/* GR meter */}
                  <rect x={limX + limW * 0.4} y={limY + 10} width={12} height={limH * 0.6} rx={1} fill={c.control} />
                  <rect
                    x={limX + limW * 0.4} y={limY + 10 + limH * 0.15}
                    width={12} height={limH * 0.45}
                    rx={1} fill={c.accent1} opacity={0.3}
                  />
                  {/* Knobs */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <circle
                      key={`lim-knob-${i}`}
                      cx={limX + 20 + i * (limW - 40) / 2}
                      cy={limY + limH - 30}
                      r={8} fill={c.control} stroke={c.midLow} strokeWidth={1}
                    />
                  ))}
                  {/* Labels */}
                  <line x1={limX + 10} y1={limY + limH - 10} x2={limX + limW - 10} y2={limY + limH - 10} stroke={c.textDim} strokeWidth={1} opacity={0.4} />
                </g>
              );
            })()}

            {/* Third device (Shaper) */}
            {(() => {
              const shapX = deviceAreaX + 10 + deviceAreaW * 0.66;
              const shapY = detailY + 28;
              const shapW = deviceAreaW * 0.28;
              const shapH = detailH - 40;

              return (
                <g>
                  <rect x={shapX} y={shapY} width={shapW} height={shapH} rx={2} fill={c.bg} opacity={0.5} />
                  {/* Shaper display */}
                  <rect x={shapX + 8} y={shapY + 8} width={shapW - 16} height={shapH * 0.45} rx={2} fill={c.control} />
                  {/* Shaper curve */}
                  <path
                    d={`M ${shapX + 12} ${shapY + shapH * 0.35} Q ${shapX + shapW * 0.3} ${shapY + 12}, ${shapX + shapW * 0.5} ${shapY + shapH * 0.25} T ${shapX + shapW - 12} ${shapY + 14}`}
                    fill="none" stroke={c.accent2} strokeWidth={1.5} opacity={0.6}
                  />
                  {/* Controls */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <circle
                      key={`shap-knob-${i}`}
                      cx={shapX + 20 + i * (shapW - 40) / 3}
                      cy={shapY + shapH - 30}
                      r={7} fill={c.control} stroke={c.midLow} strokeWidth={1}
                    />
                  ))}
                </g>
              );
            })()}
          </g>
        );
      })()}

      {/* ===== ENVELOPE / AUTOMATION AREA (between arrangement and detail) ===== */}
      {(() => {
        const envY = arrangementTop + arrangementH * 0.55;
        const envH = arrangementH * 0.45 - 2;
        const envX = timelineLeft + trackHeaderW + 1;
        const envW = timelineW - trackHeaderW - mixerColW * 2 - 12;

        return (
          <g>
            {/* Envelope background */}
            <rect x={envX} y={envY} width={envW} height={envH} fill={c.bgBorder} />
            {/* Grid lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`grid-h-${i}`}
                x1={envX} y1={envY + (i + 1) * (envH / 6)}
                x2={envX + envW} y2={envY + (i + 1) * (envH / 6)}
                stroke={c.midLow} strokeWidth={0.3} opacity={0.5}
              />
            ))}
            {/* Vertical grid */}
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={`grid-v-${i}`}
                x1={envX + (i + 1) * (envW / 9)}
                y1={envY}
                x2={envX + (i + 1) * (envW / 9)}
                y2={envY + envH}
                stroke={c.midLow} strokeWidth={0.3} opacity={0.3}
              />
            ))}
            {/* Automation line */}
            <path
              d={`M ${envX + 10} ${envY + envH * 0.6} L ${envX + envW * 0.3} ${envY + envH * 0.6} L ${envX + envW * 0.32} ${envY + envH * 0.3} L ${envX + envW * 0.7} ${envY + envH * 0.3} L ${envX + envW * 0.72} ${envY + envH * 0.5} L ${envX + envW - 10} ${envY + envH * 0.5}`}
              fill="none" stroke={c.accent2} strokeWidth={1.5} opacity={0.7}
            />
            {/* Breakpoints */}
            {[0.3, 0.32, 0.7, 0.72].map((pct, i) => (
              <circle
                key={`bp-${i}`}
                cx={envX + envW * pct}
                cy={envY + envH * (i % 2 === 0 ? 0.6 : 0.3) + (i > 1 ? (i === 2 ? -envH * 0.1 : envH * 0.2) : 0)}
                r={3} fill={c.accent2}
              />
            ))}
            {/* Scale labels */}
            <line x1={envX + 4} y1={envY + 10} x2={envX + 16} y2={envY + 10} stroke={c.textDim} strokeWidth={1} opacity={0.5} />
            <line x1={envX + 4} y1={envY + envH - 10} x2={envX + 16} y2={envY + envH - 10} stroke={c.textDim} strokeWidth={1} opacity={0.5} />
          </g>
        );
      })()}

      {/* ===== STATUS BAR ===== */}
      <rect x={0} y={H - statusBarH} width={W} height={statusBarH} fill={c.accent1} rx={0} />
      {/* Status text */}
      <line x1={10} y1={H - statusBarH / 2} x2={200} y2={H - statusBarH / 2} stroke={c.deepest} strokeWidth={1.5} />
      {/* Right side status */}
      <line x1={W - 200} y1={H - statusBarH / 2} x2={W - 20} y2={H - statusBarH / 2} stroke={c.deepest} strokeWidth={1.5} opacity={0.6} />

      {/* ===== SCROLLBARS ===== */}
      {/* Horizontal scrollbar under arrangement */}
      <rect
        x={timelineLeft + trackHeaderW} y={arrangementTop + arrangementH - 6}
        width={200} height={4} rx={2}
        fill={c.mid} opacity={0.4}
      />
      {/* Vertical scrollbar */}
      <rect
        x={W - 5} y={arrangementTop + 40}
        width={4} height={80} rx={2}
        fill={c.mid} opacity={0.4}
      />
    </svg>
  );
};
