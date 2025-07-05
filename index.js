import path from 'path'

async function factory (pkgName) {
  const me = this

  return class SumbaProxy extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'proxy'
      this.dependencies = ['bajo-extra', 'waibu-mpa', 'dobo', 'sumba', 'bajo-spatial']
      this.config = {
        waibu: {
          title: 'Sumba Proxy',
          prefix: 'spx'
        },
        cachePathHandler: null
      }
    }

    getSubDomains = (pattern = 'abc') => {
      const { randomRange } = this.app.bajoExtra
      const all = pattern.split('')
      return all[randomRange(0, pattern.length - 1)]
    }

    zxyToYxz = async (url, params, hashPrefix = true) => {
      const { hash } = this.app.bajoExtra
      const { isEmpty } = this.lib._
      let [, prefix] = url.split('/')
      if (hashPrefix) prefix = await hash(prefix)
      const [z, x, y] = params
      const base = path.basename(y)
      const [fname, ext = ''] = base.split('.')
      return `/${prefix}/${fname}/${x}/${z}${isEmpty(ext) ? '' : ('.' + ext)}`
    }
  }
}

export default factory
