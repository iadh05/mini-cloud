# 0005. Docker as the first data plane

- Status: Accepted
- Date: 2026-11-17

## Context
A real cloud runs virtual machines on hypervisors, which needs hardware support and a lot of memory. You start on a Windows PC with 16 GB of RAM.

## Decision
Phases 1 to 8 use Docker containers as "servers", and run databases, buckets and the other services as containers. Real virtual machines arrive in Phase 9, on dedicated hardware.

## Consequences
- Fast and cheap: a "server" starts in seconds and uses 10 to 50 MB.
- It uses namespaces, control groups, networks and volumes, the same building blocks as every cloud.
- Containers share the host's kernel, so isolation is weaker than with virtual machines. Tenant containers must be hardened (ARCHITECTURE.md, section 9).
- Docker Desktop runs Docker inside its own virtual machine. Host-level firewall rules (nftables) may need Docker Engine installed inside Ubuntu instead. Decided in Phase 4.

## Alternatives considered
- **Virtual machines from day one (Hyper-V, VirtualBox, Multipass):** realistic, but slow and memory-hungry on a laptop.
- **Kubernetes (kind or k3d):** a lot of complexity before the basics work.
- **Podman:** fine, but Docker is already installed and has the better Terraform provider.
