import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("local assets resolve under final_project with or without a trailing slash", async () => {
  const root = new URL("../../", import.meta.url);
  const sources = [
    "final_project/index.html",
    "final_project/js/characters.js",
  ];
  const entries = [
    "/final_project",
    "/final_project/",
    "/final_project/index.html",
  ];

  for (const source of sources) {
    const content = await readFile(new URL(source, root), "utf8");
    const assets = [
      ...content.matchAll(
        /["']((?:\/final_project\/)?(?:images|css|js)\/[^"']+)["']/g,
      ),
    ];
    assert(assets.length > 0, `No local assets checked in ${source}`);
    for (const [, asset] of assets) {
      for (const entry of entries) {
        for (const suffix of ["", "?check=1#characters"]) {
          const url = new URL(asset, `https://example.com${entry}${suffix}`);
          assert(
            url.pathname.startsWith("/final_project/"),
            `${asset} from ${entry}${suffix}`,
          );
          await access(new URL(`.${url.pathname}`, root));
        }
      }
    }
  }
});

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
    const api = await server.ssrLoadModule("/js/api.js");
    const { getCharacters } = api;

    await t.test(
      "combines filters and keeps them on another page",
      async () => {
        const requestedURLs = [];
        const data = {
          info: { count: 25, pages: 2 },
          results: Array.from({ length: 20 }, (_, index) => ({
            id: index + 1,
          })),
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

        assert.deepEqual(
          (await getCharacters(filters)).results,
          data.results.slice(0, 10),
        );
        await getCharacters(filters, 2);
        await getCharacters(filters, 3);

        for (const [index, url] of requestedURLs.entries()) {
          assert.equal(url.origin, "https://rickandmortyapi.com");
          assert.equal(url.pathname, "/api/character");
          assert.equal(
            url.searchParams.get("page"),
            String(Math.floor(index / 2) + 1),
          );
          for (const [key, value] of Object.entries(filters)) {
            assert.equal(url.searchParams.get(key), value.trim());
          }
        }
      },
    );

    await t.test(
      "splits API pages without gaps and keeps a partial last page",
      async () => {
        const characters = Array.from({ length: 26 }, (_, index) => ({
          id: index + 1,
        }));
        global.fetch = async (url) => {
          const start =
            (Number(new URL(url).searchParams.get("page")) - 1) * 20;
          return {
            ok: true,
            json: async () => ({
              info: { count: characters.length, pages: 2 },
              results: characters.slice(start, start + 20),
            }),
          };
        };
        const collected = [];
        for (let page = 1; page <= 3; page++) {
          const data = await getCharacters({}, page);
          assert.equal(data.info.pages, 3);
          assert.equal(data.results.length, page === 3 ? 6 : 10);
          collected.push(...data.results);
        }
        assert.deepEqual(collected, characters);
      },
    );

    await t.test("omits empty filters", async () => {
      global.fetch = async (url) => {
        assert.equal(new URL(url).search, "?page=1");
        return {
          ok: true,
          json: async () => ({ info: { count: 0, pages: 0 }, results: [] }),
        };
      };
      await getCharacters();
      await getCharacters({ name: "  ", status: "", species: "", gender: "" });
    });

    await t.test(
      "keeps a filtered catalog smaller than ten on one page",
      async () => {
        const data = { info: { count: 1, pages: 1 }, results: [{ id: 99 }] };
        global.fetch = async () => ({ ok: true, json: async () => data });
        assert.deepEqual(await getCharacters({ name: "unique" }), data);
      },
    );

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

    await t.test("loads a later episode page", async () => {
      assert.equal(typeof api.getEpisodes, "function");
      global.fetch = async (url) => {
        assert.equal(
          String(url),
          "https://rickandmortyapi.com/api/episode?page=2",
        );
        return { ok: true, json: async () => ({ results: [{ id: 21 }] }) };
      };
      assert.equal((await api.getEpisodes(2)).results[0].id, 21);
    });

    await t.test(
      "normalizes zero, one and several character episodes",
      async () => {
        assert.equal(typeof api.getCharacterEpisodes, "function");
        global.fetch = async () => {
          throw new Error("Must not fetch an empty list");
        };
        assert.deepEqual(await api.getCharacterEpisodes([]), []);
        const episode = { id: 1, name: "Pilot", episode: "S01E01" };
        global.fetch = async (url) => {
          assert.equal(
            String(url),
            "https://rickandmortyapi.com/api/episode/1",
          );
          return { ok: true, json: async () => episode };
        };
        assert.deepEqual(
          await api.getCharacterEpisodes([
            "https://rickandmortyapi.com/api/episode/1",
          ]),
          [episode],
        );
        global.fetch = async (url) => {
          assert.equal(
            String(url),
            "https://rickandmortyapi.com/api/episode/1,2",
          );
          return { ok: true, json: async () => [episode, { id: 2 }] };
        };
        assert.equal(
          (
            await api.getCharacterEpisodes([
              "https://rickandmortyapi.com/api/episode/1",
              "https://rickandmortyapi.com/api/episode/2",
            ])
          ).length,
          2,
        );
        await assert.rejects(
          api.getCharacterEpisodes(["https://example.com/episode/1"]),
          /Invalid episode/,
        );
      },
    );

    await t.test(
      "random selection reaches the last character without assuming IDs",
      async () => {
        assert.equal(typeof api.getRandomCharacter, "function");
        const originalRandom = Math.random;
        const first = { id: 8 },
          last = { id: 99 };
        const characters = [
          first,
          ...Array.from({ length: 24 }, (_, index) => ({ id: index + 20 })),
          last,
        ];
        const requested = [];
        global.fetch = async (url) => {
          const page = new URL(url).searchParams.get("page");
          requested.push(page);
          return {
            ok: true,
            json: async () =>
              page === "1"
                ? {
                    info: { count: 26, pages: 2 },
                    results: characters.slice(0, 20),
                  }
                : {
                    info: { count: 26, pages: 2 },
                    results: characters.slice(20),
                  },
          };
        };
        try {
          Math.random = () => 0;
          assert.deepEqual(await api.getRandomCharacter(), first);
          Math.random = () => 0.9999;
          assert.deepEqual(await api.getRandomCharacter(), last);
          assert.deepEqual(requested, ["1", "1", "2"]);
        } finally {
          Math.random = originalRandom;
        }
      },
    );

    await t.test(
      "requests Rick and Morty from TVmaze and propagates failures",
      async () => {
        assert.equal(typeof api.getShow, "function");
        global.fetch = async (url) => {
          assert.equal(new URL(url).hostname, "api.tvmaze.com");
          assert.equal(new URL(url).searchParams.get("q"), "Rick and Morty");
          return { ok: true, json: async () => ({ name: "Rick and Morty" }) };
        };
        assert.equal((await api.getShow()).name, "Rick and Morty");
        global.fetch = async () => ({ ok: false, status: 503 });
        for (const request of [
          () => api.getShow(),
          () => api.getEpisodes(),
          () => api.getRandomCharacter(),
          () =>
            api.getCharacterEpisodes([
              "https://rickandmortyapi.com/api/episode/1",
            ]),
        ]) {
          await assert.rejects(request(), /API request failed/);
        }
      },
    );

    await t.test(
      "favorites persist by ID and removal survives reload",
      async () => {
        const originalStorage = global.localStorage;
        const values = new Map();
        global.localStorage = {
          getItem: (key) => values.get(key) ?? null,
          setItem: (key, value) => values.set(key, value),
        };
        try {
          const { getFavorites, toggleFavorite } =
            await server.ssrLoadModule("/js/favorites.js");
          const rick = {
            id: 1,
            name: "Rick",
            image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg",
            episode: [],
          };
          assert.deepEqual(getFavorites(), []);
          assert.equal(toggleFavorite(rick).length, 1);
          assert.equal(getFavorites()[0].id, 1);
          assert.deepEqual(
            toggleFavorite({ ...rick, name: "Updated Rick" }),
            [],
          );
          assert.deepEqual(getFavorites(), []);
          toggleFavorite(rick);
          const saved = values.get("rickMortyFavorites");
          global.localStorage.setItem = () => {
            throw new Error("Storage full");
          };
          assert.throws(() => toggleFavorite(rick), /Storage full/);
          assert.equal(values.get("rickMortyFavorites"), saved);
          for (const value of [
            "",
            "broken JSON",
            "{}",
            "null",
            "[null]",
            '[{"id":"1","name":"Rick"}]',
            '[{"id":1,"name":"Rick","episode":"bad"}]',
            '[{"id":1,"name":"Rick","episode":[null]}]',
          ]) {
            values.set("rickMortyFavorites", value);
            assert.throws(() => getFavorites());
            assert.throws(() => toggleFavorite(rick));
            assert.equal(values.get("rickMortyFavorites"), value);
          }
          values.delete("rickMortyFavorites");
          global.localStorage.setItem = (key, value) => values.set(key, value);
          assert.throws(
            () => toggleFavorite({ id: "bad", name: "invalid" }),
            /Invalid character/,
          );
          assert.equal(values.size, 0);
          global.localStorage.getItem = () => {
            throw new Error("Storage denied");
          };
          assert.throws(() => getFavorites(), /Storage denied/);
        } finally {
          if (originalStorage === undefined) delete global.localStorage;
          else global.localStorage = originalStorage;
        }
      },
    );
  } finally {
    global.fetch = originalFetch;
    await server.close();
  }
});
