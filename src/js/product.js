import { getParam, loadHeaderFooter } from "./utils.mjs";
import ExternalServices from "./ExternalServices.mjs";
import ProductDetails from "./ProductDetails.mjs";

const dataSource = new ExternalServices();

const productId = getParam("product");

const productDetails = new ProductDetails(productId, dataSource);

loadHeaderFooter();
productDetails.init();
