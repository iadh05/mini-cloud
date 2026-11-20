variable "resource_id" {
  description = "Id of the resource in the platform database (UUID)."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", var.resource_id))
    error_message = "resource_id must be a lowercase UUID."
  }
}

variable "name" {
  description = "Server name; becomes the DNS label <name>.<base_domain>."
  type        = string

  validation {
    condition     = length(var.name) >= 3 && length(var.name) <= 40 && can(regex("^[a-z]([a-z0-9-]*[a-z0-9])?$", var.name))
    error_message = "name must be 3-40 chars: lowercase letters, digits and hyphens, start with a letter, not end with a hyphen."
  }
}

variable "image" {
  description = "Pinned image reference, e.g. nginx:1.29-alpine. Never latest."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9./-]+:[A-Za-z0-9._-]+$", var.image)) && !endswith(var.image, ":latest")
    error_message = "image must be a pinned reference with an exact tag (not latest)."
  }
}

variable "port" {
  description = "Port the app listens on inside the container."
  type        = number

  validation {
    condition     = var.port >= 1 && var.port <= 65535 && floor(var.port) == var.port
    error_message = "port must be a whole number between 1 and 65535."
  }
}

variable "base_domain" {
  description = "Domain under which servers get their URL, e.g. mc.localhost."
  type        = string
}

variable "network_name" {
  description = "Existing Docker network shared by tenant servers and the router."
  type        = string
  default     = "mc-tenants"
}

variable "memory_mb" {
  description = "Memory limit in MiB. Swap is disabled (swap limit = memory limit)."
  type        = number
  default     = 128

  validation {
    condition     = var.memory_mb >= 16 && var.memory_mb <= 8192
    error_message = "memory_mb must be between 16 and 8192."
  }
}

variable "cap_add" {
  description = "Linux capabilities added back after dropping ALL. Only what the image needs."
  type        = list(string)
  default     = []

  validation {
    condition     = alltrue([for c in var.cap_add : contains(["CHOWN", "SETUID", "SETGID", "NET_BIND_SERVICE"], c)])
    error_message = "cap_add may only contain CHOWN, SETUID, SETGID and NET_BIND_SERVICE."
  }
}
