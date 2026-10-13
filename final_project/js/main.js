import { getCharacters } from "./api.js";
import { showCharacters } from "./characters.js";

const form = document.querySelector("#search-form");
const results = document.querySelector("#results");
const message = document.querySelector("#message");
const previousButton = document.querySelector("#previous-page");
const nextButton = document.querySelector("#next-page");
const pageLabel = document.querySelector("#page-label");

let filters = {};
let currentPage = 1;
let latestRequest = 0;

async function loadCharacters(page = 1) {
  const request = ++latestRequest;
  results.replaceChildren();
  results.setAttribute("aria-busy", "true");
  message.textContent = "Loading characters...";
  pageLabel.textContent = "Loading...";
  previousButton.disabled = true;
  nextButton.disabled = true;

  try {
    const data = await getCharacters(filters, page);
    if (request !== latestRequest) return;

    currentPage = page;
    if (data.results.length === 0) {
      message.textContent = "No characters found.";
      pageLabel.textContent = "No pages";
      return;
    }

    showCharacters(data.results, results);
    message.textContent = `Showing ${data.results.length} of ${data.info.count} characters.`;
    pageLabel.textContent = `Page ${page} of ${data.info.pages}`;
    previousButton.disabled = page === 1;
    nextButton.disabled = page === data.info.pages;
  } catch {
    if (request !== latestRequest) return;
    message.textContent = "Could not load characters. Please try again.";
    pageLabel.textContent = "Unavailable";
  } finally {
    if (request === latestRequest) results.setAttribute("aria-busy", "false");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  filters = Object.fromEntries(new FormData(form));
  loadCharacters();
});

form.addEventListener("reset", () => {
  filters = {};
  loadCharacters();
});

previousButton.addEventListener("click", () => loadCharacters(currentPage - 1));
nextButton.addEventListener("click", () => loadCharacters(currentPage + 1));

loadCharacters();
