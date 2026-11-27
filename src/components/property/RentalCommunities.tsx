import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProperties } from "@/hooks/useProperties";
import { usePublicPropertyProjects, type PropertyProject } from "@/hooks/usePropertyProjects";
import { APP_ROUTES as R } from "@/lib/config/routes";
import { pickLang, type LangValues } from "@/lib/i18n/pickLang";
import { complexMediaUrl } from "@/lib/real-estate/complexMedia";
import { getDistrictLabel, PHUKET_DISTRICTS } from "@/lib/taxonomies";
import "@/styles/rental-landing.css";

const rentSearch = `${R.PROPERTY_SEARCH}?mode=rent&tenancy=short`;

const phuketDistricts = PHUKET_DISTRICTS.map(({ id }) => id);

function Community({ project }: { project: PropertyProject }) {
  const { language } = useLanguage();
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const image = [project.cover_image, ...(project.images ?? [])]
    .map(complexMediaUrl)
    .find((url): url is string => Boolean(url && !failed.has(url)));
  const name =
    (language === "ru" ? project.name_ru : project.name_en) ||
    project.name_en ||
    project.name_ru;
  return (
    <Link
      className="rental-community ds-focus"
      to={`${rentSearch}&project=${encodeURIComponent(project.id)}`}
    >
      <div className="rental-community-image">
        {image ? (
          <img
            src={image}
            alt=""
            width="640"
            height="480"
            loading="lazy"
            decoding="async"
            onError={() =>
              setFailed((previous) => new Set(previous).add(image))
            }
          />
        ) : (
          <Building2 aria-hidden="true" />
        )}
      </div>
      <div className="rental-community-copy">
        <h3>{name}</h3>
        {project.district && (
          <p>
            {getDistrictLabel(
              project.district,
              language === "ru" ? "ru" : "en",
            )}
          </p>
        )}
        <span>
          {pickLang(language, {
            ru: "Посмотреть жильё",
            en: "See vacation rentals",
            th: "ดูที่พักสำหรับวันหยุด",
          })}
          <ArrowUpRight size={18} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
export function RentalCommunities() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const homes = useProperties({ listingType: "rent", rentTenancy: "short", districts: phuketDistricts }, 60);
  const projectsWithStays = new Map<string, { count: number; featured: boolean }>();
  for (const home of homes.data ?? []) {
    if (!home.project_id) continue;
    const project = projectsWithStays.get(home.project_id) ?? { count: 0, featured: false };
    project.count += 1;
    project.featured ||= home.is_featured === true;
    projectsWithStays.set(home.project_id, project);
  }
  const ids = [...projectsWithStays]
    .sort(([, a], [, b]) => Number(b.featured) - Number(a.featured) || b.count - a.count)
    .slice(0, 6)
    .map(([id]) => id);
  const projects = usePublicPropertyProjects(6, undefined, ids);
  const loading = homes.isLoading || (ids.length > 0 && projects.isLoading);
  const error = homes.isError || (ids.length > 0 && projects.isError);
  const rows = ids.flatMap(id => (projects.data ?? []).filter(project => project.id === id));
  return (
    <section
      className="rental-section"
      id="rental-communities"
      aria-labelledby="rental-communities-title"
    >
      <div className="rental-section-heading">
        <div>
          <h2 id="rental-communities-title">
            {t({
              ru: "Проекты для отдыха на Пхукете",
              en: "Phuket communities for a holiday",
              th: "โครงการที่พักสำหรับวันหยุดในภูเก็ต",
            })}
          </h2>
          <p>
            {t({
              ru: "В этих комплексах есть опубликованные предложения посуточной аренды.",
              en: "Explore communities with published short-stay rental listings.",
              th: "ดูโครงการที่มีประกาศเช่าระยะสั้น",
            })}
          </p>
        </div>
        <Link className="rental-text-link" to={rentSearch}>
          {t({
            ru: "Вся посуточная аренда",
            en: "All vacation rentals",
            th: "ที่พักสำหรับวันหยุดทั้งหมด",
          })}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
      {loading ? (
        <p role="status" className="rental-data-state">
          {t({
            ru: "Загружаем комплексы…",
            en: "Loading communities…",
            th: "กำลังโหลดโครงการ…",
          })}
        </p>
      ) : error ? (
        <div role="alert" className="rental-data-state">
          <p>
            {t({
              ru: "Комплексы сейчас не загрузились. Попробуйте ещё раз.",
              en: "Communities could not be loaded. Please try again.",
              th: "โหลดโครงการไม่สำเร็จ โปรดลองอีกครั้ง",
            })}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              void homes.refetch();
              if (ids.length) void projects.refetch();
            }}
          >
            {t({ ru: "Повторить", en: "Try again", th: "ลองอีกครั้ง" })}
          </Button>
        </div>
      ) : rows.length ? (
        <div className="rental-community-grid">
          {rows.map((project) => (
            <Community key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <p className="rental-data-state">
          {t({
            ru: "Пока в подборке нет проектов с посуточной арендой. Посмотрите другие варианты в каталоге.",
            en: "There are no featured communities with short-stay listings yet. See other homes in the catalogue.",
            th: "ยังไม่มีโครงการในชุดนี้ที่มีประกาศเช่าระยะสั้น ดูที่พักอื่นในแค็ตตาล็อก",
          })}
        </p>
      )}
    </section>
  );
}
