import path from 'path'
import serveCached from '../../lib/serve-cached.js'
import serveFresh from '../../lib/serve-fresh.js'

const proxy = {
  url: '/*',
  method: 'GET',
  handler: async function (req, reply) {
    const { find, isEmpty, filter, get, last } = this.lib._
    const { fs, outmatch } = this.lib
    const { getTileLocation } = this.app.bajoSpatial.lib.anekaSpatial
    const { getMemdbStorage, recordGet } = this.app.dobo
    const { fetchUrl } = this.app.bajoExtra
    const mappings = filter(getMemdbStorage('ProxyMapping'), { status: 'ENABLED' })

    let url = req.url.split('?')[0]
    if (!isEmpty(this.config.waibu.prefix)) url = url.slice(this.config.waibu.prefix.length + 1)
    const rec = find(mappings, m => {
      const isMatch = outmatch(m.local)
      return isMatch(url)
    })
    if (!rec) throw this.error('_notFound', { noContent: true })
    const mapping = await recordGet('ProxyMapping', rec.id, { rels: ['group'] })
    if (get(mapping, '_rel.group.status') !== 'ENABLED') throw this.error('_notFound', { noContent: true })
    const items = mapping.local.split('/')
    const urls = url.split('/')
    const params = []
    for (const idx in items) {
      if (items[idx].includes('*')) params.push(urls[idx])
    }
    const base = path.basename(last(params))
    const [fname, ext = ''] = base.split('.')

    const cdn = mapping.cdn ?? get(mapping, '_rel.group.cdn')
    if (cdn) {
      const type = mapping.cdnType ?? get(mapping, '_rel.group.cdnType', 'rtms')
      const url = getTileLocation({ type, prefix: cdn, z: params[0], x: params[1], y: fname, format: isEmpty(ext) ? '' : `.${ext}` })
      const resp = await fetchUrl(url, { method: 'HEAD' }, { rawResponse: true, cacheBuster: false })
      if (resp.ok) return reply.redirectTo(url)
    }
    const file = `${this.dir.data}/cache${url}`
    if (!fs.existsSync(file)) return serveFresh.call(this, { file, url, mapping, reply, params, fname, ext })
    return serveCached.call(this, { file, url, mapping, reply })
  }
}

export default proxy
