import type { Match, Team } from './types';
import { STAGE_LABEL, formatDateHr } from './utils';

const BLUE = '#1d4e9e';
const RED = '#d42a3c';
const DARK = '#13152a';

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string
) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  stroke: string,
  lineWidth = 1
) {
  roundedRect(ctx, x, y, width, height, radius);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  family: string,
  weight = 700
) {
  let size = startSize;
  while (size > 24) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 4;
  }
  return size;
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startSize: number,
  color: string,
  family = 'Arial, sans-serif',
  weight = 700
) {
  const size = fitFontSize(ctx, text, maxWidth, startSize, family, weight);
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number
) {
  fillRoundedRect(ctx, x, y, width, 48, 24, 'rgba(255,255,255,0.08)');
  strokeRoundedRect(ctx, x, y, width, 48, 24, 'rgba(255,255,255,0.14)');
  ctx.font = '700 20px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + 24);
}

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function downloadMatchStory(match: Match, home?: Team, away?: Team) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas nije dostupan.');

  const homeCode = home?.code ?? '?';
  const awayCode = away?.code ?? '?';
  const homeColor = home?.color || BLUE;
  const awayColor = away?.color || RED;
  const winnerCode = match.winnerId === match.homeId ? homeCode : match.winnerId === match.awayId ? awayCode : null;

  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, '#10172f');
  background.addColorStop(1, '#1b2342');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glowLeft = ctx.createRadialGradient(180, 240, 80, 180, 240, 540);
  glowLeft.addColorStop(0, `${homeColor}70`);
  glowLeft.addColorStop(1, `${homeColor}00`);
  ctx.fillStyle = glowLeft;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glowRight = ctx.createRadialGradient(900, 420, 80, 900, 420, 560);
  glowRight.addColorStop(0, `${awayColor}70`);
  glowRight.addColorStop(1, `${awayColor}00`);
  ctx.fillStyle = glowRight;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(72, 220 + i * 240, 936, 1);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText('MIOC NOGOMETNI TURNIR', 540, 110);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 68px Arial, sans-serif';
  ctx.fillText('REZULTAT UTAKMICE', 540, 182);

  const stageText = STAGE_LABEL[match.stage] ?? match.stage;
  const dateText = formatDateHr(match.date);
  drawLabel(ctx, stageText, 140, 250, 250);
  drawLabel(ctx, match.time, 415, 250, 120);
  drawLabel(ctx, dateText, 560, 250, 380);

  fillRoundedRect(ctx, 72, 360, 936, 980, 44, 'rgba(255,255,255,0.94)');
  fillRoundedRect(ctx, 72, 360, 936, 16, 8, homeColor);
  fillRoundedRect(ctx, 540, 360, 468, 16, 8, awayColor);

  ctx.fillStyle = 'rgba(19,21,42,0.06)';
  ctx.fillRect(539, 430, 2, 550);

  ctx.fillStyle = 'rgba(19,21,42,0.42)';
  ctx.font = '700 22px Arial, sans-serif';
  ctx.fillText('RAZRED 1', 306, 460);
  ctx.fillText('RAZRED 2', 774, 460);

  drawCenteredText(ctx, homeCode, 306, 620, 360, 136, homeColor, 'Arial, sans-serif', 700);
  drawCenteredText(ctx, awayCode, 774, 620, 360, 136, awayColor, 'Arial, sans-serif', 700);

  fillRoundedRect(ctx, 370, 780, 340, 180, 36, DARK);
  ctx.fillStyle = 'rgba(255,255,255,0.36)';
  ctx.font = '700 58px Arial, sans-serif';
  ctx.fillText(':', 540, 870);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 118px Arial, sans-serif';
  ctx.fillText(String(match.homeScore), 466, 868);
  ctx.fillText(String(match.awayScore), 614, 868);

  fillRoundedRect(ctx, 132, 1035, 816, 140, 30, 'rgba(19,21,42,0.04)');
  const winnerColor = match.winnerId === match.homeId ? homeColor : awayColor;
  ctx.fillStyle = 'rgba(19,21,42,0.42)';
  ctx.font = '700 24px Arial, sans-serif';
  ctx.fillText('POBJEDNIK', 540, 1080);
  ctx.fillStyle = winnerCode ? winnerColor : DARK;
  ctx.font = '700 68px Arial, sans-serif';
  ctx.fillText(winnerCode ?? 'NERIJESENO', 540, 1135);

  let infoTop = 1235;
  if (match.penalties) {
    fillRoundedRect(ctx, 132, infoTop, 816, 110, 28, 'rgba(212,42,60,0.08)');
    ctx.fillStyle = '#d42a3c';
    ctx.font = '700 24px Arial, sans-serif';
    ctx.fillText('PENALI', 540, infoTop + 34);
    ctx.fillStyle = DARK;
    ctx.font = '700 54px Arial, sans-serif';
    ctx.fillText(`${match.penalties.home} : ${match.penalties.away}`, 540, infoTop + 78);
    infoTop += 138;
  }

  if (match.mvpName) {
    fillRoundedRect(ctx, 132, infoTop, 816, 110, 28, 'rgba(29,78,158,0.08)');
    ctx.fillStyle = homeColor;
    ctx.font = '700 24px Arial, sans-serif';
    ctx.fillText('IGRAC UTAKMICE', 540, infoTop + 34);
    ctx.fillStyle = DARK;
    ctx.font = `${match.mvpName.length > 18 ? 600 : 700} ${match.mvpName.length > 18 ? 42 : 48}px Arial, sans-serif`;
    ctx.fillText(match.mvpName, 540, infoTop + 78);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '700 22px Arial, sans-serif';
  ctx.fillText('XV. GIMNAZIJA ZAGREB', 540, 1780);
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font = '600 18px Arial, sans-serif';

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error('Nije bilo moguce generirati PNG.'));
    }, 'image/png');
  });

  saveBlob(`${slug(homeCode)}-vs-${slug(awayCode)}-story.png`, blob);
}
