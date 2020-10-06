import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigatewayv2';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dotenv from 'dotenv';

export class AwsCdkAmazonApiGatewayJwtStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Load environment variables from dotenv files
    dotenv.config();

    // Check environment variables
    this.validation();
    const issuer = process.env.JWT_ISSUER!;
    const audience = process.env.JWT_AUDIENCE!.split(',');
    const identitySource = ['$request.header.Authorization'];

    // Create a http api
    const httpApi = this.createHttpApi();
    const httpApiAuthCheck = this.createHttpRouteKey('/auth-check', apigateway.HttpMethod.GET);

    // Create a lambda function and it's integration
    const authCheckLambda = this.createAuthCheckLambda(httpApi, httpApiAuthCheck);
    const authCheckLambdaIntegration = this.createHttpIntegration(httpApi, authCheckLambda);

    // Create an authorizer and a route with the authorizer
    const authorizer = this.createAuthorizer(httpApi, issuer, audience, identitySource)
    const route = this.createRoute(httpApi, httpApiAuthCheck, authCheckLambdaIntegration, authorizer);
  }

  validation() {
    if (!process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE) {
      console.error('------------------------------[ERROR]------------------------------');
      console.error('  Environment variable JWT_ISSUER and/or JWT_AUDIENCE are not set.');
      console.error('  Check you .env file or you can set it directly.');
      console.error('  > export JWT_ISSUER=[REPLACE ME]');
      console.error('  > export JWT_AUDIENCE=[REPLACE ME]');
      console.error('-------------------------------------------------------------------');
      process.exit(0);
    }
  }

  createHttpApi() : apigateway.HttpApi {
    const httpApi = new apigateway.HttpApi(this, 'aws-cdk-amazon-api-gateway-jwt-api', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [apigateway.HttpMethod.GET],
      },
    });

    return httpApi;
  }

  createHttpRouteKey(path: string, method: apigateway.HttpMethod): apigateway.HttpRouteKey {
    return apigateway.HttpRouteKey.with(path, method);
  }

  createAuthCheckLambda(httpApi: apigateway.HttpApi, httpRouteKey: apigateway.HttpRouteKey) : lambda.Function {
    const authCheckLambda = new lambda.Function(this, 'aws-cdk-amazon-api-gateway-jwt-lambda', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.asset('lambda'),
      handler: 'auth-check.handler',
    });

    authCheckLambda.addPermission('aws-cdk-amazon-api-gateway-jwt-lambda-permission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: cdk.Stack.of(this).formatArn({
        service: 'execute-api',
        resource: httpApi.httpApiId,
        resourceName: `*/*${httpRouteKey.path ?? ''}`,
      }),
    });

    return authCheckLambda;
  }

  createHttpIntegration(httpApi: apigateway.HttpApi, handler: lambda.Function) : apigateway.HttpIntegration {
    const httpIntegration = new apigateway.HttpIntegration(this, 'aws-cdk-amazon-api-gateway-jwt-integration', {
      httpApi,
      integrationType: apigateway.HttpIntegrationType.LAMBDA_PROXY,
      integrationUri: handler.functionArn,
      payloadFormatVersion: apigateway.PayloadFormatVersion.VERSION_2_0,
    });

    return httpIntegration;
  }

  createAuthorizer(
    httpApi: apigateway.HttpApi,
    issuer: string,
    audience: string[],
    identitySource: string[]
  ) : apigateway.CfnAuthorizer {
    const authorizer = new apigateway.CfnAuthorizer(this, 'aws-cdk-amazon-api-gateway-jwt-authorizer', {
      apiId: httpApi.httpApiId,
      authorizerType: 'JWT',
      name: 'aws-cdk-amazon-api-gateway-jwt',
      identitySource,
      jwtConfiguration: {
        audience,
        issuer,
      },
    });

    return authorizer;
  }

  createRoute(
    httpApi: apigateway.HttpApi,
    httpRouteKey: apigateway.HttpRouteKey,
    httpIntegration: apigateway.HttpIntegration,
    authorizer: apigateway.CfnAuthorizer) : apigateway.CfnRoute {
    const route = new apigateway.CfnRoute(this, 'aws-cdk-amazon-api-gateway-jwt-route', {
      apiId: httpApi.httpApiId,
      target: `integrations/${httpIntegration.integrationId}`,
      routeKey: httpRouteKey.key,
      authorizationType: 'JWT',
      authorizerId: authorizer.ref,
    });

    return route;
  }
}
