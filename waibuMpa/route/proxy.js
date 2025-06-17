import serveCached from '../../lib/serve-cached.js'
import serveFresh from '../../lib/serve-fresh.js'

const proxy = {
  url: '/*',
  method: 'GET',
  handler: async function (req, reply) {
    const { find, isEmpty, filter, get } = this.lib._
    const { fs, outmatch } = this.lib
    const { getMemdbStorage, recordGet } = this.app.dobo
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
    const cdn = mapping.cdn ?? get(mapping, '_rel.group.cdn')
    const file = `${this.dir.data}/cache${url}`
    if (!fs.existsSync(file) || cdn) return serveFresh.call(this, { cdn, file, url, mapping, req, reply })
    return serveCached.call(this, { file, url, mapping, req, reply })
  }
}

export default proxy
