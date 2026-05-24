import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/catalog/categories/categories.module';

@Module({
  imports: [AppConfigModule, CommonModule, PrismaModule, UsersModule, AuthModule, CategoriesModule],
})
export class AppModule {}