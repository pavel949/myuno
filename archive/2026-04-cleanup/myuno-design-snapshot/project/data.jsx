/* myUNO Home — multi-role control center
   People wear multiple hats in Phuket: a resident who owns a villa and hosts friends
   is three roles at once. The home blends signals from all active roles with the
   primary role given top weight.
*/

const { useState, useEffect, useMemo } = React;

// ──────────────────────────────────────────────────────────────
// Tweak plumbing
// ──────────────────────────────────────────────────────────────
const DEFAULTS = JSON.parse(
  document.getElementById('tweak-defaults').textContent.replace(/\/\*EDITMODE-(BEGIN|END)\*\//g, '')
);

function useTweaks() {
  const [tweaks, setTweaks] = useState(DEFAULTS);
  const [editOn, setEditOn] = useState(false);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditOn(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditOn(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const update = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  };
  return { tweaks, editOn, update };
}

// ──────────────────────────────────────────────────────────────
// Roles — user can have many; order matters
// ──────────────────────────────────────────────────────────────
const ROLES = {
  tourist:   { short: 'Tourist',   glyph: 'T', full: 'Visiting Phuket',        color: '#4E7BFF' },
  resident:  { short: 'Resident',  glyph: 'R', full: 'Living in Phuket',       color: '#00D68F' },
  owner:     { short: 'Owner',     glyph: 'O', full: 'Property owner',         color: '#16BDCA' },
  agent:     { short: 'Agent',     glyph: 'A', full: 'Real-estate agent',      color: '#A78BFA' },
  developer: { short: 'Developer', glyph: 'D', full: 'Property developer',     color: '#EF4444' },
  provider:  { short: 'Provider',  glyph: 'P', full: 'Local business',         color: '#F59E0B' },
};
const ROLE_ORDER = ['tourist','resident','owner','agent','developer','provider'];

const ACCENTS = {
  mint:   { color: '#00D68F', label: 'Mint' },
  navy:   { color: '#4E7BFF', label: 'Navy' },
  amber:  { color: '#F59E0B', label: 'Amber' },
  violet: { color: '#A78BFA', label: 'Violet' },
};

// Each role contributes one "top signal" card
const SIGNAL = {
  tourist:   { lead: 'Transfer tomorrow',     value: '08:40',       tail: 'HKT → Kata · Confirmed',              state:'live' },
  resident:  { lead: 'Visa',                  value: '48 days left',tail: 'Non-Imm O · Extension available',     state:'warn' },
  owner:     { lead: 'Villa #204',            value: 'Occupied',    tail: 'Net ฿ 58,400 this week · Guest at 14:00', state:'live' },
  agent:     { lead: 'Pipeline',              value: '฿ 41.2M',      tail: '4 deals in review · 2 due today',     state:'active' },
  developer: { lead: 'Azure Residences',      value: '42 / 120',     tail: 'Phase I closes Friday',               state:'live' },
  provider:  { lead: 'Today',                 value: '6 bookings',   tail: '฿ 18,900 · 3 awaiting response',      state:'active' },
};

// Quick actions per role — we'll pick 2 from primary, 1 from each secondary
const ACTIONS = {
  tourist:   [['Find stay','stay'], ['Transport','car'], ['Experiences','sparkle'], ['Table tonight','chat']],
  resident:  [['Pay rent','wallet'], ['Book cleaner','spark'], ['Visa','doc'], ['Groceries','grid']],
  owner:     [['Statements','doc'], ['Guest ops','people'], ['Maintenance','wrench'], ['Pricing','chart']],
  agent:     [['New lead','plus'], ['Listings','grid'], ['Pipeline','flow'], ['Clients','people']],
  developer: [['Inventory','grid'], ['Reservations','doc'], ['Analytics','chart'], ['Campaigns','flow']],
  provider:  [['Today','calendar'], ['Orders','doc'], ['Catalog','grid'], ['Earnings','wallet']],
};

// Feed items — tagged by role
const FEED = {
  tourist: [
    { t:'Transfer confirmed',     d:'Phuket Premium Taxi · 08:40', meta:'฿ 650',  when:'2h',  dot:'primary' },
    { t:'Table held at Suay',     d:'Thu 19:00 · Party of 4',      meta:'Hold',   when:'4h',  dot:'accent'  },
    { t:'Longtail tour proposal', d:'Phi Phi · private · 6h',      meta:'฿ 9,400',when:'1d',  dot:'muted'   },
  ],
  resident: [
    { t:'Rent scheduled',         d:'Villa Saiyuan · Auto-pay 1st',meta:'฿ 45,000',when:'14h', dot:'primary' },
    { t:'Cleaning · weekly',      d:'Tomorrow 10:00 · Same team',  meta:'฿ 900',  when:'1d',  dot:'primary' },
    { t:'Legal · visa extension', d:'Siam Legal replied · 2 docs', meta:'Review', when:'2d',  dot:'gold'    },
  ],
  owner: [
    { t:'Payout received',        d:'October · 28 nights occupied',meta:'฿ 184,300',when:'1d',  dot:'primary' },
    { t:'Maintenance · AC',       d:'Scheduled Thu · ฿ 1,800 est', meta:'Approve',when:'2d',  dot:'gold'    },
    { t:'Guest review 9.6',       d:'"Pristine. Host is invisible."',meta:'Read',  when:'2d',  dot:'accent'  },
  ],
  agent: [
    { t:'Offer accepted',         d:'Layan Pool Villa',            meta:'฿ 18.4M',when:'3h',  dot:'primary' },
    { t:'New qualified lead',     d:'Budget ฿ 25–35M · Laguna',    meta:'Assign', when:'5h',  dot:'accent'  },
  ],
  developer: [
    { t:'Reservation · B-412',    d:'HNW · in-house channel',      meta:'฿ 12.8M',when:'1h',  dot:'primary' },
    { t:'Construction milestone', d:'Tower B · slab 7 poured',     meta:'On track',when:'1d', dot:'accent'  },
  ],
  provider: [
    { t:'Booking · 18:30',        d:'Party of 4 · Outdoor',        meta:'Confirm',when:'1h',  dot:'gold'    },
    { t:'Menu · out of stock',    d:'Phuket Lobster',              meta:'Update', when:'2h',  dot:'accent'  },
  ],
};

// Verticals
const CLUSTERS = [
  { id:'live',   label:'Live',    sub:'Services, daily ops',        accent:'accent',  items:'14' },
  { id:'manage', label:'Manage',  sub:'Property, staff, bills',     accent:'teal',    items:'9'  },
  { id:'invest', label:'Invest',  sub:'Property, off-plan, yield',  accent:'purple',  items:'7'  },
  { id:'legal',  label:'Legal',   sub:'Visa, contracts, tax',       accent:'gold',    items:'6'  },
  { id:'arrive', label:'Arrive',  sub:'Relocation, transfer',       accent:'primary', items:'5'  },
  { id:'build',  label:'Build',   sub:'Developer tools',            accent:'coral',   items:'4'  },
];

// Cluster score per role (higher = more relevant)
const CLUSTER_SCORES = {
  tourist:   { arrive:5, live:4, legal:1, manage:0, invest:0, build:0 },
  resident:  { live:5, legal:4, manage:3, arrive:1, invest:2, build:0 },
  owner:     { manage:5, invest:4, legal:3, live:2, build:1, arrive:0 },
  agent:     { invest:5, manage:4, legal:3, build:2, live:1, arrive:0 },
  developer: { build:5, invest:4, legal:3, manage:2, live:1, arrive:0 },
  provider:  { live:5, manage:4, legal:2, invest:1, build:1, arrive:0 },
};

// ──────────────────────────────────────────────────────────────
// Blending logic
// ──────────────────────────────────────────────────────────────
function orderedRoles(roles, primary) {
  const arr = (roles || []).filter(r => ROLES[r]);
  if (!arr.length) return ['resident'];
  if (primary && arr.includes(primary)) {
    return [primary, ...arr.filter(r => r !== primary)];
  }
  return arr;
}

function blendClusters(roles) {
  const scores = {};
  CLUSTERS.forEach(c => scores[c.id] = 0);
  roles.forEach((r, i) => {
    const weight = i === 0 ? 3 : i === 1 ? 2 : 1;
    const s = CLUSTER_SCORES[r];
    if (!s) return;
    Object.entries(s).forEach(([k, v]) => scores[k] += v * weight);
  });
  return [...CLUSTERS].sort((a,b) => scores[b.id] - scores[a.id]);
}

function blendActions(roles) {
  // 2 from primary, 1 each from up to 2 secondaries; dedupe by label
  const picks = [];
  const seen = new Set();
  const take = (arr, n) => {
    for (const a of arr) {
      if (picks.length >= 8) return;
      if (seen.has(a[0])) continue;
      picks.push(a);
      seen.add(a[0]);
      if (picks.filter(p => arr.includes(p)).length >= n) break;
    }
  };
  if (roles[0]) take(ACTIONS[roles[0]], 3);
  if (roles[1]) take(ACTIONS[roles[1]], 2);
  if (roles[2]) take(ACTIONS[roles[2]], 2);
  if (roles[3]) take(ACTIONS[roles[3]], 1);
  // which role each action came from
  return picks.map(p => {
    const roleOfAction = roles.find(r => ACTIONS[r].some(a => a[0] === p[0]));
    return { label: p[0], icon: p[1], role: roleOfAction };
  }).slice(0, 8);
}

function blendFeed(roles) {
  // interleave, primary first, tag each row with role
  const out = [];
  const maxLen = Math.max(...roles.map(r => FEED[r]?.length || 0));
  for (let i = 0; i < maxLen; i++) {
    roles.forEach(r => {
      if (FEED[r] && FEED[r][i]) {
        out.push({ ...FEED[r][i], role: r });
      }
    });
  }
  return out.slice(0, 7);
}

Object.assign(window, {
  useTweaks, ROLES, ROLE_ORDER, ACCENTS, SIGNAL, ACTIONS, FEED, CLUSTERS,
  orderedRoles, blendClusters, blendActions, blendFeed,
});
