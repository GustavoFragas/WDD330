import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("shows a message when the cart is empty", async () => {
  let renderedHtml = "";
  const productList = {
    addEventListener() {},
    get innerHTML() {
      return renderedHtml;
    },
    set innerHTML(value) {
      renderedHtml = value;
    },
  };
  const headerElement = { innerHTML: "" };
  const footerElement = { innerHTML: "" };
  const cartTotal = { textContent: "" };

  global.localStorage = {
    getItem() {
      return null;
    },
  };
  global.fetch = async (path) => ({
    text: async () =>
      path.includes("header") ? "<div>Header</div>" : "Footer",
  });
  global.document = {
    querySelector(selector) {
      if (selector === ".product-list") return productList;
      if (selector === ".cart-total") return cartTotal;
      if (selector === "#main-header") return headerElement;
      if (selector === "#main-footer") return footerElement;
      return null;
    },
  };

  const server = await createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    root: fileURLToPath(new URL("../", import.meta.url)),
    server: { middlewareMode: true },
  });

  try {
    await server.ssrLoadModule(`/js/cart.js?t=${Date.now()}`);
    await new Promise((resolve) => setImmediate(resolve));
    assert.match(renderedHtml, /cart is empty/i);
  } finally {
    await server.close();
    delete global.document;
    delete global.fetch;
    delete global.localStorage;
  }
});

test("removes the selected item and updates the cart total", async () => {
  let renderedHtml = "";
  let storedCart = [
    {
      Id: "item-1",
      Name: "First Tent",
      Image: "/first.jpg",
      Colors: [{ ColorName: "Red" }],
      FinalPrice: 100,
    },
    {
      Id: "item-2",
      Name: "Second Tent",
      Image: "/second.jpg",
      Colors: [{ ColorName: "Blue" }],
      FinalPrice: 50,
    },
  ];
  const productList = {
    addEventListener() {},
    get innerHTML() {
      return renderedHtml;
    },
    set innerHTML(value) {
      renderedHtml = value;
    },
  };
  const headerElement = { innerHTML: "" };
  const footerElement = { innerHTML: "" };
  const cartTotal = { textContent: "" };

  global.localStorage = {
    getItem() {
      return JSON.stringify(storedCart);
    },
    setItem(key, value) {
      assert.equal(key, "so-cart");
      storedCart = JSON.parse(value);
    },
  };
  global.fetch = async (path) => ({
    text: async () =>
      path.includes("header") ? "<div>Header</div>" : "Footer",
  });
  global.document = {
    querySelector(selector) {
      if (selector === ".product-list") return productList;
      if (selector === ".cart-total") return cartTotal;
      if (selector === "#main-header") return headerElement;
      if (selector === "#main-footer") return footerElement;
      return null;
    },
  };

  const server = await createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    root: fileURLToPath(new URL("../", import.meta.url)),
    server: { middlewareMode: true },
  });

  try {
    const { removeCartItem } = await server.ssrLoadModule(
      `/js/cart.js?t=${Date.now()}`,
    );
    removeCartItem("item-1");

    assert.deepEqual(
      storedCart.map((item) => item.Id),
      ["item-2"],
    );
    assert.doesNotMatch(renderedHtml, /First Tent/);
    assert.match(renderedHtml, /Second Tent/);
    assert.equal(cartTotal.textContent, "Total: $50.00");
  } finally {
    await server.close();
    delete global.document;
    delete global.fetch;
    delete global.localStorage;
  }
});
