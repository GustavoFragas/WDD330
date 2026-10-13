const baseURL = "https://rickandmortyapi.com/api";

async function requestJSON(url, allowEmpty = false) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (allowEmpty && response.status === 404) {
    return { info: { count: 0, pages: 0 }, results: [] };
  }
  if (!response.ok) throw new Error("API request failed");
  return response.json();
}

export async function getCharacters(filters = {}, page = 1) {
  const url = new URL(`${baseURL}/character`);
  // Split the API's 20 results into two pages to limit image downloads.
  url.searchParams.set("page", Math.ceil(page / 2));

  for (const key of ["name", "status", "species", "gender"]) {
    const value = filters[key]?.trim();
    if (value) url.searchParams.set(key, value);
  }

  const data = await requestJSON(url, true);
  const start = ((page - 1) % 2) * 10;
  return {
    info: { count: data.info.count, pages: Math.ceil(data.info.count / 10) },
    results: data.results.slice(start, start + 10),
  };
}

export function getEpisodes(page = 1) {
  return requestJSON(`${baseURL}/episode?page=${page}`, true);
}

export async function getCharacterEpisodes(urls = []) {
  if (!urls.length) return [];
  const ids = urls.map((url) => {
    const match =
      /^https:\/\/rickandmortyapi\.com\/api\/episode\/([1-9]\d*)$/.exec(url);
    if (!match) throw new Error("Invalid episode URL");
    return match[1];
  });
  const data = await requestJSON(`${baseURL}/episode/${ids.join(",")}`);
  // The API returns an object for one episode and an array for several.
  return Array.isArray(data) ? data : [data];
}

export async function getRandomCharacter() {
  const firstPage = await getCharacters();
  if (!firstPage.results.length) throw new Error("No characters available");
  // Pick a catalog position rather than assuming character IDs have no gaps.
  const index = Math.floor(Math.random() * firstPage.info.count);
  const pageSize = firstPage.results.length;
  const page = Math.floor(index / pageSize) + 1;
  const data = page === 1 ? firstPage : await getCharacters({}, page);
  const character = data.results[index % pageSize];
  if (!character) throw new Error("Character unavailable");
  return character;
}

export function getShow() {
  return requestJSON(
    "https://api.tvmaze.com/singlesearch/shows?q=Rick%20and%20Morty",
  );
}
