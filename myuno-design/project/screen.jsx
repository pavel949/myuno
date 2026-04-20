// Screen — multi-role home

function Screen({ roles, accent, actions, clusters, feed, rowGap, onOpenSheet }) {
  return (
    <div style={{
      position:'absolute', inset:0, paddingTop: 54,
      display:'flex', flexDirection:'column',
      background: 'var(--bg)', color:'var(--fg)',
    }}>
      <div style={{ flex:1, overflow:'auto', paddingBottom: 96 }}>
        <TopBar onOpenSheet={onOpenSheet} roles={roles} />
        <SignalStack roles={roles} accent={accent} onOpenSheet={onOpenSheet}/>
        <NowInPhuket/>
        <QuickActions actions={actions} accent={accent} />
        <Concierge roles={roles} accent={accent}/>
        <Feed feed={feed} rowGap={rowGap}/>
        <VerticalCluster clusters={clusters}/>
        <Trust/>
      </div>
      <TabBar accent={accent}/>
    </div>
  );
}

// ── top bar
function TopBar({ roles, onOpenSheet }){
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding: '10px 20px 14px',
    }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:0 }}>
        <span style={{ fontFamily:"'Golos Text'", fontWeight: 400, fontSize: 22, color:'var(--muted)', letterSpacing:'-0.02em' }}>my</span>
        <span style={{ fontFamily:"'Golos Text'", fontWeight: 700, fontSize: 22, color:'var(--fg)', letterSpacing:'0.02em' }}>UNO</span>
      </div>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <RoleStack roles={roles} onClick={onOpenSheet}/>
        <IconButton name="bell" badge/>
        <Avatar/>
      </div>
    </div>
  );
}

// Overlapping role glyphs — compact visual proof that you have many hats
function RoleStack({ roles, onClick }) {
  const size = 26;
  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', cursor:'pointer',
      padding:'4px 10px 4px 4px', borderRadius: 99,
      border:'1px solid var(--border)',
      height: 36,
    }}>
      <div style={{ display:'flex' }}>
        {roles.slice(0,3).map((r, i) => (
          <div key={r} style={{
            width: size, height: size, borderRadius:99,
            background: ROLES[r].color,
            border: '2px solid var(--bg)',
            marginLeft: i === 0 ? 0 : -9,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Golos Text'", fontSize:11, fontWeight:700, color:'#08101E',
            zIndex: 10 - i,
          }}>{ROLES[r].glyph}</div>
        ))}
      </div>
      {roles.length > 3 && <span className="mono" style={{ fontSize:10.5, color:'var(--muted)', marginLeft:6 }}>+{roles.length - 3}</span>}
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ marginLeft:8 }}>
        <path d="M2 4l3 3 3-3" stroke="var(--muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function IconButton({ name, badge }) {
  return (
    <button style={{
      width:36, height:36, borderRadius:99,
      background:'transparent', border:'1px solid var(--border)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'var(--fg)', cursor:'pointer', position:'relative',
    }}>
      <Icon name={name} size={17} color="var(--muted)"/>
      {badge && <span style={{ position:'absolute', top:7, right:8, width:6, height:6, borderRadius:99, background:'var(--primary)' }}/>}
    </button>
  );
}
function Avatar(){
  return (
    <div style={{
      width:36, height:36, borderRadius:99,
      background:'linear-gradient(135deg, #26314A 0%, #0F1C2E 100%)',
      border:'1px solid var(--border-strong)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Golos Text'", fontWeight:600, fontSize:12, color:'#EDF2FF', letterSpacing:'0.03em',
    }}>DK</div>
  );
}

// ── signal stack: one card per active role
function SignalStack({ roles, accent, onOpenSheet }) {
  return (
    <div style={{ padding:'0 16px 18px' }}>
      {/* primary — hero */}
      <SignalCard role={roles[0]} size="lg" accent={accent}/>
      {/* secondaries — slimline */}
      {roles.slice(1).length > 0 && (
        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
          {roles.slice(1).map(r => <SignalCard key={r} role={r} size="sm" accent={accent}/>)}
        </div>
      )}
      <div onClick={onOpenSheet} style={{
        marginTop:10, padding:'9px 12px', borderRadius:10,
        border:'1px dashed var(--border)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        cursor:'pointer',
      }}>
        <span style={{ fontSize:11.5, color:'var(--muted)' }}>Manage roles · reorder</span>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 3l4 4-4 4" stroke="var(--muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>
  );
}

function SignalCard({ role, size, accent }) {
  const sig = SIGNAL[role];
  const color = ROLES[role].color;
  const stateLabel = { live:'Live', warn:'Act now', active:'Active' }[sig.state];
  if (size === 'lg') {
    return (
      <div style={{
        padding:'16px 18px', borderRadius:20,
        background:'var(--card)', border:'1px solid var(--border)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:16, bottom:16, left:0, width:2, background:color, borderRadius:'0 2px 2px 0' }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <RoleChip role={role}/>
            <span style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600 }}>{sig.lead}</span>
          </div>
          <StateChip label={stateLabel} color={color}/>
        </div>
        <div className="display" style={{ fontSize:24, fontWeight:700, color:'var(--fg)', marginBottom:4, lineHeight:1.15 }}>
          {sig.value}
        </div>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.45 }}>{sig.tail}</div>
      </div>
    );
  }
  // slimline
  return (
    <div style={{
      padding:'10px 14px', borderRadius:14,
      background:'var(--card-e)', border:'1px solid var(--border)',
      position:'relative', overflow:'hidden',
      display:'grid', gridTemplateColumns:'auto 1fr auto', gap:10, alignItems:'center',
    }}>
      <div style={{ position:'absolute', top:10, bottom:10, left:0, width:2, background:color, borderRadius:'0 2px 2px 0' }}/>
      <RoleChip role={role} compact/>
      <div style={{ overflow:'hidden' }}>
        <div style={{ fontSize:12.5, fontWeight:500, color:'var(--fg)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          <span style={{ color:'var(--muted)' }}>{sig.lead} · </span>{sig.value}
        </div>
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{sig.tail}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" stroke="var(--muted-2)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

function RoleChip({ role, compact }) {
  const color = ROLES[role].color;
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:5,
      height: compact ? 22 : 22, padding: '0 7px 0 4px',
      borderRadius:99,
      background: `${color}18`, border:`1px solid ${color}33`,
    }}>
      <div style={{
        width:14, height:14, borderRadius:99, background:color,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'Golos Text'", fontSize:9, fontWeight:700, color:'#08101E',
      }}>{ROLES[role].glyph}</div>
      <span style={{ fontSize:10, fontWeight:600, color, letterSpacing:'0.04em', textTransform:'uppercase' }}>{ROLES[role].short}</span>
    </div>
  );
}
function StateChip({ label, color }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 9px 4px 7px', borderRadius:99,
      background:`${color}18`, border:`1px solid ${color}33`,
    }}>
      <span style={{ width:6, height:6, borderRadius:99, background:color, boxShadow:`0 0 8px ${color}` }}/>
      <span style={{ fontSize:10.5, fontWeight:600, color, letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}</span>
    </div>
  );
}

// ── now in phuket
function NowInPhuket(){
  return (
    <div style={{ padding: '0 16px 18px' }}>
      <div style={{
        display:'grid', gridTemplateColumns:'1.1fr 1fr 1fr', gap:0,
        borderTop:'1px solid var(--hairline)', borderBottom:'1px solid var(--hairline)',
        padding: '14px 0',
      }}>
        <Stat label="Phuket" value="29°" sub="Clear · 68% hum"/>
        <Stat label="AQI"    value="34"  sub="Good"/>
        <Stat label="THB/USD" value="34.82" sub="+0.12"/>
      </div>
    </div>
  );
}
function Stat({ label, value, sub }) {
  return (
    <div style={{ padding: '0 14px', borderLeft: '1px solid var(--hairline)', marginLeft: -1 }}>
      <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600, marginBottom:6 }}>{label}</div>
      <div className="mono" style={{ fontSize:18, fontWeight:500, color:'var(--fg)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{sub}</div>
    </div>
  );
}

// ── quick actions — now 8-cap, 2 rows
function QuickActions({ actions, accent }) {
  return (
    <div style={{ padding:'0 16px 20px' }}>
      <SectionHead title="For you" meta="Mixed from your roles"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
        {actions.map((a, i) => {
          const color = ROLES[a.role]?.color || accent;
          return (
            <div key={a.label + i} style={{
              borderRadius:14, background:'var(--card)',
              border:'1px solid var(--border)',
              padding:'12px 8px 10px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:7,
              cursor:'pointer', position:'relative',
            }}>
              <div style={{
                width:32, height:32, borderRadius:10,
                background:'rgba(255,255,255,0.04)',
                border:'1px solid var(--border)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon name={a.icon} size={15} color="var(--fg)"/>
              </div>
              <div style={{ fontSize:10.5, color:'var(--fg)', fontWeight:500, textAlign:'center', lineHeight:1.2 }}>{a.label}</div>
              {/* role tag dot */}
              <span title={ROLES[a.role]?.short} style={{
                position:'absolute', top:8, right:8,
                width:5, height:5, borderRadius:99, background: color,
              }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── concierge
function Concierge({ roles, accent }) {
  // Blend a concierge line based on active roles
  const nudge = roles.length > 1
    ? `You're wearing ${roles.length} hats today. I lined up your ${ROLES[roles[0]].full.toLowerCase()} priority first, with ${ROLES[roles[1]].short.toLowerCase()} threads below.`
    : `I lined up your ${ROLES[roles[0]].full.toLowerCase()} priority — ask me to switch focus anytime.`;
  return (
    <div style={{ padding:'0 16px 18px' }}>
      <div style={{
        padding:'14px 16px', borderRadius:16,
        border:'1px dashed var(--border-strong)',
        display:'flex', gap:12, alignItems:'flex-start',
      }}>
        <div style={{
          width:26, height:26, borderRadius:99, flexShrink:0, marginTop:1,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:accent, color:'#000',
          fontSize:11, fontWeight:700, fontFamily:"'Golos Text'",
        }}>U</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:10.5, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600, marginBottom:4 }}>
            Concierge
          </div>
          <div style={{ fontSize:13.5, color:'var(--fg)', lineHeight:1.5, textWrap:'pretty' }}>{nudge}</div>
          <div style={{ display:'flex', gap:6, marginTop:10 }}>
            <MiniBtn label="Focus mode" primary/>
            <MiniBtn label="Later"/>
            <MiniBtn label="Ask"/>
          </div>
        </div>
      </div>
    </div>
  );
}
function MiniBtn({ label, primary }) {
  return (
    <div style={{
      padding:'6px 10px', borderRadius:99, fontSize:11, fontWeight:500, cursor:'pointer',
      background: primary ? 'var(--fg)' : 'transparent',
      color: primary ? 'var(--bg)' : 'var(--muted)',
      border: `1px solid ${primary ? 'var(--fg)' : 'var(--border)'}`,
    }}>{label}</div>
  );
}

// ── feed
function Feed({ feed, rowGap }){
  return (
    <div style={{ padding: '0 16px 22px' }}>
      <SectionHead title="Activity" meta="All roles · this week"/>
      <div style={{ borderTop:'1px solid var(--hairline)' }}>
        {feed.map((f, i) => {
          const color = ROLES[f.role]?.color;
          return (
            <div key={i} style={{
              padding: `${rowGap}px 2px`, borderBottom:'1px solid var(--hairline)',
              display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 12, alignItems:'start',
            }}>
              <div style={{ marginTop:3, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{
                  width:18, height:18, borderRadius:99,
                  background:`${color}18`, border:`1px solid ${color}33`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'Golos Text'", fontSize:9, fontWeight:700, color,
                }}>{ROLES[f.role]?.glyph}</div>
              </div>
              <div>
                <div style={{ fontSize:13.5, fontWeight:500, color:'var(--fg)', marginBottom:2, lineHeight:1.3 }}>{f.t}</div>
                <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.4 }}>{f.d}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="mono" style={{ fontSize:12, fontWeight:500, color:'var(--fg)' }}>{f.meta}</div>
                <div style={{ fontSize:10.5, color:'var(--muted-2)', marginTop:3, letterSpacing:'0.04em' }}>{f.when}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionHead({ title, meta }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
      <div style={{ fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600 }}>{title}</div>
      {meta && <div style={{ fontSize:11, color:'var(--muted)' }}>{meta}</div>}
    </div>
  );
}

// ── verticals
function VerticalCluster({ clusters }){
  return (
    <div style={{ padding:'0 16px 22px' }}>
      <SectionHead title="All services" meta="45 apps · ranked for you"/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
        {clusters.map(c => <ClusterCard key={c.id} c={c}/>)}
      </div>
    </div>
  );
}
function ClusterCard({ c }) {
  const accentMap = { primary:'var(--primary)', accent:'var(--accent)', teal:'var(--teal)', purple:'var(--purple)', gold:'var(--gold)', coral:'var(--coral)' };
  const col = accentMap[c.accent] || 'var(--accent)';
  return (
    <div style={{
      position:'relative', padding:'14px 14px 14px 16px', minHeight: 86,
      borderRadius:14, background:'var(--card)', border:'1px solid var(--border)',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
    }}>
      <div style={{ position:'absolute', top:14, bottom:14, left:0, width:2, background: col, borderRadius:'0 2px 2px 0' }}/>
      <div>
        <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600 }}>Cluster</div>
        <div className="display" style={{ fontSize:17, fontWeight:600, color:'var(--fg)', marginTop:3, letterSpacing:'-0.01em' }}>{c.label}</div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:8 }}>
        <div style={{ fontSize:11, color:'var(--muted)', lineHeight:1.3, maxWidth:'80%' }}>{c.sub}</div>
        <div className="mono" style={{ fontSize:10.5, color:col, fontWeight:500 }}>{c.items}</div>
      </div>
    </div>
  );
}

function Trust(){
  return (
    <div style={{ padding:'0 16px 28px' }}>
      <div style={{
        padding:'14px 16px', borderRadius:14,
        border:'1px solid var(--hairline)',
        display:'flex', gap:14, alignItems:'center',
      }}>
        <div className="mono" style={{ fontSize:20, color:'var(--fg)', fontWeight:500, letterSpacing:'0.01em' }}>03</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12.5, color:'var(--fg)', fontWeight:500 }}>Licensed & regulated</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>SEC Thailand · DBD 0105567890123 · PDPA compliant</div>
        </div>
      </div>
    </div>
  );
}

function TabBar({ accent }){
  const tabs = [
    { id:'home',     icon:'home',    label:'Home',     active:true },
    { id:'discover', icon:'compass', label:'Discover' },
    { id:'wallet',   icon:'wallet',  label:'Wallet'   },
    { id:'me',       icon:'user',    label:'Me'       },
  ];
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom:0, height:82,
      background:'var(--surface)', borderTop:'1px solid var(--border)',
      display:'grid', gridTemplateColumns:'repeat(4, 1fr)', padding:'10px 12px 26px',
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }}>
          <Icon name={t.icon} size={19} color={t.active ? accent : 'var(--muted-2)'} stroke={t.active ? 1.8 : 1.5}/>
          <div style={{ fontSize:10, fontWeight:500, color: t.active ? 'var(--fg)' : 'var(--muted-2)', letterSpacing:'0.02em' }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Role sheet — the customization moment
function RoleSheet({ roles, primary, onClose, onChange }) {
  const toggle = (r) => {
    const has = roles.includes(r);
    let nextRoles = has ? roles.filter(x => x !== r) : [...roles, r];
    if (!nextRoles.length) nextRoles = [r];
    let nextPrimary = primary;
    if (!nextRoles.includes(nextPrimary)) nextPrimary = nextRoles[0];
    onChange({ roles: nextRoles, primary: nextPrimary });
  };
  const move = (r, dir) => {
    const i = roles.indexOf(r);
    const j = i + dir;
    if (j < 0 || j >= roles.length) return;
    const next = [...roles];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ roles: next, primary });
  };
  const setPrimary = (r) => onChange({ roles, primary: r });

  return (
    <div style={{ position:'absolute', inset:0, zIndex:60, display:'flex', alignItems:'flex-end' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}/>
      <div style={{
        position:'relative', width:'100%',
        background:'var(--surface)', borderTopLeftRadius:28, borderTopRightRadius:28,
        padding:'8px 20px 28px',
        maxHeight:'80%', overflow:'auto',
        borderTop:'1px solid var(--border-strong)',
      }}>
        <div style={{ height:4, width:36, background:'var(--border-strong)', borderRadius:99, margin:'6px auto 18px' }}/>
        <div className="display" style={{ fontSize:22, fontWeight:700, color:'var(--fg)', marginBottom:4, letterSpacing:'-0.02em' }}>
          Your roles
        </div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:18, lineHeight:1.5 }}>
          Phuket is a place where people wear many hats. Pick the ones that are true today — myUNO blends them. Reorder to change emphasis.
        </div>

        {/* Active roles — ordered list */}
        <div style={{ fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600, marginBottom:8 }}>
          Active · drag order = priority
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:20 }}>
          {roles.map((r, i) => (
            <RoleRow key={r}
              role={r} isPrimary={r === primary} index={i} total={roles.length}
              onRemove={() => toggle(r)}
              onUp={() => move(r, -1)}
              onDown={() => move(r, 1)}
              onMakePrimary={() => setPrimary(r)}
            />
          ))}
        </div>

        {/* Available */}
        <div style={{ fontSize:10.5, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600, marginBottom:8 }}>
          Add a role
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {ROLE_ORDER.filter(r => !roles.includes(r)).map(r => (
            <div key={r} onClick={() => toggle(r)} style={{
              padding:'10px 12px', borderRadius:12,
              border:'1px solid var(--border)', cursor:'pointer',
              display:'flex', alignItems:'center', gap:10,
            }}>
              <div style={{
                width:22, height:22, borderRadius:99, background: ROLES[r].color,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Golos Text'", fontSize:10, fontWeight:700, color:'#08101E',
              }}>{ROLES[r].glyph}</div>
              <div>
                <div style={{ fontSize:12.5, color:'var(--fg)', fontWeight:500 }}>{ROLES[r].short}</div>
                <div style={{ fontSize:10.5, color:'var(--muted)' }}>{ROLES[r].full}</div>
              </div>
              <div style={{ marginLeft:'auto', fontSize:11, color:'var(--muted)' }}>+</div>
            </div>
          ))}
        </div>

        <div onClick={onClose} style={{
          marginTop:22, padding:'14px', borderRadius:14,
          background:'var(--fg)', color:'var(--bg)',
          fontSize:14, fontWeight:600, textAlign:'center', cursor:'pointer',
        }}>Done</div>
      </div>
    </div>
  );
}

function RoleRow({ role, isPrimary, index, total, onRemove, onUp, onDown, onMakePrimary }) {
  const color = ROLES[role].color;
  return (
    <div style={{
      padding:'10px 12px', borderRadius:12,
      border:`1px solid ${isPrimary ? color+'55' : 'var(--border)'}`,
      background: isPrimary ? `${color}0d` : 'transparent',
      display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:10, alignItems:'center',
    }}>
      <div style={{
        width:26, height:26, borderRadius:99, background:color,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'Golos Text'", fontSize:11, fontWeight:700, color:'#08101E',
      }}>{ROLES[role].glyph}</div>
      <div>
        <div style={{ fontSize:13, color:'var(--fg)', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
          {ROLES[role].short}
          {isPrimary && <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.08em', color, textTransform:'uppercase' }}>Primary</span>}
        </div>
        <div style={{ fontSize:11, color:'var(--muted)' }}>{ROLES[role].full}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
        <MicroBtn disabled={index===0} onClick={onUp}>▲</MicroBtn>
        <MicroBtn disabled={index===total-1} onClick={onDown}>▼</MicroBtn>
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {!isPrimary && <MicroBtn onClick={onMakePrimary} text>Make 1st</MicroBtn>}
        <MicroBtn onClick={onRemove} text>Remove</MicroBtn>
      </div>
    </div>
  );
}
function MicroBtn({ children, disabled, onClick, text }) {
  return (
    <div onClick={!disabled ? onClick : null} style={{
      fontSize: text ? 10 : 8, fontWeight:600,
      padding: text ? '4px 7px' : '2px 6px',
      borderRadius:6,
      background:'transparent',
      border:'1px solid var(--border)',
      color: disabled ? 'var(--muted-2)' : 'var(--muted)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1,
      textAlign:'center',
      whiteSpace:'nowrap',
    }}>{children}</div>
  );
}

Object.assign(window, { Screen, RoleSheet });
