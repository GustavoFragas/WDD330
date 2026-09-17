import assert from "node:assert/strict";
import test from "node:test";

import {
  loadHeaderFooter,
  loadTemplate,
  renderWithTemplate,
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
      return selector === "#main-header" ? headerElement : footerElement;
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
