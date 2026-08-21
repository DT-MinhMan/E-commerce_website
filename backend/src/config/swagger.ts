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
    "/api/v1/orders/checkout": {
      post: {
        summary: "Create a pending order and payment from the current cart",
        tags: ["Orders"],
        security: bearerSecurity,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CheckoutRequest" } } } },
        responses: {
          "201": { description: "Created pending order", content: { "application/json": { schema: { $ref: "#/components/schemas/OrderSuccessResponse" } } } },
          "400": { description: "Empty cart, inactive product or invalid address", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Missing product", ...errorResponse },
          "409": { description: "Insufficient stock, currency mismatch or order number conflict", ...errorResponse },
          "500": { description: "Checkout transaction failed", ...errorResponse }
        }
      }
    },
    "/api/v1/orders": {
      get: {
        summary: "List current customer orders",
        tags: ["Orders"],
        security: bearerSecurity,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } }
        ],
        responses: {
          "200": {
            description: "Customer orders with pagination metadata",
            content: { "application/json": { schema: { $ref: "#/components/schemas/OrderListSuccessResponse" } } }
          },
          "400": { description: "Invalid pagination", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse }
        }
      }
    },
    "/api/v1/orders/{orderId}": {
      get: {
        summary: "Get a current customer order by id",
        tags: ["Orders"],
        security: bearerSecurity,
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Customer order", content: { "application/json": { schema: { $ref: "#/components/schemas/OrderSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Order not found", ...errorResponse }
        }
      }
    },
    "/api/v1/orders/{orderId}/cancel": {
      post: {
        summary: "Cancel an unpaid or pending customer order",
        tags: ["Orders"],
        security: bearerSecurity,
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Cancelled customer order", content: { "application/json": { schema: { $ref: "#/components/schemas/OrderSuccessResponse" } } } },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Order not found", ...errorResponse },
          "409": { description: "Order cannot be cancelled at this stage", ...errorResponse }
        }
      }
    },

    "/api/v1/payments/checkout-session": {
      post: {
        summary: "Create a Stripe hosted Checkout Session for a payable order",
        tags: ["Payments"],
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCheckoutSessionRequest" } } }
        },
        responses: {
          "200": {
            description: "Stripe Checkout Session redirect data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CheckoutSessionSuccessResponse" } } }
          },
          "400": { description: "Invalid request", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Order or payment not found", ...errorResponse },
          "409": { description: "Order is not payable or amount mismatch", ...errorResponse },
          "500": { description: "Stripe configuration missing", ...errorResponse },
          "502": { description: "Stripe response missing checkout URL", ...errorResponse }
        }
      }
    },
    "/api/v1/payments/orders/{orderId}": {
      get: {
        summary: "Get payment status for a current customer's order",
        tags: ["Payments"],
        security: bearerSecurity,
        parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Payment and order payment status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentStatusSuccessResponse" } } }
          },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Customer role required", ...errorResponse },
          "404": { description: "Order or payment not found", ...errorResponse }
        }
      }
    },
    "/api/v1/webhooks/stripe": {
      post: {
        summary: "Receive signed Stripe webhook events",
        tags: ["Webhooks"],
        parameters: [
          {
            name: "Stripe-Signature",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Stripe signature used to verify the raw request body."
          }
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          "200": {
            description: "Webhook accepted",
            content: { "application/json": { schema: { $ref: "#/components/schemas/WebhookReceivedSuccessResponse" } } }
          },
          "400": { description: "Missing or invalid Stripe signature", ...errorResponse }
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
    "/api/v1/admin/uploads/product-image": {
      post: {
        summary: "Upload a product image to Cloudinary",
        tags: ["Admin Catalog"],
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductImageUploadRequest" }
            }
          }
        },
        responses: {
          "201": { description: "Uploaded image", content: { "application/json": { schema: { $ref: "#/components/schemas/ProductImageUploadSuccessResponse" } } } },
          "400": { description: "Invalid image upload payload", ...errorResponse },
          "401": { description: "Missing or invalid access token", ...errorResponse },
          "403": { description: "Admin role required", ...errorResponse },
          "500": { description: "Cloudinary is not configured", ...errorResponse },
          "502": { description: "Cloudinary upload failed", ...errorResponse }
        }
      }
    },
    "/api/v1/health": {
      get: {
        summary: "Check API liveness",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Health status",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthSuccessResponse" } } }
          }
        }
      }
    },
    "/api/v1/ready": {
      get: {
        summary: "Check API readiness",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Ready for traffic",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ReadinessSuccessResponse" } } }
          },
          "503": {
            description: "Not ready for traffic",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ReadinessSuccessResponse" } } }
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
                  environment: { type: "string", example: "development" },
                  timestamp: { type: "string", format: "date-time" }
                }
              }
            }
          }
        ]
      },
      ReadinessSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["ready", "not_ready"], example: "ready" },
                  database: { type: "string", enum: ["connected", "disconnected"], example: "connected" },
                  dependencies: {
                    type: "object",
                    properties: {
                      mongodb: { type: "string", enum: ["ready", "unavailable"], example: "ready" },
                      stripeConfig: { type: "string", enum: ["configured", "missing"], example: "configured" }
                    }
                  },
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
          alt: { type: "string", example: "Mechanical keyboard" },
          publicId: { type: "string", example: "ecommerce/products/mechanical-keyboard-1722440000" }
        }
      },
      ProductImageUploadRequest: {
        type: "object",
        required: ["dataUri"],
        properties: {
          dataUri: { type: "string", example: "data:image/png;base64,iVBORw0KGgo..." },
          fileName: { type: "string", example: "keyboard.png" }
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
      ShippingAddress: {
        type: "object",
        required: ["recipientName", "phone", "addressLine1", "city", "stateOrProvince", "postalCode", "countryCode"],
        properties: {
          recipientName: { type: "string", example: "Demo Customer" },
          phone: { type: "string", example: "1234567890" },
          addressLine1: { type: "string", example: "123 Test Street" },
          addressLine2: { type: "string", example: "Unit 4" },
          city: { type: "string", example: "Test City" },
          stateOrProvince: { type: "string", example: "CA" },
          postalCode: { type: "string", example: "94105" },
          countryCode: { type: "string", minLength: 2, maxLength: 2, example: "US" }
        }
      },
      CheckoutRequest: {
        type: "object",
        required: ["shippingAddress"],
        properties: {
          shippingAddress: { $ref: "#/components/schemas/ShippingAddress" }
        }
      },
      CreateCheckoutSessionRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string", example: "66a8f0d24b23d5f35a6a4444" }
        }
      },
      OrderItem: {
        type: "object",
        properties: {
          productId: { type: "string", example: "66a8f0d24b23d5f35a6a2222" },
          productName: { type: "string", example: "Mechanical Gaming Keyboard" },
          productSlug: { type: "string", example: "mechanical-gaming-keyboard" },
          productImage: { nullable: true, allOf: [{ $ref: "#/components/schemas/ProductImage" }] },
          unitPriceMinor: { type: "integer", example: 8999 },
          quantity: { type: "integer", example: 2 },
          lineTotalMinor: { type: "integer", example: 17998 }
        }
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string", example: "66a8f0d24b23d5f35a6a4444" },
          orderNumber: { type: "string", example: "ORD-20260731-123456" },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
          subtotalMinor: { type: "integer", example: 17998 },
          shippingFeeMinor: { type: "integer", example: 0 },
          totalMinor: { type: "integer", example: 17998 },
          currency: { type: "string", example: "USD" },
          orderStatus: { type: "string", enum: ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "RETURNED"] },
          paymentStatus: { type: "string", enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
          paymentMethod: { type: "string", enum: ["COD", "CARD"] },
          paidAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
          completedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      CheckoutSession: {
        type: "object",
        properties: {
          checkoutUrl: { type: "string", format: "uri", example: "https://checkout.stripe.com/c/pay/cs_test_123" },
          sessionId: { type: "string", example: "cs_test_123" }
        }
      },
      PaymentStatus: {
        type: "object",
        properties: {
          payment: {
            type: "object",
            properties: {
              orderId: { type: "string" },
              status: { type: "string", enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
              amountMinor: { type: "integer", example: 17998 },
              currency: { type: "string", example: "USD" },
              provider: { type: "string", enum: ["STRIPE", "COD"] },
              providerCheckoutSessionId: { type: "string", nullable: true, example: "cs_test_123" },
              providerPaymentId: { type: "string", nullable: true, example: "pi_test_123" },
              paidAt: { type: "string", format: "date-time", nullable: true },
              failureCode: { type: "string", nullable: true },
              failureMessage: { type: "string", nullable: true }
            }
          },
          order: {
            type: "object",
            properties: {
              id: { type: "string" },
              orderStatus: { type: "string", enum: ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "RETURNED"] },
              paymentStatus: { type: "string", enum: ["PENDING", "PAID", "FAILED", "REFUNDED"] },
              paidAt: { type: "string", format: "date-time", nullable: true }
            }
          }
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
      ProductImageUploadSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { image: { $ref: "#/components/schemas/ProductImage" } } } } }
        ]
      },
      CartSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { cart: { $ref: "#/components/schemas/Cart" } } } } }
        ]
      },
      OrderSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { order: { $ref: "#/components/schemas/Order" } } } } }
        ]
      },
      OrderListSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          {
            type: "object",
            properties: {
              data: { type: "object", properties: { orders: { type: "array", items: { $ref: "#/components/schemas/Order" } } } },
              meta: { $ref: "#/components/schemas/PaginationMeta" }
            }
          }
        ]
      },
      CheckoutSessionSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { $ref: "#/components/schemas/CheckoutSession" } } }
        ]
      },
      PaymentStatusSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { $ref: "#/components/schemas/PaymentStatus" } } }
        ]
      },
      WebhookReceivedSuccessResponse: {
        allOf: [
          { $ref: "#/components/schemas/StandardSuccessResponse" },
          { type: "object", properties: { data: { type: "object", properties: { received: { type: "boolean", example: true } } } } }
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
