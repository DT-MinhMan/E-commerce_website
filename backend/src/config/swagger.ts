import type { AppConfig } from "./env.js";

const errorResponse = {
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/StandardErrorResponse" }
    }
  }
};

const bearerSecurity = [{ bearerAuth: [] }];

const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 12 } }
];

const productQueryParams = [
  ...paginationParams,
  { name: "category", in: "query", schema: { type: "string", example: "keyboards" }, description: "Category slug only." },
  { name: "minPriceMinor", in: "query", schema: { type: "integer", minimum: 0 } },
  { name: "maxPriceMinor", in: "query", schema: { type: "integer", minimum: 0 } },
  { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc"], default: "newest" } },
  { name: "q", in: "query", schema: { type: "string", example: "keyboard" }, description: "Escaped regex search on product name." }
];

export const swaggerSpec = (config: AppConfig) => ({
  openapi: "3.0.0",
  info: {
    title: "MERN E-commerce API",
    description: "Foundation API for a MERN single-vendor e-commerce platform.",
    version: "0.1.0"
  },
  servers: [{ url: `http://localhost:${config.port}` }],
  paths: {
    "/api/v1/auth/register": {
      post: {
        summary: "Register a customer account",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } }
        },
        responses: {
          "201": {
            description: "Registered session",
            headers: { "Set-Cookie": { description: "httpOnly refresh token cookie", schema: { type: "string" } } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthSuccessResponse" } } }
          },
          "409": { description: "Email already exists", ...errorResponse }
        }
      }
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Log in with email and password",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } }
        },
        responses: {
          "200": {
            description: "Authenticated session",
            headers: { "Set-Cookie": { description: "httpOnly refresh token cookie", schema: { type: "string" } } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthSuccessResponse" } } }
          },
          "401": { description: "Invalid credentials", ...errorResponse }
        }
      }
    },
    "/api/v1/auth/refresh": {
      post: {
        summary: "Rotate refresh token and issue a new access token",
        tags: ["Auth"],
        responses: {
          "200": {
            description: "Refreshed session",
            headers: { "Set-Cookie": { description: "Rotated httpOnly refresh token cookie", schema: { type: "string" } } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthSuccessResponse" } } }
          },
          "401": { description: "Missing, invalid, expired or reused refresh token", ...errorResponse }
        }
      }
    },
    "/api/v1/auth/logout": {
      post: {
        summary: "Log out the current refresh-token session",
        tags: ["Auth"],
        responses: {
          "200": {
            description: "Logged out",
            headers: { "Set-Cookie": { description: "Cleared refresh token cookie", schema: { type: "string" } } },
            content: { "application/json": { schema: { $ref: "#/components/schemas/LogoutSuccessResponse" } } }
          }
        }
      }
    },
    "/api/v1/cart": {
      get: {
        summary: "Get the current customer cart",
        tags: ["Cart"],
        security: bearerSecurity,
        responses: {
          "200": { description: "Current cart", content: { "application/json": { schema: { $ref: "#/components/schemas/CartSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse }
        }
      },
      delete: {
        summary: "Clear the current customer cart",
        tags: ["Cart"],
        security: bearerSecurity,
        responses: {
          "200": { description: "Cleared cart", content: { "application/json": { schema: { $ref: "#/components/schemas/CartSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse }
        }
      }
    },
    "/api/v1/cart/items": {
      post: {
        summary: "Add a product to the current customer cart",
        tags: ["Cart"],
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CartItemWriteRequest" } } } },
        responses: {
          "200": { description: "Updated cart", content: { "application/json": { schema: { $ref: "#/components/schemas/CartSuccessResponse" } } } },
          "400": { description: "Invalid quantity or inactive product", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Product not found", ...errorResponse },
          "409": { description: "Insufficient stock or currency mismatch", ...errorResponse }
        }
      }
    },
    "/api/v1/cart/items/{productId}": {
      patch: {
        summary: "Update a cart item quantity",
        tags: ["Cart"],
        security: bearerSecurity,
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CartQuantityRequest" } } } },
        responses: {
          "200": { description: "Updated cart", content: { "application/json": { schema: { $ref: "#/components/schemas/CartSuccessResponse" } } } },
          "400": { description: "Invalid quantity or inactive product", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Product or cart item not found", ...errorResponse },
          "409": { description: "Insufficient stock or currency mismatch", ...errorResponse }
        }
      },
      delete: {
        summary: "Remove a product from the current customer cart",
        tags: ["Cart"],
        security: bearerSecurity,
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated cart", content: { "application/json": { schema: { $ref: "#/components/schemas/CartSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Cart item not found", ...errorResponse }
        }
      }
    },
    "/api/v1/categories": {
      get: {
        summary: "List active public categories",
        tags: ["Catalog"],
        responses: {
          "200": {
            description: "Active categories",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryListSuccessResponse" } } }
          }
        }
      }
    },
    "/api/v1/products": {
      get: {
        summary: "List active public products",
        tags: ["Catalog"],
        parameters: productQueryParams,
        responses: {
          "200": {
            description: "Visible active products with pagination metadata",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductListSuccessResponse" } } }
          },
          "400": { description: "Invalid query", ...errorResponse }
        }
      }
    },
    "/api/v1/products/{slug}": {
      get: {
        summary: "Get an active public product by slug",
        tags: ["Catalog"],
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string", example: "mechanical-gaming-keyboard" } }],
        responses: {
          "200": {
            description: "Visible active product",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProductSuccessResponse" } } }
          },
          "400": { description: "Invalid slug", ...errorResponse },
          "404": { description: "Missing or inactive product", ...errorResponse }
        }
      }
    },
    "/api/v1/admin/categories": {
      get: {
        summary: "List categories for admins",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] } }],
        responses: {
          "200": { description: "Categories", content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryListSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse }
        }
      },
      post: {
        summary: "Create a category",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryWriteRequest" } } } },
        responses: {
          "201": { description: "Created category", content: { "application/json": { schema: { $ref: "#/components/schemas/CategorySuccessResponse" } } } },
          "400": { description: "Validation error", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse },
          "409": { description: "Slug already exists", ...errorResponse }
        }
      }
    },
    "/api/v1/admin/categories/{id}": {
      patch: {
        summary: "Update a category",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CategoryWriteRequest" } } } },
        responses: {
          "200": { description: "Updated category", content: { "application/json": { schema: { $ref: "#/components/schemas/CategorySuccessResponse" } } } },
          "400": { description: "Validation error", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse },
          "404": { description: "Category not found", ...errorResponse },
          "409": { description: "Slug already exists", ...errorResponse }
        }
      },
      delete: {
        summary: "Deactivate a category",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deactivated category", content: { "application/json": { schema: { $ref: "#/components/schemas/CategorySuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse },
          "404": { description: "Category not found", ...errorResponse }
        }
      }
    },
    "/api/v1/admin/products": {
      get: {
        summary: "List products for admins",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        parameters: [...productQueryParams, { name: "status", in: "query", schema: { type: "string", enum: ["ACTIVE", "INACTIVE"] } }],
        responses: {
          "200": { description: "Products", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductListSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse }
        }
      },
      post: {
        summary: "Create a product",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductWriteRequest" } } } },
        responses: {
          "201": { description: "Created product", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductSuccessResponse" } } } },
          "400": { description: "Validation error or invalid category", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse },
          "409": { description: "Slug already exists", ...errorResponse }
        }
      }
    },
    "/api/v1/admin/products/{id}": {
      patch: {
        summary: "Update a product",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductWriteRequest" } } } },
        responses: {
          "200": { description: "Updated product", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductSuccessResponse" } } } },
          "400": { description: "Validation error or invalid category", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse },
          "404": { description: "Product not found", ...errorResponse },
          "409": { description: "Slug already exists", ...errorResponse }
        }
      },
      delete: {
        summary: "Deactivate a product",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deactivated product", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse },
          "404": { description: "Product not found", ...errorResponse }
        }
      }
    },
    "/api/v1/health": {
      get: {
        summary: "Check API and database health",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Health status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthSuccessResponse" } } }
          }
        }
      }
    },
    "/api/v1/users/me": {
      get: {
        summary: "Get the current authenticated user",
        tags: ["Users"],
        security: bearerSecurity,
        responses: {
          "200": {
            description: "Current user",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CurrentUserSuccessResponse" } } }
          },
          "401": { description: "Missing or invalid access token", ...errorResponse }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Short-lived access token. Refresh token is stored separately in an httpOnly cookie."
      }
    },
    schemas: {
      StandardSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          meta: { nullable: true, example: null }
        }
      },
      StandardErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "sort must be one of: newest, price_asc, price_desc" },
              details: { nullable: true, example: null }
            }
          },
          requestId: { type: "string", example: "generated-request-id" }
        }
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 12 },
          totalItems: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 4 }
        }
      },
      HealthSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  status: { type: "string", example: "ok" },
                  database: { type: "string", example: "connected" },
                  environment: { type: "string", example: "development" },
                  timestamp: { type: "string", format: "date-time" }
                }
              }
            }
          }
        ]
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "fullName"],
        properties: {
          email: { type: "string", format: "email", example: "customer@example.com" },
          password: { type: "string", minLength: 8, example: "ChangeMe123!" },
          fullName: { type: "string", minLength: 2, maxLength: 120, example: "Demo Customer" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "customer@example.com" },
          password: { type: "string", example: "ChangeMe123!" }
        }
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", example: "66a8f0d24b23d5f35a6a1111" },
          email: { type: "string", format: "email", example: "customer@example.com" },
          fullName: { type: "string", example: "Demo Customer" },
          role: { type: "string", enum: ["CUSTOMER", "ADMIN"], example: "CUSTOMER" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "BLOCKED"], example: "ACTIVE" }
        }
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", example: "66a8f0d24b23d5f35a6a1111" },
          name: { type: "string", example: "Keyboards" },
          slug: { type: "string", example: "keyboards" },
          description: { type: "string", example: "Mechanical and productivity keyboards." },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "ACTIVE" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      CategoryWriteRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120, example: "Gaming Keyboards" },
          slug: { type: "string", example: "gaming-keyboards" },
          description: { type: "string", maxLength: 500 },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
        }
      },
      ProductImage: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri", example: "https://example.com/keyboard.png" },
          alt: { type: "string", example: "Mechanical keyboard" }
        }
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", example: "66a8f0d24b23d5f35a6a2222" },
          name: { type: "string", example: "Mechanical Gaming Keyboard" },
          slug: { type: "string", example: "mechanical-gaming-keyboard" },
          description: { type: "string" },
          categoryId: { type: "string", example: "66a8f0d24b23d5f35a6a1111" },
          priceMinor: { type: "integer", example: 8999 },
          currency: { type: "string", example: "USD" },
          stockQuantity: { type: "integer", example: 12 },
          images: { type: "array", maxItems: 8, items: { $ref: "#/components/schemas/ProductImage" } },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], example: "ACTIVE" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      ProductWriteRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 180 },
          slug: { type: "string", example: "mechanical-gaming-keyboard" },
          description: { type: "string", minLength: 10, maxLength: 3000 },
          categoryId: { type: "string" },
          priceMinor: { type: "integer", minimum: 0 },
          currency: { type: "string", default: "USD" },
          stockQuantity: { type: "integer", minimum: 0 },
          images: { type: "array", maxItems: 8, items: { $ref: "#/components/schemas/ProductImage" } },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" }
        }
      },
      CartItemWriteRequest: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "string", example: "66a8f0d24b23d5f35a6a2222" },
          quantity: { type: "integer", minimum: 1, example: 2 }
        }
      },
      CartQuantityRequest: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 1, example: 3 }
        }
      },
      CartItem: {
        type: "object",
        properties: {
          productId: { type: "string", example: "66a8f0d24b23d5f35a6a2222" },
          slug: { type: "string", nullable: true, example: "mechanical-gaming-keyboard" },
          name: { type: "string", example: "Mechanical Gaming Keyboard" },
          image: { nullable: true, allOf: [{ $ref: "#/components/schemas/ProductImage" }] },
          unitPriceMinor: { type: "integer", example: 8999 },
          currency: { type: "string", example: "USD" },
          quantity: { type: "integer", example: 2 },
          lineTotalMinor: { type: "integer", example: 17998 },
          stockQuantity: { type: "integer", example: 10 },
          isAvailable: { type: "boolean", example: true }
        }
      },
      Cart: {
        type: "object",
        properties: {
          id: { type: "string", nullable: true, example: "66a8f0d24b23d5f35a6a3333" },
          items: { type: "array", items: { $ref: "#/components/schemas/CartItem" } },
          itemCount: { type: "integer", example: 2 },
          subtotalMinor: { type: "integer", example: 17998 },
          currency: { type: "string", example: "USD" }
        }
      },
      CategorySuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { category: { $ref: "#/components/schemas/Category" } } } } }
        ]
      },
      CategoryListSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: { type: "object", properties: { categories: { type: "array", items: { $ref: "#/components/schemas/Category" } } } }
            }
          }
        ]
      },
      ProductSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { product: { $ref: "#/components/schemas/Product" } } } } }
        ]
      },
      ProductListSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: { type: "object", properties: { products: { type: "array", items: { $ref: "#/components/schemas/Product" } } } },
              meta: { $ref: "#/components/schemas/PaginationMeta" }
            }
          }
        ]
      },
      CartSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { cart: { $ref: "#/components/schemas/Cart" } } } } }
        ]
      },
      AuthSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  user: { $ref: "#/components/schemas/AuthUser" },
                  accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
                }
              }
            }
          }
        ]
      },
      CurrentUserSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { user: { $ref: "#/components/schemas/AuthUser" } } } } }
        ]
      },
      LogoutSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { loggedOut: { type: "boolean", example: true } } } } }
        ]
      }
    }
  }
});
