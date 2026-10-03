import assert from "node:assert/strict";
import test from "node:test";

import {
  loadHeaderFooter,
  loadTemplate,
  renderWithTemplate,
  updateCartCount,
} from "../js/utils.mjs";

test("renderWithTemplate inserts the template and calls the callback", () => {
  const parentElement = { innerHTML: "" };
  const data = { count: 2 };
  let callbackData;

  renderWithTemplate("<p>Template</p>", parentElement, data, (value) => {
    callbackData = value;
  });

  assert.equal(parentElement.innerHTML, "<p>Template</p>");
  assert.equal(callbackData, data);
});

test("loadTemplate returns the fetched HTML", async () => {
  global.fetch = async (path) => {
    assert.equal(path, "/partials/header.html");
    return { text: async () => "<div>Header</div>" };
  };

  try {
    const template = await loadTemplate("/partials/header.html");
    assert.equal(template, "<div>Header</div>");
  } finally {
    delete global.fetch;
  }
});

test("loadHeaderFooter renders both partials", async () => {
  const headerElement = { innerHTML: "" };
  const footerElement = { innerHTML: "" };
  const templates = {
    "/partials/header.html": "<div>Header</div>",
    "/partials/footer.html": "<p>Footer</p>",
  };

  global.fetch = async (path) => ({ text: async () => templates[path] });
  global.document = {
    querySelector(selector) {
      if (selector === "#main-header") return headerElement;
      if (selector === "#main-footer") return footerElement;
      return null;
    },
  };

  try {
    await loadHeaderFooter();
    assert.equal(headerElement.innerHTML, templates["/partials/header.html"]);
    assert.equal(footerElement.innerHTML, templates["/partials/footer.html"]);
  } finally {
    delete global.fetch;
    delete global.document;
  }
});

test("cart count follows the items in localStorage", () => {
  const countElement = { textContent: "" };
  const cartLink = {
    label: "",
    setAttribute(name, value) {
      assert.equal(name, "aria-label");
      this.label = value;
    },
  };
  let cart = [{ Id: "first" }, { Id: "second" }];

  global.localStorage = {
    getItem(key) {
      assert.equal(key, "so-cart");
      return JSON.stringify(cart);
    },
  };
  global.document = {
    querySelector(selector) {
      if (selector === ".cart-count") return countElement;
      if (selector === ".cart a") return cartLink;
      return null;
    },
  };

  try {
    updateCartCount();
    assert.equal(countElement.textContent, "2");
    assert.equal(cartLink.label, "Cart, 2 items");

    cart = [];
    updateCartCount();
    assert.equal(countElement.textContent, "");
    assert.equal(cartLink.label, "Cart, 0 items");
  } finally {
    delete global.localStorage;
    delete global.document;
  }
});
