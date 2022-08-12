resource "aws_ecr_repository" "flixtube" {
  name                 = var.app_name
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
  }

}