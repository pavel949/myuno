/** Buyer discovery over the existing public project/developer readers. No new sales authority. */
import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { SEOHead } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { ProjectStartingPrice } from "@/components/newbuilds/ProjectStartingPrice";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useOffplanProjects,
  type OffplanProject,
} from "@/hooks/useOffplanProjects";
import { useDevelopers } from "@/hooks/useDevelopers";
import { pickLang, type LangValues } from "@/lib/i18n/pickLang";
import { APP_ROUTES as R } from "@/lib/config/routes";
import { publicJourneyState } from "@/lib/real-estate/publicJourney";
import { publicNewbuildPresentation } from "@/lib/real-estate/publicNewbuildPresentation";
import { complexMediaUrl } from "@/lib/real-estate/complexMedia";
import { propertyAreaHref } from "@/lib/real-estate/publicJourney";
import { BUDGET_OPTIONS } from "@/lib/offplan/catalogFacets";
import {
  newbuildCopy as copy,
  newbuildGoals,
  newbuildAreas,
  newbuildTrust,
  newbuildSteps,
} from "@/content/property/newbuildLanding";
import hero from "@/assets/hero-phuket-coast-editorial.webp";
import "@/styles/rental-landing.css";
import "@/styles/newbuild-landing.css";

const text = (ru: string, en: string, th: string) => ({ ru, en, th });
function Heading({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: LangValues;
  children?: ReactNode;
}) {
  const { language } = useLanguage();
  return (
    <div className="rental-section-heading">
      <div>
        <p className="rental-eyebrow">{number} / myUNO</p>
        <h2 id={id}>{pickLang(language, title)}</h2>
        {children}
      </div>
    </div>
  );
}
function ProjectImage({ url }: { url: string | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  const safe = complexMediaUrl(url);
  return (
    <div className="rental-community-image">
      {safe && safe !== failed ? (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Image errors only swap failed media; the image is not an interactive control.
        <img
          src={safe}
          alt=""
          width="640"
          height="480"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(safe)}
        />
      ) : (
        <Building2 aria-hidden="true" />
      )}
    </div>
  );
}
export default function NewbuildLanding() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const location = useLocation();
  const navigate = useNavigate();
  const journey = publicJourneyState(location);
  const projectRead = useOffplanProjects();
  const developerRead = useDevelopers();
  const publicProjects = (projectRead.data ?? []).map(
    publicNewbuildPresentation,
  );
  const projects = publicProjects.slice(0, 6);
  const districts = [
    ...new Set(
      publicProjects
        .map((project) => project.district)
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort();
  const developers = (developerRead.data ?? []).slice(0, 4);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [budget, setBudget] = useState("");
  const chapters = [
    ["newbuild-areas", text("Районы", "Areas", "ทำเล")],
    ["newbuild-projects", text("Проекты", "Projects", "โครงการ")],
    ["newbuild-updates", text("Старты продаж", "Launches", "เปิดขาย")],
    ["newbuild-developers", text("Застройщики", "Developers", "ผู้พัฒนา")],
    [
      "newbuild-clearview",
      text(
        "Проверка и ClearView",
        "Checks and ClearView",
        "การตรวจสอบและ ClearView",
      ),
    ],
  ] as const;
  const queryHref = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (district) params.set("district", district);
    if (budget) params.set("budget", budget);
    return R.OFFPLAN_SEARCH + (params.size ? `?${params}` : "");
  };
  const projectCard = (project: OffplanProject, units = false) => (
    <article
      className="newbuild-project"
      key={project.id}
      data-project-id={project.id}
    >
      {!units && (
        <Link
          to={R.OFFPLAN_DETAIL(project.id)}
          state={journey}
          tabIndex={-1}
          aria-hidden="true"
        >
          <ProjectImage url={project.coverImage} />
        </Link>
      )}
      <div className="newbuild-project-copy">
        <h3>
          <Link
            to={R.OFFPLAN_DETAIL(project.id) + (units ? "#project-units" : "")}
            state={journey}
          >
            {(language === "ru" ? project.nameRu : project.nameEn) ||
              project.nameEn ||
              project.nameRu}
          </Link>
        </h3>
        {project.district && (
          <p>
            <MapPin size={14} aria-hidden="true" /> {project.district}
          </p>
        )}
        {project.developerName && <p>{project.developerName}</p>}
        {!units && <ProjectStartingPrice price={project.priceFrom} />}
        <Link
          className="rental-text-link"
          to={R.OFFPLAN_DETAIL(project.id) + (units ? "#project-units" : "")}
          state={journey}
        >
          {t(
            units
              ? text(
                  "Объекты и планировки",
                  "Units and floor plans",
                  "ยูนิตและแปลน",
                )
              : text(
                  "Изучить проект",
                  "Explore the project",
                  "ดูรายละเอียดโครงการ",
                ),
          )}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
  const projectState = (content: ReactNode) =>
    projectRead.isLoading ? (
      <p role="status" className="rental-data-state">
        {t(copy.loading)}
      </p>
    ) : projectRead.isError ? (
      <div role="alert" className="rental-data-state">
        <p>{t(copy.error)}</p>
        <Button variant="outline" onClick={() => void projectRead.refetch()}>
          {t(copy.retry)}
        </Button>
      </div>
    ) : projects.length ? (
      content
    ) : (
      <p className="rental-data-state">{t(copy.empty)}</p>
    );
  return (
    <div
      className="rental-landing newbuild-landing ds-frame ds-frame-wide"
      data-testid="newbuild-landing"
    >
      <SEOHead
        title={t(copy.title)}
        description={t(copy.description)}
        url="https://www.myuno.app/property/offplan"
      />
      <section className="rental-hero" aria-labelledby="newbuild-title">
        <div className="rental-hero-copy">
          <h1 id="newbuild-title">
            <span className="rental-eyebrow rental-title-kicker">
              myUNO / {t(copy.eyebrow)}
            </span>
            <span className="rental-title-text">{t(copy.headline)}</span>
          </h1>
          <p className="rental-hero-lead">{t(copy.lead)}</p>
          <div className="rental-hero-actions">
            <Button asChild size="lg">
              <Link to={R.OFFPLAN_SEARCH} state={journey}>
                {t(copy.projects)}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </Button>
            <a className="rental-text-link" href="#newbuild-units">
              {t(copy.units)}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="rental-hero-art">
          <img
            src={hero}
            alt={t(
              text("Побережье Пхукета", "Phuket coastline", "ชายฝั่งภูเก็ต"),
            )}
            width="1672"
            height="1254"
            fetchPriority="high"
          />
          <span>PHUKET / A PLACE FOR YOUR PLANS</span>
        </div>
      </section>
      <nav
        className="rental-chapters newbuild-chapters"
        aria-label={t(text("На этой странице", "On this page", "ในหน้านี้"))}
      >
        {chapters.map(([id, label], i) => (
          <a key={id} href={`#${id}`}>
            <span>0{i + 1}</span>
            {t(label)}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ))}
      </nav>
      <section
        className="rental-section"
        id="newbuild-goals"
        aria-labelledby="newbuild-goals-title"
      >
        <Heading
          id="newbuild-goals-title"
          number="01"
          title={text(
            "Начните со своих планов",
            "Start with your plans",
            "เริ่มจากแผนของคุณ",
          )}
        />
        <div className="newbuild-three">
          {newbuildGoals.map((goal) => (
            <article key={goal.title.en}>
              <h3>{t(goal.title)}</h3>
              <p>{t(goal.copy)}</p>
              <a className="rental-text-link" href="#newbuild-selection">
                {t(text("Перейти к выбору", "Start choosing", "เริ่มเลือก"))}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>
      <section
        className="rental-section newbuild-trust"
        id="newbuild-clearview"
        aria-labelledby="newbuild-clearview-title"
      >
        <Heading
          id="newbuild-clearview-title"
          number="02"
          title={text(
            "Доверие начинается с оснований",
            "Trust starts with evidence",
            "ความเชื่อมั่นเริ่มจากข้อมูล",
          )}
        >
          <p>
            {t(
              text(
                "Различайте проверку компании, оценку проекта и актуальность конкретного предложения.",
                "Distinguish company checks, project assessments and the freshness of a specific offer.",
                "แยกการตรวจสอบบริษัท การประเมินโครงการ และความเป็นปัจจุบันของข้อเสนอเฉพาะ",
              ),
            )}
          </p>
        </Heading>
        <div className="newbuild-three">
          {newbuildTrust.map((item) => (
            <article key={item.title.en}>
              <ShieldCheck size={22} aria-hidden="true" />
              <h3>{t(item.title)}</h3>
              <p>{t(item.copy)}</p>
            </article>
          ))}
        </div>
        <div className="newbuild-method">
          <h3>ClearView</h3>
          <p>
            {t(
              text(
                "Восемь направлений оценки: документы, застройщик, строительство, расположение, финансовые условия, расчёты доходности, продажи и последующая реализация. Отчёт помогает разобраться в основаниях и пробелах данных; рейтинг не является гарантией результата.",
                "Eight assessment areas cover documents, developer, construction, location, financial terms, return assumptions, sales and eventual exit. A report explains evidence and gaps; a rating is not a guarantee of outcomes.",
                "ประเมินแปดด้าน ได้แก่ เอกสาร ผู้พัฒนา การก่อสร้าง ทำเล เงื่อนไขการเงิน สมมติฐานผลตอบแทน การขาย และการขายต่อ รายงานอธิบายข้อมูลและข้อจำกัด เรตติ้งไม่รับประกันผลลัพธ์",
              ),
            )}
          </p>
          <Link
            className="rental-text-link"
            to="/property/clearview"
            state={journey}
          >
            {t(
              text(
                "Как устроен ClearView",
                "How ClearView works",
                "รู้จัก ClearView",
              ),
            )}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section
        className="rental-section"
        id="newbuild-areas"
        aria-labelledby="newbuild-areas-title"
      >
        <Heading
          id="newbuild-areas-title"
          number="03"
          title={text(
            "Сначала выберите место",
            "Find your part of Phuket",
            "ค้นหาทำเลที่เหมาะกับคุณ",
          )}
        >
          <p>
            {t(
              text(
                "Четыре отправные точки для знакомства с островом. Все районы доступны в выборе проектов.",
                "Four starting points for exploring the island. The project catalogue includes all available areas.",
                "สี่ทำเลสำหรับเริ่มทำความรู้จักเกาะ ดูทำเลทั้งหมดได้ในรายการโครงการ",
              ),
            )}
          </p>
        </Heading>
        <div className="rental-area-grid">
          {newbuildAreas.map((area, index) => (
            <article key={area.slug}>
              <span className="rental-area-number">0{index + 1}</span>
              <h3>{t(area.name)}</h3>
              <p>{t(area.copy)}</p>
              <div className="rental-area-links">
                <Link to={`/area/${area.slug}`} state={journey}>
                  {t(text("О районе", "Area guide", "คู่มือย่าน"))}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  to={`${R.OFFPLAN_SEARCH}${districts.find((value) => propertyAreaHref(value) === `/area/${area.slug}`) ? `?district=${encodeURIComponent(districts.find((value) => propertyAreaHref(value) === `/area/${area.slug}`)!)}` : ""}`}
                  state={journey}
                >
                  {t(
                    districts.some(
                      (value) =>
                        propertyAreaHref(value) === `/area/${area.slug}`,
                    )
                      ? text(
                          "Проекты здесь",
                          "Projects here",
                          "โครงการในทำเลนี้",
                        )
                      : text("Все проекты", "All projects", "ทุกโครงการ"),
                  )}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section
        className="rental-section"
        id="newbuild-projects"
        aria-labelledby="newbuild-projects-title"
      >
        <Heading
          id="newbuild-projects-title"
          number="04"
          title={text(
            "Познакомьтесь с проектами",
            "Meet the projects",
            "ทำความรู้จักโครงการ",
          )}
        >
          <p>
            {t(
              text(
                "Несколько проектов из публичного каталога для начала знакомства. Это не рейтинг и не подтверждение наличия объектов.",
                "A few public catalogue projects to start exploring. This is not a ranking or confirmation of unit availability.",
                "โครงการบางส่วนจากรายการสาธารณะเพื่อเริ่มศึกษา ไม่ใช่การจัดอันดับหรือยืนยันยูนิตว่าง",
              ),
            )}
          </p>
        </Heading>
        {projectState(
          <div className="rental-community-grid">
            {projects.map((project) => projectCard(project))}
          </div>,
        )}
        <Link
          className="rental-text-link"
          to={R.OFFPLAN_SEARCH}
          state={journey}
        >
          {t(copy.allProjects)}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section
        className="rental-section newbuild-update"
        id="newbuild-updates"
        aria-labelledby="newbuild-updates-title"
      >
        <Heading
          id="newbuild-updates-title"
          number="05"
          title={text(
            "Старты продаж и новые условия",
            "Launches and changing terms",
            "การเปิดขายและเงื่อนไขใหม่",
          )}
        >
          <p>
            {t(
              text(
                "Для нового старта важны дата события, очередь проекта и источник. Для строительства — дата съёмки и подтверждённый этап. Для предложения — срок действия условий.",
                "A launch needs an event date, project phase and source. Construction updates need dated evidence. An offer needs a validity period.",
                "การเปิดขายต้องมีวันที่ เฟส และแหล่งข้อมูล ความคืบหน้าต้องมีหลักฐานลงวันที่ ข้อเสนอต้องมีระยะเวลาที่ใช้ได้",
              ),
            )}
          </p>
        </Heading>
        <p className="newbuild-notice">
          {t(
            text(
              "В этом разделе пока нет подтверждённой ленты событий. Уточните актуальный старт, ход строительства и условия выбранного проекта перед решением.",
              "A verified event feed is not available here yet. Confirm the selected project’s launch, construction progress and current terms before deciding.",
              "ส่วนนี้ยังไม่มีรายการเหตุการณ์ที่ตรวจสอบแล้ว โปรดยืนยันการเปิดขาย ความคืบหน้า และเงื่อนไขล่าสุดของโครงการก่อนตัดสินใจ",
            ),
          )}
        </p>
        <Link
          className="rental-text-link"
          to={R.OFFPLAN_SEARCH}
          state={journey}
        >
          {t(text("Найти нужный проект", "Find the project", "ค้นหาโครงการ"))}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section
        className="rental-section"
        id="newbuild-developers"
        aria-labelledby="newbuild-developers-title"
      >
        <Heading
          id="newbuild-developers-title"
          number="06"
          title={text(
            "Кто стоит за проектом",
            "Who is behind the project",
            "ใครอยู่เบื้องหลังโครงการ",
          )}
        >
          <p>
            {t(
              text(
                "Начните с публичного профиля компании и связанных проектов. Уточняйте основания и дату каждого существенного утверждения.",
                "Start with the public company profile and linked projects. Ask for evidence and dates behind material claims.",
                "เริ่มจากข้อมูลบริษัทสาธารณะและโครงการที่เกี่ยวข้อง สอบถามหลักฐานและวันที่ของข้อมูลสำคัญ",
              ),
            )}
          </p>
        </Heading>
        {developerRead.isLoading ? (
          <p role="status">{t(copy.loading)}</p>
        ) : developerRead.isError ? (
          <div role="alert">
            <p>{t(copy.error)}</p>
            <Button
              variant="outline"
              onClick={() => void developerRead.refetch()}
            >
              {t(copy.retry)}
            </Button>
          </div>
        ) : developers.length ? (
          <div className="newbuild-developers">
            {developers.map((developer) => (
              <Link
                className="newbuild-developer"
                key={developer.id}
                to={R.DEVELOPER_DETAIL(developer.id)}
                state={journey}
              >
                <Building2 aria-hidden="true" />
                <h3>
                  {(language === "ru" ? developer.nameRu : developer.nameEn) ||
                    developer.nameEn ||
                    developer.nameRu}
                </h3>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <p>{t(copy.empty)}</p>
        )}
        <Link className="rental-text-link" to={R.DEVELOPERS} state={journey}>
          {t(text("Все застройщики", "All developers", "ผู้พัฒนาทั้งหมด"))}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section
        className="rental-section newbuild-selection"
        id="newbuild-selection"
        aria-labelledby="newbuild-selection-title"
      >
        <Heading
          id="newbuild-selection-title"
          number="07"
          title={text(
            "От планов — к выбору",
            "Turn your plans into a shortlist",
            "จากแผนสู่ตัวเลือก",
          )}
        >
          <p>
            {t(
              text(
                "Название проекта, район и бюджет — начните с того, что уже знаете. Начальная цена проекта требует уточнения и не является ценой выбранного объекта.",
                "Start with a project name, area and budget. Project starting prices require confirmation and are not a quote for a selected unit.",
                "เริ่มจากชื่อโครงการ ทำเล และงบประมาณ ราคาเริ่มต้นต้องยืนยันและไม่ใช่ราคาของยูนิตที่เลือก",
              ),
            )}
          </p>
        </Heading>
        <form
          action={R.OFFPLAN_SEARCH}
          className="newbuild-search"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(queryHref(), { state: journey });
          }}
        >
          <label htmlFor="newbuild-project-query">
            {t(text("Проект", "Project", "โครงการ"))}
            <input
              id="newbuild-project-query"
              type="text"
              aria-label={t(text("Проект", "Project", "โครงการ"))}
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(
                text("Название проекта", "Project name", "ชื่อโครงการ"),
              )}
            />
          </label>
          <label>
            {t(text("Район", "Area", "ทำเล"))}
            <select
              name="district"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            >
              <option value="">
                {t(text("Любой район", "Any area", "ทุกทำเล"))}
              </option>
              {districts.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t(text("Бюджет, THB", "Budget, THB", "งบประมาณ THB"))}
            <select
              name="budget"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
            >
              <option value="">
                {t(text("Любой бюджет", "Any budget", "ทุกงบประมาณ"))}
              </option>
              {BUDGET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">
            {t(copy.projects)}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </form>
        <div id="newbuild-units" className="newbuild-units">
          <h3>
            {t(
              text(
                "Объекты и планировки в проекте",
                "Units and floor plans within a project",
                "ยูนิตและแปลนในโครงการ",
              ),
            )}
          </h3>
          <p>
            {t(
              text(
                "Откройте нужный проект сразу на разделе объектов. Планировка описывает тип; наличие и условия конкретного объекта уточняются отдельно.",
                "Open the selected project at its units section. A floor plan describes a type; availability and terms for an actual unit need separate confirmation.",
                "เปิดโครงการตรงส่วนยูนิต แปลนอธิบายประเภทห้อง ส่วนยูนิตว่างและเงื่อนไขจริงต้องยืนยันแยกต่างหาก",
              ),
            )}
          </p>
          {projectState(
            <div className="newbuild-three">
              {projects
                .slice(0, 3)
                .map((project) => projectCard(project, true))}
            </div>,
          )}
        </div>
      </section>
      <section
        className="rental-section"
        id="newbuild-guide"
        aria-labelledby="newbuild-guide-title"
      >
        <Heading
          id="newbuild-guide-title"
          number="08"
          title={text(
            "До решения — полная картина",
            "Before deciding, see the whole picture",
            "เห็นภาพครบก่อนตัดสินใจ",
          )}
        />
        <div className="newbuild-three">
          {newbuildSteps.map((step, index) => (
            <article key={step.title.en}>
              <p className="rental-eyebrow">0{index + 1}</p>
              <h3>{t(step.title)}</h3>
              <p>{t(step.copy)}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="rental-section newbuild-help"
        id="newbuild-help"
        aria-labelledby="newbuild-help-title"
      >
        <Heading
          id="newbuild-help-title"
          number="09"
          title={text(
            "Соберём ваш короткий список",
            "Build your shortlist with us",
            "ให้เราช่วยจัดตัวเลือกของคุณ",
          )}
        >
          <p>
            {t(
              text(
                "Расскажите о районе, бюджете и планах. Поможем сформулировать вопросы к проектам и запросить условия для выбранных объектов.",
                "Tell us your area, budget and plans. We can help frame project questions and request terms for the units you choose.",
                "บอกทำเล งบประมาณ และแผนของคุณ เราช่วยเตรียมคำถามและขอเงื่อนไขของยูนิตที่เลือกได้",
              ),
            )}
          </p>
        </Heading>
        <Button asChild size="lg">
          <Link to="/property/consultation" state={journey}>
            {t(
              text(
                "Обсудить подбор",
                "Discuss your shortlist",
                "ปรึกษาการเลือก",
              ),
            )}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </Button>
      </section>
      <section
        className="rental-section"
        id="newbuild-life"
        aria-labelledby="newbuild-life-title"
      >
        <Heading
          id="newbuild-life-title"
          number="10"
          title={text(
            "Дом — начало жизни на острове",
            "A home is the start of island life",
            "บ้านคือจุดเริ่มต้นของชีวิตบนเกาะ",
          )}
        />
        <div className="newbuild-three">
          {[
            [
              R.PROPERTY_RENT,
              text(
                "Сначала пожить на Пхукете",
                "Try living in Phuket first",
                "ลองใช้ชีวิตในภูเก็ตก่อน",
              ),
            ],
            [
              R.GOAL_SERVICES,
              text(
                "Сервисы для дома и жизни",
                "Services for home and life",
                "บริการสำหรับบ้านและชีวิต",
              ),
            ],
            [
              "/experiences",
              text("Открыть остров", "Explore the island", "สำรวจเกาะ"),
            ],
          ].map(([href, label]) => (
            <Link
              className="newbuild-life-link"
              key={href as string}
              to={href as string}
            >
              {t(label as LangValues)}
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
