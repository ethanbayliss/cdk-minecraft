import * as cdk from '@aws-cdk/core';
import { ContainerStorageStack } from './storage';
import { Bucket } from '@aws-cdk/aws-s3';
import { Vpc } from '@aws-cdk/aws-ec2';
import { Queue } from '@aws-cdk/aws-sqs';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { Cluster, FargateTaskDefinition, ContainerImage, Protocol } from '@aws-cdk/aws-ecs'
import path = require('path');

export class CdkMinecraftStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vanillaMemory = 4096

    const gameVpc = Vpc.fromLookup(this, 'vpc', {
      isDefault: true,
    });

    const mcStorageBucket = new Bucket(this, `MinecraftStorage`, {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const discordMessageQueue = new Queue(this, 'discordMessageQueue', {
      fifo: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // const asset = new DockerImageAsset(this, 'discordjs-bot', {
    //   directory: path.join(__dirname, 'ecr/discordjs-bot')
    // });

    new ContainerStorageStack(this, 'Storage', 'vanilla', gameVpc)

    new Cluster(this, 'minecraftCluster', { 
      vpc: gameVpc,
    });

    const vanillaTask = new FargateTaskDefinition(this, 'vanilla', {
      cpu: 2048,
      memoryLimitMiB: vanillaMemory,
    })

    const vanillaContainer = vanillaTask.addContainer('itzg/minecraft-server', {
      image: ContainerImage.fromRegistry("itzg/minecraft-server"),
      memoryLimitMiB: vanillaMemory,
      environment: {
        EULA: "TRUE",
        OVERRIDE_SERVER_PROPERTIES: "true",
        TYPE: "PAPER",
        MEMORY: (vanillaMemory-500).toString + "M",
      },
      portMappings: [
        {
          containerPort: 25565,
          protocol: Protocol.TCP,
        },
      ],
    });

    //make a service
  }
}
