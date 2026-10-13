const storageKey = "rickMortyFavorites";

export function getFavorites() {
  const favorites = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (
    !Array.isArray(favorites) ||
    favorites.some(
      (item) =>
        !item ||
        !Number.isInteger(item.id) ||
        item.id < 1 ||
        typeof item.name !== "string" ||
        (item.episode !== undefined &&
          (!Array.isArray(item.episode) ||
            item.episode.some(
              (url) =>
                typeof url !== "string" ||
                !/^https:\/\/rickandmortyapi\.com\/api\/episode\/[1-9]\d*$/.test(
                  url,
                ),
            ))),
    )
  ) {
    throw new Error("Saved favorites are invalid");
  }
  return favorites;
}

export function toggleFavorite(character) {
  if (
    !character ||
    !Number.isInteger(character.id) ||
    character.id < 1 ||
    typeof character.name !== "string"
  ) {
    throw new Error("Invalid character");
  }
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.id === character.id);
  const saved = Object.fromEntries(
    [
      "id",
      "name",
      "image",
      "status",
      "species",
      "gender",
      "origin",
      "location",
      "episode",
    ].map((key) => [key, character[key]]),
  );
  const updated = exists
    ? favorites.filter((item) => item.id !== character.id)
    : [...favorites, saved];
  // Report success only after storage accepts the change.
  localStorage.setItem(storageKey, JSON.stringify(updated));
  return updated;
}
