# Welcome to Three Tier Application AWS CDK project with TypeScript

The `cdk.json` file tells the CDK Toolkit how to execute your app.

This AWS CDK project deploys next resources:
- resource group for logical grouping
- vpc for networking
- secret for store database credentials
- database instance for data tier
- elastic beanstalk for presentation and application tiers
- iam instance profile with required iam roles (including the one to allow elastic beanstalk environment to read database credentials secret)

## Prerequisites:
* aws cli
* node
* typescript
* aws-cdk

## To Run:
* `aws configure`
* set env variables for CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION or update the code in bin/type_script-aws-cdk.ts
* `cdk bootstrap`
* `npm run test`
* `cdk deploy`
* `cdk destroy`

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
