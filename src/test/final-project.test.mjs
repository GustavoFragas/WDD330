import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("character API filters, pagination and errors", async (t) => {
  const originalFetch = global.fetch;
  const server = await createServer({
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    root: fileURLToPath(new URL("../../final_project/", import.meta.url)),
    server: { middlewareMode: true },
  });

  try {
    const { getCharacters } = await server.ssrLoadModule("/js/api.js");

    await t.test(
      "combines filters and keeps them on another page",
      async () => {
        const requestedURLs = [];
        const data = {
          info: { count: 25, pages: 2 },
          results: [{ id: 1, name: "Rick Sanchez" }],
        };
        global.fetch = async (url) => {
          requestedURLs.push(new URL(url));
          return { ok: true, json: async () => data };
        };
        const filters = {
          name: " Rick & Morty ",
          status: "alive",
          species: "Human",
          gender: "male",
        };

        assert.deepEqual(await getCharacters(filters), data);
        await getCharacters(filters, 2);

        for (const [index, url] of requestedURLs.entries()) {
          assert.equal(url.origin, "https://rickandmortyapi.com");
          assert.equal(url.pathname, "/api/character");
          assert.equal(url.searchParams.get("page"), String(index + 1));
          for (const [key, value] of Object.entries(filters)) {
            assert.equal(url.searchParams.get(key), value.trim());
          }
        }
      },
    );

    await t.test("omits empty filters", async () => {
      global.fetch = async (url) => {
        assert.equal(new URL(url).search, "?page=1");
        return { ok: true, json: async () => ({ results: [] }) };
      };
      await getCharacters();
      await getCharacters({ name: "  ", status: "", species: "", gender: "" });
    });

    await t.test(
      "returns empty results when there are no matches",
      async () => {
        global.fetch = async () => ({ ok: false, status: 404 });
        assert.deepEqual(await getCharacters({ name: "no-match" }), {
          info: { count: 0, pages: 0 },
          results: [],
        });
      },
    );

    await t.test("reports server and connection errors", async () => {
      global.fetch = async () => ({ ok: false, status: 500 });
      await assert.rejects(getCharacters(), /API request failed/);

      global.fetch = async () => {
        throw new Error("Network unavailable");
      };
      await assert.rejects(getCharacters(), /Network unavailable/);
    });
  } finally {
    global.fetch = originalFetch;
    await server.close();
  }
});
