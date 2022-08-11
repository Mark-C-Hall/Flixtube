resource "aws_vpc" "flixtube" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    "Name" = "flixtube"
  }
}

resource "aws_subnet" "public-subnet-01" {
  vpc_id            = aws_vpc.flixtube.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    "Name" = "public-subnet-01"
  }
}

resource "aws_subnet" "public-subnet-02" {
  vpc_id            = aws_vpc.flixtube.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    "Name" = "public-subnet-02"
  }
}

resource "aws_subnet" "private-subnet-01" {
  vpc_id            = aws_vpc.flixtube.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"

  tags = {
    "Name" = "private-subnet-01"
  }
}

resource "aws_subnet" "private-subnet-02" {
  vpc_id            = aws_vpc.flixtube.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"

  tags = {
    "Name" = "private-subnet-02"
  }
}

resource "aws_internet_gateway" "flixtube-igw" {
  vpc_id = aws_vpc.flixtube.id

  tags = {
    "Name" = "flixtube-igw"
  }
}

resource "aws_route_table" "flixtube-public-rt" {
  vpc_id = aws_vpc.flixtube.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.flixtube-igw.id
  }
}

resource "aws_route_table_association" "public-subnet-01-rt" {
  subnet_id      = aws_subnet.public-subnet-01.id
  route_table_id = aws_route_table.flixtube-public-rt.id
}

resource "aws_route_table_association" "public-subnet-02-rt" {
  subnet_id      = aws_subnet.public-subnet-02.id
  route_table_id = aws_route_table.flixtube-public-rt.id
}