/* Presentational components for the hub. */
const { I: Ic, Svg: SvgIco, catMeta } = window.VFXIcons;

function fmtSize(bytes) {
  if (bytes == null || isNaN(bytes)) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}
function initials(name) {
  return String(name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ── Header ───────────────────────────────────────────────── */
function Header({ user, onLogin, onLogout, search, setSearch, onAdminTrigger }) {
  var _clicks = useRef(0);
  var _timer = useRef(null);

  function handleLogoClick() {
    _clicks.current++;
    if (_timer.current) clearTimeout(_timer.current);
    if (_clicks.current >= 5) {
      _clicks.current = 0;
      if (onAdminTrigger) onAdminTrigger();
    } else {
      _timer.current = setTimeout(function () { _clicks.current = 0; }, 2000);
    }
  }

  return (
    <header className="hdr">
      <div className="brand" onClick={handleLogoClick} style={{ cursor: 'default', userSelect: 'none' }}>
        <span className="brand-mark">
          <svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.2 6.6L21 9.2l-5.5 4.1L17.6 20 12 16l-5.6 4 2.1-6.7L3 9.2l6.8-.6z" /></svg>
        </span>
        <span className="brand-name"><b>IKAME</b> <span className="brand-sub">VFX Hub</span></span>
      </div>

      <div className="search">
        <SvgIco d={Ic.search} size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search effects, categories…" />
        <kbd>/</kbd>
      </div>

      <div className="hdr-right">
        <button className="btn btn-ghost"><SvgIco d={Ic.layers} size={15} /> Upload</button>
        {user ? (
          <div className="user-chip">
            <span className="avatar">{initials(user.name)}</span>
            <span className="uname">{user.name}</span>
            <button className="btn btn-ghost" onClick={onLogout} style={{ padding: '7px 11px' }}>Logout</button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={onLogin}>
            <SvgIco d={Ic.google} size={16} /> Sign in
          </button>
        )}
      </div>
    </header>
  );
}

/* ── Sidebar ──────────────────────────────────────────────── */
function Sidebar({ tree, counts, total, current, onPick }) {
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    Object.keys(tree).forEach(r => { init[r] = true; });
    return init;
  });

  return (
    <aside className="sidebar">
      <div className="side-title">Library</div>
      <div className={'cat' + (current === null ? ' active' : '')} onClick={() => onPick(null)}>
        <span className="cat-ico"><SvgIco d={Ic.grid} size={15} /></span>
        <span className="cat-name">All effects</span>
        <span className="cat-count">{total}</span>
      </div>

      <div className="side-sep" />
      <div className="side-title">Categories</div>

      {Object.keys(tree).sort().map(root => {
        const children = tree[root];
        const hasKids = children.length > 0;
        const meta = catMeta(root);
        const isOpen = expanded[root];
        const rootActive = current === root;
        return (
          <div key={root}>
            <div
              className={'cat' + (rootActive ? ' active' : '') + (hasKids && isOpen ? ' expanded' : '')}
              onClick={() => { onPick(root); if (hasKids) setExpanded(s => ({ ...s, [root]: !s[root] })); }}
            >
              <span className="cat-ico" style={{ color: rootActive ? meta.hue : undefined }}>
                <SvgIco d={meta.icon} size={15} />
              </span>
              <span className="cat-name">{root}</span>
              <span className="cat-count">{counts[root] || 0}</span>
              {hasKids && <span className="chev"><SvgIco d={Ic.chev} size={13} /></span>}
            </div>
            {hasKids && isOpen && (
              <div className="cat-children">
                {children.map(ch => {
                  const full = root + '/' + ch;
                  return (
                    <div key={full} className={'cat cat-child' + (current === full ? ' active' : '')}
                         onClick={(e) => { e.stopPropagation(); onPick(full); }}>
                      <span className="cat-name">{ch}</span>
                      <span className="cat-count">{counts[full] || 0}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

/* ── Card ─────────────────────────────────────────────────── */
function Card({ item, onOpen, onDownload, featured }) {
  const meta = catMeta(item.category);
  return (
    <div className="card" onClick={() => onOpen(item)}>
      <div className="card-thumb">
        <img
          src={VFX_API.thumbnailUrl(item.id)}
          alt={item.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <span className="card-cat-badge">
          <span className="swatch" style={{ background: meta.hue }} />
          {item.category}
        </span>
        <button className="card-quickdl" title="Download package"
                onClick={(e) => { e.stopPropagation(); onDownload(item); }}>
          <SvgIco d={Ic.download} size={16} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-name">{item.name}</div>
        <div className="card-meta">
          <span className="m"><SvgIco d={Ic.spark} size={12} /> {item.particleCount}</span>
          <span className="m"><SvgIco d={Ic.weight} size={12} /> {fmtSize(item.fileSize)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Grid ─────────────────────────────────────────────────── */
function Grid({ items, onOpen, onDownload }) {
  if (!items.length) {
    return (
      <div className="grid">
        <div className="empty">
          <div className="eico"><SvgIco d={Ic.search} size={46} sw={1.4} /></div>
          <h3>No effects found</h3>
          <p>Try a different search term or category.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid">
      {items.map(it => <Card key={it.id} item={it} onOpen={onOpen} onDownload={onDownload} />)}
    </div>
  );
}

/* ── Download zone (platform dropdown + copy URL) ─────────── */
const PLATFORMS = [
  { id: 'unity',  label: 'Unity',         ext: '.unitypackage', ready: true  },
  { id: 'unreal', label: 'Unreal Engine', ext: '.uasset',       ready: false },
  { id: 'godot',  label: 'Godot',         ext: '.zip',          ready: false },
  { id: 'raw',    label: 'Raw assets',    ext: '.zip',          ready: true  },
];

function DownloadZone({ item, onDownload }) {
  const [platform, setPlatform] = useState('unity');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef(null);
  const p = PLATFORMS.find(x => x.id === platform);
  const url = VFX_API.downloadUrl(item.id);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const copy = () => {
    try { navigator.clipboard.writeText(url); } catch (e) { /* ignore */ }
    setCopied(true);
    clearTimeout(window.__copyT);
    window.__copyT = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="dl-zone">
      <div className="dl-row">
        <div className="dl-picker" ref={wrapRef}>
          <button className={'dl-select' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)}>
            <span className="dl-eng"><SvgIco d={Ic.cube} size={15} /> {p.label}</span>
            <span className="chev"><SvgIco d={Ic.caret} size={14} /></span>
          </button>
          {open && (
            <div className="dl-menu">
              <div className="dl-menu-h">Download for</div>
              {PLATFORMS.map(opt => (
                <button key={opt.id} className={'dl-opt' + (opt.id === platform ? ' on' : '')}
                        onClick={() => { setPlatform(opt.id); setOpen(false); }}>
                  <SvgIco d={Ic.cube} size={15} />
                  <span className="dl-opt-label">{opt.label}</span>
                  <span className="dl-ext">{opt.ext}</span>
                  {opt.ready ? (opt.id === platform && <SvgIco d={Ic.check} size={14} />)
                            : <span className="dl-soon">soon</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="btn btn-primary btn-dl" onClick={() => onDownload(item, p)}>
          <SvgIco d={Ic.download} size={16} /> Download {p.ext} <span className="sz">{fmtSize(item.fileSize)}</span>
        </button>
      </div>

      <div className="dl-url">
        <span className="dl-url-ico"><SvgIco d={Ic.link} size={14} /></span>
        <input className="dl-url-input" readOnly value={url} onFocus={e => e.target.select()} />
        <button className={'dl-copy' + (copied ? ' done' : '')} onClick={copy}>
          <SvgIco d={copied ? Ic.check : Ic.copy} size={14} /> {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="dl-hint">Paste this link into a download manager or your asset pipeline to fetch the package.</p>
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────── */
function Modal({ item, onClose, onDownload, webglReady, webglLoading, onWebglLoad }) {
  var previewRef = useRef(null);

  useEffect(function () {
    var k = function (e) { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return function () { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [item]);

  // When modal opens and WebGL is ready, attach viewer and load effect
  useEffect(function () {
    if (webglReady && previewRef.current && item) {
      WebGLBridge.attachTo(previewRef.current);
      WebGLBridge.loadEffect(item.id);
      if (onWebglLoad) onWebglLoad();
    }
  }, [item, webglReady]);

  if (!item) return null;
  var meta = catMeta(item.category);
  var deps = item.dependencies || [];

  return (
    <div className="modal-scrim" onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-preview" ref={previewRef}>
          {!webglReady && (
            <img
              src={VFX_API.thumbnailUrl(item.id)}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
          {webglLoading && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 5 }}>
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ width: 30, height: 30, border: '2px solid #7c4dff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }}></div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Loading effect...</div>
              </div>
            </div>
          )}
          <div className="mp-tools">
            <span className="mp-pill">{webglReady ? <><span className="live"></span> LIVE</> : 'PREVIEW'}</span>
            <span className="mp-pill">{item.category}</span>
          </div>
        </div>
        <div className="modal-info">
          <button className="modal-close" onClick={onClose}><SvgIco d={Ic.close} size={16} /></button>
          <div className="modal-cat" style={{ color: meta.hue }}>
            <SvgIco d={meta.icon} size={14} /> {item.category}
          </div>
          <h2>{item.name}</h2>
          <div className="uploader">
            <span className="avatar">{initials(item.uploadedBy)}</span>
            Uploaded by {item.uploadedBy} · {fmtDate(item.uploadedAt)}
          </div>

          <div className="specs">
            <div className="spec"><div className="sk">Particles</div><div className="sv">{item.particleCount}</div></div>
            <div className="spec"><div className="sk">Package size</div><div className="sv">{fmtSize(item.fileSize)}</div></div>
            <div className="spec"><div className="sk">Preview</div><div className="sv">{item.previewType}</div></div>
            <div className="spec"><div className="sk">Effect ID</div><div className="sv">{item.id}</div></div>
          </div>

          <div className="deps-h">Dependencies</div>
          <div className="deps">
            {deps.length ? deps.map((d, i) => <span key={i} className="dep">{d}</span>)
              : <span className="dep none">No dependencies</span>}
          </div>

          <div className="modal-foot">
            <DownloadZone item={item} onDownload={onDownload} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Header, Sidebar, Card, Grid, Modal, fmtSize, fmtDate });
