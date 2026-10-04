import QRCode from '../server/node_modules/qrcode/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const LIVE_URL = 'https://sree-mk-food-court.npavansooth.workers.dev';

async function generateQrAssets() {
  console.log(`Generating verified print-ready QR codes for: ${LIVE_URL}`);

  // 1. High-Resolution PNG for Printing (1024x1024 px)
  const pngPath = path.join(root, 'qr-code-live-menu.png');
  await QRCode.toFile(pngPath, LIVE_URL, {
    width: 1024,
    margin: 2,
    color: {
      dark: '#0c2419',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  console.log(`✓ Generated High-Res PNG: ${pngPath}`);

  // Also save a copy inside client/public so it is served on the website directly!
  const clientPublicPng = path.join(root, 'client/public/qr-code-live-menu.png');
  fs.copyFileSync(pngPath, clientPublicPng);

  // 2. High-Quality Scalable Vector SVG
  const svgPath = path.join(root, 'qr-code-live-menu.svg');
  const svgString = await QRCode.toString(LIVE_URL, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#0c2419',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });
  fs.writeFileSync(svgPath, svgString, 'utf8');
  console.log(`✓ Generated Vector SVG: ${svgPath}`);

  const clientPublicSvg = path.join(root, 'client/public/qr-code-live-menu.svg');
  fs.copyFileSync(svgPath, clientPublicSvg);

  // 3. Print-Ready HTML Table Tent / Stand Card (A5 / Table Display format)
  const qrDataUri = await QRCode.toDataURL(LIVE_URL, {
    width: 600,
    margin: 2,
    color: {
      dark: '#0c2419',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'H'
  });

  const standHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sree MK Food Court - Table Menu QR Card</title>
  <style>
    @page {
      size: A5 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #061811;
      color: #fcfbf7;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card {
      width: 480px;
      background: linear-gradient(180deg, #0c2b1e 0%, #071912 100%);
      border: 3px solid #d4af37;
      border-radius: 28px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      position: relative;
    }
    .card::before {
      content: '';
      position: absolute;
      inset: 8px;
      border: 1px solid rgba(212, 175, 55, 0.4);
      border-radius: 20px;
      pointer-events: none;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid #d4af37;
      border-radius: 20px;
      color: #f6d365;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    h1 {
      font-family: Georgia, 'Playfair Display', serif;
      font-size: 26px;
      color: #f6d365;
      letter-spacing: 1px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .tagline {
      font-size: 13px;
      color: #a4c4b5;
      letter-spacing: 1.5px;
      margin-bottom: 22px;
      text-transform: uppercase;
    }
    .qr-container {
      background: #ffffff;
      padding: 18px;
      border-radius: 20px;
      display: inline-block;
      border: 3px solid #d4af37;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      margin-bottom: 20px;
    }
    .qr-img {
      width: 250px;
      height: 250px;
      display: block;
    }
    .instruction {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .sub-instruction {
      font-size: 12px;
      color: #8dafa0;
      margin-bottom: 18px;
      line-height: 1.4;
    }
    .url-pill {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(212, 175, 55, 0.4);
      padding: 8px 16px;
      border-radius: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #f3e5ab;
      word-break: break-all;
    }
    .footer {
      margin-top: 18px;
      font-size: 10px;
      color: #6d8e7f;
      letter-spacing: 1px;
    }
    .no-print-bar {
      position: fixed;
      top: 10px;
      right: 10px;
    }
    .btn {
      padding: 10px 18px;
      background: #d4af37;
      color: #071912;
      font-weight: bold;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .no-print-bar {
        display: none;
      }
      .card {
        box-shadow: none;
        width: 100%;
        max-width: 500px;
        margin: auto;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="btn" onclick="window.print()">🖨️ Print Table Stand Card</button>
  </div>

  <div class="card">
    <div class="badge">✨ Digital Dining Experience</div>
    <h1>Sree MK Food Court</h1>
    <div class="tagline">Good Food. Good Mood.</div>

    <div class="qr-container">
      <img src="${qrDataUri}" alt="Menu QR Code" class="qr-img" />
    </div>

    <div class="instruction">Scan with any Camera / QR App</div>
    <div class="sub-instruction">
      Browse our complete menu &amp; calculate your table order instantly.<br/>
      Works on Mobile Data or Restaurant Wi-Fi!
    </div>

    <div class="url-pill">
      ${LIVE_URL}
    </div>

    <div class="footer">
      SREE MK FOOD COURT RESTAURANT • 240 VERIFIED DELICACIES
    </div>
  </div>
</body>
</html>`;

  const standPath = path.join(root, 'print-table-qr-stand.html');
  fs.writeFileSync(standPath, standHtml, 'utf8');
  console.log(`✓ Generated Print-Ready Table Stand HTML: ${standPath}`);

  // Copy to client public
  fs.copyFileSync(standPath, path.join(root, 'client/public/print-table-qr-stand.html'));
}

generateQrAssets().catch(console.error);
