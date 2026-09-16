import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useAdminCategoriesQuery,
  useAdminProductDetailQuery,
  useCreateAdminProduct,
  useUpdateAdminProduct,
  useUploadAdminProductImage
} from "../../admin/hooks/useAdminQueries.js";
import type { ProductWriteInput } from "../../admin/types.js";
import { formatPrice } from "../../../lib/formatters.js";
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

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const AdminProductFormView = () => {
  const { productId = "" } = useParams();
  const isEdit = productId.length > 0;
  const navigate = useNavigate();
  const categoriesQuery = useAdminCategoriesQuery();
  const productQuery = useAdminProductDetailQuery(productId);
  const createProduct = useCreateAdminProduct();
  const updateProduct = useUpdateAdminProduct(productId);
  const uploadImage = useUploadAdminProductImage();
  const [form, setForm] = useState<ProductWriteInput>(initialForm);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [priceInput, setPriceInput] = useState<string>("");
  const [stockInput, setStockInput] = useState<string>("");

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
      images: productQuery.data.images ?? [],
      status: productQuery.data.status
    });
    setPriceInput(productQuery.data.priceMinor ? String(productQuery.data.priceMinor) : "");
    setStockInput(productQuery.data.stockQuantity !== undefined ? String(productQuery.data.stockQuantity) : "");
  }, [productQuery.data]);

  const setField = (key: keyof ProductWriteInput, value: unknown) => {
    setSaveSuccess(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleFilesSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const currentImages = form.images ?? [];
    const availableSlots = MAX_IMAGES - currentImages.length;
    if (availableSlots <= 0) {
      alert(`Sản phẩm chỉ có thể chứa tối đa ${MAX_IMAGES} hình ảnh.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const rawFiles = Array.from(fileList);
    let filesToUpload = rawFiles;
    if (rawFiles.length > availableSlots) {
      alert(
        `Bạn chỉ có thể thêm tối đa ${availableSlots} ảnh nữa (tổng cộng tối đa ${MAX_IMAGES} ảnh). Hệ thống sẽ tải lên ${availableSlots} ảnh đầu tiên.`
      );
      filesToUpload = rawFiles.slice(0, availableSlots);
    }

    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];
    for (const f of filesToUpload) {
      if (f.size > MAX_FILE_SIZE) {
        oversizedFiles.push(f.name);
      } else {
        validFiles.push(f);
      }
    }

    if (oversizedFiles.length > 0) {
      alert(`Các tệp sau vượt quá kích thước 5MB và sẽ bị bỏ qua:\n- ${oversizedFiles.join("\n- ")}`);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setSaveSuccess(false);

    const readFileAsDataUri = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Không thể đọc tệp ${file.name}`));
        reader.readAsDataURL(file);
      });

    const newlyUploaded: Array<{ url: string; alt?: string; publicId?: string }> = [];
    let failedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]!;
      setUploadProgress({ current: i + 1, total: validFiles.length });
      try {
        const dataUri = await readFileAsDataUri(file);
        const result = await uploadImage.mutateAsync({ dataUri, fileName: file.name });
        newlyUploaded.push({
          url: result.url,
          publicId: result.publicId,
          alt: form.name || file.name.replace(/\.[^/.]+$/, "")
        });
      } catch (err) {
        console.error("Upload error for file", file.name, err);
        failedCount++;
      }
    }

    if (newlyUploaded.length > 0) {
      setForm((current) => ({
        ...current,
        images: [...(current.images ?? []), ...newlyUploaded]
      }));
    }

    if (failedCount > 0) {
      setUploadError(`Có ${failedCount}/${validFiles.length} ảnh tải lên thất bại. Vui lòng thử lại.`);
    }

    setIsUploading(false);
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setSaveSuccess(false);
    setForm((current) => {
      const imgs = [...(current.images ?? [])];
      const target = imgs[index];
      if (!target) return current;
      imgs.splice(index, 1);
      imgs.unshift(target);
      return { ...current, images: imgs };
    });
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    setSaveSuccess(false);
    setForm((current) => {
      const imgs = [...(current.images ?? [])];
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= imgs.length) return current;
      const temp = imgs[index]!;
      imgs[index] = imgs[targetIndex]!;
      imgs[targetIndex] = temp;
      return { ...current, images: imgs };
    });
  };

  const handleRemoveImage = (index: number) => {
    setSaveSuccess(false);
    setForm((current) => {
      const imgs = [...(current.images ?? [])];
      imgs.splice(index, 1);
      return { ...current, images: imgs };
    });
  };

  const handleAltChange = (index: number, altText: string) => {
    setSaveSuccess(false);
    setForm((current) => {
      const imgs = [...(current.images ?? [])];
      if (!imgs[index]) return current;
      imgs[index] = { ...imgs[index]!, alt: altText };
      return { ...current, images: imgs };
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveSuccess(false);
    const mutation = isEdit ? updateProduct : createProduct;

    mutation.mutate(form, {
      onSuccess: (product) => {
        setSaveSuccess(true);
        navigate(`/admin/products/${product.id}/edit`);
      }
    });
  };

  const mutationError = createProduct.error ?? updateProduct.error;
  const isPending = createProduct.isPending || updateProduct.isPending;
  const images = form.images ?? [];

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

          {/* Section 2: Image Management */}
          <div className="panel admin-form-card">
            <div className="card-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <h3>Thư viện hình ảnh sản phẩm</h3>
                  <p>Tải lên tối đa {MAX_IMAGES} hình ảnh. Ảnh đầu tiên sẽ là ảnh đại diện chính của sản phẩm.</p>
                </div>
                <span className={`product-images-counter ${images.length >= MAX_IMAGES ? "is-max" : ""}`}>
                  {images.length}/{MAX_IMAGES} ảnh
                </span>
              </div>
            </div>

            <div className="product-image-upload-area">
              {isUploading && (
                <div className="product-image-upload-status">
                  <div className="admin-spinner" />
                  <span>
                    Đang tải ảnh lên Cloudinary... ({uploadProgress?.current ?? 1}/{uploadProgress?.total ?? 1})
                  </span>
                </div>
              )}

              {images.length === 0 && !isUploading ? (
                <div className="product-image-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p>Chưa có hình ảnh nào cho sản phẩm</p>
                  <span className="field-hint">Hỗ trợ chọn nhiều ảnh định dạng JPG, PNG, WEBP, GIF (tối đa 5MB/ảnh)</span>
                  <button
                    type="button"
                    className="admin-btn-sm primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Tải ảnh từ máy
                  </button>
                </div>
              ) : (
                <div className="product-images-grid">
                  {images.map((img, index) => (
                    <div className={`product-image-card ${index === 0 ? "is-primary" : ""}`} key={`${img.publicId || img.url}-${index}`}>
                      <div className="product-image-thumb-wrap">
                        <img src={img.url} alt={img.alt || form.name || `Ảnh ${index + 1}`} />
                        {index === 0 ? (
                          <span className="product-image-badge-primary">Ảnh chính</span>
                        ) : (
                          <span className="product-image-badge-order">#{index + 1}</span>
                        )}
                      </div>

                      <div className="product-image-card-body">
                        <div className="product-image-card-actions">
                          <div className="product-image-nav-group">
                            <button
                              type="button"
                              className="product-image-btn-icon"
                              title="Di chuyển sang trái"
                              disabled={index === 0 || isUploading}
                              onClick={() => handleMoveImage(index, "left")}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="product-image-btn-icon"
                              title="Di chuyển sang phải"
                              disabled={index === images.length - 1 || isUploading}
                              onClick={() => handleMoveImage(index, "right")}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </button>
                          </div>

                          <button
                            type="button"
                            className="product-image-btn-icon btn-danger"
                            title="Xóa ảnh này"
                            disabled={isUploading}
                            onClick={() => handleRemoveImage(index)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        {index > 0 && (
                          <button
                            type="button"
                            className="product-image-btn-primary-set"
                            disabled={isUploading}
                            onClick={() => handleSetPrimary(index)}
                          >
                            ★ Đặt làm ảnh chính
                          </button>
                        )}

                        <div className="product-image-alt-field">
                          <label>Chú thích (Alt)</label>
                          <input
                            type="text"
                            value={img.alt ?? ""}
                            disabled={isUploading}
                            onChange={(e) => handleAltChange(index, e.target.value)}
                            placeholder="Mô tả ảnh cho SEO..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      className="product-image-add-card"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Thêm ảnh ({images.length}/{MAX_IMAGES})</span>
                    </button>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFilesSelect}
                style={{ display: "none" }}
              />

              {uploadError && <p className="status-error mt-12">{uploadError}</p>}
              {uploadImage.isError && (
                <p className="status-error mt-12">
                  Tải ảnh thất bại: {uploadImage.error.message}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Pricing & Stock */}
          <div className="panel admin-form-card">
            <div className="card-header">
              <h3>Giá cả & Tồn kho</h3>
            </div>
            <div className="form-grid cols-2">
              <div className="form-group">
                <label>Đơn giá (VND) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={(event) => {
                    const cleaned = event.target.value.replace(/\D/g, "");
                    const formatted = cleaned.replace(/^0+(?=\d)/, "");
                    setPriceInput(formatted);
                    setField("priceMinor", formatted === "" ? 0 : parseInt(formatted, 10));
                  }}
                  onBlur={() => {
                    if (priceInput !== "") {
                      setPriceInput(String(parseInt(priceInput, 10)));
                    }
                  }}
                  placeholder="Ví dụ: 3500000"
                  required
                />
                <div className="price-preview-badge">
                  <span>Hiển thị: </span>
                  <strong>{formatPrice(form.priceMinor, "VND")}</strong>
                </div>
              </div>

              <div className="form-group">
                <label>Số lượng Tồn kho *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stockInput}
                  onChange={(event) => {
                    const cleaned = event.target.value.replace(/\D/g, "");
                    const formatted = cleaned.replace(/^0+(?=\d)/, "");
                    setStockInput(formatted);
                    setField("stockQuantity", formatted === "" ? 0 : parseInt(formatted, 10));
                  }}
                  onBlur={() => {
                    if (stockInput === "") {
                      setStockInput("0");
                      setField("stockQuantity", 0);
                    } else {
                      setStockInput(String(parseInt(stockInput, 10)));
                    }
                  }}
                  placeholder="0"
                  required
                />
                <span className="field-hint">Cập nhật số lượng sẵn có trong kho</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-form-side">
          {/* Section 4: Categories & Status */}
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
            {saveSuccess && <p className="status-success mt-12">Đã lưu thay đổi sản phẩm thành công!</p>}

            <div className="form-actions-box">
              <button type="submit" className="admin-btn primary full-width" disabled={isPending || isUploading}>
                {isPending ? "Đang lưu..." : isUploading ? "Đang tải ảnh..." : isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

