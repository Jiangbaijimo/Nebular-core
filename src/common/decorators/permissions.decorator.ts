import { SetMetadata } from '@nestjs/common';
import { PermissionAction, PermissionResource } from '../../modules/user/entities/permission.entity';

export interface RequiredPermission {
  action: PermissionAction;
  resource: PermissionResource;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);