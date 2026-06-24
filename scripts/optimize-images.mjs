import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const inputDir = path.join(process.cwd(), 'assets', 'images', 'raw')
const outputDir = path.join(process.cwd(), 'public', 'images', 'generated')
const manifestPath = path.join(outputDir, 'manifest.json')
const supportedExtensions = new Set(['.png', '.jpg', '.jpeg'])

async function listImages(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listImages(entryPath)))
    if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) files.push(entryPath)
  }

  return files
}

async function optimize() {
  await fs.mkdir(outputDir, { recursive: true })
  const images = await listImages(inputDir)
  const manifest = []

  for (const imagePath of images) {
    const parsed = path.parse(imagePath)
    const baseName = parsed.name
    const outputWebp = path.join(outputDir, `${baseName}.webp`)
    const placeholder = await sharp(imagePath).resize(24).blur(8).webp({ quality: 45 }).toBuffer()

    await sharp(imagePath).webp({ quality: 82 }).toFile(outputWebp)

    manifest.push({
      source: path.relative(process.cwd(), imagePath),
      webp: `/images/generated/${baseName}.webp`,
      placeholder: `data:image/webp;base64,${placeholder.toString('base64')}`
    })
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')
  console.log(`optimized ${manifest.length} image(s)`)
}

optimize().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
