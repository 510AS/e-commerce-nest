import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from '../../auth/auth.service';
import { AuthPayload } from '../types/auth.type';
import { RegisterInput, LoginInput } from '../dto/auth.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input as any);
  }

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input as any);
  }
}
