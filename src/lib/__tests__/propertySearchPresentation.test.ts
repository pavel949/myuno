import{describe,expect,it}from'vitest';
import{propertySearchFeatureLabels}from'../propertySearchPresentation';
import{PROPERTY_FEATURE_MAP}from'../config/propertyFeatures';
describe('broad search pool label',()=>{
 it('labels any matching pool honestly without mutating canonical owner vocabulary',()=>{const feature=PROPERTY_FEATURE_MAP.get('pool')!;const before={...feature};expect(propertySearchFeatureLabels(feature)).toEqual({labelEn:'Pool',labelRu:'Бассейн'});expect(feature).toEqual(before);expect(feature.labelEn).toBe('Shared pool');});
 it('preserves private-pool and all other feature labels',()=>{for(const feature of PROPERTY_FEATURE_MAP.values())if(feature.id!=='pool')expect(propertySearchFeatureLabels(feature)).toEqual({labelEn:feature.labelEn,labelRu:feature.labelRu});});
});
