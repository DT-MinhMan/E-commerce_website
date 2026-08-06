import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAdminCategoriesQuery,
  useAdminProductDetailQuery,
  useCreateAdminProduct,
  useUpdateAdminProduct
} from "../../admin/hooks/useAdminQueries.js";
import type { ProductWriteInput } from "../../admin/types.js";
import { ROOM_TYPE_LABELS, type RoomType } from "../../catalog/types.js";

const initialForm: ProductWriteInput = {
  name: "",
  description: "",
  categoryId: "",
  roomType: undefined,
  priceMinor: 0,
  currency: "USD",
  stockQuantity: 0,
  status: "ACTIVE",
  images: []
};

export const AdminProductFormView = () => {
  const { productId = "" } = useParams();
  const isEdit = productId.length > 0;
  const navigate = useNavigate();
  const categoriesQuery = useAdminCategoriesQuery();
  const productQuery = useAdminProductDetailQuery(productId);
  const createProduct = useCreateAdminProduct();
  const updateProduct = useUpdateAdminProduct(productId);
  const [form, setForm] = useState<ProductWriteInput>(initialForm);

  useEffect(() => {
    if (!productQuery.data) {
      return;
    }

    setForm({
      name: productQuery.data.name,
      slug: productQuery.data.slug,
      description: productQuery.data.description,
      categoryId: productQuery.data.categoryId,
      roomType: productQuery.data.roomType,
      priceMinor: productQuery.data.priceMinor,
      currency: productQuery.data.currency,
      stockQuantity: productQuery.data.stockQuantity,
      images: productQuery.data.images,
      status: productQuery.data.status
    });
  }, [productQuery.data]);

  const setField = (key: keyof ProductWriteInput, value: unknown) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mutation = isEdit ? updateProduct : createProduct;

    mutation.mutate(form, {
      onSuccess: (product) => navigate(`/admin/products/${product.id}/edit`)
    });
  };

  const mutationError = createProduct.error ?? updateProduct.error;
  const isPending = createProduct.isPending || updateProduct.isPending;

  if (isEdit && productQuery.isLoading) {
    return <section className="panel">Loading product...</section>;
  }

  return (
    <section className="admin-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>{isEdit ? "Edit product" : "New product"}</h2>
        </div>
        <Link className="secondary-action" to="/admin/products">
          Back to products
        </Link>
      </div>

      {productQuery.isError && <p className="status-error">{productQuery.error.message}</p>}
      <form className="admin-form panel" onSubmit={submit}>
        <label>
          Name
          <input value={form.name} onChange={(event) => setField("name", event.target.value)} required />
        </label>
        <label>
          Slug
          <input value={form.slug ?? ""} onChange={(event) => setField("slug", event.target.value)} />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} required />
        </label>
        <label>
          Category
          <select value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} required>
            <option value="">Select category</option>
            {categoriesQuery.data?.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Phân loại phòng
          <select value={form.roomType ?? ""} onChange={(event) => setField("roomType", event.target.value || undefined)}>
            <option value="">Không phân loại phòng</option>
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((key) => (
              <option value={key} key={key}>
                {ROOM_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Price minor
          <input type="number" min="0" value={form.priceMinor} onChange={(event) => setField("priceMinor", Number(event.target.value))} required />
        </label>
        <label>
          Stock
          <input type="number" min="0" value={form.stockQuantity} onChange={(event) => setField("stockQuantity", Number(event.target.value))} required />
        </label>
        <label>
          Status
          <select value={form.status} onChange={(event) => setField("status", event.target.value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>
        {mutationError && <p className="status-error">{mutationError.message}</p>}
        <button type="submit" className="primary-action" disabled={isPending}>
          {isPending ? "Saving..." : "Save product"}
        </button>
      </form>
    </section>
  );
};
