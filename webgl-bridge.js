// webgl-bridge.js — Communication bridge between VFX Hub web and Unity WebGL viewer
// Plain ES5 JavaScript — no backticks, no const/let, no arrow functions, no template literals.

window.WebGLBridge = {
  iframe: null,
  unityInstance: null,
  isReady: false,
  isLoading: false,
  onReady: null,
  onLoaded: null,
  onError: null,

  // Initialize: create hidden iframe that loads the WebGL build
  init: function init() {
    if (this.iframe) return;

    var self = this;

    this.iframe = document.createElement('iframe');
    this.iframe.src = '/webgl/index.html';
    this.iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
    this.iframe.allow = 'autoplay';
    document.body.appendChild(this.iframe);

    // Listen for messages from Unity
    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'unity-viewer') return;
      var payload = e.data.payload;

      if (payload === 'ready') {
        self.isReady = true;
        self.isLoading = false;
        if (self.onReady) self.onReady();
      } else if (payload === 'loading') {
        self.isLoading = true;
      } else if (payload === 'loaded') {
        self.isLoading = false;
        if (self.onLoaded) self.onLoaded();
      } else if (payload && payload.indexOf('error:') === 0) {
        self.isLoading = false;
        if (self.onError) self.onError(payload.substring(6));
      }
    });
  },

  // Load an AssetBundle by item ID
  loadEffect: function loadEffect(itemId) {
    if (!this.isReady) return false;
    var jsonUrl = window.location.origin + '/api/vfx/' + itemId + '/particle-json';
    this.isLoading = true;
    this.iframe.contentWindow.postMessage({
      type: 'unity-command',
      method: 'LoadEffect',
      args: jsonUrl
    }, '*');
    return true;
  },

  // Clear current effect
  clearEffect: function clearEffect() {
    if (!this.isReady) return;
    this.iframe.contentWindow.postMessage({
      type: 'unity-command',
      method: 'ClearEffect',
      args: ''
    }, '*');
  },

  // Move the iframe element into a target container (for showing in modal)
  attachTo: function attachTo(container) {
    if (!this.iframe) return;
    if (this.iframe.parentNode === container) return;
    this.iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    container.appendChild(this.iframe);
  },

  // Move the iframe back to hidden position
  detach: function detach() {
    if (!this.iframe) return;
    this.iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
    document.body.appendChild(this.iframe);
  }
};
