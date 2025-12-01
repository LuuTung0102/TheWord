class StateManager {
  constructor() {
    this.state = {
      renderParams: null,
      renderDataStructures: null,
      formDataReused: false,
      reusedGroups: new Set(),
      reusedGroupSources: new Map()
    };
    
    this.domCache = new Map();
    this.domCacheEnabled = true;
  }
  
  getElement(id) {
    if (!this.domCacheEnabled) {
      return document.getElementById(id);
    }
    
    if (!this.domCache.has(id)) {
      const element = document.getElementById(id);
      if (element) {
        this.domCache.set(id, element);
      }
      return element;
    }
    return this.domCache.get(id);
  }
  
  querySelector(selector) {
    const cacheKey = `qs:${selector}`;
    if (!this.domCacheEnabled) {
      return document.querySelector(selector);
    }
    
    if (!this.domCache.has(cacheKey)) {
      const element = document.querySelector(selector);
      if (element) {
        this.domCache.set(cacheKey, element);
      }
      return element;
    }
    return this.domCache.get(cacheKey);
  }
  
  querySelectorAll(selector) {
    return document.querySelectorAll(selector);
  }
  
  clearDOMCache(id = null) {
    if (id) {
      this.domCache.delete(id);
      this.domCache.delete(`qs:${id}`);
    } else {
      this.domCache.clear();
    }
  }
  
  invalidateDOMCache() {
    this.domCache.clear();
  }
  
  enableDOMCache() {
    this.domCacheEnabled = true;
  }
  
  disableDOMCache() {
    this.domCacheEnabled = false;
    this.domCache.clear();
  }

  setRenderParams(params) {
    this.state.renderParams = params;
  }

  getRenderParams() {
    return this.state.renderParams;
  }

  setRenderDataStructures(data) {
    this.state.renderDataStructures = data;
  }

  getRenderDataStructures() {
    return this.state.renderDataStructures;
  }

  setFormDataReused(value) {
    this.state.formDataReused = value;
  }

  getFormDataReused() {
    return this.state.formDataReused;
  }

  addReusedGroup(groupKey) {
    this.state.reusedGroups.add(groupKey);
  }

  hasReusedGroup(groupKey) {
    return this.state.reusedGroups.has(groupKey);
  }

  getReusedGroups() {
    return this.state.reusedGroups;
  }

  clearReusedGroups() {
    this.state.reusedGroups.clear();
  }

  setReusedGroupSource(groupKey, source) {
    this.state.reusedGroupSources.set(groupKey, source);
  }

  getReusedGroupSource(groupKey) {
    return this.state.reusedGroupSources.get(groupKey);
  }

  getReusedGroupSources() {
    return this.state.reusedGroupSources;
  }

  clearReusedGroupSources() {
    this.state.reusedGroupSources.clear();
  }

  reset() {
    this.state.renderParams = null;
    this.state.renderDataStructures = null;
    this.state.formDataReused = false;
    this.state.reusedGroups.clear();
    this.state.reusedGroupSources.clear();
    this.clearDOMCache();
  }

  resetReuse() {
    this.state.formDataReused = false;
    this.state.reusedGroups.clear();
    this.state.reusedGroupSources.clear();
  }
}

const stateManager = new StateManager();

if (typeof window !== 'undefined') {
  window.stateManager = stateManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = stateManager;
}
