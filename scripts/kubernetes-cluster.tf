module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "18.27.1"

  cluster_name    = local.cluster_name
  cluster_version = "1.22"

  vpc_id     = module.network.vpc_id
  subnet_ids = module.network.public_subnets

  eks_managed_node_group_defaults = {
    ami_type = "AL2_x86_64"

    attach_cluster_primary_security_group = true

  }

  eks_managed_node_groups = {
    one = {
      name = "node-group-1"

      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 2
      desired_size = 1
    }
  }
}