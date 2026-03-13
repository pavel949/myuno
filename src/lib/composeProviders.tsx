/**
 * @module composeProviders
 * @description Utility to flatten deeply nested React provider trees.
 * 
 * Instead of:
 *   <A><B><C><D>{children}</D></C></B></A>
 * 
 * Write:
 *   const Providers = composeProviders([A, B, C, D]);
 *   <Providers>{children}</Providers>
 * 
 * Preserves provider order (first = outermost).
 */
import React, { ComponentType, ReactNode } from 'react';

type ProviderComponent = ComponentType<{ children: ReactNode }>;

export function composeProviders(providers: ProviderComponent[]): ComponentType<{ children: ReactNode }> {
  return function ComposedProviders({ children }: { children: ReactNode }) {
    return providers.reduceRight<ReactNode>(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
}
