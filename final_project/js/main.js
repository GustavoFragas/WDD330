import {
  getCharacters,
  getEpisodes,
  getRandomCharacter,
  getShow,
} from "./api.js";
import {
  showCharacters,
  showDetails,
  updateFavoriteButton,
} from "./characters.js";
import { getFavorites, toggleFavorite } from "./favorites.js";
import { readFilters } from "./filters.js";
import { showEpisodes } from "./episodes.js";

const form = document.querySelector("#search-form");
const results = document.querySelector("#results");
const message = document.querySelector("#message");
const previousButton = document.querySelector("#previous-page");
const nextButton = document.querySelector("#next-page");
const pageLabel = document.querySelector("#page-label");
const episodeResults = document.querySelector("#episode-results");
const retry = document.querySelector("#retry");
const notice = document.querySelector("#notice");
const randomButton = document.querySelector("#random-character");
const filterPanel = document.querySelector("#filter-panel");
const viewTitle = document.querySelector("#view-title");

let filters = {};
let favorites = [];
let favoritesAvailable = true;
let view = "home";
const pages = { characters: 1, episodes: 1 };
let latestRequest = 0;
let randomRequest = 0;

function readSavedFavorites() {
  try {
    favorites = getFavorites();
    favoritesAvailable = true;
    notice.textContent = "";
  } catch {
    favoritesAvailable = false;
    notice.textContent =
      "Saved favorites could not be read. Check your browser storage settings.";
  }
  document.querySelector("#favorite-count").textContent = favoritesAvailable
    ? favorites.length
    : "?";
}

function openDetails(character) {
  randomRequest++;
  randomButton.disabled = false;
  randomButton.setAttribute("aria-busy", "false");
  notice.textContent = "";
  showDetails(character, favorites, changeFavorite);
}

function renderCharacters(characters) {
  showCharacters(characters, results, favorites, changeFavorite, openDetails);
}

function renderFavorites() {
  results.setAttribute("aria-busy", "false");
  renderCharacters(favoritesAvailable ? favorites : []);
  message.textContent = !favoritesAvailable
    ? "Favorites are unavailable. Your saved data has not been changed."
    : favorites.length
      ? `${favorites.length} saved ${favorites.length === 1 ? "character" : "characters"}`
      : "No favorites yet.";
  retry.hidden = favoritesAvailable;
}

function changeFavorite(character) {
  const dialog = document.querySelector("#character-dialog");
  const status = dialog.open
    ? document.querySelector("#detail-notice")
    : notice;
  try {
    const wasSaved = favorites.some((item) => item.id === character.id);
    favorites = toggleFavorite(character);
    favoritesAvailable = true;
    document.querySelector("#favorite-count").textContent = favorites.length;
    if (view === "favorites") {
      renderFavorites();
      if (!dialog.open)
        (results.querySelector(".favorite-button") || viewTitle).focus();
    }
    document.querySelectorAll(".favorite-button").forEach((button) => {
      const saved = favorites.some(
        (item) => item.id === Number(button.dataset.characterId),
      );
      updateFavoriteButton(button, button.dataset.characterName, saved);
    });
    status.textContent = `${character.name} ${wasSaved ? "removed from" : "saved to"} favorites.`;
  } catch {
    status.textContent =
      "Could not save favorites. Check your browser storage settings and try again.";
  }
}

async function loadPage(page = 1) {
  // Ignore older responses after a newer request or a view change.
  const request = ++latestRequest;
  const type = view === "episodes" ? "episodes" : "characters";
  pages[type] = page;
  results.replaceChildren();
  episodeResults.replaceChildren();
  const parent = type === "episodes" ? episodeResults : results;
  parent.setAttribute("aria-busy", "true");
  message.textContent = `Loading ${type}...`;
  pageLabel.textContent = "Loading...";
  retry.hidden = true;
  previousButton.disabled = true;
  nextButton.disabled = true;

  try {
    const data =
      type === "episodes"
        ? await getEpisodes(page)
        : await getCharacters(filters, page);
    if (request !== latestRequest) return;

    if (data.results.length === 0) {
      message.textContent = `No ${type} found.`;
      pageLabel.textContent = "No pages";
      return;
    }

    if (type === "episodes") showEpisodes(data.results, episodeResults);
    else renderCharacters(data.results);
    message.textContent = `Showing ${data.results.length} of ${data.info.count} ${type}.`;
    pageLabel.textContent = `Page ${page} of ${data.info.pages}`;
    previousButton.disabled = page === 1;
    nextButton.disabled = page === data.info.pages;
  } catch {
    if (request !== latestRequest) return;
    message.textContent = `Could not load ${type}. Please try again.`;
    pageLabel.textContent = "Unavailable";
    retry.hidden = false;
  } finally {
    if (request === latestRequest) parent.setAttribute("aria-busy", "false");
  }
}

function renderView() {
  const hash = window.location.hash.slice(1);
  view = ["home", "characters", "episodes", "favorites"].includes(hash)
    ? hash
    : "home";
  latestRequest++;
  randomRequest++;
  randomButton.disabled = false;
  randomButton.setAttribute("aria-busy", "false");
  document.querySelector("#character-dialog").close();
  notice.textContent = "";
  readSavedFavorites();
  const browsing = view === "home" || view === "characters";
  form.hidden = !browsing;
  filterPanel.hidden = !browsing;
  document
    .querySelector("#workspace")
    .classList.toggle("without-filters", !browsing);
  document.querySelector("#show-info").hidden = view !== "home";
  document.querySelector("#pagination").hidden = view === "favorites";
  results.hidden = view === "episodes";
  episodeResults.hidden = view !== "episodes";
  viewTitle.textContent = browsing
    ? "Characters"
    : view === "episodes"
      ? "Episodes"
      : "Favorites";
  document.querySelectorAll(".main-nav a").forEach((link) => {
    if (link.hash === `#${view}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (view === "favorites") renderFavorites();
  else loadPage(pages[view === "episodes" ? "episodes" : "characters"]);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  filters = readFilters(form);
  loadPage();
});

form.addEventListener("reset", () => {
  filters = {};
  loadPage();
});

previousButton.addEventListener("click", () =>
  loadPage(pages[view === "episodes" ? "episodes" : "characters"] - 1),
);
nextButton.addEventListener("click", () =>
  loadPage(pages[view === "episodes" ? "episodes" : "characters"] + 1),
);
retry.addEventListener("click", () => {
  if (view === "favorites") {
    readSavedFavorites();
    renderFavorites();
  } else loadPage(pages[view === "episodes" ? "episodes" : "characters"]);
});
window.addEventListener("hashchange", () => {
  renderView();
  viewTitle.focus({ preventScroll: true });
});

document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#main-content").focus();
});

randomButton.addEventListener("click", async () => {
  const request = ++randomRequest;
  randomButton.disabled = true;
  randomButton.setAttribute("aria-busy", "true");
  notice.textContent = "Finding a random character...";
  try {
    const character = await getRandomCharacter();
    if (request !== randomRequest) return;
    notice.textContent = "";
    openDetails(character);
  } catch {
    if (request !== randomRequest) return;
    notice.textContent = "Could not load a random character. Please try again.";
  } finally {
    if (request === randomRequest) {
      randomButton.disabled = false;
      randomButton.setAttribute("aria-busy", "false");
    }
  }
});

async function loadShow() {
  const status = document.querySelector("#show-message");
  const showRetry = document.querySelector("#show-retry");
  showRetry.hidden = true;
  status.textContent = "Loading series information...";
  try {
    const show = await getShow();
    if (show.name !== "Rick and Morty") throw new Error("Unexpected show");
    status.textContent = `${show.premiered?.slice(0, 4) || "Unknown premiere"} / ${show.status || "Status unavailable"} / ${show.language || "Language unavailable"}`;
    document.querySelector("#show-genres").textContent =
      show.genres?.join(" / ") || "Genres unavailable";
    if (show.image?.medium) {
      const image = document.createElement("img");
      image.id = "show-image";
      image.src = show.image.medium;
      image.alt = "Rick and Morty series poster";
      image.width = 84;
      image.height = 118;
      document.querySelector("#show-poster").replaceChildren(image);
    }
  } catch {
    status.textContent =
      "Series information is unavailable. Characters are still available below.";
    showRetry.hidden = false;
  }
}

document.querySelector("#show-retry").addEventListener("click", loadShow);
const mobile = window.matchMedia("(max-width: 700px)");
filterPanel.open = !mobile.matches;
mobile.addEventListener("change", () => {
  filterPanel.open = !mobile.matches;
});

renderView();
loadShow();
