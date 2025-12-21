export const formatBookNameFromUri = (uri: string) => {
    try {
      const file = decodeURIComponent(uri.split("/").pop() || uri);
      const noExt = file.replace(/\.[^.]+$/, "");  
      const cleaned = noExt
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
  
      // Title Case
      return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
      return uri;
    }
  };
  