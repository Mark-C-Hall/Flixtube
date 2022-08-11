resource "aws_resourcegroups_group" "flixtube" {
  name = var.app_name

  resource_query {
    query = <<JSON
    {
      "ResourceTypeFilters": [
        "AWS::EC2::Instance"
      ],
      "TagFilters": [
        {
          "Key": "Env",
          "Values": ["Prod"]
        }
      ]
    }
    JSON
  }
}