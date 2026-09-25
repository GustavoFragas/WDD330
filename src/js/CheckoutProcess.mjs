import { getLocalStorage } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";

function formDataToJSON(formElement) {
  const formData = new FormData(formElement);
  const convertedJSON = {};

  formData.forEach((value, key) => {
    convertedJSON[key] = value;
  });

  return convertedJSON;
}

function packageItems(items) {
  return items.map((item) => ({
    id: item.Id,
    name: item.Name,
    price: item.FinalPrice,
    quantity: 1,
  }));
}

export default class CheckoutProcess {
  constructor(key, outputSelector) {
    this.key = key;
    this.outputSelector = outputSelector;
    this.list = [];
    this.itemTotal = 0;
    this.shipping = 0;
    this.tax = 0;
    this.orderTotal = 0;
    this.dataSource = new ExternalServices();
  }

  init() {
    this.list = getLocalStorage(this.key) || [];
    this.calculateItemSubTotal();
  }

  calculateItemSubTotal() {
    this.itemTotal = this.list.reduce(
      (total, item) => total + item.FinalPrice,
      0,
    );

    document.querySelector(`${this.outputSelector} #item-count`).textContent =
      this.list.length;
    document.querySelector(`${this.outputSelector} #subtotal`).textContent =
      `$${this.itemTotal.toFixed(2)}`;
  }

  calculateOrderTotal() {
    this.tax = this.itemTotal * 0.06;
    this.shipping = this.list.length > 0 ? 10 + (this.list.length - 1) * 2 : 0;
    this.orderTotal = this.itemTotal + this.tax + this.shipping;
    this.displayOrderTotals();
  }

  displayOrderTotals() {
    document.querySelector(`${this.outputSelector} #tax`).textContent =
      `$${this.tax.toFixed(2)}`;
    document.querySelector(`${this.outputSelector} #shipping`).textContent =
      `$${this.shipping.toFixed(2)}`;
    document.querySelector(`${this.outputSelector} #order-total`).textContent =
      `$${this.orderTotal.toFixed(2)}`;
  }

  async checkout(form) {
    try {
      const order = formDataToJSON(form);
      order.orderDate = new Date().toISOString();
      order.orderTotal = this.orderTotal.toFixed(2);
      order.shipping = this.shipping;
      order.tax = this.tax.toFixed(2);
      order.items = packageItems(this.list);

      const response = await this.dataSource.checkout(order);
      localStorage.removeItem(this.key);
      window.location.href = "/checkout/success.html";
      return response;
    } catch (err) {
      return err;
    }
  }
}
