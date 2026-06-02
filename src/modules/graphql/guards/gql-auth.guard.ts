import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContextAdapter } from '../../../common/context/execution-context.adapter';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const adapter = ExecutionContextAdapter.fromContext(context);
    return adapter.req;
  }
}
