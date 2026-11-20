output "container_id" {
  description = "Docker container id."
  value       = docker_container.this.id
}

output "container_name" {
  description = "Docker container name (mc-server-<short id>)."
  value       = docker_container.this.name
}

output "url" {
  description = "URL served through the router."
  value       = "http://${local.host}"
}
