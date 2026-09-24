const fs = require('fs');
const { chromium } = require('playwright');

const pages = [
  ['index.html', 1280, 800],
  ['dashboard.html', 1440, 1400],
  ['parcela.html', 1440, 900],
  ['historico.html', 1440, 900],
  ['notificaciones.html', 1440, 900],
  ['perfil.html', 1440, 900],
  ['admin-dispositivos.html', 1440, 900],
  ['admin-usuarios.html', 1440, 900],
  ['gestion-parcelas.html', 1440, 900],
  ['m-inicio.html', 460, 900],
  ['m-parcela.html', 460, 900],
  ['m-zona.html', 460, 900],
  ['m-notificaciones.html', 460, 900],
];

(async () => {
  fs.mkdirSync('shots', { recursive: true });
  const b = await chromium.launch();
  const errs = [];
  for (const [f, w, h] of pages) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', (e) => errs.push(f + ': ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(f + ' console: ' + m.text()); });
    await p.goto('file://' + process.cwd() + '/' + f);
    await p.waitForTimeout(300);
    await p.screenshot({ path: 'shots/' + f.replace('.html', '.png'), fullPage: true });
    await p.close();
  }
  console.log('errors', errs);
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
