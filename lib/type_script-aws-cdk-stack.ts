import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as resourcegroups from 'aws-cdk-lib/aws-resourcegroups';
import { Construct } from 'constructs';

export class ThreeTierAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a Resource Group
    const resourceGroup = new resourcegroups.CfnGroup(this, 'ResourceGroup', {
      name: 'ThreeTierAppResources',
      resourceQuery: {
        type: 'TAG_FILTERS_1_0',
        query: {
          tagFilters:[
            {
              key:"Application",
              values:["ThreeTierApp"]
            }
          ]
        },
      }
    });

    // Create VPC
    const vpc = new ec2.Vpc(this, 'ThreeTierAppVpc', {
      maxAzs: 2,
      vpcName: 'ThreeTierAppVpc'
    });

    cdk.Tags.of(vpc).add('Application', 'ThreeTierApp');

    // Create Secret Manager for PostgreSQL database credentials
    const dbCreds = new secretsmanager.Secret(this, 'PostgreSQLCreds', {
      secretName: 'PostgreSQLCreds',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgreAdmin' }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      }
    });

    cdk.Tags.of(dbCreds).add('Application', 'ThreeTierApp');

    // Create RDS PostgreSQL database
    const dbInstance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_12 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      instanceIdentifier: 'three-tier-db',
      credentials: rds.Credentials.fromSecret(dbCreds),
      allocatedStorage: 20, // Adjust as needed
      deletionProtection: false // Set to true for production
    });

    cdk.Tags.of(dbInstance).add('Application', 'ThreeTierApp');

    // Create new role for Elastic Beanstalk
    const ebRole = new iam.Role(this, 'EBRole', {
      assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
    });

    ebRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'));
    ebRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWorkerTier'));
    ebRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkMulticontainerDocker'));

    cdk.Tags.of(ebRole).add('Application', 'ThreeTierApp');

    // Add IAM policy statement to grant Elastic Beanstalk access to the dbCreds secret
    ebRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: [dbCreds.secretArn],
    }));

    // Create Instance Profile for Elastic Beanstalk
    const ebInstanceProfile = new iam.CfnInstanceProfile(this, 'CustomInstanceProfile', {
      roles: [ebRole.roleName],
    });

    // Create Elastic Beanstalk application
    const ebsApp = new elasticbeanstalk.CfnApplication(this, 'ThreeTierApp');

    // Create Elastic Beanstalk environment
    const environment = new elasticbeanstalk.CfnEnvironment(this, 'ThreeTierAppEnvironment', {
      applicationName: ebsApp.ref,
      solutionStackName: '64bit Amazon Linux 2023 v6.1.1 running Node.js 20',
      tier: {
        name: 'WebServer',
        type: 'Standard'
      },
      tags: [{
        key:"Application",
        value:"ThreeTierApp"
      }],
      optionSettings: [
        {
            namespace: 'aws:autoscaling:launchconfiguration',
            optionName: 'IamInstanceProfile',
            value: ebInstanceProfile.attrArn,
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'DB_HOST',
          value: dbInstance.dbInstanceEndpointAddress
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'DB_PORT',
          value: dbInstance.dbInstanceEndpointPort.toString()
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'DB_CREDS_SECRET',
          value: dbCreds.secretArn
        }
      ]
    });
  }
}