/**
 * @file scroll-sync.js
 * Bi-directional scroll synchronisation between the editor and preview panes.
 * All mutable state (activePane, scrollBarSync) is encapsulated here.
 */

import { saveScrollBarSettings } from './storage.js';

/**
 * Initialises scroll sync between two panes.
 * Wires pane-focus tracking and scroll event listeners internally.
 *
 * @param {HTMLElement} editorEl            - The editor textarea
 * @param {HTMLElement} previewEl           - The preview wrapper
 * @param {HTMLElement} editPaneContainer   - The editor column container
 * @param {HTMLElement} previewPaneContainer - The preview column container
 * @returns {{ initScrollBarSyncToggle: (settings: boolean) => void }}
 */
export const initScrollSync = (editorEl, previewEl, editPaneContainer, previewPaneContainer) => {
  let activePane = 'editor';
  let scrollBarSync = false;

  // Track which pane the cursor is in
  if (editPaneContainer) {
    editPaneContainer.addEventListener('pointerenter', () => { activePane = 'editor'; });
    editPaneContainer.addEventListener('wheel', () => { activePane = 'editor'; }, { passive: true });
  }
  if (previewPaneContainer) {
    previewPaneContainer.addEventListener('pointerenter', () => { activePane = 'preview'; });
    previewPaneContainer.addEventListener('wheel', () => { activePane = 'preview'; }, { passive: true });
  }
  if (editorEl) {
    editorEl.addEventListener('focus', () => { activePane = 'editor'; });
    editorEl.addEventListener('wheel', () => { activePane = 'editor'; }, { passive: true });
  }
  if (previewEl) {
    previewEl.addEventListener('wheel', () => { activePane = 'preview'; }, { passive: true });
  }

  const syncPaneToPane = (source, target) => {
    const max = source.scrollHeight - source.clientHeight;
    if (max <= 0) return;
    if (source.scrollTop <= 1) {
      source.scrollTop = 0;
      target.scrollTop = 0;
      return;
    }
    if (source.scrollTop >= max - 1) {
      source.scrollTop = max;
      target.scrollTop = target.scrollHeight;
      return;
    }
    const ratio = source.scrollTop / max;
    const targetMax = target.scrollHeight - target.clientHeight;
    if (targetMax <= 0) return;
    target.scrollTop = ratio * targetMax;
  };

  if (editorEl && previewEl) {
    editorEl.addEventListener('scroll', () => {
      if (!scrollBarSync) return;
      if (activePane !== 'editor') return;
      syncPaneToPane(editorEl, previewEl);
    });
    previewEl.addEventListener('scroll', () => {
      if (!scrollBarSync) return;
      if (activePane !== 'preview') return;
      syncPaneToPane(previewEl, editorEl);
    });
  }

  const setSyncScroll = (enabled) => {
    document.documentElement.setAttribute('data-sync', enabled ? 'on' : 'off');
    scrollBarSync = enabled;
    if (enabled && editorEl && previewEl) {
      syncPaneToPane(editorEl, previewEl);
    }
  };

  /**
   * Reads initial settings, applies them, and wires the sync toggle button.
   * @param {boolean} settings - Initial sync-on state
   */
  const initScrollBarSyncToggle = (settings) => {
    setSyncScroll(settings);
    const toggle = document.querySelector('.sync-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const isOn = document.documentElement.getAttribute('data-sync') === 'on';
      const checked = !isOn;
      scrollBarSync = checked;
      setSyncScroll(checked);
      saveScrollBarSettings(checked);
    });
  };

  return { initScrollBarSyncToggle };
};
