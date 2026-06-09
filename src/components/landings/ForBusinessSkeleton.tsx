/**
 * Page-specific skeleton for `/for-business`.
 *
 * Mirrors the actual section rhythm (hero → 8-card service grid → form) so the
 * transition from skeleton to real content does not visually shift. Used as the
 * Suspense fallback at the route boundary, so slow chunk loads on bad Phuket
 * mobile networks render predictable structure instead of a blank screen.
 */
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ForBusinessSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-10 md:h-14 w-full max-w-2xl" />
          <Skeleton className="h-10 md:h-14 w-3/4" />
          <Skeleton className="h-5 w-2/3 mt-2" />
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
            <Skeleton className="h-11 w-full sm:w-44" />
            <Skeleton className="h-11 w-full sm:w-56" />
          </div>
        </div>
      </section>

      {/* Service menu grid */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex flex-col items-center gap-2 mb-8">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border border-border/80 p-5 flex flex-col gap-3 bg-card"
            >
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-5 w-5" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <div className="space-y-1.5 mt-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inquiry form */}
      <section className="max-w-2xl mx-auto px-4 pb-20 pt-4">
        <div className="border border-border/80 p-6 bg-card space-y-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="grid sm:grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </section>
    </div>
  );
}
