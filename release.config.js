module.exports = {
  ci: false,
  branches: [
    "main",
    {
      name: "beta",
      prerelease: true,
    },
  ],
  plugins: [
    ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
    "@semantic-release/changelog",
    "semantic-release-yarn",
    [
      "@semantic-release/github",
      {
        prerelease: true,
      },
    ],
    "@semantic-release/git",
    // ["@intuit/semantic-release-slack", {
    //     // These are the available platforms that the package can be downloaded from
    //     "platforms": ["npm"]
    // }]
  ],
};
