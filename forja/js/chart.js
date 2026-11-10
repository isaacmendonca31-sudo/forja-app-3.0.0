/**
 * FORJA — Gráfico de linha em SVG (sem bibliotecas).
 *
 * Acessível: o <svg> tem role="img" + descrição textual, e quem monta a tela
 * deve oferecer também os mesmos dados em tabela (alternativa a gráfico).
 */
import { svgEl, fmtNum } from './utils.js';

const W = 320;
const H = 190;
const M = { l: 44, r: 14, t: 14, b: 28 };

/**
 * @param points [{ label: string, value: number }] em ordem cronológica
 * @param opts   { ariaLabel, unit }
 */
export function lineChart(points, { ariaLabel, unit = '' } = {}) {
  const svg = svgEl('svg', {
    class: 'chart', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': ariaLabel || 'Gráfico de evolução',
  });
  if (!points.length) return svg;

  const vals = points.map((p) => p.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min = Math.max(0, min - pad);
  max += pad;

  const innerW = W - M.l - M.r;
  const innerH = H - M.t - M.b;
  const x = (i) => M.l + (points.length === 1 ? innerW / 2 : (i * innerW) / (points.length - 1));
  const y = (v) => M.t + innerH - ((v - min) / (max - min)) * innerH;

  // Linhas de grade + rótulos do eixo Y
  for (let i = 0; i <= 3; i++) {
    const v = min + ((max - min) * i) / 3;
    const yy = y(v);
    svg.append(
      svgEl('line', { class: 'grid', x1: M.l, x2: W - M.r, y1: yy, y2: yy }),
      svgEl('text', { class: 'axis', x: M.l - 6, y: yy + 3, 'text-anchor': 'end' }, fmtNum(v, max - min < 10 ? 1 : 0)),
    );
  }

  // Rótulos do eixo X (primeiro, último e, se couber, o do meio)
  const labelIdx = new Set([0, points.length - 1]);
  if (points.length > 4) labelIdx.add(Math.floor((points.length - 1) / 2));
  labelIdx.forEach((i) => {
    svg.append(svgEl('text', {
      class: 'axis', x: x(i), y: H - 8,
      'text-anchor': i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle',
    }, points[i].label));
  });

  // Área sob a linha (leitura de tendência) e linha
  if (points.length > 1) {
    const pts = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`);
    svg.append(svgEl('polygon', { class: 'area', points: `${x(0).toFixed(1)},${(M.t + innerH).toFixed(1)} ${pts.join(' ')} ${x(points.length - 1).toFixed(1)},${(M.t + innerH).toFixed(1)}` }));
  }
  if (points.length > 1) {
    svg.append(svgEl('polyline', {
      class: 'line', pathLength: 1, points: points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' '),
    }));
  }
  // Pontos (com <title> = dica ao passar o dedo/mouse)
  const bestIdx = points.length > 2 ? vals.indexOf(Math.max(...vals)) : -1; // destaca o melhor ponto (recorde)
  points.forEach((p, i) => {
    const dot = svgEl('circle', {
      class: `dot${i === points.length - 1 ? ' last' : ''}${i === bestIdx ? ' best' : ''}`, cx: x(i), cy: y(p.value), r: 4,
    }, svgEl('title', {}, `${p.label}: ${fmtNum(p.value)}${unit ? ` ${unit}` : ''}${i === bestIdx ? ' (melhor marca)' : ''}`));
    dot.style.setProperty('--i', String(Math.min(i, 20))); // CSSOM (a CSP proíbe style inline)
    svg.append(dot);
  });

  // Dica interativa: toque/mouse/foco num ponto mostra data e valor dentro do próprio gráfico.
  const tip = svgEl('g', { class: 'tip', 'aria-hidden': 'true' });
  const tipBg = svgEl('rect', { class: 'tip-bg', rx: 6, ry: 6, height: 22 });
  const tipTx = svgEl('text', { class: 'tip-tx', 'text-anchor': 'middle' });
  const guide = svgEl('line', { class: 'tip-guide', y1: M.t, y2: M.t + innerH });
  tip.append(guide, tipBg, tipTx);
  svg.append(tip);
  const dots = [...svg.querySelectorAll('.dot')];
  let active = -1;
  const show = (i) => {
    if (i === active) return;
    active = i;
    const p = points[i];
    const text = `${p.label} · ${fmtNum(p.value)}${unit ? ` ${unit}` : ''}`;
    tipTx.textContent = text;
    const w = Math.max(60, text.length * 6.2 + 14);
    const cx = Math.min(W - M.r - w / 2, Math.max(M.l + w / 2, x(i)));
    const ty = Math.max(2, y(p.value) - 34);
    tipBg.setAttribute('x', String(cx - w / 2)); tipBg.setAttribute('y', String(ty)); tipBg.setAttribute('width', String(w));
    tipTx.setAttribute('x', String(cx)); tipTx.setAttribute('y', String(ty + 15));
    guide.setAttribute('x1', String(x(i))); guide.setAttribute('x2', String(x(i)));
    tip.classList.add('on');
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
  };
  const hide = () => { active = -1; tip.classList.remove('on'); dots.forEach((d) => d.classList.remove('active')); };
  points.forEach((p, i) => {
    const hit = svgEl('circle', {
      class: 'hit', cx: x(i), cy: y(p.value), r: 14, tabindex: 0, role: 'img',
      'aria-label': `${p.label}: ${fmtNum(p.value)}${unit ? ` ${unit}` : ''}`,
    });
    hit.addEventListener('pointerenter', () => show(i));
    hit.addEventListener('pointerdown', () => show(i));
    hit.addEventListener('focus', () => show(i));
    hit.addEventListener('blur', hide);
    svg.append(hit);
  });
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  return svg;
}
