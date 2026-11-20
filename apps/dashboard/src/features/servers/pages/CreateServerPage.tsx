import { Anchor } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { ServerResource } from "@mini-cloud/shared";
import { Link, useNavigate } from "react-router";
import { PageHeader } from "../../../ui/organisms/PageHeader.tsx";
import { CreateServerForm } from "../components/CreateServerForm.tsx";

const LIST_PATH = "/servers";

export function CreateServerPage() {
  const navigate = useNavigate();

  const onCreated = (server: ServerResource) => {
    notifications.show({
      title: `${server.name} is being created`,
      message: "This usually takes a few seconds. The list updates by itself.",
    });
    void navigate(LIST_PATH);
  };

  return (
    <>
      <PageHeader
        title="Create server"
        breadcrumb={
          <>
            <Anchor component={Link} to={LIST_PATH}>
              Servers
            </Anchor>{" "}
            / Create
          </>
        }
      />
      <CreateServerForm onCreated={onCreated} cancelHref={LIST_PATH} />
    </>
  );
}
