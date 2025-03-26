async function factory (pkgName) {
  const me = this

  return class SumbaProxy extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'proxy'
      this.dependencies = ['bajo-extra', 'waibu-mpa', 'dobo', 'sumba']
      this.config = {
        waibu: {
          title: 'Sumba Proxy',
          prefix: 'spx'
        }
      }
    }

    getSubDomains = (pattern = 'abc') => {
      const { randomRange } = this.app.bajoExtra
      const all = pattern.split('')
      return all[randomRange(0, pattern.length - 1)]
    }
  }
}

export default factory
