export const defaultInputFallback = `# Markdown Viewer

Start writing markdown...`;

// ─── Storage Keys ────────────────────────────────────────────────────────────
// NOTE: These keys are intentionally mirrored verbatim in the inline <script>
// block at the top of index.html. That script runs synchronously before the
// ES-module graph loads to prevent FOUC (Flash Of Unstyled Content). If you
// rename any key here, you MUST update the corresponding string in index.html.
export const STORAGE_THEME_KEY = 'com.markdownlivepreview_theme';
export const STORAGE_CONTENT_KEY = 'mdv_last_content';
export const STORAGE_SCROLL_KEY = 'mdv_scroll_sync';
export const STORAGE_SCROLL_POS_KEY = 'mdv_scroll_positions';
export const STORAGE_SWAP_KEY = 'mdv_swapped';
export const STORAGE_PANE_RATIO_KEY = 'mdv_pane_ratio';

export const PREVIEW_CSS_LIGHT = 'css/github-markdown-light.css';
export const PREVIEW_CSS_DARK = 'css/github-markdown-dark_dimmed.css';
