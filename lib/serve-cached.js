import serve from './serve.js'

async function serveCached ({ file, url, mapping, reply }) {
  const { pascalCase } = this.lib.aneka
  reply.header(`X-${pascalCase(this.name)}-Cached`, 'true')
  return serve.call(this, { file, url, mapping, reply })
}

export default serveCached
