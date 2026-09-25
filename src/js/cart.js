import {
  getLocalStorage,
  loadHeaderFooter,
  setLocalStorage,
} from "./utils.mjs";

function renderCartContents() {
  const cartItems = getLocalStorage("so-cart") || [];
  const productList = document.querySelector(".product-list");
  const cartTotal = document.querySelector(".cart-total");

  if (cartItems.length === 0) {
    productList.innerHTML = "<li>Your cart is empty.</li>";
    cartTotal.textContent = "";
    return;
  }

  const htmlItems = cartItems.map((item) => cartItemTemplate(item));
  productList.innerHTML = htmlItems.join("");
  const total = cartItems.reduce((sum, item) => sum + item.FinalPrice, 0);
  cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

export function removeCartItem(productId) {
  const cartItems = getLocalStorage("so-cart") || [];
  const updatedCart = cartItems.filter((item) => item.Id !== productId);
  setLocalStorage("so-cart", updatedCart);
  renderCartContents();
}

function cartItemTemplate(item) {
  const newItem = `<li class="cart-card divider">
  <a href="#" class="cart-card__image">
    <img
      src="${item.Image}"
      alt="${item.Name}"
    />
  </a>
  <a href="#">
    <h2 class="card__name">${item.Name}</h2>
  </a>
  <p class="cart-card__color">${item.Colors[0].ColorName}</p>
  <p class="cart-card__quantity">qty: 1</p>
  <p class="cart-card__price">$${item.FinalPrice}</p>
  <button type="button" class="cart-card__remove" data-id="${item.Id}" aria-label="Remove ${item.Name} from cart">Remove</button>
</li>`;

  return newItem;
}

loadHeaderFooter();
renderCartContents();

document.querySelector(".product-list").addEventListener("click", (event) => {
  const removeButton = event.target.closest(".cart-card__remove");
  if (removeButton) {
    removeCartItem(removeButton.dataset.id);
  }
});
