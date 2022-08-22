const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.38.1',
  license: 'MIT-0',
  author: 'Court Schuett',
  authorAddress: 'https://subaud.io',
  copyrightOwner: 'Court Schuett',
  appEntrypoint: 'main.ts',
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['schuettc'],
  },
  autoApproveUpgrades: true,
  projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
  defaultReleaseBranch: 'main',
  name: 'single-stack-full-stack-example',
  eslintOptions: { ignorePatterns: ['resources/**'] },
  deps: ['fs-extra', '@types/fs-extra'],
});

const common_exclude = [
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'dependabot.yml',
  '.DS_Store',
];

project.addTask('launch', {
  exec: 'yarn && yarn projen && yarn build && yarn cdk bootstrap && yarn cdk deploy --hotswap && yarn configLocal',
});
project.addTask('getBucket', {
  exec: "aws cloudformation describe-stacks --stack-name single-stack-full-stack-example-dev --query 'Stacks[0].Outputs[?OutputKey==`siteBucket`].OutputValue' --output text",
});

project.addTask('configLocal', {
  exec: 'aws s3 cp s3://$(yarn run --silent getBucket)/config.json site/public/',
});

project.gitignore.exclude(...common_exclude);
project.synth();
