import serve from './serve.js'

async function serveCached ({ file, url, mapping, req, reply }) {
  const { pascalCase } = this.app.bajo
  reply.header(`X-${pascalCase(this.name)}-Cached`, 'true')
  return serve.call(this, { file, url, mapping, req, reply })
}

export default serveCached
