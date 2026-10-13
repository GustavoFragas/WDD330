export function showEpisodes(episodes, parent) {
  parent.replaceChildren();
  for (const episode of episodes) {
    const row = document.createElement("li");
    row.className = "episode-row";
    const code = document.createElement("span");
    code.className = "episode-code";
    code.textContent = episode.episode || "Unknown";
    const name = document.createElement("h3");
    name.textContent = episode.name || "Untitled episode";
    const date = document.createElement("p");
    date.textContent = episode.air_date || "Air date unavailable";
    const text = document.createElement("div");
    text.append(name, date);
    row.append(code, text);
    parent.append(row);
  }
}
