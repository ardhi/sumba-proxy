async function factory (pkgName) {
  const me = this

  return class SumbaProxy extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'proxy'
      this.dependencies = ['bajo-extra', 'waibu-mpa', 'dobo']
      this.config = {
        waibu: {
          title: 'Sumba Proxy',
          prefix: 'spx'
        }
      }
    }
  }
}

export default factory
