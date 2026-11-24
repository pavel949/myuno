import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import NewbuildLanding from "../NewbuildLanding";
import {
  PropertyOffplanEntry,
  propertyHubRoutes,
} from "@/components/layout/routes/propertyHubRoutes";
const state = vi.hoisted(() => ({
  language: "en",
  loading: false,
  error: false,
  empty: false,
  developerError: false,
  developerEmpty: false,
  retry: vi.fn(),
  developerRetry: vi.fn(),
}));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: state.language }),
}));
vi.mock("@/components/seo", () => ({
  SEOHead: (props: Record<string, string>) => (
    <output data-testid="seo">{JSON.stringify(props)}</output>
  ),
}));
vi.mock("@/hooks/useOffplanProjects", () => ({
  useOffplanProjects: () => ({
    data: state.empty
      ? []
      : [
          {
            id: "project",
            nameEn: "Stored project",
            nameRu: "Проект из каталога",
            district: "Bang Tao",
            developerName: "Stored developer",
            coverImage: "javascript:unsafe",
            priceFrom: 4500000,
            projectStatus: "completed",
            completionDate: "2028-01-01",
            muunoScore: 99,
            unitsAvailable: 100,
            roiProjected: 42,
            isClearviewRated: true,
          },
        ],
    isLoading: state.loading,
    isError: state.error,
    refetch: state.retry,
  }),
}));
vi.mock("@/hooks/useDevelopers", () => ({
  useDevelopers: () => ({
    data: state.developerEmpty
      ? []
      : [
          {
            id: "developer",
            nameEn: "Stored developer",
            nameRu: "Застройщик из каталога",
            isVerified: true,
            muunoScore: 99,
            projectsCompleted: 100,
          },
        ],
    isLoading: false,
    isError: state.developerError,
    refetch: state.developerRetry,
  }),
}));
vi.mock("@/components/layout/pageRegistry", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  NewbuildLanding: () => <h1>Newbuild discovery mounted</h1>,
  OffplanIndex: () => <h1>Canonical project results</h1>,
}));
afterEach(cleanup);
beforeEach(() => {
  state.language = "en";
  state.loading = false;
  state.error = false;
  state.empty = false;
  state.developerError = false;
  state.developerEmpty = false;
  vi.clearAllMocks();
});
function Probe() {
  const l = useLocation();
  return (
    <output data-testid="route">
      {l.pathname + l.search + l.hash}|{JSON.stringify(l.state)}
    </output>
  );
}
function mount() {
  return render(
    <MemoryRouter
      initialEntries={["/property/offplan?ref=test#newbuild-projects"]}
    >
      <NewbuildLanding />
      <Probe />
    </MemoryRouter>,
  );
}
it.each(["ru", "en", "th"])(
  "presents ten buying chapters and canonical ecosystem links in %s",
  (language) => {
    state.language = language;
    const view = mount();
    expect(view.container.querySelectorAll("h1")).toHaveLength(1);
    for (const id of [
      "goals",
      "clearview",
      "areas",
      "projects",
      "updates",
      "developers",
      "selection",
      "guide",
      "help",
      "life",
    ])
      expect(view.container.querySelector("#newbuild-" + id)).toBeTruthy();
    for (const href of [
      "/property/offplan/search",
      "/property/developers/developer",
      "/property/clearview",
      "/property/rent",
      "/experiences",
      "/discover/services",
    ])
      expect(view.container.querySelector(`a[href="${href}"]`)).toBeTruthy();
    expect(screen.getByTestId("seo")).toHaveTextContent(
      "https://www.myuno.app/property/offplan",
    );
  },
);
it("keeps withheld ratings, construction, inventory and returns out of project and developer cards", () => {
  const view = mount();
  const cards = view.container.querySelector("#newbuild-projects")!;
  expect(cards).toHaveTextContent("Price requires confirmation");
  expect(cards).not.toHaveTextContent("2028");
  expect(cards).not.toHaveTextContent("99");
  expect(cards).not.toHaveTextContent("42");
  expect(cards).not.toHaveTextContent("100");
  expect(cards.querySelector("img")).toBeNull();
  expect(view.container.querySelector('[src^="javascript:"]')).toBeNull();
  expect(view.container.querySelector("#newbuild-updates")).toHaveTextContent(
    "A verified event feed is not available here yet",
  );
});
it("uses actual stored district values and shared budget options when submitting a project search", () => {
  mount();
  fireEvent.change(screen.getByRole("textbox", { name: "Project" }), {
    target: { value: " Ocean & Garden " },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Area" }), {
    target: { value: "Bang Tao" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Budget, THB" }), {
    target: { value: "10to20" },
  });
  fireEvent.submit(
    screen.getByRole("textbox", { name: "Project" }).closest("form")!,
  );
  const result = screen.getByTestId("route").textContent!;
  expect(result).toContain(
    "/property/offplan/search?q=Ocean+%26+Garden&district=Bang+Tao&budget=10to20",
  );
  expect(result).toContain("/property/offplan?ref=test#newbuild-projects");
});
it("links available area filters using exact stored values and uses an honestly named catalogue fallback", () => {
  const view = mount();
  expect(
    view.container.querySelector(
      '#newbuild-areas a[href="/property/offplan/search?district=Bang%20Tao"]',
    ),
  ).toHaveTextContent("Projects here");
  expect(
    view.container.querySelectorAll(
      '#newbuild-areas a[href="/property/offplan/search"]',
    ),
  ).toHaveLength(3);
});
it("opens actual project unit sections with the landing return context", () => {
  const view = mount();
  const link = view.container.querySelector(
    '#newbuild-units a[href="/property/offplan/project#project-units"]',
  )!;
  fireEvent.click(link);
  expect(screen.getByTestId("route")).toHaveTextContent(
    "/property/offplan/project#project-units",
  );
  expect(screen.getByTestId("route")).toHaveTextContent("publicJourneyOrigin");
});
it.each(["loading", "error", "empty"])(
  "distinguishes %s project state while editorial guidance stays available",
  (mode) => {
    state.loading = mode === "loading";
    state.error = mode === "error";
    state.empty = mode === "empty";
    const view = mount();
    const projects = view.container.querySelector("#newbuild-projects")!;
    expect(projects).toHaveTextContent(
      mode === "loading"
        ? "Loading public information"
        : mode === "error"
          ? "Information could not be loaded"
          : "There are no published entries",
    );
    expect(view.container.querySelector("#newbuild-guide")).toBeTruthy();
    if (mode === "error") {
      fireEvent.click(projects.querySelector("button")!);
      expect(state.retry).toHaveBeenCalledOnce();
    }
  },
);
it("separates a developer read error from empty data and retries the appropriate reader", () => {
  state.developerError = true;
  const view = mount();
  fireEvent.click(view.container.querySelector("#newbuild-developers button")!);
  expect(state.developerRetry).toHaveBeenCalledOnce();
  expect(state.retry).not.toHaveBeenCalled();
});
it("shows an explicit empty developer state", () => {
  state.developerEmpty = true;
  const view = mount();
  expect(
    view.container.querySelector("#newbuild-developers"),
  ).toHaveTextContent("There are no published entries");
});
it.each([
  "?district=Bang+Tao&budget=lt5&ref=campaign#projects",
  "?view=map&ref=campaign#map",
  "?year=2028&own=freehold#terms",
])(
  "preserves criteria, campaign, hash and state for old offplan bookmarks %s",
  async (query) => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/property/offplan",
            search: query.split("#")[0],
            hash: "#" + query.split("#")[1],
            state: { from: "saved" },
          },
        ]}
      >
        <Routes>
          <Route path="/property/offplan" element={<PropertyOffplanEntry />} />
          <Route
            path="/property/offplan/search"
            element={<p>Results destination</p>}
          />
        </Routes>
        <Probe />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("route")).toHaveTextContent(
        "/property/offplan/search" + query,
      ),
    );
    expect(screen.getByTestId("route")).toHaveTextContent("saved");
  },
);
it("keeps campaign-only visits on discovery", async () => {
  render(
    <MemoryRouter
      initialEntries={["/property/offplan?utm_source=test#newbuild-areas"]}
    >
      <Routes>
        <Route path="/property/offplan" element={<PropertyOffplanEntry />} />
      </Routes>
      <Probe />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByText("Newbuild discovery mounted")).toBeVisible(),
  );
  expect(screen.getByTestId("route")).toHaveTextContent(
    "/property/offplan?utm_source=test#newbuild-areas",
  );
});
it("retains legacy projects aliases including criteria and state through to the canonical results", async () => {
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/property/projects",
          search: "?q=Ocean&ref=legacy",
          hash: "#saved",
          state: { from: "legacy" },
        },
      ]}
    >
      <Routes>
        <Route path="/property">{propertyHubRoutes}</Route>
      </Routes>
      <Probe />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByText("Canonical project results")).toBeVisible(),
  );
  expect(screen.getByTestId("route")).toHaveTextContent(
    "/property/offplan/search?q=Ocean&ref=legacy#saved",
  );
  expect(screen.getByTestId("route")).toHaveTextContent("legacy");
});
