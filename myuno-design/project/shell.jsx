// Main app — multi-role control center
const PHONE_W = 402;
const PHONE_H = 872;

function MyUnoApp() {
  const { tweaks, editOn, update } = useTweaks();
  const dark = tweaks.mood === 'dark';
  const accentColor = ACCENTS[tweaks.accent]?.color || '#00D68F';
  const density = tweaks.density;

  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark);
  }, [dark]);

  const [sheetOpen, setSheetOpen] = useState(false);

  const rolesActive = useMemo(
    () => orderedRoles(tweaks.roles, tweaks.primary),
    [tweaks.roles, tweaks.primary]
  );

  const actionsBlended  = useMemo(() => blendActions(rolesActive),  [rolesActive]);
  const clustersBlended = useMemo(() => blendClusters(rolesActive), [rolesActive]);
  const feedBlended     = useMemo(() => blendFeed(rolesActive),     [rolesActive]);
  const rowGap = density === 'compact' ? 10 : 14;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 20, width:'100%' }}>
      <PhoneShell>
        <Screen
          roles={rolesActive} accent={accentColor} rowGap={rowGap}
          actions={actionsBlended} clusters={clustersBlended} feed={feedBlended}
          onOpenSheet={() => setSheetOpen(true)}
        />
        {sheetOpen && (
          <RoleSheet
            roles={tweaks.roles} primary={tweaks.primary}
            onClose={() => setSheetOpen(false)}
            onChange={(next) => update(next)}
          />
        )}
      </PhoneShell>
      <Caption dark={dark} roles={rolesActive} />
      {editOn && <TweaksPanel tweaks={tweaks} update={update} />}
    </div>
  );
}

// ── phone
function PhoneShell({ children }) {
  return (
    <div style={{
      width: PHONE_W, height: PHONE_H, borderRadius: 52, padding: 10,
      background: 'linear-gradient(180deg, #222 0%, #111 100%)',
      boxShadow: '0 50px 110px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width:'100%', height:'100%', borderRadius:42, overflow:'hidden',
        background:'var(--bg)', position:'relative',
      }}>
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:54, zIndex:30,
          display:'flex', alignItems:'flex-end', justifyContent:'space-between',
          padding:'0 26px 6px', pointerEvents:'none',
        }}>
          <span className="mono" style={{ fontSize:14, fontWeight:500, color:'var(--fg)', letterSpacing:0.3 }}>13:42</span>
          <div style={{ width:118, height:32, borderRadius:20, background:'#000' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span className="mono" style={{ fontSize:11, color:'var(--muted)' }}>5G</span>
            <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0" y="6" width="2.5" height="4" rx="0.5" fill="var(--fg)"/><rect x="4" y="4" width="2.5" height="6" rx="0.5" fill="var(--fg)"/><rect x="8" y="2" width="2.5" height="8" rx="0.5" fill="var(--fg)"/><rect x="12" y="0" width="2.5" height="10" rx="0.5" fill="var(--fg)"/></svg>
            <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" fill="none" stroke="var(--muted)" strokeOpacity="0.5"/><rect x="2" y="2" width="17" height="7" rx="1.5" fill="var(--fg)"/><rect x="21" y="3.5" width="2" height="4" rx="1" fill="var(--muted)" opacity="0.5"/></svg>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Caption({ dark, roles }) {
  return (
    <div style={{
      fontSize: 10.5, letterSpacing: '0.14em', textTransform:'uppercase',
      color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
      fontWeight: 600, fontFamily: "'DM Sans'",
    }}>
      myUNO · {roles.map(r => ROLES[r].short).join(' + ')} · {dark ? 'Dark' : 'Light'}
    </div>
  );
}

Object.assign(window, { MyUnoApp });
