terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.9"
    }
  }
}

variable "network_name" {
  type = string
}

# Stands in for the platform's mc-tenants network during tests.
resource "docker_network" "test" {
  name = var.network_name
}

output "network_name" {
  value = docker_network.test.name
}
