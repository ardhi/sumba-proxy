import path from 'path'
import serveCached from '../../../lib/serve-cached.js'
import serveFresh from '../../../lib/serve-fresh.js'

const proxy = {
  url: '/*',
  method: 'GET',
  handler: async function (req, reply) {
    const { find, isEmpty, get, last, importPkg } = this.app.lib._
    const { fs, outmatch } = this.app.lib
    const { fetchUrl } = this.app.bajoExtra
    const { callHandler } = this.app.bajo

    const anekaSpatial = await importPkg('bajoSpatial:aneka-spatial')
    const { getTileLocation } = anekaSpatial

    const model = this.app.dobo.getModel('ProxyMapping')
    const mappings = await model.findAllRecord({ status: 'ENABLED' })

    let url = req.url.split('?')[0]
    if (!isEmpty(this.config.waibu.prefix)) url = url.slice(this.config.waibu.prefix.length + 1)
    const rec = find(mappings, m => {
      const isMatch = outmatch(m.local)
      return isMatch(url)
    })
    if (!rec) throw this.error('_notFound', { noContent: true })
    const mapping = await model.getRecord(rec.id, { refs: ['group'], throwNotFound: false })
    if (get(mapping, '_ref.group.status') !== 'ENABLED') throw this.error('_notFound', { noContent: true })
    const items = mapping.local.split('/')
    const urls = url.split('/')
    const params = []
    for (const idx in items) {
      if (items[idx].includes('*')) params.push(urls[idx])
    }
    const base = path.basename(last(params))
    const [fname, ext = ''] = base.split('.')

    const assetType = mapping.assetType ?? get(mapping, '_ref.group.assetType')
    const cdn = mapping.cdn ?? get(mapping, '_ref.group.cdn')
    if (cdn) {
      const cdnType = mapping.cdnType || get(mapping, '_ref.group.cdnType') || 'yxz'
      const [,, ...u] = urls
      let cdnUrl = `${cdn}/${u.join('/')}`
      if (['yxz', 'zxy'].includes(cdnType)) cdnUrl = getTileLocation({ type: cdnType, prefix: cdn, z: params[0], x: params[1], y: fname, format: isEmpty(ext) ? '' : `.${ext}` })
      const resp = await fetchUrl(cdnUrl, { method: 'HEAD' }, { rawResponse: true, cacheBuster: false })
      if (resp.ok) return reply.redirectTo(cdnUrl)
    }
    let file = url
    const handler = assetType === 'zxy' ? 'sumbaProxy:zxyToYxz' : null
    if (handler) file = await callHandler(handler, url, params)
    if (!isEmpty(this.config.assetPrefix)) file = `/${this.config.assetPrefix}-${file.slice(1)}`
    file = `${this.dir.data}/cache${file}`
    if (!fs.existsSync(file)) return serveFresh.call(this, { file, mapping, reply, params, fname, ext })
    return serveCached.call(this, { file, mapping, reply })
  }
}

export default proxy
