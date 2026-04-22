import React, { useState } from 'react';
import { TrendingUp, Home, Building2, Wrench, ArrowRight, DollarSign, Users, Repeat, Target, Zap, Shield, Eye, ChevronRight, Layers, Activity } from 'lucide-react';

export default function MonetizationModel() {
  const [activeEngine, setActiveEngine] = useState('stays');
  const [activeTab, setActiveTab] = useState('architecture');

  const engines = {
    stays: {
      id: 'stays',
      name: 'myUNO Stays',
      tagline: 'Airbnb + Local Presence',
      color: '#FF6B35',
      gradient: 'from-orange-500 to-red-500',
      icon: Home,
      role: 'Booking marketplace with operational edge',
      primary: 'Commissions on nights booked',
      ticket: '฿3,500 – ฿45,000 / night',
      take: '15–22%',
      mrr_logic: 'Volume × ADR × take rate',
      unit: 'per booking',
      streams: [
        { name: 'Guest service fee', rate: '8–12%', who: 'Guest pays', note: 'Shown at checkout, standard OTA practice' },
        { name: 'Host commission', rate: '10–15%', who: 'Owner pays', note: 'Net of OTA fees if cross-listed' },
        { name: 'Cleaning markup', rate: '฿500–1,200', who: 'Guest pays', note: 'Direct margin on in-house cleaning team' },
        { name: 'Damage waiver', rate: '฿299/stay', who: 'Guest pays', note: '70%+ margin, insurance-backed' },
        { name: 'Early check-in / late check-out', rate: '฿500–1,500', who: 'Guest pays', note: 'Pure margin when operationally feasible' },
        { name: 'In-stay upsells', rate: '10–25%', who: 'Guest pays', note: 'Tours, transfers, chef, spa — via BloomPhuket, MuayThaiFinder, CarRent' },
      ],
      moat: 'Estate owns 35 properties + manages 122 → Day-1 inventory. No Airbnb has a local ops team with keys.',
      kpi: ['Bookings/month', 'Take rate %', 'Upsell attach rate', 'Repeat guest %'],
    },
    invest: {
      id: 'invest',
      name: 'myUNO Invest',
      tagline: 'Tenant → Buyer Conversion Engine',
      color: '#1E40AF',
      gradient: 'from-blue-600 to-indigo-700',
      icon: Building2,
      role: 'Feed Ignatev Capital pipeline from within the ecosystem',
      primary: 'Transaction commissions on sales',
      ticket: '฿8M – ฿350M / deal',
      take: '3–5% buy-side + 5–10% off-plan',
      mrr_logic: 'Deals × avg ticket × commission',
      unit: 'per closed deal',
      streams: [
        { name: 'Resale buy-side commission', rate: '3%', who: 'Buyer pays', note: 'Standard Phuket practice, negotiable on HNW deals' },
        { name: 'Off-plan developer commission', rate: '5–10%', who: 'Developer pays', note: 'OffPlan Watch feeds qualified leads' },
        { name: 'Ignatev Capital mandate', rate: '1–2% + carry', who: 'Investor pays', note: '$7M+ tickets, strategic only' },
        { name: 'Lead resale to agencies', rate: '฿5k–25k/lead', who: 'Agency pays', note: 'Cold leads Pavel does not close personally' },
        { name: 'DueDiligence AI reports', rate: '฿1,500–3,000', who: 'Buyer pays', note: 'High-margin pre-purchase upsell' },
        { name: 'Mortgage / structuring referral', rate: '0.5–1.5%', who: 'Partner bank pays', note: 'FinanceGuide integration' },
      ],
      moat: 'Tenants staying 6+ months = pre-qualified buyer funnel. Nobody else has "lived in the unit for 3 months" data before offering it for sale.',
      kpi: ['Tenant-to-buyer conversion %', 'Pipeline value', 'Avg ticket size', 'Days to close'],
    },
    pro: {
      id: 'pro',
      name: 'myUNO Pro',
      tagline: 'CBRE-style Services Hub',
      color: '#059669',
      gradient: 'from-emerald-600 to-teal-700',
      icon: Wrench,
      role: 'B2B services for owners, developers, agencies',
      primary: 'Recurring SaaS + transaction fees',
      ticket: '฿499 – ฿9,999 / month',
      take: 'Fixed SaaS + 8–15% on managed works',
      mrr_logic: 'Accounts × avg seat price + usage',
      unit: 'per property / per account',
      streams: [
        { name: 'Full property management', rate: '15–20% of gross rent', who: 'Owner pays', note: 'Ignatev Estate core — highest LTV' },
        { name: 'StaySync channel manager', rate: '฿499–1,499/mo/property', who: 'PM firm pays', note: 'SaaS, B2B land-and-expand' },
        { name: 'PMDashboard', rate: '฿999–2,499/mo', who: 'PM firm pays', note: 'Per-seat, replaces spreadsheets' },
        { name: 'ComplianceTrack (TAT/STR license)', rate: '฿499–999/mo/property', who: 'Operator pays', note: 'Regulatory moat, sticky' },
        { name: 'ContractorHub (works coordination)', rate: '8% of job value', who: 'Owner pays', note: 'Marketplace take on renovation/maintenance' },
        { name: 'White-label for agencies', rate: '฿25k–75k/mo', who: 'Agency pays', note: 'Enterprise — rebrand the full stack' },
      ],
      moat: 'Owners hate managing operators. Operators hate fragmented tools. Agencies need white-label tech. All three converge here.',
      kpi: ['NRR (net revenue retention)', 'Properties under contract', 'Avg $/property', 'Logo churn %'],
    },
  };

  const flywheel = [
    { from: 'Stays', to: 'Invest', logic: 'Long-stay tenant → buyer funnel', tag: 'Live here. Love it. Own it.' },
    { from: 'Invest', to: 'Pro', logic: 'New owner auto-enrolls in PM', tag: 'We sold it. We manage it.' },
    { from: 'Pro', to: 'Stays', logic: 'Managed units flow into Stays inventory', tag: 'Managed = Rentable' },
    { from: 'All', to: 'myUNO platform', logic: '60 apps = stickiness + upsell surface', tag: 'Every service = another take' },
  ];

  const screens = [
    {
      role: 'Guest (B2C)',
      surface: 'bymyuno.com/stays',
      keyScreens: ['Search & filter', 'Property detail with upsell rail', 'Checkout with add-ons', 'In-stay concierge chat', 'Post-stay "buy this" CTA'],
      revenue: 'Booking commission + upsells',
    },
    {
      role: 'Tenant (long-stay)',
      surface: 'app.bymyuno.com',
      keyScreens: ['Lease management', 'Payment portal', 'Service marketplace', 'Buy-this-unit prompt (month 3+)', 'DepositSafe integration'],
      revenue: 'Services commission + sale conversion',
    },
    {
      role: 'Buyer / Investor',
      surface: 'invest.bymyuno.com',
      keyScreens: ['Deal pipeline', 'DueDiligence AI report', 'FloodScore + MarketBrief', 'Mandate onboarding (Ignatev Capital)', 'Closing tracker'],
      revenue: 'Buy-side + structuring fees',
    },
    {
      role: 'Owner (passive)',
      surface: 'owner.bymyuno.com',
      keyScreens: ['Revenue dashboard', 'Occupancy calendar', 'Statements & payouts', 'Works approval queue', 'List unit for sale CTA'],
      revenue: 'PM fee + sale commission',
    },
    {
      role: 'PM Firm / Agency (B2B)',
      surface: 'pro.bymyuno.com',
      keyScreens: ['Multi-property dashboard', 'Channel manager (StaySync)', 'Compliance tracker', 'Contractor marketplace', 'White-label admin'],
      revenue: 'SaaS MRR + transaction fees',
    },
    {
      role: 'Developer (off-plan)',
      surface: 'developers.bymyuno.com',
      keyScreens: ['Project listing', 'Construction progress uploads', 'Lead inbox', 'Commission statements', 'Co-branded content'],
      revenue: 'Off-plan commission (5–10%)',
    },
  ];

  const economics = {
    stays: { y1: 4.2, y2: 14.8, y3: 38, margin: '42%' },
    invest: { y1: 8.5, y2: 28, y3: 72, margin: '68%' },
    pro: { y1: 2.1, y2: 9.4, y3: 26, margin: '55%' },
  };

  const active = engines[activeEngine];
  const ActiveIcon = active.icon;

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div className="border-b-2 border-stone-900 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-baseline justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs tracking-[0.3em] text-stone-500 uppercase mb-2">Monetization Architecture · v1.0</div>
              <h1 className="text-5xl font-light text-stone-900 tracking-tight">
                by <span className="italic font-normal">myUNO</span> <span className="text-stone-400">×</span> Ignatev Group
              </h1>
              <div className="mt-3 text-stone-600 text-lg max-w-2xl leading-relaxed">
                Three revenue engines. One flywheel. A commission-first model where every guest, tenant, buyer, and owner becomes the entry point for the next transaction.
              </div>
            </div>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-3xl font-light text-stone-900">฿124M</div>
                <div className="text-xs uppercase tracking-widest text-stone-500">Y3 target GMV</div>
              </div>
              <div className="w-px bg-stone-300"></div>
              <div>
                <div className="text-3xl font-light text-stone-900">฿14.8M</div>
                <div className="text-xs uppercase tracking-widest text-stone-500">Y3 target net revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-stone-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 flex gap-8">
          {[
            { id: 'architecture', label: 'Revenue Architecture' },
            { id: 'flywheel', label: 'Flywheel Logic' },
            { id: 'screens', label: 'Product Screens' },
            { id: 'economics', label: 'Unit Economics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm tracking-wider uppercase transition-all border-b-2 ${
                activeTab === tab.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
              style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.1em' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'architecture' && (
          <>
            {/* Engine selector */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              {Object.values(engines).map(eng => {
                const Icon = eng.icon;
                const isActive = activeEngine === eng.id;
                return (
                  <button
                    key={eng.id}
                    onClick={() => setActiveEngine(eng.id)}
                    className={`text-left p-6 border-2 transition-all ${
                      isActive ? 'border-stone-900 bg-white shadow-lg' : 'border-stone-200 bg-white/50 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 flex items-center justify-center text-white"
                        style={{ backgroundColor: eng.color }}
                      >
                        <Icon size={22} strokeWidth={1.5} />
                      </div>
                      {isActive && <div className="text-xs tracking-widest text-stone-500 uppercase mt-2">Active</div>}
                    </div>
                    <div className="text-2xl font-light text-stone-900 mb-1">{eng.name}</div>
                    <div className="text-xs tracking-wider uppercase text-stone-500 mb-3" style={{ fontFamily: 'system-ui' }}>{eng.tagline}</div>
                    <div className="text-sm text-stone-600 leading-relaxed">{eng.role}</div>
                  </button>
                );
              })}
            </div>

            {/* Active engine detail */}
            <div className="bg-white border-2 border-stone-900">
              <div
                className="px-8 py-6 flex items-center justify-between"
                style={{ backgroundColor: active.color, color: 'white' }}
              >
                <div>
                  <div className="text-xs tracking-[0.3em] uppercase opacity-70 mb-1">Engine 0{Object.keys(engines).indexOf(activeEngine) + 1}</div>
                  <div className="text-3xl font-light">{active.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs tracking-widest uppercase opacity-70">Primary take</div>
                  <div className="text-3xl font-light">{active.take}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 border-b border-stone-200">
                {[
                  { label: 'Primary revenue', value: active.primary },
                  { label: 'Ticket range', value: active.ticket },
                  { label: 'Unit of sale', value: active.unit },
                  { label: 'MRR formula', value: active.mrr_logic },
                ].map((item, i) => (
                  <div key={i} className={`p-6 ${i < 3 ? 'border-r border-stone-200' : ''}`}>
                    <div className="text-xs tracking-widest uppercase text-stone-500 mb-2" style={{ fontFamily: 'system-ui' }}>{item.label}</div>
                    <div className="text-stone-900">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="p-8">
                <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-6" style={{ fontFamily: 'system-ui' }}>Revenue Streams</div>
                <div className="space-y-3">
                  {active.streams.map((s, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 py-4 border-b border-stone-100 items-start">
                      <div className="col-span-1 text-stone-400 text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {String(i + 1).padStart(2, '0')}
                      </div>
                      <div className="col-span-4">
                        <div className="text-stone-900 font-medium">{s.name}</div>
                        <div className="text-xs text-stone-500 mt-1" style={{ fontFamily: 'system-ui' }}>{s.who}</div>
                      </div>
                      <div className="col-span-2">
                        <div
                          className="inline-block px-3 py-1 text-sm"
                          style={{ backgroundColor: active.color + '15', color: active.color, fontFamily: 'JetBrains Mono, monospace' }}
                        >
                          {s.rate}
                        </div>
                      </div>
                      <div className="col-span-5 text-sm text-stone-600 leading-relaxed">{s.note}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 grid grid-cols-2 gap-8">
                  <div className="p-6 border-l-4" style={{ borderColor: active.color, backgroundColor: active.color + '08' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield size={16} style={{ color: active.color }} />
                      <div className="text-xs tracking-[0.3em] uppercase text-stone-700" style={{ fontFamily: 'system-ui' }}>Defensible Moat</div>
                    </div>
                    <div className="text-stone-800 leading-relaxed">{active.moat}</div>
                  </div>
                  <div className="p-6 border-l-4 border-stone-900 bg-stone-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={16} className="text-stone-900" />
                      <div className="text-xs tracking-[0.3em] uppercase text-stone-700" style={{ fontFamily: 'system-ui' }}>KPIs to Track</div>
                    </div>
                    <ul className="space-y-2">
                      {active.kpi.map((k, i) => (
                        <li key={i} className="text-stone-800 flex items-start gap-2">
                          <ChevronRight size={14} className="mt-1 text-stone-400" />
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'flywheel' && (
          <div>
            <div className="mb-8">
              <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-2" style={{ fontFamily: 'system-ui' }}>The Compounding Effect</div>
              <h2 className="text-3xl font-light text-stone-900 max-w-3xl leading-tight">
                No single engine wins alone. Every transaction in one engine becomes the acquisition cost for another.
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-10">
              {Object.values(engines).map((eng, i) => {
                const Icon = eng.icon;
                return (
                  <div key={eng.id} className="bg-white border-2 border-stone-900 p-6 relative">
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-stone-900 text-white flex items-center justify-center text-sm" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <Icon size={20} style={{ color: eng.color }} />
                      <div className="font-light text-xl">{eng.name}</div>
                    </div>
                    <div className="text-sm text-stone-600 leading-relaxed mb-4">{eng.tagline}</div>
                    <div className="pt-4 border-t border-stone-200">
                      <div className="text-xs tracking-widest uppercase text-stone-500 mb-1" style={{ fontFamily: 'system-ui' }}>Feeds into</div>
                      <div className="text-stone-900">
                        {i === 0 && 'Invest (tenant → buyer)'}
                        {i === 1 && 'Pro (new owner → PM)'}
                        {i === 2 && 'Stays (managed → listed)'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border-2 border-stone-900 p-8">
              <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-6" style={{ fontFamily: 'system-ui' }}>Transition Logic</div>
              <div className="space-y-4">
                {flywheel.map((f, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 items-center py-4 border-b border-stone-100">
                    <div className="col-span-2">
                      <div className="text-xs tracking-widest text-stone-500 uppercase mb-1" style={{ fontFamily: 'system-ui' }}>From</div>
                      <div className="text-stone-900 font-medium">{f.from}</div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <ArrowRight className="text-stone-400" />
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs tracking-widest text-stone-500 uppercase mb-1" style={{ fontFamily: 'system-ui' }}>To</div>
                      <div className="text-stone-900 font-medium">{f.to}</div>
                    </div>
                    <div className="col-span-4 text-stone-700">{f.logic}</div>
                    <div className="col-span-3 italic text-stone-500 text-sm text-right">"{f.tag}"</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-stone-900 text-white">
                <div className="flex items-start gap-4">
                  <Repeat size={24} className="mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-xs tracking-[0.3em] uppercase opacity-60 mb-2" style={{ fontFamily: 'system-ui' }}>The compounding insight</div>
                    <div className="text-xl font-light leading-relaxed">
                      A guest booking a ฿12,000/night villa today is also, three months from now, a potential long-stay tenant; six months from now, a buyer of that same villa; and indefinitely, a referral source for the next guest. <span className="italic">One CAC, four revenue moments.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'screens' && (
          <div>
            <div className="mb-8">
              <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-2" style={{ fontFamily: 'system-ui' }}>Product Surfaces</div>
              <h2 className="text-3xl font-light text-stone-900 max-w-3xl leading-tight">
                Six audiences. Six dedicated surfaces. Each one is a revenue capture point with its own domain, design, and funnel.
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {screens.map((s, i) => (
                <div key={i} className="bg-white border-2 border-stone-200 hover:border-stone-900 transition-all p-6 group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-1" style={{ fontFamily: 'system-ui' }}>Surface 0{i + 1}</div>
                      <div className="text-2xl font-light text-stone-900">{s.role}</div>
                    </div>
                    <Eye size={18} className="text-stone-300 group-hover:text-stone-900 transition-colors" />
                  </div>
                  <div className="text-sm text-stone-500 mb-4 pb-4 border-b border-stone-100" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {s.surface}
                  </div>
                  <div className="mb-4">
                    <div className="text-xs tracking-widest uppercase text-stone-400 mb-2" style={{ fontFamily: 'system-ui' }}>Key Screens</div>
                    <ul className="space-y-1.5">
                      {s.keyScreens.map((k, j) => (
                        <li key={j} className="text-sm text-stone-700 flex items-start gap-2">
                          <span className="text-stone-300 mt-0.5">·</span>
                          <span>{k}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div className="text-xs tracking-widest uppercase text-stone-400" style={{ fontFamily: 'system-ui' }}>Revenue capture</div>
                    <div className="text-sm text-stone-900 font-medium">{s.revenue}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-8 bg-stone-900 text-white">
              <div className="text-xs tracking-[0.3em] uppercase opacity-60 mb-4" style={{ fontFamily: 'system-ui' }}>Design Principle</div>
              <div className="text-2xl font-light leading-relaxed max-w-4xl">
                Each surface shows the audience their data, their money, their decisions — and <span className="italic">exactly one contextual CTA</span> that pushes them into the next engine. No generic dashboards. No menu-driven navigation. One obvious next move per screen.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'economics' && (
          <div>
            <div className="mb-8">
              <div className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-2" style={{ fontFamily: 'system-ui' }}>Three-Year Projection</div>
              <h2 className="text-3xl font-light text-stone-900 max-w-3xl leading-tight">
                Modeled conservatively on current inventory and pipeline. All figures in ฿ millions of net revenue.
              </h2>
            </div>

            <div className="bg-white border-2 border-stone-900 overflow-hidden">
              <div className="grid grid-cols-5 bg-stone-900 text-white">
                <div className="p-4 text-xs tracking-widest uppercase" style={{ fontFamily: 'system-ui' }}>Engine</div>
                <div className="p-4 text-xs tracking-widest uppercase text-center" style={{ fontFamily: 'system-ui' }}>Year 1</div>
                <div className="p-4 text-xs tracking-widest uppercase text-center" style={{ fontFamily: 'system-ui' }}>Year 2</div>
                <div className="p-4 text-xs tracking-widest uppercase text-center" style={{ fontFamily: 'system-ui' }}>Year 3</div>
                <div className="p-4 text-xs tracking-widest uppercase text-center" style={{ fontFamily: 'system-ui' }}>Gross margin</div>
              </div>
              {Object.entries(economics).map(([key, val]) => {
                const eng = engines[key];
                const Icon = eng.icon;
                return (
                  <div key={key} className="grid grid-cols-5 border-b border-stone-100 items-center">
                    <div className="p-4 flex items-center gap-3">
                      <Icon size={18} style={{ color: eng.color }} />
                      <span className="text-stone-900">{eng.name}</span>
                    </div>
                    <div className="p-4 text-center text-stone-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿{val.y1}M</div>
                    <div className="p-4 text-center text-stone-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿{val.y2}M</div>
                    <div className="p-4 text-center text-stone-900 text-lg" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿{val.y3}M</div>
                    <div className="p-4 text-center text-stone-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{val.margin}</div>
                  </div>
                );
              })}
              <div className="grid grid-cols-5 bg-stone-100 items-center border-t-2 border-stone-900">
                <div className="p-4 text-stone-900 font-medium flex items-center gap-2">
                  <TrendingUp size={18} />
                  Total net revenue
                </div>
                <div className="p-4 text-center text-stone-900 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿14.8M</div>
                <div className="p-4 text-center text-stone-900 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿52.2M</div>
                <div className="p-4 text-center text-stone-900 text-xl font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿136M</div>
                <div className="p-4 text-center text-stone-900 font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>~55% blended</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-10">
              <div className="bg-white border-l-4 border-stone-900 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} />
                  <div className="text-xs tracking-[0.3em] uppercase text-stone-700" style={{ fontFamily: 'system-ui' }}>Year 1 Priority</div>
                </div>
                <div className="text-stone-800 leading-relaxed">
                  Capture Stays volume with the 35 owned + 122 managed properties. Prove take rate and upsell attach before scaling inventory.
                </div>
              </div>
              <div className="bg-white border-l-4 border-stone-900 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={16} />
                  <div className="text-xs tracking-[0.3em] uppercase text-stone-700" style={{ fontFamily: 'system-ui' }}>Year 2 Priority</div>
                </div>
                <div className="text-stone-800 leading-relaxed">
                  Convert Stays tenants into Invest pipeline. First measurable tenant-to-buyer conversion data unlocks developer partnerships.
                </div>
              </div>
              <div className="bg-white border-l-4 border-stone-900 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={16} />
                  <div className="text-xs tracking-[0.3em] uppercase text-stone-700" style={{ fontFamily: 'system-ui' }}>Year 3 Priority</div>
                </div>
                <div className="text-stone-800 leading-relaxed">
                  Scale Pro to agencies and PM firms. White-label becomes the expansion vector into Bali, Koh Samui, Pattaya, and Da Nang.
                </div>
              </div>
            </div>

            <div className="mt-10 p-8 bg-stone-900 text-white">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-xs tracking-[0.3em] uppercase opacity-60 mb-2" style={{ fontFamily: 'system-ui' }}>Key assumption</div>
                  <div className="text-lg font-light leading-relaxed">Tenant-to-buyer conversion of 3% (benchmark: residential sales industry averages 1.5–2% from cold leads).</div>
                </div>
                <div>
                  <div className="text-xs tracking-[0.3em] uppercase opacity-60 mb-2" style={{ fontFamily: 'system-ui' }}>Risk</div>
                  <div className="text-lg font-light leading-relaxed">Pro engine is lowest gross Y3 but highest NRR. Under-indexing here loses the defensibility story for a raise.</div>
                </div>
                <div>
                  <div className="text-xs tracking-[0.3em] uppercase opacity-60 mb-2" style={{ fontFamily: 'system-ui' }}>Unlock</div>
                  <div className="text-lg font-light leading-relaxed">Every 10 new units into Pro = ฿180–240k/mo recurring + ~12 rentable listings into Stays within 30 days.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-stone-900 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between text-xs tracking-widest uppercase text-stone-500" style={{ fontFamily: 'system-ui' }}>
          <div>by myUNO · Ignatev Group · Monetization v1.0</div>
          <div className="flex items-center gap-2">
            <Activity size={12} />
            <span>Pavel Ignatev · Phuket 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
