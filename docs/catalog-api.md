# Catalog API

Phase 4 adds public catalog reads and ADMIN-only category/product management APIs. Phase 10 expands admin product operations with product detail, stock updates, status updates and stock-state filtering.

## Visibility

Public category responses include only categories with `status: ACTIVE`.

Public product responses include only products with `status: ACTIVE` whose category also has `status: ACTIVE`. Inactive products, products in inactive categories and missing products all use the same public `PRODUCT_NOT_FOUND` detail response where applicable.

Admin listing endpoints can see both `ACTIVE` and `INACTIVE` records. `DELETE` endpoints are semantic deactivations; documents are not physically removed and category deactivation does not cascade to products.

Admin product detail is fetched by Mongo ObjectId at `GET /api/v1/admin/products/:id`. Public product detail remains slug-based and only exposes visible active products.

## Public Products

`GET /api/v1/products` accepts:

- `page`: positive integer, default `1`.
- `limit`: positive integer, default `12`, max `50`.
- `category`: category slug only.
- `minPriceMinor` and `maxPriceMinor`: non-negative integer price bounds.
- `sort`: `newest`, `price_asc` or `price_desc`.
- `q`: MVP search string.

Responses use:

```json
{
  "success": true,
  "data": {
    "products": []
  },
  "meta": {
    "page": 1,
    "limit": 12,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

## Search And Indexes

Search escapes user input and applies a case-insensitive regex to product `name`. The raw user value is never passed as a regex pattern.

This MVP search is not index-backed. Phase 4 does not add a MongoDB text index because search requirements are intentionally still small.

Existing index alignment:

- `categories.slug` supports category lookup and unique slug conflicts.
- `products.slug` supports product detail lookup and unique slug conflicts.
- `products.categoryId + products.status` supports category-filtered active listing.
- `products.status + products.createdAt` supports newest listing.
- `products.stockQuantity + products.updatedAt` supports low-stock admin views.

## Admin Writes

Admin routes require a valid access token with role `ADMIN`; roles from frontend request bodies are ignored.

Accepted category fields: `name`, `slug`, `description`, `status`.

Accepted product fields: `name`, `slug`, `description`, `categoryId`, `priceMinor`, `currency`, `stockQuantity`, `images`, `status`.

Clients cannot send `_id`, timestamps or unknown/internal fields. Slugs are normalized to lowercase. If omitted, slugs are generated from `name`; updating `name` does not change an existing slug unless `slug` is explicitly provided.

Product create/update requires the category to exist. Creating or activating an `ACTIVE` product requires the target category to also be `ACTIVE`.

## Admin Inventory

`PATCH /api/v1/admin/products/:id/stock` updates stock by absolute value:

```json
{
  "stockQuantity": 12
}
```

`stockQuantity` must be a non-negative integer. The endpoint does not accept Mongo operators, arbitrary fields, delta adjustments or reason fields.

`PATCH /api/v1/admin/products/:id/status` updates only product status:

```json
{
  "status": "INACTIVE"
}
```

Activating a product still validates category usability. Product deletion remains semantic deactivation.

Admin product listing additionally accepts `stockState`:

- `in_stock`: stock greater than zero.
- `low_stock`: stock from 1 through 5.
- `out_of_stock`: stock equals zero.
