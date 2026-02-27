import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthHeaders } from "./api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: HeadersInit;
  }
): Promise<any> {
  const headers: HeadersInit = {
    ...getAuthHeaders(),
    ...options?.headers,
  };

  let bodyStr: string | undefined;
  if (options?.body !== undefined) {
    bodyStr = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method: options?.method || "GET",
    headers,
    body: bodyStr,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined;
  }
  
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
