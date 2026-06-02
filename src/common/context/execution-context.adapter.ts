import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface ContextualRequest {
  locale?: string;
  user?: any;
  tenant?: string;
  correlationId?: string;
}

export class ExecutionContextAdapter {
  constructor(public readonly req: ContextualRequest) {}

  static fromContext(context: ExecutionContext): ExecutionContextAdapter {
    const contextType = context.getType<'http' | 'graphql'>();
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      return new ExecutionContextAdapter(gqlCtx.getContext().req);
    }
    return new ExecutionContextAdapter(context.switchToHttp().getRequest());
  }

  get locale(): string {
    return this.req.locale ?? 'en';
  }

  get authUser(): any {
    return this.req.user ?? null;
  }

  get correlationId(): string {
    return this.req.correlationId ?? 'unknown';
  }

  get tenant(): string | null {
    return this.req.tenant ?? null;
  }
}
