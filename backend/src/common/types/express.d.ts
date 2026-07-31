declare global {
  namespace Express {
    interface Request {
      requestId: string;
      currentUser?: {
        userId: string;
        role: "CUSTOMER" | "ADMIN";
      };
    }
  }
}

export {};
