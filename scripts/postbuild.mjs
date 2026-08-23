// GitHub Pages no tiene un fallback de SPA como Vercel/Azure: si alguien
// recarga una ruta interna (ej. /Gastos/cuentas), sirve su propio 404.
// Copiar index.html como 404.html hace que ese 404 arranque la app igual,
// y React Router resuelve la ruta desde la URL.
import { copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve('dist')

await copyFile(path.join(dist, 'index.html'), path.join(dist, '404.html'))
await writeFile(path.join(dist, '.nojekyll'), '')

console.log('postbuild: 404.html y .nojekyll listos')
