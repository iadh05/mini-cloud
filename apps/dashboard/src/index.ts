import { type CreateServerInput, PLATFORM_NAME, SERVER_IMAGES } from "@mini-cloud/shared";

// Replaced by the React + Vite app in MC-208.
export const APP_TITLE = `${PLATFORM_NAME} console`;

/** Values of the create-server form, validated with the same schema as the API. */
export type ServerFormValues = CreateServerInput;

export const IMAGE_OPTIONS = Object.entries(SERVER_IMAGES).map(([value, image]) => ({
  value,
  label: image.label,
}));
