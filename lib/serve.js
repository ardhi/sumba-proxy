import path from 'path'

async function serve ({ file, mapping, req, reply }) {
  const { fs } = this.lib
  const { importPkg } = this.app.bajo
  const { get } = this.lib._
  let mimeType = mapping.mime ?? get(mapping, '_rel.group.mime')
  if (!mimeType) {
    const mime = await importPkg('waibu:mime')
    mimeType = mime.getType(path.extname(file))
  }
  reply.header('Content-Type', mimeType)
  const stream = fs.createReadStream(file)
  reply.send(stream)
  return reply
}

export default serve
