## Single Stack - Full Stack Deployment

Previously, we looked at how to use CDK Pipelines to create a [full stack deployment](https://subaud.io/creating-a-full-stack-app-with-cdk-pipeline/). This deployment used multiple Cloudformation stacks to create a front-end and back-end. This example will show a similar process, but uses a new technique that will allow us to use a single stack to deploy both front-end and back-end while still maintaining the ability to work on the front-end locally.

```typescript
export class SingleStackFullStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const infrastructure = new Infrastructure(this, 'infrastructure');

    const site = new Site(this, 'Site', { apiUrl: infrastructure.apiUrl });
  }
}
```

The entry point to the CDK simply calls two separate Constructs. In this case, we are creating the back-end with the `infrastructure` Construct and the front-end with the `site` Construct. The `infrastrcutre` Construct contains an API Gateway that we will be using to invoke a Lambda function. The URL of this API Gateway will be passed to `site` Construct as a prop to be used there.

```typescript
const exampleLambda = new NodejsFunction(this, 'meetingLambda', {
  entry: 'resources/index.ts',
  bundling: {
    nodeModules: ['aws-lambda'],
  },
  handler: 'lambdaHandler',
  runtime: Runtime.NODEJS_16_X,
  architecture: Architecture.ARM_64,
  role: infrastructureRole,
  timeout: Duration.seconds(60),
  environment: {
    MEETINGS_TABLE: exampleTable.tableName,
  },
});
```

The Lambda function used in the back-end uses Typescript code and is built using the [NodejsFunction Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunction.html). This will use `esbuild` to transpile the Typescript code into Javascript to be run in the NodeJS Lambda function.

---

### Front End Deployment

The front-end Construct will use a typical S3 Bucket + Cloudfront distribution to create a static website built from a React application.

The deployment to the S3 bucket will consist of two components: a production built version of the React application and JSON file with the URL from the API Gateway.

```typescript
const config = {
  apiUrl: props.apiUrl,
};

new BucketDeployment(this, 'DeployBucket', {
  sources: [bundle, Source.jsonData('config.json', config)],
  destinationBucket: this.siteBucket,
  distribution: this.distribution,
  distributionPaths: ['/*'],
});
```

The deployment uses [`Source.jsonData`](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_deployment.Source.html#static-jsonwbrdataobjectkey-obj) to capture deploy-time values before it creates the key containing the JSON data in the S3 bucket. This allows us to create the API Gateway and pass the URL of this API Gateway to the S3 bucket as a JSON file in a single stack.

---

### React Application Amplify Configuration

This JSON file will be read by the front-end React application in the [`Config.js`](https://github.com/schuettc/single-stack-full-stack-example/blob/main/site/src/Config.js) file:

```javascript
const config = await fetch('./config.json').then((response) => response.json());

export const AmplifyConfig = {
  API: {
    endpoints: [
      {
        name: 'exampleApi',
        endpoint: config.apiUrl,
      },
    ],
  },
};
```

To allow for a top level await, be sure to enable it in the [`webpack.config.js`](https://github.com/schuettc/single-stack-full-stack-example/blob/bf6fd9b7ac310a19a5f6ae5382316da37e708b6f/site/webpack.config.js#L61-L63) file:

```javascript
    experiments: {
        topLevelAwait: true,
    },
```

Within [`App.js`](https://github.com/schuettc/single-stack-full-stack-example/blob/main/site/src/App.js) this will be used to configure Amplify:

```javascript
import { AmplifyConfig as config } from './Config';
import { Amplify, API } from 'aws-amplify';
Amplify.configure(config);
```

This will be used to POST to the API Gateway to invoke the Lambda function and get the response.

```javascript
useEffect(() => {
  const fetchData = async () => {
    const exampleResponse = await API.post('exampleApi', 'example', {});
    console.log(exampleResponse);
    setHelloWorld(exampleResponse.message);
  };

  fetchData().catch(console.error);
}, []);
```

---

### Projen Scripts

Additionally, working on the the React application locally is possible by copying the `config.json` from the S3 bucket to the local directory for use with `yarn run start`.

Creating additional `package.json` scripts with Projen can be done using `project.addTask`. This example uses a script to make deployments easy:

```javascript
project.addTask('launch', {
  exec: 'yarn && yarn projen && yarn build && yarn cdk bootstrap && yarn cdk deploy --hotswap && yarn configLocal',
});
```

This script will build and deploy the included CDK as well as download the `config.json` file for use locally using the `configLocal` script.

The `configlocal` script will download the `config.json` from the S3 bucket and copy to the approriate local directory.

```javascript
project.addTask('getBucket', {
  exec: "aws cloudformation describe-stacks --stack-name single-stack-full-stack-example-dev --query 'Stacks[0].Outputs[?OutputKey==`siteBucket`].OutputValue' --output text",
});

project.addTask('configLocal', {
  exec: 'aws s3 cp s3://$(yarn run --silent getBucket)/config.json site/public/',
});
```

---

The result of this CDK is a fully built and deployed front-end and back-end React application that is hosted but can also be worked on locally.
