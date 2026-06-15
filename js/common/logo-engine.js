let svgTemplate = '';
let isLoaded = false;

export const initDynamicSvg = async () => {
  try {
    const r = await fetch('markdown-preview-logo.svg');
    if (r.ok) {
      svgTemplate = await r.text();
      isLoaded = true;
      updateThemedLogos();
    }
  } catch (e) {
    console.error('Failed to load themed logo SVG', e);
  }
};

export const updateThemedLogos = () => {
  if (!isLoaded || !svgTemplate) return;
  
  const style = getComputedStyle(document.documentElement);
  const hue = style.getPropertyValue('--hue').trim();
  const primaryS = style.getPropertyValue('--color-primary-s').trim();
  const primaryL = style.getPropertyValue('--color-primary-l').trim();
  const surfaceS = style.getPropertyValue('--bg-surface-s').trim();
  const surfaceL = style.getPropertyValue('--bg-surface-l').trim();

  const colorPrimary = `hsl(${hue}, ${primaryS}, ${primaryL})`;
  const bgSurface = `hsl(${hue}, ${surfaceS}, ${surfaceL})`;

  // Replace placeholders in SVG
  const updatedSvg = svgTemplate
    .replace(/fill="var\(--color-primary, #2b4eb4\)"/g, `fill="${colorPrimary}"`)
    .replace(/fill="var\(--bg-surface, #fafcfe\)"/g, `fill="${bgSurface}"`);

  const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(updatedSvg);

  // 1. Update Favicon
  const favicon = document.getElementById('favicon');
  if (favicon) {
    favicon.href = dataUrl;
  }

  // 2. Update Navbar Logo (if it's an img element)
  const navLogos = document.querySelectorAll('img.nav-logo');
  for (const img of navLogos) {
    img.src = dataUrl;
  }

  // 3. Update Preview Logos
  const previewLogos = document.querySelectorAll('.themed-logo');
  for (const img of previewLogos) {
    img.src = dataUrl;
  }
};
