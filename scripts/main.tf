provider "aws" {
  region = var.region
}

locals {
  cluster_name = "flixtube-eks-1"
}