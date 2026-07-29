export interface SuccessResponse<TData> {
  success: true;
  data: TData;
  meta: unknown;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
    stack?: string;
  };
  requestId: string;
}

export const successResponse = <TData>(data: TData, meta: unknown = null): SuccessResponse<TData> => ({
  success: true,
  data,
  meta
});
