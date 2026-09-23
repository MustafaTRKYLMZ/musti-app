
export const guessNameFromUri = (uri: string) => {
  try {
    const last = uri.split("/").pop() || uri;
    return decodeURIComponent(last);
  } catch {
    return uri;
  }
};