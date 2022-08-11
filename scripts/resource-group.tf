resource "aws_resourcegroups_group" "flixtube" {
  name = "Flixtube"

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