import Navbar from "../components/Navbar";
import ProductsViews from "./products/ProductsViews";
import { useProductsPage } from "./products/useProductsPage";

export default function Products() {
  const props = useProductsPage();
  return (
    <div className="flex flex-col gap-6 pb-20 w-full min-w-0">
      <Navbar title="المنتجات" />
      <ProductsViews {...props} />
    </div>
  );
}
