import fs from 'node:fs'
import path from 'node:path'

const cat = JSON.parse(fs.readFileSync('src/i18n/strings.en.json', 'utf8'))

const files = []
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) walk(p)
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) files.push(p)
  }
}
walk('src')

const used = new Map()
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const re =
    /(?:t\(|key:\s*|Key:\s*|labelKey:\s*|textKey:\s*|outcomeTextKey:\s*)['"]([a-zA-Z][\w.]*)['"]/g
  for (const match of text.matchAll(re)) {
    if (!used.has(match[1])) used.set(match[1], file)
  }
}

const missing = [...used].filter(([key]) => !(key in cat))
console.log(`used literal keys ${used.size}, missing ${missing.length}`)
for (const [key, file] of missing) console.log(`${key} <- ${file}`)
