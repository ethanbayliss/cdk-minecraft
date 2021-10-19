import * as cdk from '@aws-cdk/core';
import { ContainerStorageStack } from './storage';
import { Bucket } from '@aws-cdk/aws-s3';
import { SecurityGroup, Vpc, Peer, Port } from '@aws-cdk/aws-ec2';
import { Queue } from '@aws-cdk/aws-sqs';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { Cluster, FargateTaskDefinition, ContainerImage, Protocol, FargateService, AwsLogDriver } from '@aws-cdk/aws-ecs'
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

    const minecraftCluster = new Cluster(this, 'minecraftCluster', { 
      vpc: gameVpc,
    });

    const vanillaTask = new FargateTaskDefinition(this, 'vanillaTask', {
      cpu: 2048,
      memoryLimitMiB: vanillaMemory,
    })
    
    const vanillaLogs = new AwsLogDriver({
      streamPrefix: 'MinecraftCluster',
    })

    const vanillaContainer = vanillaTask.addContainer('itzg/minecraft-server', {
      image: ContainerImage.fromRegistry("itzg/minecraft-server"),
      memoryLimitMiB: vanillaMemory,
      environment: {
        EULA: "TRUE",
        OVERRIDE_SERVER_PROPERTIES: "true",
        TYPE: "PAPER",
        MEMORY: (vanillaMemory-500).toString() + "M",
        OPS: "ethan240"
      },
      logging: vanillaLogs,
      portMappings: [
        {
          containerPort: 25565,
          protocol: Protocol.TCP,
        },
        {
          containerPort: 25575,
          protocol: Protocol.TCP,
        },
      ],
    });

    const mcSg = new SecurityGroup(this, 'minecraftSg', {
      vpc: gameVpc,
      allowAllOutbound: true,
      description: 'Security group to allow minecraft server access to all',
    })

    mcSg.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(25565),
      'Minecraft',
    )

    const vanillaService = new FargateService(this, 'vanillaService', {
      cluster: minecraftCluster,
      taskDefinition: vanillaTask,
      assignPublicIp: true,
      serviceName: 'vanilla',
      securityGroups: [mcSg],
    })
  }
}
