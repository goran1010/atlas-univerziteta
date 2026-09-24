declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null | undefined;
      role: string;
      adminRequestedAt?: string | null | undefined;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

export {};
