import { createServerInput, PLATFORM_NAME } from "@mini-cloud/shared";

const fields = Object.keys(createServerInput.shape).join(", ");
process.stdout.write(`${PLATFORM_NAME} api: not implemented yet (server fields: ${fields})\n`);
