// WCAG contrast ratio checker
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function relativeLuminance([r, g, b]) {
  const toLinear = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function grade(ratio, isLarge = false) {
  const aa = isLarge ? 3.0 : 4.5;
  const aaa = isLarge ? 4.5 : 7.0;
  if (ratio >= aaa) return '✅ AAA';
  if (ratio >= aa)  return '✅ AA ';
  if (ratio >= 3.0) return '⚠️  AA large only';
  return '❌ FAIL';
}

const colors = {
  bg:         '#0A1A0F',
  bgCard:     '#122117',
  bgSurface:  '#0E2516',
  text:       '#E8E6E1',
  textDim:    '#8B9A8E',
  textMuted:  '#838E88',
  gold:       '#C9A84C',
  goldLight:  '#E8CC6E',
  goldDim:    '#A08535',
  white:      '#FFFFFF',
  danger:     '#E8786A',
  accent:     '#4ECDC4',
};

// Player colours (often used as text/labels)
const playerColors = {
  moon:     '#7B8CDE',
  cupido:   '#E8786A',
  sozzle:   '#F4A940',
  h:        '#4ECDC4',
  ben:      '#5BC0EB',
  brunners: '#6A994E',
  flemzo:   '#B07EF0',
  shlid:    '#FF3D9A',
};

const backgrounds = ['bg', 'bgCard', 'bgSurface'];
const textColors = ['text', 'textDim', 'textMuted', 'gold', 'goldLight', 'goldDim', 'white', 'danger', 'accent'];

console.log('\n=== WCAG Contrast Audit — App Theme Colors ===\n');
console.log('Text Color'.padEnd(14) + 'Background'.padEnd(14) + 'Ratio'.padEnd(10) + 'Result');
console.log('─'.repeat(60));

for (const tc of textColors) {
  for (const bg of backgrounds) {
    const ratio = contrastRatio(colors[tc], colors[bg]);
    const result = grade(ratio);
    const flag = result.includes('FAIL') || result.includes('large') ? ' ← ISSUE' : '';
    console.log(
      tc.padEnd(14) +
      bg.padEnd(14) +
      ratio.toFixed(2).padEnd(10) +
      result + flag
    );
  }
}

console.log('\n=== Player Colors on Dark Backgrounds ===\n');
console.log('Player'.padEnd(12) + 'Background'.padEnd(14) + 'Ratio'.padEnd(10) + 'Result');
console.log('─'.repeat(55));

for (const [name, hex] of Object.entries(playerColors)) {
  for (const bg of backgrounds) {
    const ratio = contrastRatio(hex, colors[bg]);
    const result = grade(ratio);
    const flag = result.includes('FAIL') || result.includes('large') ? ' ← ISSUE' : '';
    console.log(
      name.padEnd(12) +
      bg.padEnd(14) +
      ratio.toFixed(2).padEnd(10) +
      result + flag
    );
  }
}
