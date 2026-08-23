// Genera los cuatro íconos de una PWA a partir de public/logo.png.
// Reimplementa en Node (Jimp) la lógica del script Python de la skill
// pwa-instalable, porque este equipo no tiene Python instalado.
import { Jimp } from 'jimp'
import path from 'node:path'

const ORIGEN = path.resolve('public/logo.png')
const SALIDA = path.resolve('public')
const FONDO = 0xffffffff // blanco opaco

// (nombre, lado, margen en fracción del lado)
const SALIDAS = [
  ['icon-192.png', 192, 0.06],
  ['icon-512.png', 512, 0.06],
  ['icon-maskable-512.png', 512, 0.22],
  ['apple-touch-icon.png', 180, 0.055],
]

function safeZone(lado, w, h) {
  const radioLogo = Math.hypot(w / 2, h / 2)
  const radioSeguro = 0.4 * lado
  return { radioLogo, radioSeguro, ok: radioLogo <= radioSeguro }
}

async function main() {
  const src = await Jimp.read(ORIGEN)
  console.log(`origen: ${ORIGEN}  ${src.width}x${src.height}`)
  if (src.width < 512 || src.height < 512) {
    console.log('  aviso: el origen mide menos de 512 px de lado.')
  }

  for (const [nombre, lado, margenFrac] of SALIDAS) {
    const margen = Math.round(lado * margenFrac)
    const util = lado - 2 * margen
    const escala = Math.min(util / src.width, util / src.height)
    const w = Math.max(1, Math.round(src.width * escala))
    const h = Math.max(1, Math.round(src.height * escala))

    const logo = src.clone().resize({ w, h })
    const lienzo = new Jimp({ width: lado, height: lado, color: FONDO })
    lienzo.composite(logo, Math.round((lado - w) / 2), Math.round((lado - h) / 2))

    const destino = path.join(SALIDA, nombre)
    await lienzo.write(destino)

    let detalle = `  ${nombre.padEnd(24)} ${lado}x${lado}  logo ${w}x${h}`
    if (nombre.includes('maskable')) {
      const { radioLogo, radioSeguro, ok } = safeZone(lado, w, h)
      detalle += `\n      zona segura: logo a ${radioLogo.toFixed(0)}px del centro, límite ${radioSeguro.toFixed(0)}px ==> ${ok ? 'OK' : 'SE RECORTA'}`
    }
    console.log(detalle)
  }

  console.log('\nListo.')
}

main()
