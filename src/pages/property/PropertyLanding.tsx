/** Rental discovery at /property/rent. Public projections, existing catalogue and one shell. */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Compass,
  MapPin,
  Wrench,
} from "lucide-react";
import { SEOHead } from "@/components/seo";
import { HomeDiscoverySearch } from "@/components/home/HomeDiscoverySearch";
import { SearchLeadRequest } from "@/components/search/SearchLeadRequest";
import { useLanguage } from "@/contexts/LanguageContext";
import { RentalCommunities } from "@/components/property/RentalCommunities";
import { pickLang, type LangValues } from "@/lib/i18n/pickLang";
import { APP_ROUTES as R } from "@/lib/config/routes";
import {
  rentalAreas,
  rentalDurations,
  rentalChecklist,
} from "@/content/property/rentalLanding";
import { MarketplaceEntry } from "@/components/landing/MarketplaceEntry";
import "@/styles/cinematic-home.css";
import "@/styles/rental-landing.css";

const rentSearch = `${R.PROPERTY_SEARCH}?mode=rent`;
export default function PropertyLanding() {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const chapters = [
    [
      "rental-communities",
      { ru: "Для отпуска", en: "Vacation rentals", th: "ที่พักสำหรับวันหยุด" },
    ],
    ["rental-areas", { ru: "Районы", en: "Areas", th: "ย่าน" }],
    [
      "rental-guide",
      { ru: "Как выбрать", en: "How to choose", th: "วิธีเลือก" },
    ],
    [
      "rental-life",
      { ru: "Жизнь на острове", en: "Island life", th: "ชีวิตบนเกาะ" },
    ],
  ] as const;
  return (
    <div className="rental-landing" data-testid="rental-landing">
      <SEOHead
        url="https://www.myuno.app/property/rent"
        title={t({
          ru: "Аренда на Пхукете: районы, комплексы и жильё",
          en: "Rent in Phuket: areas, communities and homes",
          th: "เช่าที่พักภูเก็ต: ย่าน โครงการ และบ้าน",
        })}
        description={t({
          ru: "Найдите свой район и формат жизни на Пхукете. Изучите комплексы, сравните сроки аренды и переходите к реальным предложениям жилья.",
          en: "Find your area and your way of living in Phuket. Explore communities, compare rental durations and browse real homes.",
          th: "ค้นหาย่านและรูปแบบชีวิตที่เหมาะกับคุณในภูเก็ต ดูโครงการ เปรียบเทียบระยะเวลาเช่า และเลือกที่พัก",
        })}
      />
      <MarketplaceEntry kind="rent" headingId="rental-title" />
      <section
        className="rental-section rental-search-section scroll-mt-24"
        id="rental-search"
        aria-labelledby="rental-search-title"
      >
        <h2 id="rental-search-title" className="sr-only">
          {t({ ru: "Поиск жилья", en: "Find a home", th: "ค้นหาที่พัก" })}
        </h2>
        <HomeDiscoverySearch rentalOnly showGuestsInline catalogue />
        <Link className="rental-text-link" to={rentSearch}>
          {t({
            ru: "Смотреть каталог без дат",
            en: "Browse without dates",
            th: "ดูรายการโดยไม่ระบุวันที่",
          })}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <RentalCommunities />
      <section className="rental-section" id="rental-request">
        <SearchLeadRequest kind="rent" params={new URLSearchParams("mode=rent")} />
      </section>
      <nav
        className="rental-chapters"
        aria-label={t({
          ru: "На этой странице",
          en: "On this page",
          th: "ในหน้านี้",
        })}
      >
        {chapters.map(([id, label], index) => (
          <a href={`#${id}`} key={id}>
            <span className="font-mono">0{index + 1}</span>
            {t(label)}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ))}
      </nav>
      <section
        className="rental-durations"
        aria-label={t({
          ru: "Срок аренды",
          en: "Rental duration",
          th: "ระยะเวลาเช่า",
        })}
      >
        {rentalDurations.map((item) => (
          <Link key={item.tenancy} to={`${rentSearch}&tenancy=${item.tenancy}`}>
            <h2>{t(item.title)}</h2>
            <p>{t(item.copy)}</p>
            <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        ))}
      </section>
      <section
        className="rental-section"
        id="rental-areas"
        aria-labelledby="rental-areas-title"
      >
        <div className="rental-section-heading">
          <div>
            <p className="rental-eyebrow">
              01 /{" "}
              {t({
                ru: "Найдите своё место",
                en: "Find your place",
                th: "ค้นหาทำเลของคุณ",
              })}
            </p>
            <h2 id="rental-areas-title">
              {t({
                ru: "Какой Пхукет — ваш?",
                en: "Which Phuket is yours?",
                th: "ภูเก็ตแบบไหนที่ใช่สำหรับคุณ?",
              })}
            </h2>
            <p>
              {t({
                ru: "Начните не с количества спален, а с того, как вы хотите проводить день. Затем сравните конкретные адреса.",
                en: "Start with how you want to spend your day, then compare actual addresses — not just bedroom counts.",
                th: "เริ่มจากวิธีที่คุณอยากใช้เวลาในแต่ละวัน แล้วเปรียบเทียบทำเลจริง ไม่ใช่เพียงจำนวนห้องนอน",
              })}
            </p>
          </div>
          <Link className="rental-text-link" to={R.AREA_INDEX}>
            {t({
              ru: "Гид по всем районам",
              en: "All area guides",
              th: "คู่มือทุกย่าน",
            })}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="rental-area-grid">
          {rentalAreas.map((area, index) => (
            <article key={area.slug}>
              <p className="rental-area-number font-mono">
                0{index + 1} / PHUKET
              </p>
              <h3>{t(area.name)}</h3>
              <p className="rental-area-note">{t(area.note)}</p>
              <p>{t(area.copy)}</p>
              <div className="rental-area-links">
                <Link to={R.AREA_DETAIL(area.slug)}>
                  {t({ ru: "О районе", en: "Area guide", th: "คู่มือย่าน" })}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link to={`${rentSearch}&district=${area.district}`}>
                  {t({
                    ru: "Жильё здесь",
                    en: "Homes here",
                    th: "ที่พักในย่านนี้",
                  })}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section
        className="rental-section"
        id="rental-guide"
        aria-labelledby="rental-guide-title"
      >
        <div className="rental-section-heading">
          <div>
            <p className="rental-eyebrow">
              03 /{" "}
              {t({
                ru: "До бронирования",
                en: "Before you book",
                th: "ก่อนจอง",
              })}
            </p>
            <h2 id="rental-guide-title">
              {t({
                ru: "Дом должен подходить вашей жизни",
                en: "A home should fit your life",
                th: "ที่พักควรเหมาะกับชีวิตของคุณ",
              })}
            </h2>
          </div>
        </div>
        <div className="rental-guide-grid">
          {rentalChecklist.map((item, i) => (
            <article key={i}>
              <span className="font-mono">0{i + 1}</span>
              <h3>{t(item.title)}</h3>
              <p>{t(item.copy)}</p>
            </article>
          ))}
        </div>
        <Link
          className="rental-text-link"
          to={`${R.PROPERTY_CONSULTATION}?mode=rent`}
        >
          {t({
            ru: "Нужна помощь с выбором?",
            en: "Need help choosing?",
            th: "ต้องการความช่วยเหลือในการเลือก?",
          })}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
      <section
        className="rental-section rental-life"
        id="rental-life"
        aria-labelledby="rental-life-title"
      >
        <div className="rental-section-heading">
          <div>
            <p className="rental-eyebrow">
              04 /{" "}
              {t({
                ru: "Больше, чем адрес",
                en: "More than an address",
                th: "มากกว่าที่อยู่",
              })}
            </p>
            <h2 id="rental-life-title">
              {t({
                ru: "Дом найден. Остров ждёт.",
                en: "A place to stay. An island to discover.",
                th: "มีที่พักแล้ว เกาะยังรอให้ค้นพบ",
              })}
            </h2>
            <p>
              {t({
                ru: "Спланируйте отдых и повседневные дела в той же экосистеме myUNO.",
                en: "Plan your island days and everyday needs in the same myUNO ecosystem.",
                th: "วางแผนวันพักผ่อนและความต้องการประจำวันใน myUNO",
              })}
            </p>
          </div>
        </div>
        <div className="rental-life-grid">
          {[
            {
              to: R.EXPERIENCES,
              Icon: Compass,
              title: { ru: "Впечатления", en: "Experiences", th: "ประสบการณ์" },
              copy: {
                ru: "Морские прогулки, экскурсии и идеи для свободного дня.",
                en: "Sea trips, excursions and ideas for a day off.",
                th: "ทริปทะเล ทัวร์ และไอเดียสำหรับวันว่าง",
              },
            },
            {
              to: R.GOAL_SERVICES,
              Icon: Wrench,
              title: {
                ru: "Сервисы для жизни",
                en: "Services for island life",
                th: "บริการสำหรับชีวิตบนเกาะ",
              },
              copy: {
                ru: "Найдите помощь для дома, поездок и ежедневных задач.",
                en: "Find help with your home, travel and everyday tasks.",
                th: "ค้นหาความช่วยเหลือเรื่องบ้าน การเดินทาง และงานประจำวัน",
              },
            },
          ].map(({ to, Icon, title, copy }) => (
            <Link to={to} key={to}>
              <Icon aria-hidden="true" />
              <h3>{t(title)}</h3>
              <p>{t(copy)}</p>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
      <footer className="rental-footer">
        <MapPin size={18} aria-hidden="true" />
        <span>myUNO · Phuket</span>
        <Link to={R.PROPERTY_SEARCH}>
          {t({
            ru: "Аренда и покупка: весь каталог",
            en: "Rent and buy: the full catalogue",
            th: "เช่าและซื้อ: รายการทั้งหมด",
          })}
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
