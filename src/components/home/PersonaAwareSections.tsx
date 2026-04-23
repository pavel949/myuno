/**
 * @module PersonaAwareSections
 * @description M6 · Track D.3 — обёртка для перестановки Home-секций по
 * канонической персоне.
 *
 * Не владеет JSX отдельных блоков — родитель передаёт словарь
 * `sections: Partial<Record<HomeSectionKey, ReactNode>>` (готовые элементы
 * со своими props). Компонент:
 *  1. Читает `useCanonicalProfile()`.
 *  2. Прогоняет `prioritizeHomeSections(profile, defaultOrder)`.
 *  3. Рендерит секции в новом порядке. Отсутствующие в `sections` ключи
 *     пропускаются (не падает).
 *
 * Поведение под флагом регулирует **родитель**, а не этот компонент:
 * родитель сам решает, использовать `<PersonaAwareSections />` или
 * рендерить блоки в дефолтном порядке. Это упрощает A/B и rollback.
 *
 * Контракт SSR/loading: пока `useCanonicalProfile` грузится, рендерим
 * `defaultOrder` (regression-safe — никаких content-jump'ов).
 *
 * См. `docs/canonical/audits/M6-persona-landings.md` § 3 · Трек D.
 */

import React, { useMemo } from 'react';
import { useCanonicalProfile } from '@/hooks/useCanonicalProfile';
import {
  prioritizeHomeSections,
  type HomeSectionKey,
  type PrioritizeOptions,
} from '@/lib/segmentation/prioritizeHomeSections';

export interface PersonaAwareSectionsProps {
  /** Дефолтный порядок секций — это «канонический» layout Home. */
  defaultOrder: readonly HomeSectionKey[];
  /**
   * Готовые JSX-элементы для каждой секции. Ключ должен совпадать с
   * `HomeSectionKey`. Отсутствующие ключи тихо пропускаются.
   *
   * Каждый элемент должен иметь стабильный `key` или быть рендерным один
   * раз — мы не оборачиваем во фрагменты с `React.cloneElement`.
   */
  sections: Partial<Record<HomeSectionKey, React.ReactNode>>;
  /** Тонкие настройки prioritization (см. `PrioritizeOptions`). */
  options?: PrioritizeOptions;
  /**
   * Если `true` — отключает prioritization и рендерит `defaultOrder` 1:1.
   * Удобно для A/B и быстрого hot-fix без изменения родителя.
   * По умолчанию `false`.
   */
  disabled?: boolean;
}

/**
 * Перестанавливает Home-блоки по канонической персоне.
 * Длина и состав отрисованных секций равны пересечению `defaultOrder`
 * и ключей `sections`.
 */
export const PersonaAwareSections: React.FC<PersonaAwareSectionsProps> = ({
  defaultOrder,
  sections,
  options,
  disabled = false,
}) => {
  const { profile, isLoading } = useCanonicalProfile();

  const orderedKeys = useMemo<HomeSectionKey[]>(() => {
    // Loading или disabled или anon без профиля → дефолт.
    if (disabled || isLoading) return [...defaultOrder];
    return prioritizeHomeSections(profile, defaultOrder, options);
  }, [profile, isLoading, defaultOrder, options, disabled]);

  return (
    <>
      {orderedKeys.map((key) => {
        const node = sections[key];
        if (!node) return null;
        return <React.Fragment key={key}>{node}</React.Fragment>;
      })}
    </>
  );
};

export default PersonaAwareSections;
