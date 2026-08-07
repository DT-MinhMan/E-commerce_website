import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminCategoriesQuery, useCreateAdminCategory, useUpdateAdminCategory } from "../../admin/hooks/useAdminQueries.js";
import type { CategoryWriteInput } from "../../admin/types.js";

const initialForm: CategoryWriteInput = {
  name: "",
  description: "",
  status: "ACTIVE"
};

export const AdminCategoryFormView = () => {
  const { categoryId = "" } = useParams();
  const isEdit = categoryId.length > 0;
  const navigate = useNavigate();
  const categoriesQuery = useAdminCategoriesQuery();
  const createCategory = useCreateAdminCategory();
  const updateCategory = useUpdateAdminCategory();
  const [form, setForm] = useState<CategoryWriteInput>(initialForm);

  useEffect(() => {
    const category = categoriesQuery.data?.find((item) => item.id === categoryId);
    if (category) {
      setForm({
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        status: category.status
      });
    }
  }, [categoriesQuery.data, categoryId]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEdit) {
      updateCategory.mutate({ categoryId, input: form }, { onSuccess: () => navigate("/admin/categories") });
      return;
    }

    createCategory.mutate(form, { onSuccess: () => navigate("/admin/categories") });
  };

  const mutationError = createCategory.error ?? updateCategory.error;
  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <section className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link> / <Link to="/admin/categories">Danh mục</Link> / <span>{isEdit ? "Chỉnh sửa" : "Tạo mới"}</span>
          </div>
          <h2>{isEdit ? `Chỉnh sửa: ${form.name || "Danh mục"}` : "Thêm Danh mục Mới"}</h2>
        </div>
        <Link className="admin-btn secondary" to="/admin/categories">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Quay lại danh mục</span>
        </Link>
      </div>

      {categoriesQuery.isError && <p className="status-error">{categoriesQuery.error.message}</p>}

      <div className="admin-single-card-wrapper">
        <form className="panel admin-form-card" onSubmit={submit}>
          <div className="card-header">
            <h3>Thông tin danh mục</h3>
            <p>Điền thông tin danh mục nội thất để hiển thị trên cửa hàng</p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Tên danh mục *</label>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ví dụ: Ghế sofa, Bàn ăn, Giường ngủ..."
                required
              />
            </div>

            <div className="form-group">
              <label>Đường dẫn Slug (Tùy chọn)</label>
              <input
                value={form.slug ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="slug-duong-dan"
              />
            </div>

            <div className="form-group full-width">
              <label>Mô tả danh mục</label>
              <textarea
                rows={4}
                value={form.description ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Mô tả ngắn về các sản phẩm thuộc danh mục này..."
              />
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CategoryWriteInput["status"] }))}
              >
                <option value="ACTIVE">Hoạt động (Hiển thị)</option>
                <option value="INACTIVE">Tạm ẩn (Khóa danh mục)</option>
              </select>
            </div>
          </div>

          {mutationError && <p className="status-error mt-12">{mutationError.message}</p>}

          <div className="form-actions-box mt-20">
            <button type="submit" className="admin-btn primary" disabled={isPending}>
              {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
            <Link to="/admin/categories" className="admin-btn secondary">
              Hủy bỏ
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

