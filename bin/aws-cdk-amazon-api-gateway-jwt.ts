#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsCdkAmazonApiGatewayJwtStack } from '../lib/aws-cdk-amazon-api-gateway-jwt-stack';

const app = new cdk.App();
new AwsCdkAmazonApiGatewayJwtStack(app, 'AwsCdkAmazonApiGatewayJwtStack');
