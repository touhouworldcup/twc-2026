import { readFile, glob, stat } from 'fs/promises'
import { homedir } from 'os'
import { join, posix } from 'path'
import { execSync } from 'child_process'
import SftpClient from 'ssh2-sftp-client'
import { targets } from './deploy-config.js'

execSync('npm run build', { stdio: 'inherit' })
const fileGlob = '{{dashboard,extension,graphics,schemas}/**/{*,.*}, package.json, package-lock.json}'
const rawFiles = await Array.fromAsync(glob(fileGlob))
const files = (await Promise.all(rawFiles.map(async file => {
  const st = await stat(file)
  return st.isFile() ? { file, st } : null
}))).filter(Boolean)

const privateKey = await readFile(join(homedir(), '.ssh', 'id_rsa'))
await Promise.all(targets.map(async (target) => {
  const sftp = new SftpClient()
  try {
    await sftp.connect({ ...target, privateKey })
    console.log(`Connected to ${target.host}`)

    const dirs = [...new Set(files.map(f => posix.dirname(posix.join(target.remotePath, f.file.replaceAll('\\', '/')))))]
    for (const dir of dirs) {
      if (!await sftp.exists(dir)) await sftp.mkdir(dir, true)
    }

    await Promise.all(files.map(async ({ file, st }) => {
      const dest = posix.join(target.remotePath, file.replaceAll('\\', '/'))
      const remote = await sftp.stat(dest).catch(() => null)
      const needsUpload = !remote || st.size !== remote.size || st.mtimeMs > remote.modifyTime

      if (needsUpload) await sftp.put(file, dest)
    }))

    console.log(`Deployed to ${target.host}!`)
  } catch (err) {
    console.error(`Failed ${target.host}: ${err.message}`)
  } finally {
    await sftp.end()
  }
}))
