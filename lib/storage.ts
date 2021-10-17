import * as cdk from '@aws-cdk/core';
import { FileSystem } from '@aws-cdk/aws-efs';
import { IVpc } from '@aws-cdk/aws-ec2';

//create efs filesystems for containers to connect to, one stack for each instance
export class ContainerStorageStack extends cdk.NestedStack {
  public readonly gameInstance: string;
  public readonly efs: FileSystem;

  constructor(scope: cdk.Construct, id: string, gameInstance: string, gameVpc: IVpc, props?: cdk.NestedStackProps) {
    super(scope, id, props);
    
    const efs = new FileSystem(this, gameInstance, {
      vpc: gameVpc,
      enableAutomaticBackups: true,
    });
  }
}