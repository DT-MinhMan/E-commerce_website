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
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>{isEdit ? "Edit category" : "New category"}</h2>
        </div>
        <Link className="secondary-action" to="/admin/categories">
          Back to categories
        </Link>
      </div>

      {categoriesQuery.isError && <p className="status-error">{categoriesQuery.error.message}</p>}
      <form className="admin-form panel" onSubmit={submit}>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
        </label>
        <label>
          Slug
          <input value={form.slug ?? ""} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
        </label>
        <label>
          Description
          <textarea value={form.description ?? ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        </label>
        <label>
          Status
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CategoryWriteInput["status"] }))}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>
        {mutationError && <p className="status-error">{mutationError.message}</p>}
        <button type="submit" className="primary-action" disabled={isPending}>
          {isPending ? "Saving..." : "Save category"}
        </button>
      </form>
    </section>
  );
};
