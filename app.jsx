/* Main app: state, filtering, tweaks, design tokens. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "style": "refined",
  "accent": ["#7c4dff", "#00e5ff"],
  "cardMin": 210,
  "radius": 12,
  "font": "Space Grotesk"
}/*EDITMODE-END*/;

const FONT_STACKS = {
  'Space Grotesk': "'Space Grotesk', system-ui, sans-serif",
  'Archivo': "'Archivo', system-ui, sans-serif",
  'System': "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const ACCENT_OPTIONS = [
  ['#7c4dff', '#00e5ff'],
  ['#00e5ff', '#00e5ff'],
  ['#ff7a18', '#ff3d6e'],
  ['#3a86ff', '#3a86ff'],
  ['#22d3a6', '#22d3a6'],
];

function buildTree(categories) {
  const tree = {};
  categories.forEach(function(path) {
    var parts = path.split('/');
    var node = tree;
    for (var i = 0; i < parts.length; i++) {
      if (!node[parts[i]]) node[parts[i]] = {};
      node = node[parts[i]];
    }
  });
  return tree;
}

function buildCounts(items) {
  // Count per exact path AND every ancestor path
  var out = {};
  items.forEach(function(it) {
    var parts = it.category.split('/');
    for (var i = 1; i <= parts.length; i++) {
      var path = parts.slice(0, i).join('/');
      out[path] = (out[path] || 0) + 1;
    }
  });
  return out;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [catalog, setCatalog] = useState(window.VFX_CATALOG);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('category');
  const [active, setActive] = useState(null); // modal item
  const [toast, setToast] = useState(null);

  // Preview panel state (floating overlay)
  const [previewItem, setPreviewItem] = useState(null);

  // Card click: first click = preview, second click same card = modal
  function handleCardClick(item) {
    if (previewItem && previewItem.id === item.id) {
      setActive(item);
    } else {
      setPreviewItem(item);
    }
  }

  // Admin state
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // WebGL viewer state
  const [webglReady, setWebglReady] = useState(false);
  const [webglLoading, setWebglLoading] = useState(false);

  // Initialize WebGL viewer on mount
  useEffect(function () {
    WebGLBridge.init();
    WebGLBridge.onReady = function () { setWebglReady(true); };
    WebGLBridge.onLoaded = function () { setWebglLoading(false); };
    WebGLBridge.onError = function (err) { console.error('WebGL error:', err); setWebglLoading(false); };
  }, []);

  // Fetch catalog from server on mount
  useEffect(() => {
    VFX_API.fetchCatalog().then(data => {
      setCatalog(data);
      setLoading(false);
    });
  }, []);

  // Check for OAuth token on page load (from redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('vfx_token', token);
      window.history.replaceState({}, document.title, '/');
    }

    const savedToken = localStorage.getItem('vfx_token');
    if (savedToken) {
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ name: payload.name, email: payload.email });
        } else {
          localStorage.removeItem('vfx_token');
        }
      } catch (e) {
        localStorage.removeItem('vfx_token');
      }
    }
  }, []);

  const tree = useMemo(() => buildTree(catalog.categories), [catalog]);
  const counts = useMemo(() => buildCounts(catalog.items), [catalog]);

  // keyboard "/" focuses search
  useEffect(() => {
    const h = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const el = document.querySelector('.search input');
        if (el) el.focus();
      }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const filtered = useMemo(() => {
    let items = catalog.items.slice();
    if (category) items = items.filter(it => it.category === category || it.category.startsWith(category + '/'));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(it => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q));
    }
    if (sort === 'category') items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    else if (sort === 'recent') items.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    else if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'size') items.sort((a, b) => b.fileSize - a.fileSize);
    return items;
  }, [catalog, category, search, sort]);

  const featured = useMemo(() => catalog.items.filter(it => it.featured), [catalog]);
  const showFeatured = !category && !search.trim() && t.style !== 'dense';

  function doDownload(item, platform) {
    // Actually download the file
    const link = document.createElement('a');
    link.href = VFX_API.downloadUrl(item.id);
    link.download = item.name + '.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show toast
    setToast({ name: item.name, signed: !!user, platform: platform || null });
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(() => setToast(null), 2800);
  }

  // design tokens
  const accent = Array.isArray(t.accent) ? t.accent : [t.accent, t.accent];
  const rootStyle = {
    '--accent': accent[0],
    '--accent-2': accent[1] || accent[0],
    '--accent-grad': accent[0] === accent[1]
      ? accent[0]
      : `linear-gradient(120deg, ${accent[0]}, ${accent[1]})`,
    '--card-min': t.cardMin + 'px',
    '--radius': t.radius + 'px',
    '--font': FONT_STACKS[t.font] || FONT_STACKS['Space Grotesk'],
  };

  const title = category || 'All effects';

  return (
    <div className="hub-root" data-style={t.style} style={rootStyle}>
      <Header user={user} search={search} setSearch={setSearch}
        onLogin={() => { window.location.href = '/auth/google'; }}
        onLogout={() => { localStorage.removeItem('vfx_token'); setUser(null); }}
        onAdminTrigger={() => { if (adminToken) { setShowAdmin(true); } else { setShowAdminPw(true); } }} />

      <div className="layout">
        <Sidebar tree={tree} counts={counts} total={catalog.items.length} current={category} onPick={setCategory} />

        <main className="content">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', opacity: 0.5 }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--accent, #7c4dff)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontFamily: 'var(--font)', fontSize: 14, color: '#888' }}>Loading catalog...</p>
              <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
            </div>
          ) : (
            <>
              <div className="crumbs">
                <span>Library</span>
                <span className="sep">/</span>
                <b>{title}</b>
              </div>
              <div className="content-head">
                <div>
                  <h1>{title}</h1>
                  <div className="result-count"><b>{filtered.length}</b> {filtered.length === 1 ? 'effect' : 'effects'}{search.trim() ? ' matching "' + search.trim() + '"' : ''}</div>
                </div>
                <div className="sortbar">
                  <div className="seg">
                    <button className={sort === 'category' ? 'on' : ''} onClick={() => setSort('category')}>Category</button>
                    <button className={sort === 'recent' ? 'on' : ''} onClick={() => setSort('recent')}>Recent</button>
                    <button className={sort === 'name' ? 'on' : ''} onClick={() => setSort('name')}>Name</button>
                    <button className={sort === 'size' ? 'on' : ''} onClick={() => setSort('size')}>Size</button>
                  </div>
                </div>
              </div>

              {showFeatured && featured.length > 0 && (
                <div className="featured">
                  <div className="featured-head">
                    <span className="dot" />
                    <h2>Featured this week</h2>
                  </div>
                  <div className="featured-row">
                    {featured.map(it => <Card key={it.id} item={it} featured onOpen={setActive} onDownload={doDownload} onPreview={handleCardClick} user={user} />)}
                  </div>
                </div>
              )}

              <Grid items={filtered} onOpen={setActive} onDownload={doDownload} onPreview={handleCardClick} user={user} />
            </>
          )}
        </main>
      </div>

      {active && <Modal item={active} onClose={function () { setActive(null); }}
        onDownload={doDownload} user={user} />}

      {toast && (
        <div className="toast">
          <span className="toast-ico"><SvgIco d={window.VFXIcons.I.download} size={16} /></span>
          <div>
            <div className="toast-t">{toast.platform && !toast.platform.ready ? <span>Coming soon — <b>{toast.platform.label}</b> export</span> : <span>Downloading <b>{toast.name}</b>{toast.platform ? ' · ' + toast.platform.label : ''}</span>}</div>
            <div className="toast-s">{toast.platform && !toast.platform.ready ? 'This engine export is on the roadmap. Copy the URL to get notified.' : (toast.signed ? 'Package queued · check your downloads' : 'Demo · sign in to download real packages')}</div>
          </div>
        </div>
      )}

      {previewItem && <PreviewPanel
        item={previewItem}
        webglReady={webglReady}
        webglLoading={webglLoading}
        onWebglLoad={function () { setWebglLoading(true); }}
        onClose={function () { setPreviewItem(null); }} />}

      <TweaksPanel>
        <TweakSection label="Style direction" />
        <TweakRadio label="Theme" value={t.style}
          options={[{ value: 'refined', label: 'Refined' }, { value: 'neon', label: 'Neon' }, { value: 'dense', label: 'Dense' }]}
          onChange={(v) => setTweak('style', v)} />

        <TweakSection label="Accent" />
        <TweakColor label="Color" value={t.accent} options={ACCENT_OPTIONS}
          onChange={(v) => setTweak('accent', v)} />

        <TweakSection label="Layout" />
        <TweakSlider label="Card size" value={t.cardMin} min={160} max={300} step={5} unit="px"
          onChange={(v) => setTweak('cardMin', v)} />
        <TweakSlider label="Corner radius" value={t.radius} min={0} max={22} step={1} unit="px"
          onChange={(v) => setTweak('radius', v)} />

        <TweakSection label="Typography" />
        <TweakRadio label="Font" value={t.font}
          options={['Space Grotesk', 'Archivo', 'System']}
          onChange={(v) => setTweak('font', v)} />
      </TweaksPanel>

      {showAdminPw && <AdminPasswordModal
        onSuccess={(token) => { setAdminToken(token); setShowAdminPw(false); setShowAdmin(true); }}
        onClose={() => setShowAdminPw(false)} />}

      {showAdmin && adminToken && <AdminPanel
        adminToken={adminToken}
        catalog={catalog}
        onCatalogChange={(data) => setCatalog(data)}
        onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
