import { Badge, Loader } from "@mantine/core";
import { type ResourceStatus } from "@mini-cloud/shared";
import { IconAlertTriangle, IconCheck, IconClock, IconPlayerStop } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { type StatusTone, statusTone } from "../tokens/index.ts";

const ICON_SIZE = 12;

const TONES: Record<ResourceStatus, StatusTone> = {
  pending: "neutral",
  provisioning: "progress",
  updating: "progress",
  starting: "progress",
  stopping: "progress",
  deleting: "progress",
  running: "success",
  stopped: "stopped",
  deleted: "stopped",
  failed: "danger",
};

function iconFor(status: ResourceStatus, fg: string): ReactNode {
  switch (TONES[status]) {
    case "neutral":
      return <IconClock size={ICON_SIZE} aria-hidden />;
    case "progress":
      return <Loader size={ICON_SIZE} color={fg} aria-hidden />;
    case "success":
      return <IconCheck size={ICON_SIZE} aria-hidden />;
    case "stopped":
      return <IconPlayerStop size={ICON_SIZE} aria-hidden />;
    case "danger":
      return <IconAlertTriangle size={ICON_SIZE} aria-hidden />;
  }
}

/** Status with text and icon, never color alone. */
export function StatusBadge({ status }: Readonly<{ status: ResourceStatus }>) {
  const tone = statusTone[TONES[status]];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge
      bg={tone.bg}
      c={tone.fg}
      radius="xl"
      tt="none"
      fw={600}
      leftSection={iconFor(status, tone.fg)}
    >
      {label}
    </Badge>
  );
}
