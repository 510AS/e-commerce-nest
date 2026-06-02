declare global {
  namespace Express {
    interface Request {
      locale?: string;
      tenant?: string;
      correlationId?: string;
    }
  }
}

export {};
