import serve from './serve.js'

async function serveCached ({ file, mapping, reply }) {
  const { pascalCase } = this.lib.aneka
  reply.header(`X-${pascalCase(this.name)}-Cached`, 'true')
  return serve.call(this, { file, mapping, reply })
}

export default serveCached
