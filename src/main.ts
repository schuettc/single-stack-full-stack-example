import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Site, Infrastructure } from './index';

export class SingleStackFullStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const infrastructure = new Infrastructure(this, 'infrastructure');

    const site = new Site(this, 'Site', { apiUrl: infrastructure.apiUrl });

    new CfnOutput(this, 'apiUrl', { value: infrastructure.apiUrl });
    new CfnOutput(this, 'distribution', {
      value: site.distribution.domainName,
    });

    new CfnOutput(this, 'siteBucket', { value: site.siteBucket.bucketName });
  }
}
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new SingleStackFullStack(app, 'single-stack-full-stack-example-dev', {
  env: devEnv,
});

app.synth();
