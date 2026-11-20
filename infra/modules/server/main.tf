locals {
  # The last 12 hex digits of the UUID. UUIDv7 starts with a timestamp, so the
  # end (random bits) is what makes two servers created in the same millisecond differ.
  short_id       = substr(replace(var.resource_id, "-", ""), 20, 12)
  container_name = "mc-server-${local.short_id}"
  router         = "mc-${local.short_id}"
  host           = "${var.name}.${var.base_domain}"

  labels = {
    "mc.resource-id" = var.resource_id
    "mc.service"     = "server"
    "mc.name"        = var.name

    # Traefik (docker provider) routes http://<name>.<base_domain> to this container.
    "traefik.enable"                                                 = "true"
    "traefik.docker.network"                                         = var.network_name
    "traefik.http.routers.${local.router}.rule"                      = "Host(`${local.host}`)"
    "traefik.http.routers.${local.router}.entrypoints"               = "web"
    "traefik.http.services.${local.router}.loadbalancer.server.port" = tostring(var.port)
  }
}

# The network is created by the platform (Compose), never by a tenant module.
data "docker_network" "tenants" {
  name = var.network_name
}

resource "docker_image" "this" {
  name = var.image
  # Images are shared by many servers; removing one server must not delete the image.
  keep_locally = true
}

resource "docker_container" "this" {
  name     = local.container_name
  image    = docker_image.this.image_id
  restart  = "unless-stopped"
  must_run = true

  memory      = var.memory_mb
  memory_swap = var.memory_mb

  security_opts = ["no-new-privileges"]

  capabilities {
    drop = ["ALL"]
    # Docker stores names with the CAP_ prefix; sending them that way keeps plans stable.
    add = [for c in var.cap_add : "CAP_${c}"]
  }

  networks_advanced {
    name = data.docker_network.tenants.name
  }

  dynamic "labels" {
    for_each = local.labels
    content {
      label = labels.key
      value = labels.value
    }
  }
}
