import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import PropertyLanding from "../PropertyLanding";
import { PropertyRentEntry } from "@/components/layout/routes/propertyHubRoutes";
import GoalEntryPage from "@/pages/discover/GoalEntryPage";
vi.mock('@/hooks/useUniversalLead', () => ({ useUniversalLead: () => ({ submitLead: { mutate: vi.fn() }, isSubmitting: false }) }));

const state = vi.hoisted(() => ({
  language: "en",
  homesLoading: false,
  homesError: false,
  projectsLoading: false,
  projectsError: false,
  homes: [{ id: "home", project_id: "community" }] as {
    id: string;
    project_id: string | null;
  }[],
  projects: [
    {
      id: "community",
      name_en: "Stored community",
      name_ru: "Комплекс из каталога",
      district: "rawai",
      cover_image: "https://example.invalid/photo.jpg",
    },
  ] as Record<string, unknown>[],
  homesRetry: vi.fn(),
  projectsRetry: vi.fn(),
  projectRead: vi.fn(),
}));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: state.language }),
}));
vi.mock("@/components/seo", () => ({ SEOHead: () => null }));
vi.mock("@/components/home/HomeDiscoverySearch", () => ({
  HomeDiscoverySearch: () => <div>Shared rental search</div>,
}));
vi.mock("@/hooks/useProperties", () => ({
  useProperties: () => ({
    data: state.homes,
    isLoading: state.homesLoading,
    isError: state.homesError,
    refetch: state.homesRetry,
  }),
}));
vi.mock("@/hooks/usePropertyProjects", () => ({
  usePublicPropertyProjects: (...args: unknown[]) => {
    state.projectRead(...args);
    return {
      data: state.projects,
      isLoading: state.projectsLoading,
      isError: state.projectsError,
      refetch: state.projectsRetry,
    };
  },
}));
vi.mock("@/components/layout/pageRegistry", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  PropertyLanding: () => <h1>Rental landing mounted</h1>,
}));
vi.mock("@/pages/services/ServicesIndex", () => ({ default: () => null }));
afterEach(cleanup);
beforeEach(() => {
  state.language = "en";
  state.homesLoading = false;
  state.homesError = false;
  state.projectsLoading = false;
  state.projectsError = false;
  state.homes = [{ id: "home", project_id: "community" }];
  state.projects = [
    {
      id: "community",
      name_en: "Stored community",
      name_ru: "Комплекс из каталога",
      district: "rawai",
      cover_image: "https://example.invalid/photo.jpg",
    },
  ];
  vi.clearAllMocks();
});
function mountLanding() {
  return render(
    <MemoryRouter>
      <PropertyLanding />
    </MemoryRouter>,
  );
}
it.each(["en", "ru", "th"])(
  "provides area, community, decision and ecosystem sections in %s",
  (language) => {
    state.language = language;
    const { container } = mountLanding();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    for (const id of [
      "rental-areas",
      "rental-communities",
      "rental-search",
      "rental-guide",
      "rental-life",
    ])
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    const life = container.querySelector("#rental-life")!;
    expect(life.querySelector('a[href="/experiences"]')).not.toBeNull();
    expect(life.querySelector('a[href="/discover/services"]')).not.toBeNull();
    const durations = screen.getByRole("region", {
      name:
        language === "en"
          ? "Rental duration"
          : language === "ru"
            ? "Срок аренды"
            : "ระยะเวลาเช่า",
    });
    expect(
      [...durations.querySelectorAll("a")].map((a) => a.getAttribute("href")),
    ).toEqual(
      ["short", "medium", "long"].map(
        (p) => `/property/search?mode=rent&tenancy=${p}`,
      ),
    );
  },
);
it("only renders stored communities linked to the loaded rental sample and retains rental intent", () => {
  state.projects.push({ id: "unlinked", name_en: "Unlinked sales project" });
  mountLanding();
  expect(state.projectRead).toHaveBeenCalledWith(6, undefined, ["community"]);
  expect(
    screen.getByRole("link", { name: /Stored community/ }),
  ).toHaveAttribute("href", "/property/complex/community?mode=rent");
  expect(screen.queryByText("Unlinked sales project")).not.toBeInTheDocument();
});
it("keeps guidance useful with empty supply and does not invent availability", () => {
  state.homes = [];
  state.projects = [];
  mountLanding();
  expect(screen.getByText(/This selection has no communities/)).toBeVisible();
  expect(screen.getByRole("link", { name: "All area guides" })).toHaveAttribute(
    "href",
    "/area",
  );
  expect(state.projectRead).toHaveBeenCalledWith(6, undefined, []);
});
it("separates loading and read rejection from empty supply, retries the existing readers", () => {
  state.homesError = true;
  mountLanding();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Communities could not be loaded",
  );
  expect(
    screen.queryByText(/This selection has no communities/),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(state.homesRetry).toHaveBeenCalledOnce();
  expect(state.projectsRetry).toHaveBeenCalledOnce();
});
it("shows a loading state rather than a false empty result", () => {
  state.homesLoading = true;
  mountLanding();
  expect(screen.getByRole("status")).toHaveTextContent("Loading communities");
  expect(
    screen.queryByText(/This selection has no communities/),
  ).not.toBeInTheDocument();
});
it("falls back to a neutral symbol when stored media fails without inventing a photo", () => {
  const { container } = mountLanding();
  const image = container.querySelector(".rental-community img")!;
  fireEvent.error(image);
  expect(container.querySelector(".rental-community img")).toBeNull();
  expect(screen.getByRole("link", { name: /Stored community/ })).toBeVisible();
});
function Probe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname + location.search + location.hash}|
      {JSON.stringify(location.state)}
    </output>
  );
}
function entry(url: string) {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          ...new URL(url, "https://example.invalid"),
          pathname: new URL(url, "https://example.invalid").pathname,
          search: new URL(url, "https://example.invalid").search,
          hash: new URL(url, "https://example.invalid").hash,
          state: { origin: "saved" },
        },
      ]}
    >
      <Probe />
      <Routes>
        <Route path="/property/rent" element={<PropertyRentEntry />} />
        <Route path="/property/search" element={<h1>Results</h1>} />
        <Route path="/discover/stay" element={<GoalEntryPage goal="stay" />} />
      </Routes>
    </MemoryRouter>,
  );
}
it("mounts the rental introduction for context-only links", async () => {
  entry("/property/rent?ref=campaign#rental-areas");
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Rental landing mounted" }),
    ).toBeVisible(),
  );
  expect(screen.getByTestId("location")).toHaveTextContent(
    "/property/rent?ref=campaign#rental-areas",
  );
});
it("preserves saved dates, district, hash and router state on old rental URLs", () => {
  entry(
    "/property/rent?district=rawai&checkIn=2027-01-01&checkOut=2027-01-08&tag=a&tag=b#results",
  );
  const out = screen.getByTestId("location");
  expect(out).toHaveTextContent("/property/search?");
  expect(out).toHaveTextContent("district=rawai");
  expect(out).toHaveTextContent("checkIn=2027-01-01");
  expect(out).toHaveTextContent("tag=a&tag=b");
  expect(out).toHaveTextContent("mode=rent#results");
  expect(out).toHaveTextContent("saved");
});
it("canonicalizes an unfiltered Stay entry to the rental introduction", async () => {
  entry("/discover/stay?ref=campaign#rental-areas");
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Rental landing mounted" }),
    ).toBeVisible(),
  );
  expect(screen.getByTestId("location")).toHaveTextContent(
    "/property/rent?ref=campaign#rental-areas",
  );
});
it("keeps explicit Stay criteria in the catalogue", () => {
  entry("/discover/stay?project=community&q=Needle#results");
  expect(screen.getByRole("heading", { name: "Results" })).toBeVisible();
  expect(screen.getByTestId("location")).toHaveTextContent(
    "project=community&q=Needle&mode=rent#results",
  );
});

it.each(["/property/rent", "/discover/stay"])(
  "preserves the explicit map bookmark from %s",
  (path) => {
    entry(`${path}?view=map&ref=saved#results`);
    expect(screen.getByRole("heading", { name: "Results" })).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/property/search?view=map&ref=saved&mode=rent#results",
    );
    expect(screen.getByTestId("location")).toHaveTextContent("saved");
  },
);
