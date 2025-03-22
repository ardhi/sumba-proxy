import path from 'path'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import serve from './serve.js'

async function serveFresh ({ file, url, mapping, req, reply }) {
  const { get } = this.lib._
  const { fs, sprintf } = this.lib
  const { fetchUrl, randomRange } = this.app.bajoExtra
  const dir = path.dirname(file)
  fs.ensureDirSync(dir)
  const items = mapping.local.split('/')
  const urls = url.split('/')
  const params = []
  for (const idx in items) {
    if (items[idx].includes('*')) params.push(urls[idx])
  }
  let remoteUrl = mapping.remote ?? get(mapping, '_rel.group.remote')
  remoteUrl = sprintf(remoteUrl, ...params)
    .replace('{s}', randomRange(1, 3, true))
    .replace('{variant}', mapping.variant ?? get(mapping, '_rel.group.variant', ''))
    .replace('{dim}', mapping.dim ?? get(mapping, '_rel.group.dim', '256'))
    .replace('{apiKey}', mapping.apiKey ?? get(mapping, '_rel.group.apiKey', ''))
  const extra = { rawResponse: true, cacheBuster: false }
  this.log.trace('fetching%s', remoteUrl)
  const resp = await fetchUrl(remoteUrl, {}, extra)
  const fileStream = fs.createWriteStream(file, { flags: 'wx' })
  await finished(Readable.fromWeb(resp.body).pipe(fileStream))
  await serve.call(this, { file, url, mapping, req, reply })
}

export default serveFresh
