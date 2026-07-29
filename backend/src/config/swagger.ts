import type { AppConfig } from "./env.js";

export const swaggerSpec = (config: AppConfig) => ({
  openapi: "3.0.0",
  info: {
    title: "MERN E-commerce API",
    description: "Foundation API for a MERN single-vendor e-commerce platform.",
    version: "0.1.0"
  },
  servers: [
    {
      url: `http://localhost:${config.port}`
    }
  ],
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Check API and database health",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Health status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthSuccessResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
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
              code: { type: "string", example: "INTERNAL_SERVER_ERROR" },
              message: { type: "string", example: "An unexpected error occurred" },
              details: { nullable: true, example: null }
            }
          },
          requestId: { type: "string", example: "generated-request-id" }
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
      }
    }
  }
});
