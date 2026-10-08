import { cpSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/",

  plugins: [
    {
      name: "copy-static-files",
      closeBundle() {
        cpSync(resolve(__dirname, "src/json"), resolve(__dirname, "dist/json"), {
          recursive: true,
        });
        cpSync(resolve(__dirname, "final_project"), resolve(__dirname, "dist/final_project"), {
          recursive: true,
        });
      },
    },
  ],

  build: {
    outDir: "../dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        cart: resolve(__dirname, "src/cart/index.html"),
        checkout: resolve(__dirname, "src/checkout/index.html"),
        checkoutSuccess: resolve(__dirname, "src/checkout/success.html"),
        product: resolve(__dirname, "src/product_pages/index.html"),
        productListing: resolve(__dirname, "src/product_listing/index.html"),
      },
    },
  },
});
