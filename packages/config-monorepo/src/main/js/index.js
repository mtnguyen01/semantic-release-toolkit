module.exports = {
  branch: 'master',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          {type: 'docs', release: 'patch'},
          {type: 'refactor', release: 'patch'},
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES']
        }
      }
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install && git add ../../yarn.lock',
        publishCmd: 'yarn npm publish'
      }
    ],
    [
      '@semrel-extra/npm',
      {
        "npmPublish": false
      }
    ],
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false
      }
    ],
    [
      '@semantic-release/git',
      {
        message: 'chore(release): ${nextRelease.gitTag} [skip ci]\n\n${nextRelease.notes}'
      }
    ]
  ]
}
