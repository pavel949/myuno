import { describe, it, expect } from "vitest";

describe("Build Quality", () => {
  it("should pass basic sanity check", () => {
    expect(true).toBe(true);
  });

  it("should have correct environment", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });

  it("should have matchMedia mock", () => {
    expect(window.matchMedia).toBeDefined();
    const result = window.matchMedia("(min-width: 768px)");
    expect(result.matches).toBe(false);
  });

  it("should have ResizeObserver mock", () => {
    expect(global.ResizeObserver).toBeDefined();
    const observer = new ResizeObserver(() => {});
    expect(observer).toBeDefined();
  });

  it("should have IntersectionObserver mock", () => {
    expect(global.IntersectionObserver).toBeDefined();
    const observer = new IntersectionObserver(() => {});
    expect(observer).toBeDefined();
  });
});
