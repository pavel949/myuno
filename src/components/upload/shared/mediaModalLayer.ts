/** Photo portals opt in when hosted by a sheet (z-120). Other hosts keep their defaults. */
export type MediaModalLayer = 'default' | 'above-sheet';

export function mediaModalClasses(layer?: MediaModalLayer) {
  return layer === 'above-sheet'
    ? { className: 'z-[140]', overlayClassName: 'z-[130]' }
    : { className: undefined, overlayClassName: undefined };
}
