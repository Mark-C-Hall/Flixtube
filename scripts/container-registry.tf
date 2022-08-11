resource "aws_ecr_repository" "flixtube" {
  name                 = "flixtube"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "KMS"
  }

}

output "registry_url" {
  value = aws_ecr_repository.flixtube.repository_url
}