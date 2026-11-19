# Mini Cloud — Capacity and Host Configuration

| | |
|---|---|
| Status | Draft v1 |
| Last updated | 2026-11-17 |
| Related | [Spec](SPEC.md) (FR-14, NFR-4, NFR-5) · [Architecture](ARCHITECTURE.md) · [Backend](BACKEND.md) |

How we decide **what sizes users can pick**, **how big each host must be**, and **how each host is configured**. Every number here starts as an estimate and is replaced by a measurement at the phase shown.

---

## 1. The method

Always in this order:

1. **Measure real workloads** → choose the sizes users can buy. *(load tests; fixed in Phase 3)*
2. **Measure the platform itself** → know the fixed overhead. *(Phase 6)*
3. **Calculate the host** → overhead + user capacity + margin. *(Phase 7)*
4. **Enforce it in code** → the API refuses what doesn't fit. *(Phase 3 for one host, Phase 9 for many)*
5. **Write the host configuration as code** → any host can be rebuilt from nothing. *(Phase 7)*

## 2. Measuring a workload

Run the workload, put load on it, record the **peak**, not the idle value.

```bash
# 1. Start the workload
docker run -d --name t-nginx -p 8080:80 nginx:<pinned-tag>

# 2. Idle usage
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}"

# 3. Put load on it (in a second terminal), for example with 'hey':
#    2000 requests, 50 at a time
hey -n 2000 -c 50 http://localhost:8080/

# 4. Watch peak usage while the load runs
docker stats t-nginx
```

Record each result in a sizing table:

| Workload | Idle memory | Peak memory | Peak CPU | Notes |
|---|---|---|---|---|
| nginx static page | _measure_ | _measure_ | _measure_ | |
| Small Node.js app | _measure_ | _measure_ | _measure_ | |
| Postgres, empty | _measure_ | _measure_ | _measure_ | |
| Postgres, 100k rows + queries | _measure_ | _measure_ | _measure_ | |

### From measurements to sizes

**Size memory = peak × 1.5, rounded up to the next 128 MB step.** The 1.5 leaves room for spikes you didn't test.

Current proposal, to be confirmed by load tests and recorded in an ADR in Phase 3:

| Size | CPU | Memory | Fits |
|---|---|---|---|
| `nano` | 0.25 vCPU | 128 MB | Static sites |
| `small` | 0.5 vCPU | 256 MB | Small apps |
| `medium` | 1 vCPU | 512 MB | Busy apps, databases |

Sizes are defined once in `packages/shared/src/resource-types/server.ts` and passed to the Terraform server module as memory and CPU limits.

## 3. Measuring the platform (Phase 6)

Measure in two situations: **idle**, and **busy** (10 servers being created at once).

Quick check, any time:

```bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}" | grep -v mc-server
```

Proper check, once Prometheus runs (highest memory per platform container over 7 days):

```promql
max_over_time(container_memory_working_set_bytes{name=~"mc-(api|worker|postgres|traefik|minio|prometheus).*"}[7d])
```

| Part | Estimate | Measured idle | Measured busy |
|---|---|---|---|
| OS + Docker | 500–700 MB | | |
| API | 100–200 MB | | |
| Worker + Terraform | 150–400 MB | | |
| Postgres | 100–300 MB | | |
| Traefik + dashboard files | 50–150 MB | | |
| MinIO | 200–500 MB | | |
| Monitoring | 400–800 MB | | |
| **Total** | **1.5–3 GB** | | |

The **busy** total is the number used in the formula.

## 4. Calculating a host

```
User memory = Total − (OS + Docker) − Platform (busy) − Margin (20% of Total)
User CPU    = (Total vCPU − 1 reserved for the platform) × CPU overcommit (4)
Capacity    = whichever of memory or CPU runs out first
```

| Resource | Overcommit | Why |
|---|---|---|
| CPU | 4× | Most apps are idle most of the time. When all are busy, they slow down; nothing crashes. |
| Memory | 1× (none) | When memory runs out, Linux kills processes. |
| Disk | None, keep 30% free | A full disk stops the database, Docker and logging at once. |

### Worked example: 4 vCPU / 8 GB, platform measured at 2.5 GB

| | |
|---|---|
| User memory | 8 − 0.7 − 2.5 − 1.6 = **3.2 GB** → 12 `small` |
| User CPU | (4 − 1) × 4 = **12 vCPU** → 24 `small` |
| **Capacity** | **12 `small` servers. Memory runs out first.** |

### Disk

| Uses disk | Rough size |
|---|---|
| OS + Docker | 10 GB |
| Images (cached once per host) | 5–15 GB |
| Volumes (databases) | Sum of volume sizes sold |
| MinIO (buckets, backups, registry) | Sum of bucket quotas |
| Logs | Capped by Docker log rotation (§6) |
| Free space | 30% of total |

## 5. Enforcing capacity in code

### Data (Phase 3 for one host, Phase 9 for many)

```
hosts
  id, name
  cpu_total, memory_mb_total
  cpu_reserved, memory_mb_reserved        -- OS + platform
  cpu_overcommit                          -- 4.0
  status                                  -- active, draining, down
```

Allocation is the sum of the sizes of all resources on a host that are not `deleted`.

### The check

The API runs this inside the same transaction that creates the resource:

```sql
SELECT h.id
FROM hosts h
LEFT JOIN resources r ON r.host_id = h.id AND r.deleted_at IS NULL
WHERE h.status = 'active'
GROUP BY h.id
HAVING  h.memory_mb_total - h.memory_mb_reserved - COALESCE(SUM(r.memory_mb), 0) >= :requested_memory
    AND (h.cpu_total - h.cpu_reserved) * h.cpu_overcommit - COALESCE(SUM(r.cpu), 0) >= :requested_cpu
ORDER BY h.memory_mb_total - h.memory_mb_reserved - COALESCE(SUM(r.memory_mb), 0) DESC
LIMIT 1
FOR UPDATE OF h;
```

- **A row comes back** → place the resource on that host (the one with the most free memory).
- **No row** → `422 insufficient_capacity`.
- `FOR UPDATE` stops two requests from taking the last free slot at the same time.

Project quotas (Phase 5) are checked first, so one user cannot fill a host.

## 6. Host configuration as code (Phase 7)

The host is never configured by hand. A script in `infra/host/` sets everything, and running it twice changes nothing the second time.

| Area | Setting |
|---|---|
| OS | Ubuntu Server LTS, automatic security updates (`unattended-upgrades`) |
| Users | One admin user with sudo; SSH keys only; `PermitRootLogin no`; `PasswordAuthentication no` |
| Firewall | `ufw`: allow 22, 80, 443; deny everything else inbound |
| Brute force | `fail2ban` on SSH |
| Docker | Installed from Docker's apt repository; version pinned |
| Docker logs | `/etc/docker/daemon.json`: `"log-driver": "json-file", "log-opts": {"max-size": "10m", "max-file": "3"}` |
| Time | NTP enabled (TLS and logs need correct time) |
| Swap | Small swap file (1–2 GB) as a safety net, `vm.swappiness=10` |
| Backups | Daily `pg_dump` of the app database, copied off the host; restore tested monthly |
| Monitoring | Disk, memory and CPU alerts at 80% |

### How to test it before renting anything

1. Run the script against a fresh Ubuntu VM or a second WSL2 distribution.
2. Run it a second time: nothing should change.
3. Try to log in with a password: it must fail.
4. Scan open ports from another machine: only 22, 80 and 443.

## 7. On your PC today

Your PC plays the role of the host. Set Docker Desktop's memory limit to 6–8 GB. The same formula then tells you how many servers you can run locally before things slow down.
