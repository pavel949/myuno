/**
 * lifecycle-matrix tests (Deno)
 *
 * M6 · Track C.5 — unit-тесты матрицы переходов lifecycle_stage.
 * Запуск: supabase test edge functions canonical-lifecycle-recompute.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { resolveLifecycleStage } from "./lifecycle-matrix.ts";

const NOW = new Date("2026-04-23T00:00:00Z");
const FUTURE = "2027-01-01";
const PAST = "2025-01-01";

Deno.test("scout: anonymous / no visits", () => {
  const r = resolveLifecycleStage({
    currentStage: null,
    totalDaysInThailand: 0,
    visitsCount: 0,
    visaType: null,
    visaExpiresAt: null,
    now: NOW,
  });
  assertEquals(r.stage, "scout");
});

Deno.test("tourist: first short visit", () => {
  const r = resolveLifecycleStage({
    currentStage: "scout",
    totalDaysInThailand: 14,
    visitsCount: 1,
    visaType: "TR60",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(r.stage, "tourist");
});

Deno.test("snowbird: 2+ distinct seasons", () => {
  const r = resolveLifecycleStage({
    currentStage: "tourist",
    totalDaysInThailand: 60,
    visitsCount: 2,
    distinctSeasons: 2,
    visaType: "TR60",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(r.stage, "snowbird");
});

Deno.test("nomad: active DTV visa, low totalDays", () => {
  const r = resolveLifecycleStage({
    currentStage: "tourist",
    totalDaysInThailand: 90,
    visitsCount: 1,
    visaType: "DTV",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(r.stage, "nomad");
});

Deno.test("settler: 180+ days", () => {
  const r = resolveLifecycleStage({
    currentStage: "tourist",
    totalDaysInThailand: 200,
    visitsCount: 3,
    visaType: "TR60",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(r.stage, "settler");
});

Deno.test("settler: DTV with 90+ days", () => {
  const r = resolveLifecycleStage({
    currentStage: "nomad",
    totalDaysInThailand: 100,
    visitsCount: 2,
    visaType: "DTV",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(r.stage, "settler");
});

Deno.test("resident: 2+ years totalDays", () => {
  const r = resolveLifecycleStage({
    currentStage: "settler",
    totalDaysInThailand: 800,
    visitsCount: 5,
    visaType: "TR60",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(r.stage, "resident");
});

Deno.test("resident: active LTR visa", () => {
  const r = resolveLifecycleStage({
    currentStage: "settler",
    totalDaysInThailand: 100,
    visitsCount: 2,
    visaType: "LTR",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(r.stage, "resident");
});

Deno.test("absentee: resident + visa expired", () => {
  const r = resolveLifecycleStage({
    currentStage: "resident",
    totalDaysInThailand: 0,
    visitsCount: 0,
    visaType: "LTR",
    visaExpiresAt: PAST,
    now: NOW,
  });
  assertEquals(r.stage, "absentee");
});

Deno.test("returnee: was absentee, fresh booking", () => {
  const r = resolveLifecycleStage({
    currentStage: "absentee",
    totalDaysInThailand: 100,
    visitsCount: 1,
    visaType: "TR60",
    visaExpiresAt: FUTURE,
    hasRecentReturnBooking: true,
    now: NOW,
  });
  assertEquals(r.stage, "returnee");
});

Deno.test("idempotent: tourist remains tourist on small delta", () => {
  const a = resolveLifecycleStage({
    currentStage: "tourist",
    totalDaysInThailand: 10,
    visitsCount: 1,
    visaType: "TR60",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  const b = resolveLifecycleStage({
    currentStage: "tourist",
    totalDaysInThailand: 11,
    visitsCount: 1,
    visaType: "TR60",
    visaExpiresAt: FUTURE,
    now: NOW,
  });
  assertEquals(a.stage, b.stage);
});
