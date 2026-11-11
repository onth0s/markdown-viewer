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

  const colorPrimary = `hsl(${hue}, ${primaryS}, ${primaryL})`;

  // Replace primary color in SVG
  const updatedSvg = svgTemplate.replace(
    /fill="var\(--color-primary, #2b4eb4\)"/g,
    `fill="${colorPrimary}"`
  );

  const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(updatedSvg);

  // 1. Update Favicon
  const favicon = document.getElementById('favicon');
  if (favicon) {
    favicon.href = dataUrl;
  }

  // 2. Update Preview Themed Logos
  const previewLogos = document.querySelectorAll('.themed-logo');
  for (const img of previewLogos) {
    img.src = dataUrl;
  }
};
