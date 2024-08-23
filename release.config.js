module.exports = {
  ci: false,
  dryRun: true,
  branches: ["main", {
    name: "beta",
    prerelease: true
  }],
  plugins: [
    [
      '@semantic-release/commit-analyzer', 
      { preset: 'conventionalcommits' }
    ],
    '@semantic-release/changelog',
    'semantic-release-yarn',
    ["@semantic-release/github", {
      "prerelease": true
    }],
    '@semantic-release/git',
    
  ],
  debug: true
};
