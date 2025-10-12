export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    return {};
  }
  return {
    "Authorization": `Bearer ${token}`,
  };
}

export async function apiRequest(method: string, url: string, data?: any) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "Error en la solicitud");
  }

  return response.json();
}
