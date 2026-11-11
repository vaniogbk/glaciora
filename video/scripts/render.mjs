// npm run render -- fr de cs … : rend une vidéo par langue dans out/ (1080 × 1920, H.264, sans son).
// Le projet est empaqueté une seule fois (build/), puis chaque langue est rendue depuis ce paquet.
// Utilise le Chrome sans interface de Playwright s'il est déjà installé (évite un téléchargement de Remotion).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ALL = ['fr', 'de', 'sk', 'it', 'cs', 'pl', 'sv', 'es', 'fi', 'nb', 'lt', 'pt', 'sl'];
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const pw = path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright');
const shell = existsSync(pw)
  ? readdirSync(pw)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .sort()
      .map((d) => path.join(pw, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'))
      .filter(existsSync)
      .pop()
  : undefined;
const browser = shell ? [`--browser-executable="${shell}"`] : [];
// Machine lente : une image peut dépasser le délai par défaut (30 s) ; on laisse 2 min et on retente une fois.
const run = (args, tries = 1) => {
  for (let i = 0; i <= tries; i++) {
    const r = spawnSync('npx', args, { stdio: 'inherit', shell: true });
    if (r.status === 0) return;
    if (i < tries) console.log('Échec, nouvel essai…');
    else process.exit(r.status ?? 1);
  }
};

if (!process.env.SKIP_BUNDLE) run(['remotion', 'bundle', 'src/index.ts', '--out-dir=build']);
mkdirSync('out', { recursive: true });
for (const lang of langs) {
  console.log(`\n=== ${lang} ===`);
  run(['remotion', 'render', 'build', `Glaciora-${lang}`, `out/glaciora-${lang}.mp4`, '--codec=h264', '--crf=18', '--concurrency=6', '--timeout=120000', ...browser]);
}
