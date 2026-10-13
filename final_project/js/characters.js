import { getCharacterEpisodes } from "./api.js";
import { showEpisodes } from "./episodes.js";

let detailRequest = 0;

export function favoriteButton(character, favorites, onToggle) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite-button icon-button";
  button.dataset.characterId = character.id;
  const icon = document.createElement("img");
  icon.src = "images/icons/heart.svg";
  icon.alt = "";
  icon.width = 20;
  icon.height = 20;
  button.append(icon);
  updateFavoriteButton(
    button,
    character.name,
    favorites.some((item) => item.id === character.id),
  );
  button.addEventListener("click", () => onToggle(character));
  return button;
}

export function updateFavoriteButton(button, name, saved) {
  button.setAttribute("aria-pressed", String(saved));
  button.setAttribute(
    "aria-label",
    `${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} favorites`,
  );
  button.title = button.getAttribute("aria-label");
  button.dataset.characterName = name;
}

export function showDetails(character, favorites, onToggle) {
  const dialog = document.querySelector("#character-dialog");
  const image = document.createElement("img");
  image.id = "detail-image";
  image.src = character.image;
  image.alt = character.name;
  image.width = 300;
  image.height = 300;
  dialog.querySelector("#detail-portrait").replaceChildren(image);

  const details = {
    name: character.name,
    status: character.status,
    species: character.species,
    gender: character.gender,
    origin: character.origin?.name,
    location: character.location?.name,
  };

  for (const [key, value] of Object.entries(details)) {
    dialog.querySelector(`#detail-${key}`).textContent = value || "Unknown";
  }
  dialog
    .querySelector("#detail-favorite")
    .replaceChildren(favoriteButton(character, favorites, onToggle));
  dialog.querySelector("#detail-notice").textContent = "";
  dialog.onclose = () => {
    detailRequest++;
  };
  dialog.showModal();
  const retry = dialog.querySelector("#detail-retry");
  retry.onclick = () => loadDetailEpisodes(character);
  loadDetailEpisodes(character);
}

async function loadDetailEpisodes(character) {
  const request = ++detailRequest;
  const parent = document.querySelector("#detail-episodes");
  const message = document.querySelector("#detail-message");
  const retry = document.querySelector("#detail-retry");
  parent.replaceChildren();
  parent.setAttribute("aria-busy", "true");
  message.textContent = "Loading episodes...";
  retry.hidden = true;
  try {
    const episodes = await getCharacterEpisodes(character.episode);
    if (request !== detailRequest) return;
    showEpisodes(episodes, parent);
    message.textContent = episodes.length
      ? `${episodes.length} ${episodes.length === 1 ? "episode" : "episodes"}`
      : "No episodes available.";
  } catch {
    if (request !== detailRequest) return;
    message.textContent = "Could not load episodes. Please try again.";
    retry.hidden = false;
  } finally {
    if (request === detailRequest) parent.setAttribute("aria-busy", "false");
  }
}

export function showCharacters(
  characters,
  parent,
  favorites,
  onToggle,
  onDetails,
) {
  parent.replaceChildren();

  for (const character of characters) {
    const card = document.createElement("article");
    card.className = "character-card";

    const image = document.createElement("img");
    image.src = character.image;
    image.alt = character.name;
    image.loading = "lazy";

    image.width = 300;
    image.height = 300;
    const content = document.createElement("div");
    content.className = "character-content";
    const name = document.createElement("h3");
    name.textContent = character.name;

    const details = document.createElement("p");
    details.textContent = `${character.species} - ${character.status}`;
    details.className = "character-status";
    details.dataset.status = String(character.status).toLowerCase();

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "View details";
    button.setAttribute("aria-label", `View details for ${character.name}`);
    button.className = "details-button";
    button.addEventListener("click", () => onDetails(character));

    content.append(name, details, button);
    card.append(image, content, favoriteButton(character, favorites, onToggle));
    parent.append(card);
  }
}
