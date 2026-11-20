import {
  Alert,
  Button,
  Card,
  Group,
  NumberInput,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  createServerInput,
  imageRef,
  PORT_MAX,
  PORT_MIN,
  SERVER_IMAGE_IDS,
  SERVER_IMAGES,
  type ServerImage,
  type ServerResource,
} from "@mini-cloud/shared";
import { Link } from "react-router";
import { ApiError } from "../../../api/errors.ts";
import { zodValidate } from "../../../lib/zod-form.ts";
import { useCreateServer } from "../api.ts";

interface FormValues {
  name: string;
  image: ServerImage;
  /** NumberInput gives "" while the field is empty. */
  port: number | string;
}

const FIELDS = ["name", "image", "port"] as const;

/** API errors that belong to a field: 409 name_taken → Name, 400 details → each field. */
export function fieldErrorsFrom(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  if (error.code === "name_taken") return { name: error.message };
  if (error.code !== "validation_failed") return {};
  const known: readonly string[] = FIELDS;
  return Object.fromEntries(
    error.details
      .filter((detail) => known.includes(detail.field))
      .map((detail) => [detail.field, detail.message]),
  );
}

function asImage(value: string): ServerImage | undefined {
  return SERVER_IMAGE_IDS.find((id) => id === value);
}

interface CreateServerFormProps {
  onCreated: (server: ServerResource) => void;
  cancelHref: string;
}

export function CreateServerForm({ onCreated, cancelHref }: Readonly<CreateServerFormProps>) {
  const create = useCreateServer();
  const form = useForm<FormValues>({
    mode: "controlled",
    initialValues: { name: "", image: "nginx", port: SERVER_IMAGES.nginx.defaultPort },
    // The same schema the API uses: invalid input never leaves the browser.
    validate: zodValidate(createServerInput),
    validateInputOnChange: true,
  });

  const submit = form.onSubmit((values) => {
    create.mutate(createServerInput.parse(values), {
      onSuccess: onCreated,
      onError: (error) => {
        form.setErrors(fieldErrorsFrom(error));
      },
    });
  });

  const pickImage = (value: string) => {
    const image = asImage(value);
    if (!image) return;
    form.setFieldValue("image", image);
    form.setFieldValue("port", SERVER_IMAGES[image].defaultPort);
  };

  const formError =
    create.error && Object.keys(fieldErrorsFrom(create.error)).length === 0 ? create.error : null;
  const { name, image, port } = form.values;

  return (
    <Group align="flex-start" gap="lg" wrap="wrap">
      <Card
        component="form"
        onSubmit={submit}
        noValidate
        withBorder
        radius="lg"
        padding="xl"
        style={{ flex: "999 1 480px", minWidth: 0 }}
      >
        <Stack gap="xl">
          {formError ? (
            <Alert color="red" title="The server was not created" role="alert">
              {formError.message}
            </Alert>
          ) : null}

          <TextInput
            label="Name"
            description="Lowercase letters, digits and hyphens. It becomes part of the server's URL."
            autoComplete="off"
            spellCheck={false}
            data-autofocus
            {...form.getInputProps("name")}
          />

          <Radio.Group
            label="Image"
            description="Approved images only for now."
            value={image}
            onChange={pickImage}
            error={form.errors.image}
          >
            <SimpleGrid cols={{ base: 1, sm: 2 }} mt="xs">
              {SERVER_IMAGE_IDS.map((id) => (
                <Radio.Card key={id} value={id} radius="md" p="md">
                  <Group wrap="nowrap" align="flex-start">
                    <Radio.Indicator />
                    <div>
                      <Text ff="monospace" fw={600}>
                        {id}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {SERVER_IMAGES[id].label}
                      </Text>
                    </div>
                  </Group>
                </Radio.Card>
              ))}
            </SimpleGrid>
          </Radio.Group>

          <NumberInput
            label="Container port"
            description="The port your app listens on inside the container."
            min={PORT_MIN}
            max={PORT_MAX}
            allowDecimal={false}
            allowNegative={false}
            maw={220}
            {...form.getInputProps("port")}
          />

          <Group gap="sm">
            <Button type="submit" loading={create.isPending}>
              Create server
            </Button>
            <Button component={Link} to={cancelHref} variant="default">
              Cancel
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="lg" style={{ flex: "1 1 280px", minWidth: 0 }}>
        <Stack gap="xs">
          <Title order={2} fz={17}>
            Summary
          </Title>
          <Text size="sm">
            <Text span c="dimmed">
              Name:{" "}
            </Text>
            <b>{name || "—"}</b>
          </Text>
          <Text size="sm">
            <Text span c="dimmed">
              Image:{" "}
            </Text>
            <Text span ff="monospace">
              {imageRef(image)}
            </Text>
          </Text>
          <Text size="sm">
            <Text span c="dimmed">
              Port:{" "}
            </Text>
            {String(port) || "—"}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            The server starts as Pending, then Provisioning while Terraform runs, then Running with
            its URL.
          </Text>
        </Stack>
      </Card>
    </Group>
  );
}
