export function buildTrackedUrl(
  baseUrl: string,
  params: Record<string, string>,
): string {
  try {
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}
