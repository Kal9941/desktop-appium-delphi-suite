// Roda só os cenários marcados @bug (vermelhos propositais de bug conhecido do produto), que a
// execução padrão (`npm test`, CI) deixa de fora. Uso: `npm run test:bugs` (aceita os mesmos
// argumentos do wdio, ex.: `npm run test:bugs -- --spec tests/features/4.calculo.feature`).
import { spawnSync } from 'node:child_process'

const resultado = spawnSync('npx', ['wdio', 'run', 'wdio.conf.js', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CUCUMBER_TAGS: '@bug' },
})
process.exit(resultado.status ?? 1)
