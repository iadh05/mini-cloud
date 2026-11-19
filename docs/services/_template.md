# <Service>

| | |
|---|---|
| Resource type | `<type>` |
| API | `/v1/<type>` |
| Terraform module | `infra/modules/<type>/` (or direct driver) |
| Phase | <n> |
| Feature folders | `apps/api/src/features/<type>/` · `apps/worker/src/features/<type>/` · `apps/dashboard/src/features/<type>/` |

## What it does

Two sentences: the problem it solves for the user.

## Spec (desired state)

| Field | Type | Rules | Default |
|---|---|---|---|

## Outputs

| Field | Meaning |
|---|---|

## Status machine

```
pending → provisioning → running
                      ↘ failed
```

## API

| Method | Path | Result |
|---|---|---|

## How it is provisioned

What the worker does, step by step.

## Console

| Screen | Shows | Actions |
|---|---|---|

## Limits and security

## Tickets
