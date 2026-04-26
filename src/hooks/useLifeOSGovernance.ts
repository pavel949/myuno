/**
 * useLifeOSGovernance - LifeOS Governance Rules & Validation Hook
 * 
 * Provides:
 * - Governance configuration from DB
 * - Pre-save validation
 * - Impact preview calculations
 * - Health metrics
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Default governance rules (fallback if DB not loaded)
export const DEFAULT_GOVERNANCE = {
  MAX_SCENARIOS_PER_ENTITY: 3,
  PRIMARY_WEIGHT_MIN: 70,
  PRIMARY_WEIGHT_MAX: 85,
  SECONDARY_WEIGHT_MIN: 40,
  SECONDARY_WEIGHT_MAX: 60,
  MAX_PRIMARY_BLOCKS: 2,
  MAX_SECONDARY_BLOCKS: 3,
  MIN_ENTITIES_PER_SCENARIO: 3,
  MIN_PRIMARY_PER_SCENARIO: 1,
  DISALLOW_RAW_JSON_EDIT: true,
  AI_MODE: 'OFF' as const,
  AUTO_MAPPING: 'OFF' as const,
  LIFEOS_MODE: 'MANUAL' as const,
};

export type GovernanceConfig = typeof DEFAULT_GOVERNANCE;

export interface HealthMetrics {
  situation_id: string;
  situation_code: string;
  title_en: string;
  title_ru: string;
  is_active: boolean;
  scenario_count: number;
  task_count: number;
  legacy_entity_count: number;
  new_entity_count: number;
  flag_no_scenarios: boolean;
  flag_no_tasks: boolean;
  flag_no_entities: boolean;
  orphan_scenario_count: number;
  orphan_task_count: number;
  entity_overuse_count: number;
  health_score: number;
}

export interface ValidationResult {
  isValid: boolean;
  blocked: boolean;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  messageRu: string;
  affectedSituations?: string[];
  suggestedFix?: string;
}

export interface ValidationError {
  code: string;
  message: string;
  messageRu: string;
  affectedSituations?: string[];
}

export interface ChangeImpact {
  affectedSituations: number;
  primaryBlocksImpacted: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  healthDelta: { before: number; after: number };
  requiresPlatformAdmin: boolean;
}

/**
 * Fetch governance configuration from DB
 */
export function useGovernanceConfig() {
  return useQuery({
    queryKey: ['lifeos-governance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifeos_governance')
        .select('key, value');

      if (error) {
        return DEFAULT_GOVERNANCE;
      }

      const config = { ...DEFAULT_GOVERNANCE };
      for (const row of data || []) {
        const key = row.key as keyof GovernanceConfig;
        if (key in config) {
          try {
            (config as Record<string, unknown>)[key] = typeof row.value === 'string' 
              ? JSON.parse(row.value as string) 
              : row.value;
          } catch {
            (config as Record<string, unknown>)[key] = row.value;
          }
        }
      }
      return config;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch health metrics for all scenarios
 */
export function useLifeOSHealth() {
  return useQuery({
    queryKey: ['lifeos-health'],
    queryFn: async () => {
      // lifeos_health_view does not exist in current schema — return empty until view is created
      const { data, error } = await (supabase as unknown as {
        from: (t: string) => { select: (s: string) => Promise<{ data: unknown; error: unknown }> };
      })
        .from('lifeos_health_view')
        .select('*');

      if (error) return [] as HealthMetrics[];
      return ((data as HealthMetrics[]) || []);
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Count how many scenarios an entity is mapped to
 */
export async function getEntityScenarioCount(entityType: string, entityId: string): Promise<number> {
  const { count, error } = await supabase
    .from('catalog_life_map')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (error) return 0;
  return count || 0;
}

/**
 * Get mappings for a specific scenario
 */
export async function getScenarioMappings(situationId: string) {
  const { data, error } = await supabase
    .from('catalog_life_map')
    .select('*')
    .eq('life_situation_id', situationId);

  if (error) return [];
  return data || [];
}

/**
 * Validate a new or updated mapping against governance rules
 */
export async function validateMapping(
  mapping: {
    life_situation_id: string;
    entity_type: string;
    entity_id: string;
    weight: number;
    priority_type: 'primary' | 'secondary';
  },
  config: GovernanceConfig,
  isUpdate: boolean = false,
  existingMappingId?: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Check entity scenario count (MAX_SCENARIOS_PER_ENTITY)
  const currentCount = await getEntityScenarioCount(mapping.entity_type, mapping.entity_id);
  const effectiveCount = isUpdate ? currentCount : currentCount + 1;
  
  if (effectiveCount > config.MAX_SCENARIOS_PER_ENTITY) {
    errors.push({
      code: 'ENTITY_OVERUSE',
      message: `Entity is already mapped to ${currentCount} scenarios (max: ${config.MAX_SCENARIOS_PER_ENTITY})`,
      messageRu: `Сущность уже привязана к ${currentCount} сценариям (макс: ${config.MAX_SCENARIOS_PER_ENTITY})`,
    });
  }

  // 2. Validate weight ranges
  const isPrimary = mapping.priority_type === 'primary';
  const weightMin = isPrimary ? config.PRIMARY_WEIGHT_MIN : config.SECONDARY_WEIGHT_MIN;
  const weightMax = isPrimary ? config.PRIMARY_WEIGHT_MAX : config.SECONDARY_WEIGHT_MAX;

  if (mapping.weight < weightMin || mapping.weight > weightMax) {
    warnings.push({
      code: 'WEIGHT_OUT_OF_RANGE',
      message: `Weight ${mapping.weight} is outside recommended range (${weightMin}-${weightMax}) for ${mapping.priority_type} entities`,
      messageRu: `Вес ${mapping.weight} вне рекомендуемого диапазона (${weightMin}-${weightMax}) для ${mapping.priority_type === 'primary' ? 'основных' : 'дополнительных'} сущностей`,
      suggestedFix: `Set weight between ${weightMin} and ${weightMax}`,
    });
  }

  // 3. High weight warning (>85)
  if (mapping.weight > 85) {
    warnings.push({
      code: 'HIGH_WEIGHT',
      message: 'Weight above 85 requires confirmation',
      messageRu: 'Вес выше 85 требует подтверждения',
    });
  }

  // 4. Check scenario primary count
  const scenarioMappings = await getScenarioMappings(mapping.life_situation_id);
  const currentPrimaryCount = scenarioMappings.filter(
    m => (m.rules as { priority_type?: string } | null)?.priority_type === 'primary' && m.id !== existingMappingId
  ).length;

  if (isPrimary && currentPrimaryCount >= config.MAX_PRIMARY_BLOCKS) {
    warnings.push({
      code: 'PRIMARY_OVERLOAD',
      message: `Scenario already has ${currentPrimaryCount} primary entities (max: ${config.MAX_PRIMARY_BLOCKS})`,
      messageRu: `У сценария уже ${currentPrimaryCount} основных сущностей (макс: ${config.MAX_PRIMARY_BLOCKS})`,
    });
  }

  return {
    isValid: errors.length === 0,
    blocked: errors.length > 0,
    warnings,
    errors,
  };
}

/**
 * Validate before deleting a mapping
 */
export async function validateDelete(
  mappingId: string,
  config: GovernanceConfig
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Get the mapping
  const { data: mapping } = await supabase
    .from('catalog_life_map')
    .select('*, life_situations(code, title_en)')
    .eq('id', mappingId)
    .single();

  if (!mapping) {
    return { isValid: true, blocked: false, warnings: [], errors: [] };
  }

  const isPrimary = (mapping.rules as { priority_type?: string } | null)?.priority_type === 'primary';
  const situationTitle = (mapping.life_situations as { title_en?: string } | null)?.title_en || 'Unknown';

  // Get scenario health
  const scenarioMappings = await getScenarioMappings(mapping.life_situation_id);
  const primaryCount = scenarioMappings.filter(
    m => (m.rules as { priority_type?: string } | null)?.priority_type === 'primary'
  ).length;
  const totalCount = scenarioMappings.length;

  // Block: Removing last primary
  if (isPrimary && primaryCount <= config.MIN_PRIMARY_PER_SCENARIO) {
    errors.push({
      code: 'LAST_PRIMARY',
      message: `Cannot remove the last primary entity from "${situationTitle}"`,
      messageRu: `Нельзя удалить последнюю основную сущность из "${situationTitle}"`,
      affectedSituations: [situationTitle],
    });
  }

  // Warn: Reducing below minimum
  if (totalCount <= config.MIN_ENTITIES_PER_SCENARIO) {
    warnings.push({
      code: 'LOW_COVERAGE',
      message: `Removing this will leave "${situationTitle}" with only ${totalCount - 1} entities (min: ${config.MIN_ENTITIES_PER_SCENARIO})`,
      messageRu: `После удаления в "${situationTitle}" останется только ${totalCount - 1} сущностей (мин: ${config.MIN_ENTITIES_PER_SCENARIO})`,
      affectedSituations: [situationTitle],
    });
  }

  // Warn: Disabling primary
  if (isPrimary) {
    warnings.push({
      code: 'DISABLE_PRIMARY',
      message: `You are removing a primary entity from "${situationTitle}"`,
      messageRu: `Вы удаляете основную сущность из "${situationTitle}"`,
      affectedSituations: [situationTitle],
    });
  }

  return {
    isValid: errors.length === 0,
    blocked: errors.length > 0,
    warnings,
    errors,
  };
}

/**
 * Calculate change impact for preview modal
 */
export async function calculateChangeImpact(
  action: 'create' | 'update' | 'delete',
  mapping: { life_situation_id: string; priority_type?: string },
  config: GovernanceConfig
): Promise<ChangeImpact> {
  const scenarioMappings = await getScenarioMappings(mapping.life_situation_id);
  const currentTotal = scenarioMappings.length;
  const currentPrimary = scenarioMappings.filter(
    m => (m.rules as { priority_type?: string } | null)?.priority_type === 'primary'
  ).length;

  const isPrimary = mapping.priority_type === 'primary';
  
  let afterTotal = currentTotal;
  let afterPrimary = currentPrimary;

  switch (action) {
    case 'create':
      afterTotal++;
      if (isPrimary) afterPrimary++;
      break;
    case 'delete':
      afterTotal--;
      if (isPrimary) afterPrimary--;
      break;
  }

  // Calculate health scores
  const beforeScore = calculateHealthScore(currentTotal, currentPrimary, config);
  const afterScore = calculateHealthScore(afterTotal, afterPrimary, config);

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (afterPrimary < config.MIN_PRIMARY_PER_SCENARIO) {
    riskLevel = 'HIGH';
  } else if (afterTotal < config.MIN_ENTITIES_PER_SCENARIO) {
    riskLevel = 'MEDIUM';
  } else if (afterScore < beforeScore) {
    riskLevel = 'MEDIUM';
  }

  return {
    affectedSituations: 1,
    primaryBlocksImpacted: isPrimary ? 1 : 0,
    riskLevel,
    healthDelta: { before: beforeScore, after: afterScore },
    requiresPlatformAdmin: riskLevel === 'HIGH',
  };
}

function calculateHealthScore(total: number, primary: number, config: GovernanceConfig): number {
  if (total === 0) return 0;
  if (primary === 0) return 25;
  if (total < config.MIN_ENTITIES_PER_SCENARIO) return 50;
  if (primary > config.MAX_PRIMARY_BLOCKS) return 60;
  return Math.min(100, 70 + total * 2);
}

/**
 * Log governance-related action to audit log
 */
export async function logGovernanceAction(
  action: string,
  blocked: boolean,
  ruleTriggered: string | null,
  entityId: string | null,
  details: Record<string, unknown> = {}
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('admin_audit_logs').insert([{
      action: `LIFEOS_GOVERNANCE_${action}`,
      entity_type: 'lifeos_mapping',
      entity_id: entityId,
      old_data: JSON.parse(JSON.stringify({ blocked, rule_triggered: ruleTriggered })),
      new_data: JSON.parse(JSON.stringify(details)),
      admin_id: user?.id || '00000000-0000-0000-0000-000000000000',
    }]);
  } catch {
    // governance logging is non-critical
  }
}
