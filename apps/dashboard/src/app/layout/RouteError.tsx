import { useRouteError } from "react-router";
import { ErrorAlert } from "../../ui/molecules/ErrorAlert.tsx";

/** Shown inside the layout when a page throws while rendering. */
export function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <ErrorAlert
      title="This page crashed"
      onRetry={() => {
        window.location.reload();
      }}
    >
      {message}
    </ErrorAlert>
  );
}
