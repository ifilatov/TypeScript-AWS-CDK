import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib/core';
import { ThreeTierAppStack } from '../lib/type_script-aws-cdk-stack';

test('Stack Snapshot', () => {
  const app = new cdk.App();
  const stack = new ThreeTierAppStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

test('VPC Created', () => {
  const app = new cdk.App();
  const stack = new ThreeTierAppStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  expect(template.hasResource('AWS::EC2::VPC', {
    "Properties": {
      "CidrBlock":"10.0.0.0/16"
    }
  }));
});

test('Secrets Manager Secret Created', () => {
  const app = new cdk.App();
  const stack = new ThreeTierAppStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  expect(template.hasResource('AWS::SecretsManager::Secret', {
    "Properties": {
      "GenerateSecretString": {
        "ExcludePunctuation":true,
        "GenerateStringKey":"password",
        "IncludeSpace":false
      }
    }
  }));
});

test('RDS Database Instance Created', () => {
  const app = new cdk.App();
  const stack = new ThreeTierAppStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  expect(template.hasResource('AWS::RDS::DBInstance', {
    "Properties": {
      "DBInstanceClass":"db.t3.micro",
      "DBInstanceIdentifier":"three-tier-db",
      "DeletionProtection":false,
      "Engine":"postgres",
      "EngineVersion":"12"
    }
  }));
});

test('Elastic Beanstalk Environment Created', () => {
  const app = new cdk.App();
  const stack = new ThreeTierAppStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  expect(template.hasResource('AWS::ElasticBeanstalk::Environment', {
    "Properties": {
      "ApplicationName": {
        "Ref":"ThreeTierApp"
      },
      "SolutionStackName":"64bit Amazon Linux 2 v3.4.6 running Node.js 14",
      "Tier": {
        "Name":"WebServer",
        "Type":"Standard"
      }
    }
  }));
});