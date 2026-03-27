const base = (): string => {
  const u = import.meta.env.VITE_API_BASE_URL;
  return (typeof u === "string" && u ? u : "http://127.0.0.1:8000").replace(/\/$/, "");
};

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${base()}${path}`;
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: "POST",
      data: body,
      header: { "Content-Type": "application/json" },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (e) => reject(e),
    });
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${base()}${path}`;
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: "GET",
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (e) => reject(e),
    });
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const url = `${base()}${path}`;
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: "PATCH",
      data: body,
      header: { "Content-Type": "application/json" },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (e) => reject(e),
    });
  });
}
