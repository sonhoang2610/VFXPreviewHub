/* Admin panel — hidden behind 5-click logo + password.
   Manages VFX items: delete single, bulk delete, delete by category, delete all, edit metadata. */

function AdminPasswordModal({ onSuccess, onClose }) {
  var _pw = useRef(null);
  var _err = useState('');
  var err = _err[0], setErr = _err[1];
  var _loading = useState(false);
  var loading = _loading[0], setLoading = _loading[1];

  function submit() {
    var pw = _pw.current ? _pw.current.value : '';
    if (!pw) { setErr('Enter password'); return; }
    setLoading(true);
    setErr('');
    fetch('/auth/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    })
    .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      setLoading(false);
      if (!res.ok) { setErr(res.data.error || 'Invalid password'); return; }
      onSuccess(res.data.token);
    })
    .catch(function () { setLoading(false); setErr('Connection error'); });
  }

  function onKey(e) { if (e.key === 'Enter') submit(); }

  return (
    <div className="modal-scrim" onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 16, padding: 28, width: 340, textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text)', marginBottom: 16, fontSize: '1.1rem' }}>Admin Access</h3>
        <input ref={_pw} type="password" placeholder="Password" onKeyDown={onKey}
          style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', marginBottom: 12 }} />
        {err && <div style={{ color: '#ff5a5a', fontSize: 13, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ adminToken, catalog, onCatalogChange, onClose }) {
  var _tab = useState('vfx');
  var tab = _tab[0], setTab = _tab[1];
  var _sel = useState({});
  var selected = _sel[0], setSelected = _sel[1];
  var _filter = useState('');
  var filter = _filter[0], setFilter = _filter[1];
  var _catFilter = useState(null);
  var catFilter = _catFilter[0], setCatFilter = _catFilter[1];
  var _busy = useState(false);
  var busy = _busy[0], setBusy = _busy[1];
  var _msg = useState(null);
  var msg = _msg[0], setMsg = _msg[1];
  var _editing = useState(null);
  var editing = _editing[0], setEditing = _editing[1];

  var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken };

  var items = catalog.items.filter(function (it) {
    if (catFilter && it.category !== catFilter && !it.category.startsWith(catFilter + '/')) return false;
    if (filter) {
      var q = filter.toLowerCase();
      return it.name.toLowerCase().indexOf(q) >= 0 || it.id.toLowerCase().indexOf(q) >= 0;
    }
    return true;
  });

  var selCount = Object.keys(selected).filter(function (k) { return selected[k]; }).length;
  var allSelected = items.length > 0 && items.every(function (it) { return selected[it.id]; });

  function toggleAll() {
    var next = {};
    if (!allSelected) { items.forEach(function (it) { next[it.id] = true; }); }
    setSelected(next);
  }

  function flash(text) { setMsg(text); setTimeout(function () { setMsg(null); }, 2500); }

  function refresh() {
    return VFX_API.fetchCatalog().then(function (data) { onCatalogChange(data); });
  }

  function deleteOne(id) {
    if (!confirm('Delete this VFX?')) return;
    setBusy(true);
    fetch('/api/vfx/' + id, { method: 'DELETE', headers: headers })
      .then(function () { return refresh(); })
      .then(function () { setBusy(false); flash('Deleted'); setSelected({}); })
      .catch(function () { setBusy(false); flash('Error deleting'); });
  }

  function deleteBulk() {
    var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
    if (ids.length === 0) return;
    if (!confirm('Delete ' + ids.length + ' selected items?')) return;
    setBusy(true);
    fetch('/api/vfx/admin/bulk-delete', { method: 'POST', headers: headers, body: JSON.stringify({ ids: ids }) })
      .then(function () { return refresh(); })
      .then(function () { setBusy(false); flash('Deleted ' + ids.length + ' items'); setSelected({}); })
      .catch(function () { setBusy(false); flash('Error'); });
  }

  function deleteCategory(cat) {
    if (!confirm('Delete ALL items in "' + cat + '"?')) return;
    setBusy(true);
    fetch('/api/vfx/admin/by-category/' + encodeURIComponent(cat), { method: 'DELETE', headers: headers })
      .then(function () { return refresh(); })
      .then(function () { setBusy(false); flash('Category deleted'); setSelected({}); setCatFilter(null); })
      .catch(function () { setBusy(false); flash('Error'); });
  }

  function deleteAll() {
    if (!confirm('DELETE ALL VFX? This cannot be undone!')) return;
    if (!confirm('Are you really sure? This deletes EVERYTHING.')) return;
    setBusy(true);
    fetch('/api/vfx/admin/all', { method: 'DELETE', headers: headers })
      .then(function () { return refresh(); })
      .then(function () { setBusy(false); flash('All deleted'); setSelected({}); setCatFilter(null); })
      .catch(function () { setBusy(false); flash('Error'); });
  }

  function saveEdit(id, fields) {
    setBusy(true);
    fetch('/api/vfx/' + id, { method: 'PATCH', headers: headers, body: JSON.stringify(fields) })
      .then(function () { return refresh(); })
      .then(function () { setBusy(false); setEditing(null); flash('Saved'); })
      .catch(function () { setBusy(false); flash('Error saving'); });
  }

  var cats = catalog.categories || [];

  return (
    <div className="modal-scrim" onClick={function (e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 16, width: 'min(900px, 95vw)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ color: 'var(--text)', fontSize: '1.05rem', flex: 1 }}>Admin Panel</h3>
          {msg && <span style={{ color: '#22d3a6', fontSize: 13, fontWeight: 600 }}>{msg}</span>}
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px 12px' }}>Close</button>
        </div>

        <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0 }}>
          {['vfx', 'meshes', 'shaders', 'materials', 'textures'].map(function (t) {
            return <button key={t} onClick={function () { setTab(t); setSelected({}); }}
              style={{ padding: '10px 16px', border: 'none', background: tab === t ? 'var(--surface-2)' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-mute)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', textTransform: 'capitalize' }}>{t}</button>;
          })}
        </div>

        {tab === 'vfx' && <><div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={filter} onChange={function (e) { setFilter(e.target.value); }}
            placeholder="Search by name or ID..."
            style={{ flex: 1, minWidth: 180, height: 34, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' }} />
          <select value={catFilter || ''} onChange={function (e) { setCatFilter(e.target.value || null); }}
            style={{ height: 34, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13 }}>
            <option value="">All categories</option>
            {cats.map(function (c) { return <option key={c} value={c}>{c}</option>; })}
          </select>

          {selCount > 0 && (
            <button className="btn" onClick={deleteBulk} disabled={busy}
              style={{ background: '#ff3b3b', color: '#fff', border: 'none', padding: '6px 14px', fontSize: 13 }}>
              Delete {selCount} selected
            </button>
          )}
          {catFilter && (
            <button className="btn" onClick={function () { deleteCategory(catFilter); }} disabled={busy}
              style={{ background: '#ff7a18', color: '#fff', border: 'none', padding: '6px 14px', fontSize: 13 }}>
              Delete category "{catFilter}"
            </button>
          )}
          <button className="btn" onClick={deleteAll} disabled={busy}
            style={{ background: '#991b1b', color: '#fff', border: 'none', padding: '6px 14px', fontSize: 13 }}>
            Delete ALL
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2 }}>
                <th style={{ padding: '8px 10px', width: 36, textAlign: 'center' }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-mute)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-mute)', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-mute)', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-mute)', fontWeight: 600 }}>Featured</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-mute)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(function (it) {
                var isEditing = editing === it.id;
                return (
                  <tr key={it.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <input type="checkbox" checked={!!selected[it.id]}
                        onChange={function () { var n = Object.assign({}, selected); n[it.id] = !n[it.id]; if (!n[it.id]) delete n[it.id]; setSelected(n); }} />
                    </td>
                    <td style={{ padding: '6px 10px', color: 'var(--text)' }}>
                      {isEditing ? <AdminEditRow item={it} onSave={saveEdit} onCancel={function () { setEditing(null); }} /> : it.name}
                    </td>
                    <td style={{ padding: '6px 10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{isEditing ? '' : it.category}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{fmtSize(it.fileSize)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', color: it.featured ? '#22d3a6' : 'var(--text-mute)' }}>{it.featured ? 'Yes' : '-'}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {!isEditing && (
                        <>
                          <button onClick={function () { setEditing(it.id); }} disabled={busy}
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600, marginRight: 8 }}>Edit</button>
                          <button onClick={function () { deleteOne(it.id); }} disabled={busy}
                            style={{ background: 'none', border: 'none', color: '#ff5a5a', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan="6" style={{ padding: 30, textAlign: 'center', color: 'var(--text-mute)' }}>No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', color: 'var(--text-mute)', fontSize: 12 }}>
          {catalog.items.length} total items · {cats.length} categories · {items.length} shown
        </div></>}

        {tab !== 'vfx' && <AssetTab type={tab} adminToken={adminToken} onFlash={flash} />}
      </div>
    </div>
  );
}

function AdminEditRow({ item, onSave, onCancel }) {
  var _name = useState(item.name);
  var name = _name[0], setName = _name[1];
  var _cat = useState(item.category);
  var cat = _cat[0], setCat = _cat[1];
  var _feat = useState(!!item.featured);
  var feat = _feat[0], setFeat = _feat[1];

  var inputStyle = { height: 28, padding: '0 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 12, marginRight: 6 };

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <input value={name} onChange={function (e) { setName(e.target.value); }} style={Object.assign({}, inputStyle, { width: 140 })} placeholder="Name" />
      <input value={cat} onChange={function (e) { setCat(e.target.value); }} style={Object.assign({}, inputStyle, { width: 120 })} placeholder="Category" />
      <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="checkbox" checked={feat} onChange={function () { setFeat(!feat); }} /> Featured
      </label>
      <button onClick={function () { onSave(item.id, { name: name, category: cat, featured: feat }); }}
        style={{ background: '#22d3a6', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Save</button>
      <button onClick={onCancel}
        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--text-dim)' }}>Cancel</button>
    </span>
  );
}

function AssetTab({ type, adminToken, onFlash }) {
  var _items = useState([]);
  var items = _items[0], setItems = _items[1];
  var _loading = useState(true);
  var loading = _loading[0], setLoading = _loading[1];
  var _busy = useState(false);
  var busy = _busy[0], setBusy = _busy[1];
  var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + adminToken };

  useEffect(function () {
    setLoading(true);
    // Map tab type to asset type for unified API (singular form)
    var assetType = type === 'meshes' ? 'mesh' : type === 'shaders' ? 'shader' : type === 'materials' ? 'material' : type === 'textures' ? 'texture' : type;
    fetch('/api/assets?type=' + assetType)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        setItems(data.assets || []);
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [type]);

  function deleteItem(id) {
    if (!confirm('Delete ' + type.slice(0, -1) + ' ' + id + '?')) return;
    setBusy(true);
    fetch('/api/assets/' + id, { method: 'DELETE', headers: headers })
      .then(function () {
        setItems(items.filter(function (it) { return (it.guid || it.id || it) !== id; }));
        setBusy(false);
        if (onFlash) onFlash('Deleted');
      })
      .catch(function () { setBusy(false); if (onFlash) onFlash('Error'); });
  }

  function deleteAll() {
    if (!confirm('Delete ALL ' + type + '?')) return;
    if (!confirm('Are you sure? This cannot be undone.')) return;
    setBusy(true);
    var promises = items.map(function (it) {
      var id = it.guid || it.id || it;
      return fetch('/api/assets/' + id, { method: 'DELETE', headers: headers });
    });
    Promise.all(promises)
      .then(function () { setItems([]); setBusy(false); if (onFlash) onFlash('All deleted'); })
      .catch(function () { setBusy(false); });
  }

  var thStyle = { padding: '8px 10px', textAlign: 'left', color: 'var(--text-mute)', fontWeight: 600 };
  var tdStyle = { padding: '6px 10px', color: 'var(--text)' };

  return (
    <>
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-dim)' }}>{items.length} {type}</span>
        <button className="btn" onClick={deleteAll} disabled={busy}
          style={{ background: '#991b1b', color: '#fff', border: 'none', padding: '5px 12px', fontSize: 12 }}>
          Delete All
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-mute)' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2 }}>
                <th style={thStyle}>GUID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Path</th>
                {type === 'materials' && <th style={thStyle}>Shader</th>}
                <th style={Object.assign({}, thStyle, { textAlign: 'right' })}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(function (it) {
                var id = it.guid || it.id || it;
                var name = it.name || id;
                return (
                  <tr key={id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={Object.assign({}, tdStyle, { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })} title={id}>{id}</td>
                    <td style={tdStyle}>{name}</td>
                    <td style={Object.assign({}, tdStyle, { fontSize: 11, color: 'var(--text-dim)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })} title={it.assetPath || ''}>{it.assetPath || '-'}</td>
                    {type === 'materials' && <td style={Object.assign({}, tdStyle, { fontSize: 11, color: 'var(--text-dim)' })}>{it.shaderName || '-'}</td>}
                    <td style={Object.assign({}, tdStyle, { textAlign: 'right' })}>
                      <button onClick={function () { deleteItem(id); }} disabled={busy}
                        style={{ background: 'none', border: 'none', color: '#ff5a5a', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan="5" style={{ padding: 30, textAlign: 'center', color: 'var(--text-mute)' }}>No {type} found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

Object.assign(window, { AdminPasswordModal, AdminPanel });
