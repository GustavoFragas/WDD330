import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("loads a category and a product from the API", async () => {
  const requestedURLs = [];
  const product = { Id: "20CXG" };

  global.fetch = async (url) => {
    requestedURLs.push(url);
    return {
      ok: true,
      json: async () => ({
        Result: url.includes("search") ? [product] : product,
      }),
    };
  };

  const server = await createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    root: fileURLToPath(new URL("../", import.meta.url)),
    server: { middlewareMode: true },
  });

  try {
    const { default: ExternalServices } = await server.ssrLoadModule(
      `/js/ExternalServices.mjs?t=${Date.now()}`,
    );
    const dataSource = new ExternalServices();

    assert.deepEqual(await dataSource.getData("backpacks"), [product]);
    assert.equal(await dataSource.findProductById("20CXG"), product);
    assert.match(requestedURLs[0], /products\/search\/backpacks$/);
    assert.match(requestedURLs[1], /product\/20CXG$/);
  } finally {
    await server.close();
    delete global.fetch;
  }
});

test("renders product cards and the selected category title", async () => {
  const listElement = { innerHTML: "" };
  const titleElement = { textContent: "" };
  const product = {
    Id: "14GVF",
    Name: "Marmot Rampart Sleeping Bag",
    NameWithoutBrand: "Rampart Sleeping Bag",
    Brand: { Name: "Marmot" },
    Images: { PrimaryMedium: "sleeping-bag.jpg" },
    FinalPrice: 99.99,
  };

  global.document = {
    querySelector(selector) {
      return selector === ".title" ? titleElement : null;
    },
  };

  try {
    const { default: ProductList } = await import(
      `../js/ProductList.mjs?t=${Date.now()}`
    );
    const dataSource = {
      async getData(category) {
        assert.equal(category, "sleeping-bags");
        return [product];
      },
    };
    const productList = new ProductList(
      "sleeping-bags",
      dataSource,
      listElement,
    );

    await productList.init();

    assert.match(listElement.innerHTML, /product=14GVF/);
    assert.match(listElement.innerHTML, /sleeping-bag\.jpg/);
    assert.equal(titleElement.textContent, "Sleeping Bags");
  } finally {
    delete global.document;
  }
});
