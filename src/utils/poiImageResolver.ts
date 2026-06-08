const imageCache = new Map<string, string>();

const wikiSummaryUrl = (title: string) =>
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

const wikiSearchUrl = (query: string) =>
  `https://en.wikipedia.org/w/api.php?action=query&list=search&srnamespace=0&srlimit=6&srsearch=${encodeURIComponent(
    query,
  )}&format=json&origin=*`;

const wikiPageImagesUrl = (title: string) =>
  `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
    title,
  )}&prop=pageimages&pithumbsize=1200&format=json&origin=*`;

const commonsSearchUrl = (query: string) =>
  `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
    query,
  )}&gsrlimit=8&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;

const searchThumbnailUrl = (title: string, city: string) =>
  `https://tse1.mm.bing.net/th?q=${encodeURIComponent(`${title} ${city} attraction photo`)}&w=1200&h=800&c=7&rs=1&p=0&o=5&pid=1.7`;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const usefulTokens = (value: string) =>
  normalize(value)
    .split(" ")
    .filter((token) => token.length > 1 && !["the", "of", "and", "de", "la", "le", "st", "saint"].includes(token));

const scoreArticleTitle = (pageTitle: string, title: string, city: string) => {
  const page = normalize(pageTitle);
  const target = normalize(title);
  const titleTokens = usefulTokens(title);
  const cityTokens = usefulTokens(city);
  const tokenScore = titleTokens.reduce((score, token) => score + (page.includes(token) ? 4 : -3), 0);
  const cityScore = cityTokens.reduce((score, token) => score + (page.includes(token) ? 2 : 0), 0);
  const exactScore = page === target || page.includes(target) || target.includes(page) ? 12 : 0;
  const weakPenalty = /(disambiguation|list of|station|district|album|song|film|company|school|university)/i.test(pageTitle)
    ? -12
    : 0;
  return exactScore + tokenScore + cityScore + weakPenalty;
};

const scoreFileTitle = (fileTitle: string, title: string, city: string) => {
  const file = normalize(fileTitle.replace(/^file:/i, ""));
  const titleTokens = usefulTokens(title);
  const cityTokens = usefulTokens(city);
  const titleScore = titleTokens.reduce((score, token) => score + (file.includes(token) ? 3 : 0), 0);
  const cityScore = cityTokens.reduce((score, token) => score + (file.includes(token) ? 1 : 0), 0);
  const weakPenalty = /(map|logo|diagram|icon|svg|plan|sign|ticket|poster|flag|seal)/i.test(fileTitle) ? -8 : 0;
  return titleScore + cityScore + weakPenalty;
};

const extractWikiThumbnail = async (title: string) => {
  const response = await fetch(wikiSummaryUrl(title));
  if (!response.ok) {
    const pageImageResponse = await fetch(wikiPageImagesUrl(title));
    if (!pageImageResponse.ok) {
      return null;
    }
    const pageImageData = (await pageImageResponse.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
    };
    return Object.values(pageImageData.query?.pages ?? {})[0]?.thumbnail?.source ?? null;
  }
  const data = (await response.json()) as { thumbnail?: { source?: string }; originalimage?: { source?: string } };
  return data.thumbnail?.source ?? data.originalimage?.source ?? null;
};

const extractWikiSearchThumbnail = async (query: string, title: string, city: string) => {
  const response = await fetch(wikiSearchUrl(query));
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as {
    query?: {
      search?: Array<{ title: string }>;
    };
  };
  const candidates = (data.query?.search ?? [])
    .map((page) => ({
      title: page.title,
      score: scoreArticleTitle(page.title, title, city),
    }))
    .filter((page) => page.score >= Math.max(8, usefulTokens(title).length * 2));

  candidates.sort((a, b) => b.score - a.score);

  for (const candidate of candidates.slice(0, 3)) {
    const image = await extractWikiThumbnail(candidate.title);
    if (image) {
      return image;
    }
  }

  return null;
};

const extractCommonsThumbnail = async (query: string, title: string, city: string, minScore?: number) => {
  const response = await fetch(commonsSearchUrl(query));
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{ thumburl?: string; url?: string; mime?: string }>;
        }
      >;
    };
  };
  const pages = Object.values(data.query?.pages ?? {})
    .filter((page) => page.imageinfo?.[0]?.mime?.startsWith("image/"))
    .map((page) => ({
      score: scoreFileTitle(page.title ?? "", title, city),
      url: page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url ?? "",
    }))
    .filter((page) => page.url);

  pages.sort((a, b) => b.score - a.score);
  const requiredScore = minScore ?? Math.max(8, usefulTokens(title).length * 2);
  return pages[0] && pages[0].score >= requiredScore ? pages[0].url : null;
};

export const resolvePoiImage = async (title: string, city: string, fallbackImage: string) => {
  const cacheKey = `${city}::${title}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey) ?? fallbackImage;
  }

  const searches = [
    () => extractWikiSearchThumbnail(`${title} ${city}`, title, city),
    () => extractWikiSearchThumbnail(`${title} ${city} tourist attraction`, title, city),
    () => extractWikiSearchThumbnail(`${title} landmark`, title, city),
    () => extractCommonsThumbnail(`${title} ${city}`, title, city),
    () => extractCommonsThumbnail(`${title} ${city} tourist attraction`, title, city),
    () => extractCommonsThumbnail(title, title, city),
    () => extractCommonsThumbnail(`${title} ${city} photo`, title, city, -999),
    () => extractCommonsThumbnail(`${title} ${city}`, title, city, -999),
    () => extractCommonsThumbnail(title, title, city, -999),
  ];

  for (const search of searches) {
    try {
      const image = await search();
      if (image) {
        imageCache.set(cacheKey, image);
        return image;
      }
    } catch {
      // Keep trying the next source; the UI still has a local fallback image.
    }
  }

  return searchThumbnailUrl(title, city);
};
