// Tweaks panel — multi-role aware

function TweaksPanel({ tweaks, update }) {
  const roles = tweaks.roles || [];
  const primary = tweaks.primary;
  const toggleRole = (r) => {
    const has = roles.includes(r);
    let next = has ? roles.filter(x => x !== r) : [...roles, r];
    if (!next.length) next = [r];
    let p = primary;
    if (!next.includes(p)) p = next[0];
    update({ roles: next, primary: p });
  };
  return (
    <div style={{
      position:'fixed', right:20, bottom:20, zIndex: 999,
      width: 280, padding:'14px 14px 16px', borderRadius:16,
      background: '#0B1422', color:'#EDF2FF',
      border:'1px solid rgba(255,255,255,0.1)',
      boxShadow:'0 20px 50px rgba(0,0,0,0.5)',
      fontFamily:"'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'#5E7389', fontWeight:600, marginBottom:12 }}>
        Tweaks
      </div>

      <FieldLabel>Active roles (primary = star)</FieldLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:10 }}>
        {ROLE_ORDER.map(id => {
          const active = roles.includes(id);
          const isPrim = id === primary;
          return (
            <div key={id} style={{
              padding:'6px 8px', borderRadius:8, textAlign:'left', cursor:'pointer',
              fontSize:11, fontWeight:500,
              color: active ? '#EDF2FF' : '#8FA3B8',
              background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
              border:`1px solid ${active ? ROLES[id].color + '55' : 'rgba(255,255,255,0.08)'}`,
              display:'flex', alignItems:'center', gap:6,
            }}>
              <span onClick={() => toggleRole(id)} style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{
                  width:14, height:14, borderRadius:99, background:ROLES[id].color,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:8, fontWeight:700, color:'#08101E',
                }}>{ROLES[id].glyph}</span>
                {ROLES[id].short}
              </span>
              {active && (
                <span onClick={() => update({ roles, primary: id })} style={{
                  fontSize:11, cursor:'pointer',
                  color: isPrim ? '#F59E0B' : 'rgba(255,255,255,0.3)',
                }}>★</span>
              )}
            </div>
          );
        })}
      </div>

      <FieldLabel>Accent</FieldLabel>
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {Object.entries(ACCENTS).map(([k, v]) => (
          <div key={k} onClick={()=>update({accent:k})} style={{
            flex:1, padding:'6px 0', borderRadius:10, cursor:'pointer', textAlign:'center',
            border: `1px solid ${tweaks.accent === k ? v.color : 'rgba(255,255,255,0.1)'}`,
            background: tweaks.accent === k ? `${v.color}18` : 'transparent',
          }}>
            <div style={{ width:10, height:10, borderRadius:99, background:v.color, margin:'0 auto 2px' }}/>
            <div style={{ fontSize:9.5, color:tweaks.accent === k ? v.color : '#8FA3B8' }}>{v.label}</div>
          </div>
        ))}
      </div>

      <FieldLabel>Density</FieldLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:12 }}>
        {['comfortable','compact'].map(d => (
          <Choice key={d} active={tweaks.density === d} onClick={()=>update({density:d})}>{d}</Choice>
        ))}
      </div>

      <FieldLabel>Mood</FieldLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
        {['dark','light'].map(m => (
          <Choice key={m} active={tweaks.mood === m} onClick={()=>update({mood:m})}>{m}</Choice>
        ))}
      </div>
    </div>
  );
}
function FieldLabel({ children }) {
  return <div style={{ fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', color:'#5E7389', fontWeight:600, marginBottom:6 }}>{children}</div>;
}
function Choice({ children, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding:'6px 8px', borderRadius:8, textAlign:'center', cursor:'pointer',
      fontSize:11, fontWeight:500,
      color: active ? '#08101E' : '#EDF2FF',
      background: active ? '#EDF2FF' : 'transparent',
      border:`1px solid ${active ? '#EDF2FF' : 'rgba(255,255,255,0.1)'}`,
      textTransform:'capitalize',
    }}>{children}</div>
  );
}

Object.assign(window, { TweaksPanel });
