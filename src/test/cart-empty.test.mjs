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

  globalThis.localStorage = {
    getItem() {
      return null;
    },
  };
  globalThis.document = {
    querySelector(selector) {
      assert.equal(selector, ".product-list");
      return productList;
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
    assert.match(renderedHtml, /cart is empty/i);
  } finally {
    await server.close();
    delete globalThis.document;
    delete globalThis.localStorage;
  }
});
