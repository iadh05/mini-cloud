import {
  type CreateServerInput,
  isTransitional,
  page,
  PAGE_LIMIT_MAX,
  serverResource,
} from "@mini-cloud/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client.ts";
import { qk } from "../../api/query-keys.ts";

/** How often the list refreshes while a server is changing (FR-21; SSE replaces it in Phase 3). */
export const POLL_MS = 2_000;

const serverPage = page(serverResource);
const listParams = { limit: PAGE_LIMIT_MAX };

export function useServers() {
  return useQuery({
    queryKey: qk.list("server", listParams),
    queryFn: () => apiFetch(`/v1/servers?limit=${String(PAGE_LIMIT_MAX)}`, serverPage),
    // Poll only while something is changing; stops by itself once every server settles.
    refetchInterval: (query) =>
      query.state.data?.items.some((server) => isTransitional(server.status)) ? POLL_MS : false,
  });
}

export function useCreateServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateServerInput) =>
      apiFetch("/v1/servers", serverResource, { method: "POST", body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.resources("server") }),
  });
}
