/**
 * Rewrites system deep links that are not real app screens (OAuth callback, dev client launcher).
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    const lower = path.toLowerCase();

    if (
      lower.includes("oauthredirect") ||
      lower.includes("expo-development-client")
    ) {
      return initial ? "/launcher" : "/oauthredirect";
    }
  } catch {
    return "/launcher";
  }

  return path;
}
