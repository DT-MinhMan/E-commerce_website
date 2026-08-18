import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAdminCategoriesQuery, useCreateAdminCategory, useUpdateAdminCategory, useUploadAdminCategoryImage } from "../../admin/hooks/useAdminQueries.js";
import type { CategoryWriteInput } from "../../admin/types.js";

const initialForm: CategoryWriteInput = {
  name: "",
  description: "",
  imageUrl: "",
  status: "ACTIVE"
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const AdminCategoryFormView = () => {
  const { categoryId = "" } = useParams();
  const isEdit = categoryId.length > 0;
  const navigate = useNavigate();
  const categoriesQuery = useAdminCategoriesQuery();
  const createCategory = useCreateAdminCategory();
  const updateCategory = useUpdateAdminCategory();
  const uploadImage = useUploadAdminCategoryImage();
  const [form, setForm] = useState<CategoryWriteInput>(initialForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const category = categoriesQuery.data?.find((item) => item.id === categoryId);
    if (category) {
      setForm({
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        imageUrl: category.imageUrl ?? "",
        status: category.status
      });
    }
  }, [categoriesQuery.data, categoryId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert("Kích thước ảnh tối đa là 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      uploadImage.mutate(
        { dataUri, fileName: file.name },
        {
          onSuccess: (result) => {
            setForm((current) => ({ ...current, imageUrl: result.url }));
          }
        }
      );
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setForm((current) => ({ ...current, imageUrl: "" }));
    uploadImage.reset();
  };

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

            {/* Category Image Upload */}
            <div className="form-group full-width">
              <label>Ảnh đại diện danh mục</label>
              <div className="category-image-upload-area">
                {form.imageUrl ? (
                  <div className="category-image-preview">
                    <img src={form.imageUrl} alt="Ảnh danh mục" />
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="admin-btn-sm primary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <span>Chọn ảnh mới</span>
                      </button>
                      <button type="button" className="admin-btn-sm secondary" onClick={handleRemoveImage}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span>Xóa ảnh</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="category-image-placeholder">
                    {uploadImage.isPending ? (
                      <div className="upload-loading">
                        <div className="admin-spinner" />
                        <p>Đang tải ảnh lên Cloudinary...</p>
                      </div>
                    ) : (
                      <>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <p>Chọn ảnh đại diện cho danh mục</p>
                        <button
                          type="button"
                          className="admin-btn-sm primary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Tải ảnh từ máy
                        </button>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                {uploadImage.isError && (
                  <p className="status-error mt-12">
                    Tải ảnh thất bại: {uploadImage.error.message}
                  </p>
                )}
              </div>
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
            <button type="submit" className="admin-btn primary" disabled={isPending || uploadImage.isPending}>
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

