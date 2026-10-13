function showDetails(character) {
  const dialog = document.querySelector("#character-dialog");
  const image = dialog.querySelector("#detail-image");
  image.src = character.image;
  image.alt = character.name;

  const details = {
    name: character.name,
    status: character.status,
    species: character.species,
    gender: character.gender,
    origin: character.origin.name,
    location: character.location.name,
  };

  for (const [key, value] of Object.entries(details)) {
    dialog.querySelector(`#detail-${key}`).textContent = value;
  }
  dialog.showModal();
}

export function showCharacters(characters, parent) {
  parent.replaceChildren();

  for (const character of characters) {
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

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "View details";
    button.setAttribute("aria-label", `View details for ${character.name}`);
    button.addEventListener("click", () => showDetails(character));

    card.append(image, name, details, button);
    parent.append(card);
  }
}
