// Tweaks panel — palette/type/density/sub-brand toggle
const { useEffect } = React;

const PALETTES = /*EDITMODE-BEGIN*/{
  "palette": "navy-amber",
  "fontPair": "geist-serif4",
  "density": "comfortable",
  "subbrand": "on"
}/*EDITMODE-END*/;

function Panel() {
  const [t, setTweak] = useTweaks(PALETTES);

  useEffect(() => {
    const root = document.documentElement;
    // palette
    const PAL = {
      'navy-amber': { deep: '#0A2240', amber: '#D96B1A', paper: '#F5F4F0' },
      'midnight-coral': { deep: '#0B1320', amber: '#E5604A', paper: '#F4F2EE' },
      'forest-gold': { deep: '#1B3A2F', amber: '#C99344', paper: '#F4F2EC' },
      'graphite-rose': { deep: '#161618', amber: '#C46A6B', paper: '#F0EEEA' },
    }[t.palette] || {};
    if (PAL.deep)  root.style.setProperty('--uno-deep', PAL.deep);
    if (PAL.amber) root.style.setProperty('--uno-amber', PAL.amber);
    if (PAL.paper) root.style.setProperty('--uno-paper', PAL.paper);

    // density
    document.body.setAttribute('data-density', t.density);
    document.body.setAttribute('data-cv', t.subbrand);

    // font pair
    const FONT = {
      'geist-serif4': { sans: "'Geist', sans-serif", serif: "'Source Serif 4', serif" },
      'inter-georgia': { sans: "'Inter', sans-serif", serif: "Georgia, serif" },
      'manrope-fraunces': { sans: "'Manrope', sans-serif", serif: "'Fraunces', serif" },
    }[t.fontPair] || {};
    if (FONT.sans)  document.body.style.fontFamily = FONT.sans;
    if (FONT.serif) {
      document.querySelectorAll('.bv2-hero h1, .bv2-section-title, .bv2-sub, .bv2-cell-h, .bv2-brand .name, .bv2-stat .num')
        .forEach(el => { el.style.fontFamily = FONT.serif; });
    }
  }, [t]);

  return (
    <TweaksPanel title="Tweaks · Bible v2">
      <TweakSection title="Palette">
        <TweakColor
          label="Brand"
          value={t.palette}
          onChange={v => setTweak('palette', v)}
          options={[
            ['#0A2240', '#D96B1A', '#F5F4F0'],
            ['#0B1320', '#E5604A', '#F4F2EE'],
            ['#1B3A2F', '#C99344', '#F4F2EC'],
            ['#161618', '#C46A6B', '#F0EEEA'],
          ]}
          labels={['Navy · Amber', 'Midnight · Coral', 'Forest · Gold', 'Graphite · Rose']}
        />
      </TweakSection>

      <TweakSection title="Typography">
        <TweakRadio
          label="Font pair"
          value={t.fontPair}
          onChange={v => setTweak('fontPair', v)}
          options={[
            { value: 'geist-serif4', label: 'Geist / Serif 4' },
            { value: 'inter-georgia', label: 'Inter / Georgia' },
            { value: 'manrope-fraunces', label: 'Manrope / Fraunces' },
          ]}
        />
      </TweakSection>

      <TweakSection title="Density">
        <TweakRadio
          label="UI density"
          value={t.density}
          onChange={v => setTweak('density', v)}
          options={[
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
      </TweakSection>

      <TweakSection title="Sub-brand">
        <TweakRadio
          label="ClearView visible"
          value={t.subbrand}
          onChange={v => setTweak('subbrand', v)}
          options={[
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
          ]}
        />
      </TweakSection>

      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(0,0,0,.45)',
        margin: '12px 0 0'
      }}>
        Tweaks · live preview · saved to file
      </p>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-mount')).render(<Panel />);
