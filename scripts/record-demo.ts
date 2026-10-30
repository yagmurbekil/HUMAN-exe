/**
 * HUMAN.exe — automated ~60 s demo recording (docs/demo/README.md)
 *
 * Drives the real running app in a local Chrome/Edge via Playwright at a 390×844 mobile viewport
 * (device scale 2). Frames are captured with the Chrome DevTools screencast (Page.startScreencast),
 * which — unlike Playwright's recordVideo — delivers device-pixel (780×1688) frames, and are encoded
 * to H.264 MP4 with the bundled ffmpeg (@ffmpeg-installer/ffmpeg). No audio is recorded.
 *
 * Prerequisite: `npm run dev` is running on http://localhost:3000.
 * Usage: npm run demo:record   (env: DEMO_URL, DEMO_BROWSER=chrome|msedge)
 */

import { chromium, type Page } from 'playwright-core';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const BASE_URL = process.env.DEMO_URL || 'http://localhost:3000';
const BROWSER_CHANNEL = process.env.DEMO_BROWSER || 'chrome';
const VIEWPORT = { width: 390, height: 844 };
const SCALE = 2; // record at device pixels so small retro text stays readable
const OUT_DIR = path.resolve('docs/demo');
const OUT_FILE = path.join(OUT_DIR, 'HUMAN-exe-demo.mp4');

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);

/** Caption band injected into the page for the recording only (not part of the app). */
async function caption(page: Page, text: string) {
  await page.evaluate((t) => {
    let el = document.getElementById('demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-caption';
      el.style.cssText =
        'position:fixed;left:0;right:0;top:0;z-index:99999;pointer-events:none;' +
        'background:rgba(0,0,128,0.92);color:#fff;font:bold 13px Tahoma,Arial,sans-serif;' +
        'padding:7px 10px;text-align:center;border-bottom:2px solid #fff;';
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

async function scrollBy(page: Page, dy: number, ms = 900) {
  await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), dy);
  await pause(page, ms);
}

/** Vertical-only scroll that centres the element (never scrolls sideways). */
async function scrollIntoView(page: Page, selector: string, ms = 800) {
  await page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    const top = window.scrollY + r.top - window.innerHeight / 2 + r.height / 2;
    window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'smooth' });
  });
  await pause(page, ms);
}

async function decide(page: Page, choiceId: string, justifyIndex: number, captionText: string) {
  await caption(page, captionText);
  await scrollIntoView(page, `[data-cy="choice-${choiceId}"]`, 900);
  await page.click(`[data-cy="choice-${choiceId}"]`);
  await pause(page, 700);
  await scrollIntoView(page, '[data-cy="confirm-decision-btn"]', 600);
  await page.click('[data-cy="confirm-decision-btn"]');
  await caption(page, 'JUSTIFY.dlg — kararın gerekçesi seçilir');
  await pause(page, 1200);
  await page.click(`[data-cy="justification-option-${justifyIndex}"]`);
  await pause(page, 900);
  await page.click('[data-cy="justify-confirm-btn"]');
  await page.waitForSelector('[data-cy="consequence-window"]');
  await page.evaluate(() => window.scrollTo({ top: 0 }));
}

async function main() {
  try {
    const health = await fetch(`${BASE_URL}/api/health`);
    if (!health.ok) throw new Error(`HTTP ${health.status}`);
  } catch (err) {
    throw new Error(`App is not reachable at ${BASE_URL}. Start it first with "npm run dev". (${err})`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'humanexe-demo-'));

  // --force-device-scale-factor makes headless screencast frames device-pixel sized (780×1688)
  const browser = await chromium.launch({
    channel: BROWSER_CHANNEL,
    headless: true,
    args: [`--force-device-scale-factor=${SCALE}`],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.waitForSelector('[data-cy="onboarding-window"]');
  await page.evaluate(() => document.fonts.ready);
  const cssWidth = await page.evaluate(() => window.innerWidth);
  if (cssWidth !== VIEWPORT.width) throw new Error(`Unexpected CSS viewport width ${cssWidth}`);

  // Start capturing only once the app is ready (no blank loading frames).
  // The screencast emits a frame whenever the page repaints; each frame carries its timestamp.
  const frames: { file: string; t: number }[] = [];
  const cdp = await context.newCDPSession(page);
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    const file = path.join(tmpDir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp ?? Date.now() / 1000 });
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 92,
    maxWidth: VIEWPORT.width * SCALE,
    maxHeight: VIEWPORT.height * SCALE,
  });

  // 1. Opening — Windows 95 desktop
  await caption(page, 'HUMAN.exe — Windows 95 tarzı olay masaüstü');
  await pause(page, 2500);

  // 2. Three-question personalization
  await caption(page, 'Kişiselleştirme: seviye · rol · öğrenme hedefi');
  await scrollIntoView(page, '[data-cy="level-beginner"]', 700);
  await page.click('[data-cy="level-beginner"]');
  await pause(page, 800);
  await scrollIntoView(page, '[data-cy="role-developer"]', 700);
  await page.click('[data-cy="role-developer"]');
  await pause(page, 800);
  await scrollIntoView(page, '[data-cy="goal-validation"]', 700);
  await page.click('[data-cy="goal-validation"]');
  await pause(page, 800);
  await scrollIntoView(page, '[data-cy="start-session-btn"]', 700);
  await page.click('[data-cy="start-session-btn"]');
  await page.waitForSelector('[data-cy="decision-window"]');
  await page.evaluate(() => window.scrollTo({ top: 0 }));

  // 3. D1 — evidence review
  await caption(page, 'D1 Mimari: olay günlüğü ve kanıt kartları');
  await pause(page, 1500);
  await scrollIntoView(page, '.win95-tab', 1000);
  const tabs = page.locator('.win95-tab');
  await tabs.nth(1).click();
  await pause(page, 1200);
  await tabs.nth(0).click();
  await pause(page, 900);
  await caption(page, 'ASSIST.exe önerisi — doğrulanmadan uygulanmamalı');
  await scrollBy(page, 260, 1600);

  // 4. TUTOR.hlp — Socratic hint
  await caption(page, 'TUTOR.hlp: cevabı vermez, soru sorar');
  await page.click('[data-cy="tutor-btn"]');
  await page.waitForSelector('[data-cy="tutor-window"]');
  await pause(page, 900);
  await page.click('[data-cy="hint-btn"]');
  await pause(page, 2400);
  await page.fill('[data-cy="tutor-input"]', 'Hangisi doğru, sadece söyle.');
  await pause(page, 500);
  await page.click('[data-cy="tutor-send"]');
  await pause(page, 3000);
  await page.click('[data-cy="tutor-btn"]');
  await pause(page, 500);

  // 5. D1 decision + JUSTIFY.dlg + consequence
  await decide(page, 'D1_VERIFY_SCHEMA', 1, 'D1: geri almadan önce şema uyumu doğrulanır');
  await caption(page, 'Sonuç: ilke, kavram tanımı ve simüle saat');
  await pause(page, 2500);
  await page.click('[data-cy="continue-btn"]');
  await page.waitForSelector('[data-cy="decision-window"]');
  await page.evaluate(() => window.scrollTo({ top: 0 }));

  // 6. D2 — hotfix / testing (risky choice to show a flag)
  await caption(page, 'D2 Doğrulama: test edilmemiş acil yama');
  await pause(page, 1200);
  await decide(page, 'D2_DEPLOY_NOW', 0, 'D2: birim testleri geçti → hemen yayına al (riskli)');
  await caption(page, 'Riskli eylem: VERIFY_RISK bayrağı eklendi');
  await pause(page, 2400);
  await page.click('[data-cy="continue-btn"]');
  await page.waitForSelector('[data-cy="decision-window"]');
  await page.evaluate(() => window.scrollTo({ top: 0 }));

  // 7. D3 — privacy / logs
  await caption(page, 'D3 Gizlilik: hasta verisi içeren log');
  await pause(page, 1200);
  await decide(page, 'D3_REDACT_RESTRICT', 0, 'D3: kimlik alanları maskelenir, kanal sınırlanır');
  await pause(page, 2000);
  await page.click('[data-cy="continue-btn"]');
  await page.waitForSelector('[data-cy="report-window"]');
  await page.evaluate(() => window.scrollTo({ top: 0 }));

  // 8. Report — ending, flags, decision history
  await caption(page, 'REPORT.txt: son, risk bayrakları ve karar geçmişi');
  await pause(page, 3000);
  await scrollIntoView(page, '[data-cy="flag-VERIFY_RISK"]', 2500);
  await scrollBy(page, 420, 2300);
  await scrollBy(page, 420, 2300);
  await scrollBy(page, 420, 2000);

  await cdp.send('Page.stopScreencast');
  const endTime = Date.now() / 1000;
  await context.close();
  await browser.close();
  if (frames.length === 0) throw new Error('No screencast frames were captured.');

  // Each frame is shown until the next one arrives (concat demuxer with per-frame durations)
  const lines: string[] = [];
  frames.forEach((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : endTime;
    lines.push(`file '${path.basename(f.file)}'`, `duration ${Math.max(0.001, next - f.t).toFixed(4)}`);
  });
  lines.push(`file '${path.basename(frames[frames.length - 1].file)}'`); // concat quirk: repeat last frame
  fs.writeFileSync(path.join(tmpDir, 'frames.txt'), lines.join('\n'));
  console.log(`Captured ${frames.length} frames over ${(endTime - frames[0].t).toFixed(1)} s`);

  execFileSync(
    ffmpeg.path,
    [
      '-y',
      '-loglevel', 'error',
      '-f', 'concat',
      '-safe', '0',
      '-i', 'frames.txt',
      '-vf', 'fps=25,format=yuv420p',
      '-an',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-crf', '22',
      '-movflags', '+faststart',
      OUT_FILE,
    ],
    { stdio: 'inherit', cwd: tmpDir }
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`\nDemo saved: ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
