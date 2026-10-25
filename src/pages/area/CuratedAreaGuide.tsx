import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page/PageShell';
import { AreaPhoto } from '@/components/home/HomeAreaGallery';
import { useLanguage } from '@/contexts/LanguageContext';
import { areaName, areaSearchHref, findAreaGuide, type AreaGuide } from '@/content/areas/areaRegistry';
import { uniqueById, useAreaInventory, useAreaPreviews } from '@/hooks/useAreaInventory';
import { surfaceFromOffplanProject, surfaceFromProperty, surfaceFromResale } from '@/lib/real-estate/listingViewModel';

export default function CuratedAreaGuide({ area }: { area: AreaGuide }) {
  const { language } = useLanguage();
  const { search } = useLocation();
  const ru = language === 'ru';
  const copy = area.content[ru ? 'ru' : 'en'];
  const name = areaName(area, language);
  const inventory = useAreaInventory(area);
  const preview = useAreaPreviews(area);
  const sections = [
    { key: 'rentals', title: ru ? 'Аренда: объекты' : 'Rental properties', query: inventory.rentals, preview: preview.rentals, surfaces: uniqueById(preview.rentals.data ?? []).map(row => surfaceFromProperty(row, 'rent')) },
    { key: 'projects', title: ru ? 'Новостройки: проекты' : 'New-build projects', query: inventory.projects, preview: preview.projects, surfaces: uniqueById(preview.projects.data ?? []).slice(0, 6).map(surfaceFromOffplanProject) },
    { key: 'resale', title: ru ? 'Вторичка: объекты' : 'Resale properties', query: inventory.resale, preview: preview.resale, surfaces: uniqueById(preview.resale.data ?? []).slice(0, 6).map(surfaceFromResale) },
  ] as const;
  return <AppLayout><Helmet>
    <title>{name} — {ru ? 'О районе' : 'Area guide'} · myUNO</title>
    <meta name="description" content={copy.intro} />
    <link rel="canonical" href={`https://myuno.app/area/${area.slug}`} />
  </Helmet><PageShell width="wide">
    <nav className="mb-5 text-sm" aria-label={ru ? 'Навигация' : 'Navigation'}><Link className="underline" to="/">{ru ? 'Главная' : 'Home'}</Link> / <Link className="underline" to="/area">{ru ? 'Районы' : 'Areas'}</Link> / {name}</nav>
    <header className="mb-6"><p className="mb-2 text-sm text-muted-foreground">{ru ? 'Знакомство с локацией' : 'Get to know the area'}</p><h1 className="text-3xl font-semibold">{name}</h1><p className="mt-4">{copy.intro}</p>
      {language === 'th' && <p lang="en" className="mt-2 text-sm">English guide · Thai translation pending review</p>}
    </header>
    <div className="mb-8"><AreaPhoto key={area.key} area={area} eager /></div>
    {area.relationship && <p className="mb-6 text-sm">{ru ? 'Связанная локация' : 'Related area'}: <Link className="underline" to={`/area/${area.relationship.key}`}>{areaName(findAreaGuide(area.relationship.key)!, language)}</Link>. {ru ? 'Предложения показаны по собственной локации каталога; соседние локации не суммируются.' : 'Listings use their own catalog location; related areas are not added together.'}</p>}
    <section aria-labelledby="area-about" className="mb-10"><h2 id="area-about" className="mb-4 text-2xl font-semibold">{ru ? 'О районе' : 'About the area'}</h2>
      <div className="grid gap-5 sm:grid-cols-2">{[
        [ru ? 'Кому подойдёт' : 'Who it suits', copy.fit],
        [ru ? 'Что учесть' : 'What to consider', copy.tradeoffs],
        [ru ? 'Пляж' : 'Beach', copy.beach],
        [ru ? 'Повседневная инфраструктура' : 'Everyday essentials', copy.daily],
        [ru ? 'Интересные места' : 'Places to explore', copy.places],
      ].map(([title, text]) => <div key={title} className="border border-border p-4"><h3 className="mb-2 font-medium">{title}</h3><p className="text-sm leading-relaxed">{text}</p></div>)}</div>
    </section>
    {sections.map(section => <section key={section.key} className="mb-10" aria-label={section.title}>
      <h2 className="mb-4 text-xl font-semibold">{section.title}{section.query.isSuccess ? ` · ${section.query.data}` : ''}</h2>
      {section.query.isPending ? <p role="status">{ru ? 'Проверяем опубликованные предложения…' : 'Checking published listings…'}</p> : section.query.isError ? <div role="alert"><p>{ru ? 'Не удалось проверить предложения.' : 'Could not check listings.'}</p><button className="underline" onClick={() => void section.query.refetch()}>{ru ? 'Повторить' : 'Try again'}</button></div> : !section.query.data ? <p className="text-sm text-muted-foreground">{ru ? 'Опубликованных предложений пока нет.' : 'No published listings yet.'}</p> : <>
        <Link className="mb-4 inline-block underline" to={areaSearchHref(area, section.key, search)}>{ru ? 'Открыть поиск →' : 'Open search →'}</Link>
        {section.preview.isPending ? <p role="status">{ru ? 'Загружаем предложения…' : 'Loading listings…'}</p> : section.preview.isError ? <div role="alert"><p>{ru ? 'Не удалось загрузить карточки.' : 'Could not load preview.'}</p><button className="underline" onClick={() => void section.preview.refetch()}>{ru ? 'Повторить' : 'Try again'}</button></div> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{section.surfaces.map(surface => <li key={surface.id} className="min-w-0 border border-border"><Link className="block p-4 hover:bg-muted" to={surface.href}>
          {surface.coverImageUrl && <img className="mb-3 aspect-[4/3] w-full object-cover" src={surface.coverImageUrl} width={400} height={300} loading="lazy" alt={ru ? surface.titleRu : surface.titleEn} />}
          <h3 className="font-medium">{ru ? surface.titleRu : surface.titleEn}</h3><p className="text-sm text-muted-foreground">{surface.locationLine}</p>
        </Link></li>)}</ul>}
      </>}
    </section>)}
    <details className="mb-8 text-sm"><summary className="cursor-pointer">{ru ? 'Источники и дата проверки' : 'Sources and review date'}</summary><ul className="mt-3 space-y-2">{area.sources.map(source => <li key={source.url}><a className="break-all underline" href={source.url}>{new URL(source.url).hostname}</a> · {source.checkedAt}</li>)}</ul></details>
  </PageShell></AppLayout>;
}
