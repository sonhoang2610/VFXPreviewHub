/* Floating WebGL preview panel — bottom-right overlay, resizable + minimizable.
   Iframe stays permanently attached once panel is shown. Only sends load commands on item change. */

var PANEL_SIZES = { min: { w: 64, h: 64 }, small: { w: 320, h: 240 }, large: { w: 560, h: 420 } };

function PreviewPanel({ item, webglReady, webglLoading, onClose, onWebglLoad }) {
  var _size = useState('small');
  var size = _size[0], setSize = _size[1];
  var _dragging = useState(false);
  var dragging = _dragging[0], setDragging = _dragging[1];
  var _pos = useState({ right: 20, bottom: 20 });
  var pos = _pos[0], setPos = _pos[1];
  var _attached = useState(false);
  var attached = _attached[0], setAttached = _attached[1];
  var panelRef = useRef(null);
  var previewRef = useRef(null);
  var dragStart = useRef(null);
  var lastItemId = useRef(null);

  var isMin = size === 'min';
  var dim = PANEL_SIZES[size] || PANEL_SIZES.small;

  // Attach iframe once when panel first shows (never detach until close)
  useEffect(function () {
    if (!item || isMin || !webglReady || !previewRef.current) return;
    if (!attached) {
      WebGLBridge.attachTo(previewRef.current);
      setAttached(true);
    }
  }, [item, size, webglReady]);

  // Only send load command when item ID actually changes
  useEffect(function () {
    if (!item || !webglReady || !attached) return;
    if (item.id !== lastItemId.current) {
      lastItemId.current = item.id;
      WebGLBridge.loadEffect(item.id);
      if (onWebglLoad) onWebglLoad();
      // Fallback: clear loading after 5s in case "loaded" message is missed
      var timeout = setTimeout(function () { WebGLBridge.isLoading = false; if (WebGLBridge.onLoaded) WebGLBridge.onLoaded(); }, 5000);
      var origOnLoaded = WebGLBridge.onLoaded;
      WebGLBridge.onLoaded = function () { clearTimeout(timeout); WebGLBridge.onLoaded = origOnLoaded; if (origOnLoaded) origOnLoaded(); };
    }
  }, [item, webglReady, attached]);

  // Re-attach when coming back from minimize
  useEffect(function () {
    if (!isMin && attached && previewRef.current && webglReady) {
      WebGLBridge.attachTo(previewRef.current);
    }
  }, [isMin]);

  if (!item) return null;

  function onDragStart(e) {
    e.preventDefault();
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      right: pos.right,
      bottom: pos.bottom
    };
    setDragging(true);

    function onMove(ev) {
      var dx = ev.clientX - dragStart.current.x;
      var dy = ev.clientY - dragStart.current.y;
      setPos({
        right: Math.max(0, dragStart.current.right - dx),
        bottom: Math.max(0, dragStart.current.bottom + dy)
      });
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function cycleSize() {
    if (size === 'min') setSize('small');
    else if (size === 'small') setSize('large');
    else setSize('small');
  }

  function doClose() {
    WebGLBridge.detach();
    setAttached(false);
    lastItemId.current = null;
    onClose();
  }

  var panelStyle = {
    position: 'fixed',
    right: pos.right,
    bottom: pos.bottom,
    width: dim.w,
    height: isMin ? dim.h : dim.h + 36,
    zIndex: 150,
    borderRadius: isMin ? 12 : 14,
    overflow: 'hidden',
    background: 'var(--surface, #1d2026)',
    border: '1px solid var(--border-strong, rgba(255,255,255,0.14))',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    transition: dragging ? 'none' : 'width 0.2s, height 0.2s',
    cursor: isMin ? 'pointer' : 'default'
  };

  var headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px 6px 10px',
    background: 'var(--bg-2, #1a1d22)',
    borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))',
    cursor: 'move',
    userSelect: 'none',
    flexShrink: 0
  };

  var btnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-mute, #6a7077)',
    cursor: 'pointer',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 13,
    lineHeight: 1
  };

  return (
    <div ref={panelRef} style={panelStyle} onClick={isMin ? function () { setSize('small'); } : undefined}>
      {isMin ? (
        <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-mute)', fontSize: 11, textAlign: 'center', padding: 4 }}>
          <div>
            <div style={{ fontSize: 18, marginBottom: 2 }}>&#9654;</div>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 56, fontSize: 10 }}>{item.name}</div>
          </div>
        </div>
      ) : (
        <div style={headerStyle} onMouseDown={onDragStart}>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text, #e9ebee)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.name}</span>
          <button style={btnStyle} onClick={cycleSize} title={size === 'small' ? 'Enlarge' : 'Shrink'}>
            {size === 'small' ? String.fromCharCode(8599) : String.fromCharCode(8601)}
          </button>
          <button style={btnStyle} onClick={function () { setSize('min'); }} title="Minimize">&#8211;</button>
          <button style={btnStyle} onClick={doClose} title="Close">&times;</button>
        </div>
      )}
      <div ref={previewRef} style={{ flex: 1, position: 'relative', background: '#0c0d10', display: isMin ? 'none' : 'block', minWidth: 2, minHeight: 2 }}>
        {!webglReady && !isMin && (
          <img
            src={VFX_API.thumbnailUrl(item.id)}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
        {webglLoading && !isMin && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 5 }}>
            <div style={{ textAlign: 'center', color: '#fff', fontSize: 11 }}>Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PreviewPanel: PreviewPanel });
