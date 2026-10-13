export async function getCharacters(filters = {}, page = 1) {
  const url = new URL("https://rickandmortyapi.com/api/character");
  url.searchParams.set("page", page);

  for (const key of ["name", "status", "species", "gender"]) {
    const value = filters[key]?.trim();
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (response.status === 404) {
    return { info: { count: 0, pages: 0 }, results: [] };
  }
  if (!response.ok) throw new Error("API request failed");
  return response.json();
}
