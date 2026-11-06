/**
 * HUMAN.exe v3 demo: the same D1 scene with two scripted players and two model decisions (Ödev 7, 60–90 s).
 *
 * Same capture pipeline as scripts/record-demo.ts (CDP screencast at 780×1688, H.264, no audio).
 * Prerequisite: `npm run dev` is running on http://localhost:3000.
 * Usage: npm run demo:model   (env: DEMO_URL, DEMO_BROWSER=chrome|msedge)
 */

import { chromium, type Page } from 'playwright-core';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const BASE_URL = process.env.DEMO_URL || 'http://localhost:3000';
const VIEWPORT = { width: 390, height: 844 };
const SCALE = 2;
const OUT_FILE = path.resolve('docs/demo/HUMAN-exe-model-demo.mp4');

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);
const top = (page: Page) => page.evaluate(() => window.scrollTo({ top: 0, left: 0 }));

async function caption(page: Page, text: string) {
  await page.evaluate((t) => {
    let el = document.getElementById('demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-caption';
      el.style.cssText =
        'position:fixed;left:0;right:0;top:0;z-index:99999;pointer-events:none;background:rgba(0,0,128,.92);' +
        'color:#fff;font:bold 13px Tahoma,Arial,sans-serif;padding:7px 10px;text-align:center;border-bottom:2px solid #fff;';
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

async function center(page: Page, selector: string, ms = 800) {
  await page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, window.scrollY + r.top - window.innerHeight / 2), left: 0, behavior: 'smooth' });
  });
  await pause(page, ms);
}

async function onboard(page: Page) {
  await center(page, '[data-cy="level-intermediate"]', 500);
  await page.click('[data-cy="level-intermediate"]');
  await center(page, '[data-cy="role-developer"]', 500);
  await page.click('[data-cy="role-developer"]');
  await center(page, '[data-cy="goal-validation"]', 500);
  await page.click('[data-cy="goal-validation"]');
  await center(page, '[data-cy="start-session-btn"]', 500);
  await page.click('[data-cy="start-session-btn"]');
  await page.waitForSelector('[data-cy="decision-window"]');
  await top(page);
}

async function chooseAndConfirm(page: Page, choice: string) {
  await center(page, `[data-cy="choice-${choice}"]`, 1200);
  await page.click(`[data-cy="choice-${choice}"]`);
  await pause(page, 900);
  await center(page, '[data-cy="confirm-decision-btn"]', 500);
  await page.click('[data-cy="confirm-decision-btn"]');
}

async function main() {
  const health = await fetch(`${BASE_URL}/api/health`).catch(() => null);
  if (!health?.ok) throw new Error(`App is not reachable at ${BASE_URL}. Start it with "npm run dev".`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'humanexe-demo-'));
  const browser = await chromium.launch({
    channel: process.env.DEMO_BROWSER || 'chrome',
    headless: true,
    args: [`--force-device-scale-factor=${SCALE}`],
  });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(BASE_URL);
  await page.waitForSelector('[data-cy="onboarding-window"]');

  const frames: { file: string; t: number }[] = [];
  const cdp = await context.newCDPSession(page);
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(tmpDir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp ?? Date.now() / 1000 });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', {
    format: 'jpeg', quality: 92, maxWidth: VIEWPORT.width * SCALE, maxHeight: VIEWPORT.height * SCALE,
  });

  // Player A
  await caption(page, 'Prototip model (yalnızca sentetik veri)');
  await pause(page, 3500);
  await caption(page, 'BETİKLİ OYUNCU A: acele ediyor');
  await onboard(page);
  await caption(page, 'A — D1: tek kart, 3 sn, tutor yok');
  await pause(page, 2500);
  await chooseAndConfirm(page, 'D1_VERIFY_SCHEMA');
  await page.waitForSelector('[data-cy="dogrula-dlg"]');
  await caption(page, 'Model: p ≥ 0,5 → DOGRULA.dlg açıldı');
  await pause(page, 6000);
  await caption(page, 'İncelenmemiş kartları listeler, cevabı söylemez');
  await pause(page, 4000);
  await page.click('[data-cy="dogrula-eminim"]');
  await page.waitForSelector('[data-cy="justify-dlg"]');
  await caption(page, 'A kararında ısrar eder → JUSTIFY.dlg');
  await pause(page, 2500);
  await page.click('[data-cy="justification-option-1"]');
  await pause(page, 900);
  await page.click('[data-cy="justify-confirm-btn"]');
  await page.waitForSelector('[data-cy="consequence-window"]');
  await top(page);
  await pause(page, 2500);

  // Player B: same scene from a fresh session
  await page.click('[data-cy="start-menu-btn"]');
  await page.click('[data-cy="start-menu-restart"]');
  await page.click('[data-cy="restart-confirm-yes"]');
  await page.waitForSelector('[data-cy="onboarding-window"]');
  await top(page);
  await caption(page, 'BETİKLİ OYUNCU B: aynı sahne, dikkatli');
  await pause(page, 2000);
  await onboard(page);
  await caption(page, 'B — D1: tüm kanıt kartlarını inceliyor');
  await center(page, '.win95-tab', 900);
  const tabs = page.locator('.win95-tab');
  for (let i = 1; i < (await tabs.count()); i++) {
    await tabs.nth(i).click();
    await pause(page, 2200);
  }
  await caption(page, 'B — tutordan Sokratik ipucu alıyor');
  await page.click('[data-cy="tutor-btn"]');
  await page.waitForSelector('[data-cy="tutor-window"]');
  await pause(page, 900);
  await page.click('[data-cy="hint-btn"]');
  await pause(page, 4000);
  await page.click('[data-cy="tutor-btn"]');
  await pause(page, 400);
  await caption(page, 'B — aynı seçenek');
  await chooseAndConfirm(page, 'D1_VERIFY_SCHEMA');
  await page.waitForSelector('[data-cy="justify-dlg"]');
  await caption(page, 'Model: p < 0,5 → uyarı yok, doğrudan JUSTIFY.dlg');
  await pause(page, 5000);
  await page.click('[data-cy="justification-option-1"]');
  await pause(page, 900);
  await page.click('[data-cy="justify-confirm-btn"]');
  await page.waitForSelector('[data-cy="consequence-window"]');
  await top(page);
  await caption(page, 'Aynı sahne, aynı seçim: model iki farklı karar verdi');
  await pause(page, 3500);

  // Parity
  await page.goto(`${BASE_URL}/?parite=1`);
  await page.waitForSelector('[data-cy="parity-panel"]');
  await caption(page, 'Parite: aynı model.onnx tarayıcıda çalışıyor');
  await page.fill('[data-cy="f-karar_suresi_sn"]', '3');
  await page.fill('[data-cy="f-kart_orani"]', '0.25');
  await page.fill('[data-cy="f-karar_no"]', '1');
  await pause(page, 1000);
  await page.click('[data-cy="hesapla"]');
  await page.waitForFunction(() => document.querySelector('[data-cy="p"]')?.textContent !== '—');
  await caption(page, 'Python ile fark < 0,0001 (Cypress ile doğrulandı)');
  await pause(page, 4000);

  await cdp.send('Page.stopScreencast');
  const endTime = Date.now() / 1000;
  await context.close();
  await browser.close();
  if (frames.length === 0) throw new Error('No screencast frames were captured.');

  const lines: string[] = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : endTime;
    lines.push(`file '${path.basename(f.file)}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  lines.push(`file '${path.basename(frames[frames.length - 1].file)}'`);
  fs.writeFileSync(path.join(tmpDir, 'frames.txt'), lines.join('\n'));
  console.log(`Captured ${frames.length} frames over ${(endTime - frames[0].t).toFixed(1)} s`);

  execFileSync(ffmpeg.path, [
    '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'frames.txt',
    '-vf', 'fps=25,format=yuv420p', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
    '-movflags', '+faststart', OUT_FILE,
  ], { stdio: 'inherit', cwd: tmpDir });
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Demo saved: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
