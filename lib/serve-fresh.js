import path from 'path'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import serve from './serve.js'

async function serveFresh ({ file, url, mapping, reply, params, fname, ext }) {
  const { get } = this.lib._
  const { fs, sprintf } = this.lib
  const { fetchUrl } = this.app.bajoExtra
  const dir = path.dirname(file)
  fs.ensureDirSync(dir)
  let remoteUrl = mapping.remote ?? get(mapping, '_rel.group.remote')
  remoteUrl = remoteUrl
    .replace('{s}', this.getSubDomains(mapping.subDomains || get(mapping, '_rel.group.subDomains') || undefined))
    .replace('{variant}', mapping.variant || get(mapping, '_rel.group.variant') || '')
    .replace('{size}', mapping.size || get(mapping, '_rel.group.size') || '256')
    .replace('{apiKey}', mapping.apiKey || get(mapping, '_rel.group.apiKey') || '')
  if (remoteUrl.includes('{z}')) remoteUrl = remoteUrl.replace('{z}', params[0])
  if (remoteUrl.includes('{x}')) remoteUrl = remoteUrl.replace('{x}', params[1])
  if (remoteUrl.includes('{y}')) remoteUrl = remoteUrl.replace('{y}', fname)
  remoteUrl = remoteUrl.replace('{ext}', ext)
  remoteUrl = sprintf(remoteUrl, ...params)
  const extra = { rawResponse: true, cacheBuster: false }
  this.log.trace('fetching%s', remoteUrl)
  const resp = await fetchUrl(remoteUrl, {}, extra)
  if (!resp.ok) throw this.error(resp.status >= 400 && resp.status < 500 ? '_notFound' : 'peerError%s', { noContent: true })
  const fileStream = fs.createWriteStream(file, { flags: 'wx' })
  await finished(Readable.fromWeb(resp.body).pipe(fileStream))
  await serve.call(this, { file, url, mapping, reply })
}

export default serveFresh
