/* ==========================================================================
   FORMA – icons.js
   Tiny inline-SVG icon set (stroke icons, 24×24). No external icon font.
   Usage:
     Icons.svg('dumbbell')                 -> '<svg class="icon">…</svg>'
     <i data-icon="dumbbell"></i>          -> replaced by Icons.hydrate()
     Icons.equip('treadmill')              -> larger equipment artwork
   ========================================================================== */
const Icons = (() => {
  const P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    posture: '<circle cx="12" cy="5" r="2.2"/><path d="M12 8v6M8 10l4 1 4-1M12 14l-3 6M12 14l3 6"/>',
    nutrition: '<path d="M12 8c-1.8-1.6-6-1.2-6 4 0 4.2 2.8 8 6 8s6-3.8 6-8c0-5.2-4.2-5.6-6-4z"/><path d="M12 8c0-2 .9-3.4 2.8-4.2"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/>',
    kettlebell: '<circle cx="12" cy="14" r="6"/><path d="M8.5 9.5C8.5 4 15.5 4 15.5 9.5"/>',
    progress: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    trainers: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2c2.4.2 4 2 4 4.8"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/>',
    membership: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
    droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    'camera-off': '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/><path d="M3 3l18 18"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    scale: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9a4 4 0 0 1 8 0M12 9l2-2"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    bot: '<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V5M9 13v.01M15 13v.01M9 16.5h6"/><circle cx="12" cy="3.8" r="1"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6v.01M3 12v.01M3 18v.01"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>',
    wrench: '<path d="M15 5a4 4 0 0 0-4.5 5.3L4 17l3 3 6.7-6.5A4 4 0 0 0 19 9l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    medal: '<circle cx="12" cy="15" r="5"/><path d="M8.5 11L6 3h4l2 4 2-4h4l-2.5 8"/>'
  };

  // Larger "artwork" icons for equipment cards (24×24 viewBox, stroke).
  const EQ = {
    treadmill: '<path d="M3 19h16M5 19l2.5-6h11l1 6"/><path d="M16 13l-1.5-8h-2.5M12 5h5"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9L8.5 6H11M13 9l-1 7"/>',
    elliptical: '<path d="M4 20h16M7 20l3-8M17 20l-3-8M10 12l2-8M14 12l2-6h2"/>',
    rower: '<path d="M2 18h20M5 18l3-5h7l3-4M8 8.5a1.2 1.2 0 1 0 .01 0"/>',
    stairs: '<path d="M3 20h5v-4h5v-4h5V8h3"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    barbell: '<path d="M2 12h20M5 7v10M8 9v6M16 9v6M19 7v10"/>',
    kettlebell: '<circle cx="12" cy="14.5" r="6"/><path d="M8.5 10C8.5 4 15.5 4 15.5 10"/>',
    bench: '<path d="M3 12h14a2 2 0 0 1 2 2v1H3zM6 15v4M16 15v4M17 8h4M19 6v4"/>',
    rack: '<path d="M5 3v18M19 3v18M2 8h6M16 8h6M7 14h10"/>',
    pullup: '<path d="M3 5h18M6 5v15M18 5v15M9 10h6"/>',
    cable: '<rect x="4" y="3" width="4" height="18" rx="1"/><path d="M8 6h9l3 3M8 18h10M14 6v7"/>',
    legpress: '<path d="M4 20h16M6 20l6-8 6 2M12 12l7-7"/>',
    bag: '<path d="M12 2v4"/><rect x="8" y="6" width="8" height="14" rx="3"/>',
    rope: '<path d="M3 12c3-7 5 7 9 0s6 7 9 0"/>',
    mat: '<rect x="3" y="15" width="18" height="4" rx="1"/><path d="M6 15V9h12v6"/>'
  };

  function svg(name, cls) {
    const body = P[name] || P.info;
    return `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }
  function equip(type) {
    const body = EQ[type] || EQ.dumbbell;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }
  /** Replace every <i data-icon="name"></i> inside root with an inline SVG. */
  function hydrate(root) {
    (root || document).querySelectorAll('i[data-icon]').forEach(el => {
      const wrap = document.createElement('span');
      wrap.innerHTML = svg(el.dataset.icon, el.dataset.class || '');
      el.replaceWith(wrap.firstChild);
    });
  }
  return { svg, equip, hydrate, names: Object.keys(P), equipTypes: Object.keys(EQ) };
})();
