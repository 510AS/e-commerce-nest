import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  locale?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get locale(): string {
    return (this.request as any).locale ?? 'en';
  }

  get tenant(): string | null {
    return (this.request as any).tenant ?? null;
  }

  get authUser(): AuthUser | null {
    return (this.request as any).user ?? null;
  }

  get correlationId(): string {
    return (this.request as any).correlationId ?? 'unknown';
  }

  get isAuthenticated(): boolean {
    return !!(this.request as any).user;
  }

  hasRole(...roles: string[]): boolean {
    const user = this.authUser;
    if (!user) return false;
    return roles.includes(user.role);
  }
}
