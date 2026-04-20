// Icons — stroke-only, 20px grid. No fills. No emoji.
const Icon = ({ name, size = 18, color = 'currentColor', stroke = 1.6 }) => {
  const p = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:stroke, strokeLinecap:'round', strokeLinejoin:'round' };
  switch(name){
    case 'stay':    return <svg {...p}><path d="M3 21V10l9-7 9 7v11"/><path d="M9 21v-6h6v6"/></svg>;
    case 'car':     return <svg {...p}><path d="M5 17h14M5 17v3M19 17v3M4 14l2-7h12l2 7v3H4z"/><circle cx="8" cy="17" r="1.2"/><circle cx="16" cy="17" r="1.2"/></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M18.4 5.6l-4.2 4.2M9.8 14.2l-4.2 4.2"/></svg>;
    case 'sos':     return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5M12 15.5v.5"/></svg>;
    case 'wallet':  return <svg {...p}><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/></svg>;
    case 'spark':   return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/></svg>;
    case 'doc':     return <svg {...p}><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h4"/></svg>;
    case 'people':  return <svg {...p}><circle cx="9" cy="9" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 6a3 3 0 010 6M17 20c0-2.3-1.3-4.3-3-5.3"/></svg>;
    case 'wrench':  return <svg {...p}><path d="M14.7 6.3a4 4 0 00-5.5 5L3 17.5 6.5 21l6.2-6.2a4 4 0 005-5.5l-2.8 2.8-2.2-2.2z"/></svg>;
    case 'chat':    return <svg {...p}><path d="M4 5h16v11H8l-4 4z"/></svg>;
    case 'plus':    return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'grid':    return <svg {...p}><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg>;
    case 'flow':    return <svg {...p}><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3h12V9M12 15v-3"/></svg>;
    case 'chart':   return <svg {...p}><path d="M4 20V8M10 20V4M16 20v-8M22 20H2"/></svg>;
    case 'calendar':return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'search':  return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>;
    case 'bell':    return <svg {...p}><path d="M6 16V10a6 6 0 0112 0v6l2 2H4z"/><path d="M10 21a2 2 0 004 0"/></svg>;
    case 'user':    return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
    case 'home':    return <svg {...p}><path d="M3 11l9-8 9 8v10H3z"/></svg>;
    case 'compass': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5L13 13l-4.5 2.5L11 11z"/></svg>;
    case 'arrow':   return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'dot':     return <svg viewBox="0 0 24 24" width={size} height={size}><circle cx="12" cy="12" r="4" fill={color}/></svg>;
    default:        return <svg {...p}><circle cx="12" cy="12" r="8"/></svg>;
  }
};

Object.assign(window, { Icon });
