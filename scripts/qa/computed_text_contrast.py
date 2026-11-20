"""WCAG computed contrast for solid UI surfaces in isolated Playwright fixtures."""

# Canvas resolves computed CSS colors (including color-mix) to sRGB + alpha.
# These controls are placed on solid surfaces; do not guess a backdrop if a
# gradient, image or group opacity is introduced.
MEASURE_CONTRAST = """
(targets) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const rgba = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].map(v => v / 255);
  };
  const over = (fg, bg) => {
    const a = fg[3] + bg[3] * (1 - fg[3]);
    return a ? [...fg.slice(0, 3).map((v, i) =>
      (v * fg[3] + bg[i] * bg[3] * (1 - fg[3])) / a), a] : [0, 0, 0, 0];
  };
  const luminance = (rgba) => rgba.slice(0, 3).reduce((sum, v, i) =>
    sum + [0.2126, 0.7152, 0.0722][i] *
      (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4), 0);
  return targets.map(({selector, count, kind}) => {
    const elements = [...document.querySelectorAll(selector)].filter(el => {
      const {width, height} = el.getBoundingClientRect();
      return width > 0 && height > 0 && getComputedStyle(el).visibility === 'visible';
    });
    if (elements.length !== count) return {selector, error: `expected ${count} visible, got ${elements.length}`};
    return {selector, samples:elements.map(el => {
      if (kind === 'placeholder' && (!el.matches(':placeholder-shown') || !el.placeholder?.trim())) {
        return {error: 'input is not showing a non-empty placeholder'};
      }
      const ink = getComputedStyle(el, kind === 'placeholder' ? '::placeholder' : null);
      const layers = [];
      for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (Number(style.opacity) !== 1 || style.mixBlendMode !== 'normal') {
          return {error: 'group opacity/blending requires an actual pixel test'};
        }
        if (layers.some(layer => layer[3] === 1)) continue;
        if (style.backgroundImage !== 'none') {
          return {error: 'non-solid backdrop requires an actual pixel test'};
        }
        layers.push(rgba(style.backgroundColor));
      }
      const bg = layers.reduceRight((base, layer) => over(layer, base), [0, 0, 0, 0]);
      if (bg[3] !== 1) return {error: 'no explicit opaque backdrop'};
      const raw = kind === 'icon' ? (ink.stroke === 'currentcolor' ? ink.color : ink.stroke) : ink.color;
      if (!raw || raw === 'none') return {error: 'no foreground paint'};
      const fg = rgba(raw);
      if (kind === 'placeholder') fg[3] *= Number(ink.opacity);
      const a = luminance(over(fg, bg)), b = luminance(bg);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      // Keep normal-text AA even for currently large headings, so changes to
      // language, font or responsive typography do not silently lower the gate.
      const min = kind === 'icon' ? 3 : 4.5;
      return {ratio, min, foreground: raw, opacity: fg[3], background: bg.slice(0, 3).map(v => Math.round(v * 255))};
    })};
  });
}
"""


async def assert_computed_contrast(page, targets):
    readings = await page.evaluate(MEASURE_CONTRAST, [
        {"selector": selector, "count": count, "kind": kind}
        for selector, count, kind in targets
    ])
    failures = [
        item for item in readings if "error" in item
        or any("error" in s or s["ratio"] < s["min"] for s in item["samples"])
    ]
    assert not failures, {"computedContrast": failures}
    return readings
