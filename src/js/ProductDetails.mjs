import { setLocalStorage, getLocalStorage } from "./utils.mjs";

export default class ProductDetails {
  constructor(productId, dataSource) {
    this.productId = productId;
    this.dataSource = dataSource;
    this.product = {};
  }

  async init() {
    this.product = await this.dataSource.findProductById(this.productId);

    this.renderProductDetails();

    document
      .getElementById("addToCart")
      .addEventListener("click", this.addProductToCart.bind(this));
  }

  renderProductDetails() {
    const card = document.querySelector(".product-detail");
    card.innerHTML = `
        <h3>${this.product.Brand.Name}</h3>

        <h2 class="divider">${this.product.NameWithoutBrand}</h2>

        <img
            class="divider"
            src="${this.product.Images.PrimaryLarge}"
            alt="${this.product.NameWithoutBrand}"
        />

        <p class="product-card__price">$${this.product.FinalPrice}</p>

        <p class="product__color">${this.product.Colors[0].ColorName}</p>

        <p class="product__description">${this.product.DescriptionHtmlSimple}</p>

        <div class="product-detail__add"><button id="addToCart" data-id="${this.product.Id}">Add to Cart</button></div>

        `;
  }

  addProductToCart() {
    const cart = getLocalStorage("so-cart") || [];
    cart.push(this.product);
    setLocalStorage("so-cart", cart);
  }
}
