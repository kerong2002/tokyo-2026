/* global React, ReactDOM */
const { useState, useEffect, useMemo, useRef } = React;

// ─── helpers ────────────────────────────────────
const TRIP = window.TRIP_DATA;

// project lat/lng to SVG coords (Tokyo bounding box)
const BBOX = { minLat: 35.55, maxLat: 35.78, minLng: 139.65, maxLng: 140.45 };
function project(lat, lng, w = 100, h = 100) {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * w;
  const y = h - ((lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * h;
  return { x, y };
}

// for inner-Tokyo focused map (excludes airport)
const TOKYO_BBOX = { minLat: 35.64, maxLat: 35.74, minLng: 139.68, maxLng: 139.82 };
function projectTokyo(lat, lng, w = 100, h = 100) {
  const x = ((lng - TOKYO_BBOX.minLng) / (TOKYO_BBOX.maxLng - TOKYO_BBOX.minLng)) * w;
  const y = h - ((lat - TOKYO_BBOX.minLat) / (TOKYO_BBOX.maxLat - TOKYO_BBOX.minLat)) * h;
  return { x, y };
}

function useLocalStorage(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, setV];
}

// ─── Masthead ───────────────────────────────────
function Masthead() {
  return (
    React.createElement('header', { className: 'masthead' },
      React.createElement('div', null,
        React.createElement('div', { className: 'masthead-issue' }, 'Issue No. 06 / 2026'),
        React.createElement('div', { className: 'masthead-title' }, 'Tokyo Travelogue'),
      ),
      React.createElement('div', { className: 'masthead-center' },
        React.createElement('h1', { className: 'serif masthead-kanji' }, '東京六日'),
        React.createElement('div', { className: 'masthead-sub' }, 'June Thirteenth — Eighteenth · MMXXVI'),
      ),
      React.createElement('div', { className: 'masthead-meta' },
        '行程手帳',
        React.createElement('strong', null, '2026.06.13 — 06.18'),
      ),
    )
  );
}

// ─── Day Tabs ───────────────────────────────────
function DayTabs({ days, activeIdx, onSelect }) {
  return (
    React.createElement('nav', { className: 'tabs' },
      days.map((d, i) =>
        React.createElement('button', {
          key: d.id,
          className: 'tab' + (i === activeIdx ? ' active' : ''),
          onClick: () => onSelect(i),
        },
          React.createElement('span', { className: 'tab-num' }, 'DAY ' + String(d.idx).padStart(2, '0')),
          React.createElement('span', { className: 'tab-date' }, d.date + ' (' + d.weekday + ')'),
          React.createElement('span', { className: 'tab-title' }, d.title),
        )
      )
    )
  );
}

// ─── Hero ───────────────────────────────────────
function Hero({ day, weather }) {
  const w = weather.find(x => x.date === day.date);
  return (
    React.createElement('section', { className: 'hero' },
      React.createElement('div', { className: 'hero-left' },
        React.createElement('div', { className: 'hero-eyebrow' }, 'Day ' + String(day.idx).padStart(2, '0') + ' · ' + day.date + ' (' + day.weekday + ')'),
        React.createElement('h2', { className: 'serif hero-kanji' }, day.kanji),
        React.createElement('h3', { className: 'serif hero-title' }, day.title),
        React.createElement('div', { className: 'hero-sub' }, day.subtitle),
      ),
      React.createElement('div', { className: 'hero-right' },
        React.createElement('p', { className: 'serif hero-headline' }, day.headline),
        React.createElement('div', { className: 'hero-note' }, day.heroNote),
        React.createElement('div', { className: 'hero-meta' },
          React.createElement('div', { className: 'hero-meta-cell' },
            React.createElement('div', { className: 'hero-meta-label' }, '區域'),
            React.createElement('div', { className: 'hero-meta-val' }, day.areas.join(' · ')),
          ),
          React.createElement('div', { className: 'hero-meta-cell' },
            React.createElement('div', { className: 'hero-meta-label' }, '行程'),
            React.createElement('div', { className: 'hero-meta-val' },
              React.createElement('span', { className: 'mono' }, day.events.length), ' 個地點'),
          ),
          w && React.createElement('div', { className: 'hero-meta-cell' },
            React.createElement('div', { className: 'hero-meta-label' }, '天氣'),
            React.createElement('div', { className: 'hero-meta-val' },
              w.icon + ' ',
              React.createElement('span', { className: 'mono' }, w.high + '°/' + w.low + '°'),
            ),
          ),
        ),
      ),
    )
  );
}

// ─── View Switch ────────────────────────────────
function ViewSwitch({ view, onChange }) {
  const views = [
    { k: 'timeline', label: '時間軸 Timeline' },
    { k: 'map',      label: '地圖 Map' },
    { k: 'checklist',label: '清單 Checklist' },
    { k: 'budget',   label: '預算 Budget' },
  ];
  return (
    React.createElement('div', { className: 'view-switch' },
      views.map(v =>
        React.createElement('button', {
          key: v.k,
          className: 'view-btn' + (view === v.k ? ' active' : ''),
          onClick: () => onChange(v.k),
        }, v.label)
      )
    )
  );
}

// ─── Timeline View ──────────────────────────────
function TimelineView({ day, onPick }) {
  return (
    React.createElement('div', { className: 'timeline' },
      React.createElement('div', { className: 'timeline-rail' },
        React.createElement('div', { className: 'rail-line' }),
        day.events.map((_, i) => {
          const t = (i / Math.max(1, day.events.length - 1)) * 100;
          const cls = 'rail-tick' + (i === 0 ? ' start' : '') + (i === day.events.length - 1 ? ' end' : '');
          return React.createElement('div', { key: i, className: cls, style: { top: 'calc(' + t + '% - 8px)' } });
        }),
      ),
      React.createElement('div', { className: 'events' },
        day.events.map((ev, i) =>
          React.createElement('div', { key: i, className: 'event', onClick: () => onPick(ev) },
            React.createElement('div', null,
              React.createElement('div', { className: 'event-time mono' }, ev.time),
              React.createElement('div', { className: 'event-emoji' }, ev.type),
            ),
            React.createElement('div', { className: 'event-body' },
              React.createElement('h4', { className: 'event-title' },
                React.createElement('span', { className: 'event-icon' }, ev.emoji),
                ev.title,
              ),
              ev.note && React.createElement('div', { className: 'event-note' }, ev.note),
              ev.mapsUrl && React.createElement('a', {
                className: 'event-link',
                href: ev.mapsUrl, target: '_blank', rel: 'noreferrer',
                onClick: (e) => e.stopPropagation(),
              }, '在 Google Maps 開啟 →'),
            ),
          )
        )
      ),
      React.createElement('aside', { className: 'aside' },
        // meals
        React.createElement('div', { className: 'card' },
          React.createElement('div', { className: 'card-eyebrow' }, '餐廳重點 Restaurants'),
          React.createElement('h3', { className: 'serif card-title' }, '今日推薦'),
          day.meals.map((m, i) =>
            React.createElement('div', { key: i, className: 'meal' },
              React.createElement('div', { className: 'meal-slot' }, m.slot),
              React.createElement('div', null,
                React.createElement('div', { className: 'meal-name' }, m.name),
                React.createElement('div', { className: 'meal-type' }, m.type,
                  m.url && React.createElement('a', {
                    className: 'meal-link', href: m.url, target: '_blank', rel: 'noreferrer'
                  }, '📍'),
                ),
              ),
              React.createElement('div', { className: 'meal-rating' }, m.rating),
            )
          )
        ),
        // tips
        React.createElement('div', { className: 'card' },
          React.createElement('div', { className: 'card-eyebrow' }, '今日提醒 Notes'),
          React.createElement('h3', { className: 'serif card-title' }, '記得這些'),
          React.createElement('ul', { className: 'tips-list' },
            day.tips.map((t, i) => React.createElement('li', { key: i }, t))
          ),
        ),
        // photo spot
        React.createElement('div', { className: 'card photo-spot' },
          React.createElement('div', { className: 'card-eyebrow' }, '拍照打卡 Photo Spot'),
          React.createElement('p', null, day.photoSpot),
        ),
      )
    )
  );
}

// ─── Map View ───────────────────────────────────
function MapView({ day, onPick }) {
  const [hovered, setHovered] = useState(null);
  const placedEvents = day.events.filter(e => e.lat && e.lng);

  // determine if we should use Tokyo or wide bbox
  const useWide = placedEvents.some(e => e.lng > 139.85 || e.lng < 139.65);
  const proj = useWide ? project : projectTokyo;

  // build label points for region names
  const regions = [
    { name: '上野', lat: 35.7126, lng: 139.7770 },
    { name: '東京駅', lat: 35.6812, lng: 139.7671 },
    { name: '秋葉原', lat: 35.6989, lng: 139.7731 },
    { name: '新宿', lat: 35.6895, lng: 139.7005 },
    { name: '池袋', lat: 35.7295, lng: 139.7109 },
    { name: '澀谷', lat: 35.6595, lng: 139.7004 },
    { name: '原宿', lat: 35.6707, lng: 139.7027 },
    { name: '淺草', lat: 35.7148, lng: 139.7967 },
    { name: '東京鐵塔', lat: 35.6586, lng: 139.7454 },
    { name: '晴空塔', lat: 35.7101, lng: 139.8107 },
  ];

  return (
    React.createElement('div', { className: 'map-wrap' },
      React.createElement('div', { className: 'map-canvas' },
        React.createElement('div', { className: 'map-grid' }),
        // SVG: region rings + connector lines
        React.createElement('svg', { className: 'map-svg', viewBox: '0 0 100 100', preserveAspectRatio: 'none' },
          // route line connecting events in order
          React.createElement('polyline', {
            points: placedEvents.map(e => {
              const p = proj(e.lat, e.lng, 100, 100);
              return p.x + ',' + p.y;
            }).join(' '),
            fill: 'none',
            stroke: 'var(--vermillion)',
            strokeWidth: '0.4',
            strokeDasharray: '1.2 0.8',
            opacity: '0.6',
            vectorEffect: 'non-scaling-stroke',
          }),
        ),
        // region labels (light)
        regions.map((r, i) => {
          const p = proj(r.lat, r.lng, 100, 100);
          if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) return null;
          return React.createElement('div', {
            key: i,
            style: {
              position: 'absolute',
              left: p.x + '%',
              top: p.y + '%',
              transform: 'translate(-50%, -50%)',
              fontSize: '10px',
              color: 'var(--ink-4)',
              letterSpacing: '0.1em',
              pointerEvents: 'none',
              fontFamily: 'Noto Serif JP, serif',
              opacity: 0.55,
            }
          }, r.name);
        }),
        // pins
        placedEvents.map((ev, i) => {
          const p = proj(ev.lat, ev.lng, 100, 100);
          const isHover = hovered === i;
          return React.createElement('div', {
            key: i,
            className: 'map-pin' + (isHover ? ' active' : ''),
            style: { left: p.x + '%', top: p.y + '%' },
            onMouseEnter: () => setHovered(i),
            onMouseLeave: () => setHovered(null),
            onClick: () => onPick(ev),
          },
            React.createElement('div', { className: 'map-pin-dot' },
              React.createElement('span', { className: 'map-pin-num' }, i + 1),
            ),
            React.createElement('div', { className: 'map-pin-label' }, ev.time + ' · ' + ev.title),
          );
        }),
        React.createElement('div', { className: 'map-legend' },
          React.createElement('div', { className: 'map-legend-title' }, day.date + ' · ' + placedEvents.length + ' STOPS'),
          React.createElement('div', { className: 'mono' }, day.areas.join(' → ')),
        ),
      ),
      React.createElement('div', { className: 'map-list' },
        placedEvents.map((ev, i) =>
          React.createElement('div', {
            key: i,
            className: 'map-list-item' + (hovered === i ? ' active' : ''),
            onMouseEnter: () => setHovered(i),
            onMouseLeave: () => setHovered(null),
            onClick: () => onPick(ev),
          },
            React.createElement('div', { className: 'map-list-num' }, String(i + 1).padStart(2, '0')),
            React.createElement('div', null,
              React.createElement('div', { className: 'map-list-title' }, ev.emoji + ' ' + ev.title),
              React.createElement('div', { className: 'map-list-time mono' }, ev.time),
              ev.note && React.createElement('div', { className: 'map-list-note' }, ev.note),
            ),
          )
        )
      )
    )
  );
}

// ─── Checklist View ─────────────────────────────
function ChecklistView({ packing, dayId }) {
  const [done, setDone] = useLocalStorage('tokyo2026-checklist', {});
  const [dayDone, setDayDone] = useLocalStorage('tokyo2026-day-checklist', {});

  const sections = [
    { key: 'essentials',  title: '出發必備 Essentials',  items: packing.essentials },
    { key: 'clothing',    title: '衣物 Clothing',         items: packing.clothing },
    { key: 'toiletries',  title: '盥洗 Toiletries',       items: packing.toiletries },
    { key: 'gadgets',     title: '電子用品 Gadgets',      items: packing.gadgets },
    { key: 'paperwork',   title: '證件文件 Paperwork',    items: packing.paperwork },
  ];

  // also include current day's checklist if d6
  const currentDay = TRIP.days.find(d => d.id === dayId);
  const dayList = currentDay && currentDay.checklist;

  function toggle(secKey, item) {
    const k = secKey + ':' + item;
    setDone(prev => ({ ...prev, [k]: !prev[k] }));
  }
  function toggleDay(item) {
    setDayDone(prev => ({ ...prev, [item]: !prev[item] }));
  }

  return (
    React.createElement('div', null,
      React.createElement('div', { className: 'checklist-grid' },
        sections.map(sec => {
          const total = sec.items.length;
          const checked = sec.items.filter(it => done[sec.key + ':' + it]).length;
          const pct = total ? (checked / total) * 100 : 0;
          return React.createElement('div', { key: sec.key, className: 'checklist-section' },
            React.createElement('h3', { className: 'serif checklist-h' },
              sec.title,
              React.createElement('span', { className: 'checklist-progress' }, checked + '/' + total),
            ),
            React.createElement('div', { className: 'checklist-bar' },
              React.createElement('div', { className: 'checklist-bar-fill', style: { width: pct + '%' } }),
            ),
            sec.items.map(it => {
              const k = sec.key + ':' + it;
              const isDone = !!done[k];
              return React.createElement('div', {
                key: it,
                className: 'check' + (isDone ? ' done' : ''),
                onClick: () => toggle(sec.key, it),
              },
                React.createElement('div', { className: 'check-box' }),
                React.createElement('div', { className: 'check-label' }, it),
              );
            })
          );
        }),
        dayList && React.createElement('div', { className: 'checklist-section', style: { gridColumn: '1 / -1', background: 'var(--ink)', color: 'var(--paper)' } },
          React.createElement('h3', { className: 'serif checklist-h', style: { color: 'var(--paper)' } },
            '返程日離開前清單 Last Day',
            React.createElement('span', { className: 'checklist-progress', style: { color: '#E0B574' } },
              dayList.filter(it => dayDone[it]).length + '/' + dayList.length),
          ),
          React.createElement('div', { className: 'checklist-bar', style: { background: '#3A352E' } },
            React.createElement('div', { className: 'checklist-bar-fill', style: {
              background: '#E0B574',
              width: (dayList.filter(it => dayDone[it]).length / dayList.length) * 100 + '%'
            } }),
          ),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 24px' } },
            dayList.map(it => {
              const isDone = !!dayDone[it];
              return React.createElement('div', {
                key: it,
                className: 'check' + (isDone ? ' done' : ''),
                onClick: () => toggleDay(it),
                style: { color: 'var(--paper)' },
              },
                React.createElement('div', { className: 'check-box', style: { borderColor: 'var(--paper)', background: 'transparent' } }),
                React.createElement('div', { className: 'check-label' }, it),
              );
            })
          )
        ),
      )
    )
  );
}

// ─── Budget View ────────────────────────────────
function BudgetView({ budget }) {
  const total = budget.categories.reduce((s, c) => s + (c.twd ? c.amount / budget.rate : c.amount), 0);
  const totalTwd = total * budget.rate;
  const max = Math.max(...budget.categories.map(c => c.twd ? c.amount / budget.rate : c.amount));

  function fmtJPY(n) { return '¥' + Math.round(n).toLocaleString(); }
  function fmtTWD(n) { return 'NT$ ' + Math.round(n).toLocaleString(); }

  return (
    React.createElement('div', { className: 'budget' },
      React.createElement('div', { className: 'budget-summary' },
        React.createElement('div', { className: 'budget-total-label' }, '預估總預算 / 每人'),
        React.createElement('div', { className: 'budget-total-jpy' }, fmtJPY(total)),
        React.createElement('div', { className: 'budget-total-twd' }, '≈ ' + fmtTWD(totalTwd)),
        React.createElement('div', { className: 'budget-rate' }, '匯率 1 JPY ≈ ' + budget.rate.toFixed(2) + ' TWD'),
        React.createElement('div', { style: { marginTop: 32, fontSize: 12, lineHeight: 1.6, color: '#E0B574' } },
          '※ 以上為兩人 6 天 5 夜估算，實際會依購物量浮動。',
        ),
      ),
      React.createElement('div', null,
        React.createElement('div', { className: 'card-eyebrow' }, '分類細項 Breakdown'),
        React.createElement('div', { className: 'budget-list' },
          budget.categories.map(c => {
            const jpy = c.twd ? c.amount / budget.rate : c.amount;
            const twd = jpy * budget.rate;
            const w = (jpy / max) * 100;
            return React.createElement('div', { key: c.key },
              React.createElement('div', { className: 'budget-row' },
                React.createElement('div', { className: 'budget-cat' }, c.label),
                React.createElement('div', { className: 'budget-amt' }, fmtJPY(jpy)),
                React.createElement('div', { className: 'budget-twd' }, fmtTWD(twd)),
              ),
              React.createElement('div', { className: 'budget-bar' },
                React.createElement('div', { className: 'budget-bar-fill', style: { width: w + '%' } }),
              )
            );
          })
        ),
      )
    )
  );
}

// ─── Detail Modal ───────────────────────────────
function Detail({ event, onClose }) {
  if (!event) return null;
  const proj = projectTokyo;
  const hasMap = event.lat && event.lng;
  const p = hasMap ? proj(event.lat, event.lng, 100, 100) : null;

  return (
    React.createElement('div', { className: 'detail-overlay', onClick: onClose },
      React.createElement('div', { className: 'detail', onClick: (e) => e.stopPropagation() },
        React.createElement('div', { className: 'detail-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'detail-eyebrow' }, event.time + ' · ' + (event.type || '').toUpperCase()),
            React.createElement('h2', { className: 'serif detail-title' }, event.emoji + ' ' + event.title),
          ),
          React.createElement('button', { className: 'detail-close', onClick: onClose }, '✕'),
        ),
        React.createElement('div', { className: 'detail-body' },
          event.note && React.createElement('div', { className: 'detail-row' },
            React.createElement('div', { className: 'detail-key' }, '備註'),
            React.createElement('div', { className: 'detail-val' }, event.note),
          ),
          event.lat && React.createElement('div', { className: 'detail-row' },
            React.createElement('div', { className: 'detail-key' }, '座標'),
            React.createElement('div', { className: 'detail-val mono' },
              event.lat.toFixed(4) + ', ' + event.lng.toFixed(4),
            ),
          ),
          event.mapsUrl && React.createElement('div', { className: 'detail-row' },
            React.createElement('div', { className: 'detail-key' }, '地圖'),
            React.createElement('div', { className: 'detail-val' },
              React.createElement('a', {
                href: event.mapsUrl, target: '_blank', rel: 'noreferrer',
                style: { color: 'var(--vermillion)' }
              }, '在 Google Maps 開啟 →'),
            ),
          ),
          hasMap && p && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 &&
            React.createElement('div', { className: 'detail-map' },
              React.createElement('div', { className: 'map-grid' }),
              React.createElement('div', {
                className: 'map-pin active',
                style: { left: p.x + '%', top: p.y + '%' }
              },
                React.createElement('div', { className: 'map-pin-dot' },
                  React.createElement('span', { className: 'map-pin-num' }, '★'),
                ),
              ),
            )
        ),
      )
    )
  );
}

// ─── Weather Strip ──────────────────────────────
function WeatherStrip({ weather, activeIdx, onSelect }) {
  return (
    React.createElement('div', { className: 'weather-strip' },
      weather.map((w, i) =>
        React.createElement('div', {
          key: i,
          className: 'weather-cell' + (i === activeIdx ? ' active' : ''),
          onClick: () => onSelect(i),
        },
          React.createElement('div', { className: 'weather-date' }, w.date),
          React.createElement('div', { className: 'weather-icon' }, w.icon),
          React.createElement('div', { className: 'weather-temp mono' }, w.high + '° / ' + w.low + '°'),
          React.createElement('div', { className: 'weather-cond' }, w.cond),
        )
      )
    )
  );
}

// ─── Extras Footer Panel ────────────────────────
function ExtrasPanel({ meta }) {
  return (
    React.createElement('section', { className: 'extras-grid' },
      React.createElement('div', { className: 'extras-card' },
        React.createElement('h4', { className: 'serif extras-title' }, '✈ 航班資訊 Flights'),
        React.createElement('ul', { className: 'extras-list' },
          React.createElement('li', null,
            React.createElement('span', null, meta.flights.out.date + ' ' + meta.flights.out.code),
            React.createElement('span', { className: 'mono' }, meta.flights.out.dep + '→' + meta.flights.out.arr),
          ),
          React.createElement('li', null,
            React.createElement('span', null, '　' + meta.flights.out.from + ' → ' + meta.flights.out.to),
            React.createElement('span', { className: 'mono' }, meta.flights.out.duration),
          ),
          React.createElement('li', null,
            React.createElement('span', null, meta.flights.back.date + ' ' + meta.flights.back.code),
            React.createElement('span', { className: 'mono' }, meta.flights.back.dep + '→' + meta.flights.back.arr),
          ),
          React.createElement('li', null,
            React.createElement('span', null, '　' + meta.flights.back.from + ' → ' + meta.flights.back.to),
            React.createElement('span', { className: 'mono' }, meta.flights.back.duration),
          ),
        ),
      ),
      React.createElement('div', { className: 'extras-card' },
        React.createElement('h4', { className: 'serif extras-title' }, '🏨 住宿 Hotel'),
        React.createElement('ul', { className: 'extras-list' },
          React.createElement('li', null, React.createElement('span', null, meta.hotel.name)),
          React.createElement('li', null, React.createElement('span', null, meta.hotel.address)),
          React.createElement('li', null,
            React.createElement('span', null, 'Check-in'),
            React.createElement('span', { className: 'mono' }, meta.hotel.checkIn)),
          React.createElement('li', null,
            React.createElement('span', null, 'Check-out'),
            React.createElement('span', { className: 'mono' }, meta.hotel.checkOut)),
        ),
      ),
      React.createElement('div', { className: 'extras-card' },
        React.createElement('h4', { className: 'serif extras-title' }, '☎ 緊急聯絡 Emergency'),
        React.createElement('ul', { className: 'extras-list' },
          meta.emergency.map((e, i) =>
            React.createElement('li', { key: i },
              React.createElement('span', null, e.label),
              React.createElement('span', { className: 'mono' }, e.phone),
            )
          )
        ),
      ),
    )
  );
}

// ─── App ────────────────────────────────────────
function App() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [view, setView] = useState('timeline');
  const [picked, setPicked] = useState(null);

  const day = TRIP.days[activeIdx];
  const weatherIdx = TRIP.meta.weather.findIndex(w => w.date === day.date);

  // close detail on Esc
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setPicked(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    React.createElement('div', { className: 'app' },
      React.createElement(Masthead, null),
      React.createElement(DayTabs, { days: TRIP.days, activeIdx, onSelect: setActiveIdx }),
      React.createElement(Hero, { day, weather: TRIP.meta.weather }),
      React.createElement(WeatherStrip, {
        weather: TRIP.meta.weather,
        activeIdx: weatherIdx,
        onSelect: (i) => {
          // jump to corresponding day
          const targetDate = TRIP.meta.weather[i].date;
          const dIdx = TRIP.days.findIndex(d => d.date === targetDate);
          if (dIdx >= 0) setActiveIdx(dIdx);
        },
      }),
      React.createElement(ViewSwitch, { view, onChange: setView }),

      view === 'timeline' && React.createElement(TimelineView, { day, onPick: setPicked }),
      view === 'map' && React.createElement(MapView, { day, onPick: setPicked }),
      view === 'checklist' && React.createElement(ChecklistView, { packing: TRIP.meta.packing, dayId: day.id }),
      view === 'budget' && React.createElement(BudgetView, { budget: TRIP.meta.budget }),

      // pull quote at end of timeline
      view === 'timeline' && day.pullQuote &&
        React.createElement('blockquote', { className: 'pullquote serif' }, day.pullQuote),

      React.createElement(ExtrasPanel, { meta: TRIP.meta }),

      React.createElement('footer', { className: 'colophon' },
        React.createElement('div', null,
          React.createElement('div', { className: 'colophon-title' }, 'Tokyo Travelogue'),
          'Issue 06 / June 2026',
        ),
        React.createElement('div', null,
          React.createElement('div', { className: 'colophon-title' }, 'Itinerary by'),
          'Two Travelers, One Notebook',
        ),
        React.createElement('div', null,
          React.createElement('div', { className: 'colophon-title' }, 'Printed in'),
          'Taipei → Tokyo',
        ),
      ),

      React.createElement(Detail, { event: picked, onClose: () => setPicked(null) }),
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
