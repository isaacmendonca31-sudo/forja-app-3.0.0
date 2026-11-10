export const THEMES = Object.freeze({
  green: { label: 'Verde', accent: '#76e06f', pressed: '#5fcb58', deep: '#0b2112', icon: 'icon', manifest: 'manifest.webmanifest' },
  blue: { label: 'Azul', accent: '#70b7ff', pressed: '#4d9ce8', deep: '#0b1628', icon: 'icon-blue', manifest: 'manifest-blue.webmanifest' },
  purple: { label: 'Roxo', accent: '#c49aff', pressed: '#a977ed', deep: '#1a1028', icon: 'icon-purple', manifest: 'manifest-purple.webmanifest' },
  orange: { label: 'Laranja', accent: '#ffb86b', pressed: '#f39b45', deep: '#281709', icon: 'icon-orange', manifest: 'manifest-orange.webmanifest' },
});

function rgbChannels(hex) {
  return hex.match(/[a-f\d]{2}/gi).map((channel) => Number.parseInt(channel, 16));
}

export function applyTheme(theme) {
  const selected = THEMES[theme] ? theme : 'green';
  const palette = THEMES[selected];
  const root = document.documentElement;
  root.dataset.theme = selected;
  root.style.setProperty('--accent', palette.accent);
  root.style.setProperty('--accent-press', palette.pressed);
  root.style.setProperty('--ambient-rgb', rgbChannels(palette.accent).join(', '));

  document.dispatchEvent(new Event('forja:theme'));

  const colorMeta = document.querySelector('meta[name="theme-color"]');
  colorMeta?.setAttribute('content', palette.accent);
  const iconLink = document.querySelector('link[rel="icon"]');
  iconLink?.setAttribute('href', `icons/${palette.icon}.svg`);
  const appleIconLink = document.querySelector('link[rel="apple-touch-icon"]');
  appleIconLink?.setAttribute('href', `icons/${palette.icon}-192.png`);
  const manifestLink = document.querySelector('link[rel="manifest"]');
  manifestLink?.setAttribute('href', palette.manifest);
}
