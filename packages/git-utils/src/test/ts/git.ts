import path from 'path'
import tempy from 'tempy'
import fs from 'fs-extra'

import { gitFindUp, gitInit } from '../../main/ts'

const root = path.resolve(__dirname, '../../../../../')

describe('git-utils', () => {
  describe('gitFindUp()', () => {
    it('returns the closest .git containing path', async () => {
      expect(await gitFindUp(__filename)).toBe(root)
    })

    // https://git-scm.com/docs/gitrepository-layout
    describe('gitdir ref', () => {
      it('handles `gitdir: ref` and returns target path if exists', async () => {
        const temp0 = tempy.directory()
        const temp1 = tempy.directory()
        const data = `gitdir: ${temp1}.git `

        await fs.outputFile(path.join(temp0, '.git'), data, {encoding: 'utf8'})

        expect(await gitFindUp(temp0)).toBe(temp1)
      })

      it('returns undefined if `gitdir: ref` is unreachable', async () => {
        const temp = tempy.directory()
        const data = `gitdir: /foo/bar/baz.git `

        await fs.outputFile(path.join(temp, '.git'), data, {encoding: 'utf8'})

        expect(await gitFindUp(temp)).toBeUndefined()
      })

      it('returns undefined if `gitdir: ref` is invalid', async () => {
        const temp = tempy.directory()
        const data = `gitdir: broken-ref-format`

        await fs.outputFile(path.join(temp, '.git'), data, {encoding: 'utf8'})

        expect(await gitFindUp(temp)).toBeUndefined()
      })

    })

    it('returns undefined if `.git` is not found', async () => {
      expect(await gitFindUp(tempy.root)).toBeUndefined()
    })
  })

  describe('gitInit()', () => {
    const isGitDir = async (cwd: string): Promise<boolean> =>
      (await gitFindUp(cwd)) === cwd

    it('inits a new git project in temp dir', async () => {
      const cwd = await gitInit()

      expect(cwd).toEqual(expect.any(String))
      expect(cwd).not.toBe(root)
      expect(await isGitDir(cwd)).toBe(true)
    })

    it('inits repo in specified dir', async () => {
      const cwd = tempy.directory()
      const _cwd = await gitInit(cwd)

      expect(cwd).toBe(_cwd)
      expect(await isGitDir(cwd)).toBe(true)
    })

    it('asserts that cwd does not belong to git repo', async () => {
      expect(gitInit(__dirname)).rejects.toThrowError(
        `${__dirname} belongs to repo ${root} already`,
      )
    })
  })
})
