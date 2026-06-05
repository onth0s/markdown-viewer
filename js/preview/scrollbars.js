
/**
 * Native scrollbar for preview - no custom DOM/JS. Kept as a no-op
 * so existing imports don't break. The DOM elements (#preview-custom-scrollbar,
 * #preview-scroll-overlay) are no longer needed and can be removed from HTML.
 */
export let initPreviewCustomScrollbar = (previewEl, previewTrack, previewThumb) => {
  if (!previewEl) return { update: () => {}, setupOverlay: () => {} };
  let update = () => {
    // Native scrollbar handles itself; nothing to do.
  };
  return { update, setupOverlay: () => {} };
};
