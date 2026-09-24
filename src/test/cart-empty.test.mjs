import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("shows a message when the cart is empty", async () => {
  let renderedHtml = "";
  const productList = {
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
