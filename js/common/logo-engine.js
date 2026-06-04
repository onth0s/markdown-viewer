let svgTemplate = '';
let isLoaded = false;

export let initDynamicSvg = async () => {
  try {
    let r = await fetch('markdown-preview-logo.svg');
    if (r.ok) {
      svgTemplate = await r.text();
      isLoaded = true;
      updateThemedLogos();
    }
  } catch (e) {
    console.error('Failed to load themed logo SVG', e);
  }
};

export let updateThemedLogos = () => {
  if (!isLoaded || !svgTemplate) return;
  
  let style = getComputedStyle(document.documentElement);
  let hue = style.getPropertyValue('--hue').trim();
  let primaryS = style.getPropertyValue('--color-primary-s').trim();
  let primaryL = style.getPropertyValue('--color-primary-l').trim();
  let surfaceS = style.getPropertyValue('--bg-surface-s').trim();
  let surfaceL = style.getPropertyValue('--bg-surface-l').trim();

  let colorPrimary = `hsl(${hue}, ${primaryS}, ${primaryL})`;
  let bgSurface = `hsl(${hue}, ${surfaceS}, ${surfaceL})`;

  // Replace placeholders in SVG
  let updatedSvg = svgTemplate
    .replace(/fill="var\(--color-primary, #2b4eb4\)"/g, `fill="${colorPrimary}"`)
    .replace(/fill="var\(--bg-surface, #fafcfe\)"/g, `fill="${bgSurface}"`);

  let dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(updatedSvg);

  // 1. Update Favicon
  let favicon = document.getElementById('favicon');
  if (favicon) {
    favicon.href = dataUrl;
  }

  // 2. Update Navbar Logo (if it's an img element)
  let navLogos = document.querySelectorAll('img.nav-logo');
  for (let img of navLogos) {
    img.src = dataUrl;
  }

  // 3. Update Preview Logos
  let previewLogos = document.querySelectorAll('.themed-logo');
  for (let img of previewLogos) {
    img.src = dataUrl;
  }
};
