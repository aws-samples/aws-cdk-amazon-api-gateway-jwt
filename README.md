## aws-cdk-amazon-api-gateway-jwt

In this repository, we show a way to implement JWT authorizer for API Gateway (HTTP API) with CDK.

This repository would be good example for lower level (CloudFormation level) implementation in CDK as well.

See [aws-cdk-amazon-api-gateway-jwt-stack.ts](/lib/aws-cdk-amazon-api-gateway-jwt-stack.ts) for details.

## Prerequirements
- CLI of CDK ([Installtion guide](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html))
- JWT issuer and audiences
  - **Cognito** You need a user pool and an app client
  - **Auth0** You need an application

## Create `.env` file
The stack reads an **issuer** and **audiences** from `.env` file.
You can find a template of it at [`.env.template`](/.env.template). (Copy the file and replace the values!)

```bash
mv .env.template .env
```

## Deploy

```bash
# Install dependencies
npm install

# Deployment
cdk deploy
```

## Check authentication

Once you deploy the stack, it creates API Gateway with `/auth-check` route.

First, let's confirm that the api is protected.

```bash
curl https://[Your API Gateway ID].execute-api.[Your Region].amazonaws.com/auth-check
```

It returns `{"message":"Unauthorized"}`.

After getting id token, execute the below and confirm that it returns `{"auth": "ok"}`

```bash
curl -H "Authorization: Bearer [Your ID Token]" https://[Your API Gateway ID].execute-api.[Your Region].amazonaws.com/auth-check
```

## Tips

To get id token from Cognito, execute the below.
```bash
aws cognito-idp admin-initiate-auth \
    --user-pool-id [Your User Pool ID] \
    --client-id [Your App Client ID] \
    --auth-flow ADMIN_NO_SRP_AUTH \
    --auth-parameters "USERNAME=[Username],PASSWORD=[Password]" \
    --query "AuthenticationResult.IdToken"
```

## Cleanup
```bash
cdk destroy
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
