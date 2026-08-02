import ProductsViews from "./products/ProductsViews";
import { useProductsPage } from "./products/useProductsPage";

export default function Products() {
  const props = useProductsPage();
  return (
    <div className="flex flex-col gap-6 pb-20 w-full min-w-0">
      <ProductsViews {...props} />
    </div>
  );
}
