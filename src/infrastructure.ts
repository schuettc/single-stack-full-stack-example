import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  EndpointType,
  MethodLoggingLevel,
} from 'aws-cdk-lib/aws-apigateway';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class Infrastructure extends Construct {
  public readonly apiUrl: string;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const exampleTable = new Table(this, 'exampleTable', {
      partitionKey: {
        name: 'example',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'timeToLive',
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const infrastructureRole = new Role(this, 'infrastructureRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

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

    exampleTable.grantReadWriteData(exampleLambda);

    const api = new RestApi(this, 'exampleAPI', {
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'POST'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    const example = api.root.addResource('example');

    const meetingIntegration = new LambdaIntegration(exampleLambda);

    example.addMethod('POST', meetingIntegration, {});

    this.apiUrl = api.url;
  }
}
