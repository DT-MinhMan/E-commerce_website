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
  currency: "VND",
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
    return (
      <div className="panel admin-loading-panel">
        <div className="admin-spinner" />
        <p>Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  return (
    <section className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link> / <Link to="/admin/products">Sản phẩm</Link> / <span>{isEdit ? "Chỉnh sửa" : "Tạo mới"}</span>
          </div>
          <h2>{isEdit ? `Chỉnh sửa: ${form.name || "Sản phẩm"}` : "Thêm Sản phẩm Mới"}</h2>
        </div>
        <Link className="admin-btn secondary" to="/admin/products">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {productQuery.isError && <p className="status-error">{productQuery.error.message}</p>}

      <form className="admin-form-layout" onSubmit={submit}>
        <div className="admin-form-main">
          {/* Section 1: Basic Info */}
          <div className="panel admin-form-card">
            <div className="card-header">
              <h3>Thông tin cơ bản</h3>
              <p>Nhập tên sản phẩm, đường dẫn slug và mô tả chi tiết sản phẩm</p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Tên sản phẩm *</label>
                <input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Nhập tên sản phẩm..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Đường dẫn Slug (Tùy chọn)</label>
                <input
                  value={form.slug ?? ""}
                  onChange={(event) => setField("slug", event.target.value)}
                  placeholder="tudong-tao-tu-ten-san-pham"
                />
              </div>

              <div className="form-group full-width">
                <label>Mô tả sản phẩm *</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) => setField("description", event.target.value)}
                  placeholder="Mô tả chất liệu, kích thước, thiết kế và công năng..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="panel admin-form-card">
            <div className="card-header">
              <h3>Giá cả & Tồn kho</h3>
              <p>Thiết lập đơn giá và số lượng sản phẩm có sẵn trong kho</p>
            </div>
            <div className="form-grid cols-2">
              <div className="form-group">
                <label>Đơn giá (VND) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.priceMinor}
                  onChange={(event) => setField("priceMinor", Number(event.target.value))}
                  required
                />
                <span className="field-hint">Nhập giá chính xác (Ví dụ: 1500000)</span>
              </div>

              <div className="form-group">
                <label>Số lượng Tồn kho *</label>
                <input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(event) => setField("stockQuantity", Number(event.target.value))}
                  required
                />
                <span className="field-hint">Cập nhật số lượng sẵn có trong kho</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-form-side">
          {/* Section 3: Categories & Status */}
          <div className="panel admin-form-card">
            <div className="card-header">
              <h3>Phân loại & Trạng thái</h3>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Danh mục *</label>
                <select value={form.categoryId} onChange={(event) => setField("categoryId", event.target.value)} required>
                  <option value="">-- Chọn danh mục --</option>
                  {categoriesQuery.data?.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phân loại Phòng</label>
                <select value={form.roomType ?? ""} onChange={(event) => setField("roomType", event.target.value || undefined)}>
                  <option value="">Không phân loại phòng</option>
                  {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((key) => (
                    <option value={key} key={key}>
                      {ROOM_TYPE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Trạng thái hiển thị</label>
                <select value={form.status} onChange={(event) => setField("status", event.target.value)}>
                  <option value="ACTIVE">Hoạt động (Hiển thị bán)</option>
                  <option value="INACTIVE">Tạm ẩn (Khóa sản phẩm)</option>
                </select>
              </div>
            </div>

            {mutationError && <p className="status-error mt-12">{mutationError.message}</p>}

            <div className="form-actions-box">
              <button type="submit" className="admin-btn primary full-width" disabled={isPending}>
                {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

