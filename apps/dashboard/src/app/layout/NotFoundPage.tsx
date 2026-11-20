import { Button } from "@mantine/core";
import { Link } from "react-router";
import { EmptyState } from "../../ui/organisms/EmptyState.tsx";

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      action={
        <Button component={Link} to="/servers">
          Go to servers
        </Button>
      }
    >
      There is nothing at this address.
    </EmptyState>
  );
}
