/** Shared Tailwind/merge adapter; numerical type values remain in tokens.css. */
export const TYPE_SCALE: Record<string, [string, { lineHeight: string; letterSpacing?: string; fontWeight: string }]> = {
        // Canon §3.3 — single typographic scale. Use these tokens, not arbitrary values.
        'display':  ['var(--type-display-size)',     { lineHeight: 'var(--type-display-leading)',  letterSpacing: '-0.01em', fontWeight: '400' }],
        'h1':       ['var(--type-h1-size)',  { lineHeight: 'var(--type-h1-leading)',  letterSpacing: '-0.01em', fontWeight: '400' }],
        'h2':       ['var(--type-h2-size)',  { lineHeight: 'var(--type-h2-leading)', fontWeight: '400' }],
        'h3':       ['var(--type-h3-size)', { lineHeight: 'var(--type-h3-leading)',  fontWeight: '500' }],
        'h4':       ['var(--type-h4-size)', { lineHeight: 'var(--type-h4-leading)',  fontWeight: '500' }],
        'body-lg':  ['var(--type-body-lg-size)',{ lineHeight: 'var(--type-body-lg-leading)',  fontWeight: '400' }],
        'body':     ['var(--type-body-size)',{ lineHeight: 'var(--type-body-leading)',  fontWeight: '400' }],
        'body-sm':  ['var(--type-body-sm-size)',{ lineHeight: 'var(--type-body-sm-leading)',  fontWeight: '400' }],
        'caption':  ['var(--type-caption-size)',{ lineHeight: 'var(--type-caption-leading)',  fontWeight: '500' }],
        'label':    ['var(--type-label-size)', { lineHeight: 'var(--type-label-leading)',  letterSpacing: '0.25em', fontWeight: '600' }],
        'mono':     ['var(--type-mono-size)',  { lineHeight: 'var(--type-mono-leading)',  fontWeight: '500' }],
      };
