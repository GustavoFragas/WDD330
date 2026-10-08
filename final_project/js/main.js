const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const results = document.querySelector("#results");
const message = document.querySelector("#message");

function showCharacter(character) {
  const card = document.createElement("article");
  card.className = "character-card";

  const image = document.createElement("img");
  image.src = character.image;
  image.alt = character.name;
  image.loading = "lazy";

  const name = document.createElement("h3");
  name.textContent = character.name;

  const details = document.createElement("p");
  details.textContent = `${character.species} - ${character.status}`;

  card.append(image, name, details);
  results.append(card);
}

async function loadCharacters(name = "") {
  results.replaceChildren();
  message.textContent = "Loading characters...";

  const url = new URL("https://rickandmortyapi.com/api/character");
  if (name) url.searchParams.set("name", name);

  try {
    const response = await fetch(url);
    if (response.status === 404) {
      message.textContent = "No characters found.";
      return;
    }
    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    data.results.forEach(showCharacter);
    message.textContent = `Showing ${data.results.length} of ${data.info.count} characters.`;
  } catch {
    message.textContent = "Could not load characters. Please try again.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadCharacters(searchInput.value.trim());
});

loadCharacters();
