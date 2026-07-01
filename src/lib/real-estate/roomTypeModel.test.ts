import { describe, it, expect } from 'vitest';
import {
  normalizeBedConfig,
  rowToRoomType,
  hasBookableRoomTypes,
  type RoomType,
  type RoomTypeRow,
} from './roomTypeModel';

function makeRoom(overrides: Partial<RoomType> = {}): RoomType {
  return {
    id: 'r1',
    property_id: 'p1',
    owner_id: 'o1',
    name_en: 'Deluxe',
    name_ru: null,
    description_en: null,
    description_ru: null,
    max_occupancy: 2,
    bed_config: [],
    amenities: [],
    images: [],
    base_price_per_night: 3500,
    currency: 'THB',
    total_units: 1,
    refundable: true,
    sort_order: 0,
    is_bookable: true,
    is_active: true,
    ...overrides,
  };
}

describe('normalizeBedConfig', () => {
  it('returns [] for null / undefined / non-array', () => {
    expect(normalizeBedConfig(null)).toEqual([]);
    expect(normalizeBedConfig(undefined)).toEqual([]);
    expect(normalizeBedConfig('king')).toEqual([]);
    expect(normalizeBedConfig({ type: 'king', count: 1 })).toEqual([]);
  });

  it('keeps well-formed entries', () => {
    expect(
      normalizeBedConfig([
        { type: 'king', count: 1 },
        { type: 'twin', count: 2 },
      ]),
    ).toEqual([
      { type: 'king', count: 1 },
      { type: 'twin', count: 2 },
    ]);
  });

  it('drops entries with no usable type', () => {
    expect(
      normalizeBedConfig([
        { type: 'king', count: 1 },
        { count: 3 },
        { type: 42, count: 1 },
        null,
        'twin',
      ]),
    ).toEqual([{ type: 'king', count: 1 }]);
  });

  it('defaults a missing / invalid / non-positive count to 1', () => {
    expect(
      normalizeBedConfig([
        { type: 'king' },
        { type: 'twin', count: 0 },
        { type: 'sofa', count: -2 },
        { type: 'bunk', count: '2' },
      ]),
    ).toEqual([
      { type: 'king', count: 1 },
      { type: 'twin', count: 1 },
      { type: 'sofa', count: 1 },
      { type: 'bunk', count: 1 },
    ]);
  });
});

describe('rowToRoomType', () => {
  it('normalizes bed_config and null arrays', () => {
    const row = {
      ...makeRoom(),
      bed_config: [{ type: 'king', count: 1 }],
      amenities: null,
      images: null,
    } as unknown as RoomTypeRow;
    const room = rowToRoomType(row);
    expect(room.bed_config).toEqual([{ type: 'king', count: 1 }]);
    expect(room.amenities).toEqual([]);
    expect(room.images).toEqual([]);
  });

  it('coerces malformed bed_config jsonb without throwing', () => {
    const row = { ...makeRoom(), bed_config: 'not-json', amenities: [], images: [] } as unknown as RoomTypeRow;
    expect(rowToRoomType(row).bed_config).toEqual([]);
  });
});

describe('hasBookableRoomTypes', () => {
  it('is false for undefined / empty', () => {
    expect(hasBookableRoomTypes(undefined)).toBe(false);
    expect(hasBookableRoomTypes([])).toBe(false);
  });

  it('is false when no room is both bookable and active', () => {
    expect(
      hasBookableRoomTypes([
        makeRoom({ is_bookable: false, is_active: true }),
        makeRoom({ is_bookable: true, is_active: false }),
      ]),
    ).toBe(false);
  });

  it('is true when at least one room is bookable and active', () => {
    expect(
      hasBookableRoomTypes([
        makeRoom({ is_bookable: false, is_active: true }),
        makeRoom({ is_bookable: true, is_active: true }),
      ]),
    ).toBe(true);
  });
});
