module "network" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "3.14.2"

  name = "flixtube-vpc"

  cidr = "10.0.0.0/16"
  azs  = ["${var.region}a", "${var.region}b"]

  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]

  create_igw           = true
  enable_ipv6          = true
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    "Terraform"   = "true"
    "Environment" = "prod"
  }

  vpc_tags = {
    "Name" = "flixtube-vpc"
  }
}