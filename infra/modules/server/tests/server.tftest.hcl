variables {
  resource_id  = "0195a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b"
  name         = "tf-test"
  image        = "traefik/whoami:v1.11.0"
  port         = 80
  base_domain  = "mc.localhost"
  network_name = "mc-tenants-tftest"
}

run "setup" {
  module {
    source = "./tests/setup"
  }
}

run "plan_is_hardened" {
  command = plan

  assert {
    condition     = docker_container.this.name == "mc-server-0c1d2e3f4a5b"
    error_message = "container name must use the last 12 hex digits of the resource id"
  }

  assert {
    condition     = one(docker_container.this.capabilities).drop == toset(["ALL"])
    error_message = "all capabilities must be dropped"
  }

  assert {
    condition     = length(one(docker_container.this.capabilities).add) == 0
    error_message = "whoami needs no capability"
  }

  assert {
    condition     = contains(docker_container.this.security_opts, "no-new-privileges")
    error_message = "no-new-privileges must be set"
  }

  assert {
    condition     = docker_container.this.memory == 128 && docker_container.this.memory_swap == 128
    error_message = "memory limit 128 MiB with swap disabled"
  }

  assert {
    condition     = docker_container.this.restart == "unless-stopped"
    error_message = "servers restart unless stopped by the platform"
  }

  assert {
    condition = anytrue([
      for l in docker_container.this.labels :
      l.label == "traefik.http.routers.mc-0c1d2e3f4a5b.rule" && l.value == "Host(`tf-test.mc.localhost`)"
    ])
    error_message = "Traefik must route the server's host name to it"
  }

  assert {
    condition     = output.url == "http://tf-test.mc.localhost"
    error_message = "url output"
  }
}

run "adds_back_only_what_nginx_needs" {
  command = plan

  variables {
    image   = "nginx:1.29-alpine"
    cap_add = ["CHOWN", "SETUID", "SETGID"]
  }

  assert {
    condition     = one(docker_container.this.capabilities).add == toset(["CAP_CHOWN", "CAP_SETUID", "CAP_SETGID"])
    error_message = "only CHOWN, SETUID and SETGID are added back"
  }
}

run "rejects_a_bad_name" {
  command = plan

  variables {
    name = "Bad_Name"
  }

  expect_failures = [var.name]
}

run "rejects_latest" {
  command = plan

  variables {
    image = "nginx:latest"
  }

  expect_failures = [var.image]
}

run "rejects_a_dangerous_capability" {
  command = plan

  variables {
    cap_add = ["SYS_ADMIN"]
  }

  expect_failures = [var.cap_add]
}

run "apply_runs_the_container" {
  assert {
    condition     = length(output.container_id) == 64
    error_message = "a real container id is returned"
  }

  assert {
    condition     = output.container_name == "mc-server-0c1d2e3f4a5b"
    error_message = "container name output"
  }
}
