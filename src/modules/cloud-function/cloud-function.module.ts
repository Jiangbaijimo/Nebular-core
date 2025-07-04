import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudFunction } from './entities/cloud-function.entity';
import { CloudFunctionSecret } from './entities/cloud-function-secret.entity';
import { CloudFunctionLog } from './entities/cloud-function-log.entity';
import { CloudFunctionController, CloudFunctionExecuteController } from './cloud-function.controller';
import { CloudFunctionService } from './cloud-function.service';
import { CloudFunctionInitService } from './cloud-function-init.service';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CloudFunction,
      CloudFunctionSecret,
      CloudFunctionLog,
      User,
    ]),
  ],
  controllers: [CloudFunctionController, CloudFunctionExecuteController],
  providers: [CloudFunctionService, CloudFunctionInitService],
  exports: [CloudFunctionService, CloudFunctionInitService],
})
export class CloudFunctionModule {}