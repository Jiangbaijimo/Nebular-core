import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionAction, PermissionResource } from '../../modules/user/entities/permission.entity';

export interface RequiredPermission {
  action: PermissionAction;
  resource: PermissionResource;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    const hasPermission = requiredPermissions.some((permission) =>
      this.checkPermission(user, permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }

  private checkPermission(user: any, permission: RequiredPermission): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    return user.roles.some((role: any) => {
      if (!role.permissions || !Array.isArray(role.permissions)) {
        return false;
      }

      return role.permissions.some((userPermission: any) => {
        // 检查是否有管理权限（manage权限包含所有操作）
        if (
          userPermission.action === PermissionAction.MANAGE &&
          userPermission.resource === permission.resource
        ) {
          return true;
        }

        // 检查具体权限
        return (
          userPermission.action === permission.action &&
          userPermission.resource === permission.resource
        );
      });
    });
  }
}