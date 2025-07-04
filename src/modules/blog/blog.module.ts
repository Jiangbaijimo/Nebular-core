import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { Blog } from './entities/blog.entity';
import { Category } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Blog, Category]),
  ],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService, TypeOrmModule],
})
export class BlogModule {}