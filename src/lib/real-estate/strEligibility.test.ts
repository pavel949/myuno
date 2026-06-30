import { describe, it, expect } from 'vitest';
import {
  isHotel,
  isCondo,
  isShortFlagged,
  isBlockedFromNightly,
  isNightlyEligible,
  strComplianceStatus,
  minNightsFloor,
  HOTEL_ACT_MIN_NIGHTS,
  type StrEligibilityInput,
} from './strEligibility';

const licensedHotel: StrEligibilityInput = {
  asset_class: 'commercial',
  property_type: 'hotel_building',
  tenancy_modes: ['short'],
  hotel_license_type: 'full_hotel_license',
};

const unlicensedHotel: StrEligibilityInput = {
  asset_class: 'commercial',
  property_type: 'boutique_hotel',
  tenancy_modes: ['short'],
  hotel_license_type: 'pending',
};

const nonHotelRegHotel: StrEligibilityInput = {
  asset_class: 'commercial',
  property_type: 'hostel',
  tenancy_modes: ['short'],
  hotel_license_type: 'non_hotel_license',
};

const shortVilla: StrEligibilityInput = {
  asset_class: 'residential',
  property_type: 'villa',
  tenancy_modes: ['short'],
  min_stay_nights: 2,
};

const longVilla: StrEligibilityInput = {
  asset_class: 'residential',
  property_type: 'villa',
  tenancy_modes: ['long'],
};

const nightlyCondo: StrEligibilityInput = {
  asset_class: 'residential',
  property_type: 'condo',
  price_period: 'night',
};

describe('isHotel / isCondo / isShortFlagged', () => {
  it('detects commercial hotel types', () => {
    expect(isHotel(licensedHotel)).toBe(true);
    expect(isHotel(shortVilla)).toBe(false);
  });

  it('detects condos', () => {
    expect(isCondo(nightlyCondo)).toBe(true);
    expect(isCondo(shortVilla)).toBe(false);
  });

  it('treats tenancy_modes short or price_period night/week as short-flagged', () => {
    expect(isShortFlagged(shortVilla)).toBe(true);
    expect(isShortFlagged(nightlyCondo)).toBe(true);
    expect(isShortFlagged(longVilla)).toBe(false);
    expect(isShortFlagged({ price_period: 'week' })).toBe(true);
    expect(isShortFlagged({ price_period: 'month' })).toBe(false);
  });
});

describe('isNightlyEligible (the safety gate)', () => {
  it('allows a licensed, short-flagged hotel', () => {
    expect(isNightlyEligible(licensedHotel)).toBe(true);
  });

  it('blocks an unlicensed / pending hotel', () => {
    expect(isNightlyEligible(unlicensedHotel)).toBe(false);
  });

  it('blocks a non-hotel-registration hotel (legal grey area → conservative)', () => {
    expect(isNightlyEligible(nonHotelRegHotel)).toBe(false);
  });

  it('always blocks condos from <30-night results', () => {
    expect(isNightlyEligible(nightlyCondo)).toBe(false);
  });

  it('allows a short-flagged residential villa', () => {
    expect(isNightlyEligible(shortVilla)).toBe(true);
  });

  it('blocks a long-only villa (not short-flagged)', () => {
    expect(isNightlyEligible(longVilla)).toBe(false);
  });
});

describe('isBlockedFromNightly (exclusion filter — no short-flag required)', () => {
  it('blocks condos and unlicensed hotels even without an explicit short flag', () => {
    expect(isBlockedFromNightly({ property_type: 'condo' })).toBe(true);
    expect(isBlockedFromNightly({ asset_class: 'commercial', property_type: 'resort' })).toBe(true);
  });
  it('does not block licensed hotels or residential listings', () => {
    expect(isBlockedFromNightly(licensedHotel)).toBe(false);
    expect(isBlockedFromNightly({ asset_class: 'residential', property_type: 'villa' })).toBe(false);
  });
});

describe('strComplianceStatus', () => {
  it('marks licensed hotels licensed', () => {
    expect(strComplianceStatus(licensedHotel)).toBe('licensed');
  });
  it('marks unlicensed hotels and condos min30', () => {
    expect(strComplianceStatus(unlicensedHotel)).toBe('min30');
    expect(strComplianceStatus(nightlyCondo)).toBe('min30');
  });
  it('leaves plain residential unset', () => {
    expect(strComplianceStatus(shortVilla)).toBe('unset');
  });
});

describe('minNightsFloor', () => {
  it('forces 30 for condos and non-cleared hotels', () => {
    expect(minNightsFloor(nightlyCondo)).toBe(HOTEL_ACT_MIN_NIGHTS);
    expect(minNightsFloor(unlicensedHotel)).toBe(HOTEL_ACT_MIN_NIGHTS);
  });
  it('uses the listing min_stay for cleared/residential', () => {
    expect(minNightsFloor(shortVilla)).toBe(2);
    expect(minNightsFloor(licensedHotel)).toBe(1);
  });
});
