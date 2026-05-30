// data.js — Fetch VFX catalog from server API
// The API base URL is the same origin since the server serves this frontend
window.VFX_CATALOG = {
  version: 1,
  lastUpdated: '',
  categories: [],
  items: []
};

window.VFX_API = {
  // Fetch catalog from server
  async fetchCatalog() {
    try {
      const res = await fetch('/api/vfx/catalog');
      if (!res.ok) throw new Error('Failed to fetch catalog');
      const data = await res.json();
      window.VFX_CATALOG = data;
      return data;
    } catch (err) {
      console.error('Failed to fetch catalog:', err);
      return window.VFX_CATALOG;
    }
  },

  // Get thumbnail URL for an item
  thumbnailUrl(id) {
    return '/api/vfx/' + id + '/thumbnail';
  },

  // Get download URL for an item
  downloadUrl(id) {
    return '/api/vfx/' + id + '/download';
  },

  // Format file size
  formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
};
