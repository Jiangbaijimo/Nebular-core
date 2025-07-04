curl 'http://localhost:3000/api/cloud-functions' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc1MTY1NTQyNCwiZXhwIjoxNzUyMjYwMjI0fQ.YLg6Rn3IzerJkB1LjxyQjsgbaFr808OpvhHlZ0dA61c' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -H 'Referer: http://localhost:3000/api/docs' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'accept: */*' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  --data-raw $'{\n  "name": "theme-config",\n  "reference": "shiro",\n  "description": "string",\n  "type": "json",\n  "method": "GET",\n  "content": "{}",\n  "config": {},\n  "isPublic": false,\n  "timeout": 5000,\n  "headers": {}\n}'
  {
    "success": true,
    "data": {
        "success": true,
        "data": {
            "id": 1,
            "name": "theme-config",
            "reference": "shiro",
            "description": "string",
            "type": "json",
            "method": "GET",
            "status": "active",
            "content": "{}",
            "config": {},
            "callCount": 0,
            "lastCalledAt": null,
            "lastError": null,
            "isPublic": false,
            "timeout": 5000,
            "headers": {},
            "author": {
                "id": 1,
                "email": "user@example.com",
                "username": "username",
                "password": "$2a$12$QFYynj1vMIOQUEnERQjYgOByVSZEG.2YSRAQp36CHjqSXj8zWAzIK",
                "avatar": null,
                "nickname": "昵称",
                "bio": null,
                "status": "active",
                "provider": "local",
                "providerId": null,
                "emailVerified": false,
                "emailVerificationToken": null,
                "passwordResetToken": null,
                "passwordResetExpires": null,
                "lastLoginAt": "2025-07-04T18:57:04.000Z",
                "lastLoginIp": null,
                "roles": [
                    {
                        "id": 1,
                        "name": "超级管理员",
                        "code": "admin",
                        "description": "系统超级管理员，拥有所有权限",
                        "isActive": true,
                        "isSystem": true,
                        "permissions": [
                            {
                                "id": 1,
                                "name": "创建用户",
                                "code": "CREATE_USER",
                                "action": "create",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.708Z",
                                "updatedAt": "2025-07-04T18:55:57.708Z"
                            },
                            {
                                "id": 2,
                                "name": "查看用户",
                                "code": "READ_USER",
                                "action": "read",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.725Z",
                                "updatedAt": "2025-07-04T18:55:57.725Z"
                            },
                            {
                                "id": 3,
                                "name": "更新用户",
                                "code": "UPDATE_USER",
                                "action": "update",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.736Z",
                                "updatedAt": "2025-07-04T18:55:57.736Z"
                            },
                            {
                                "id": 4,
                                "name": "删除用户",
                                "code": "DELETE_USER",
                                "action": "delete",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.746Z",
                                "updatedAt": "2025-07-04T18:55:57.746Z"
                            },
                            {
                                "id": 5,
                                "name": "管理用户",
                                "code": "MANAGE_USER",
                                "action": "manage",
                                "resource": "user",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.756Z",
                                "updatedAt": "2025-07-04T18:55:57.756Z"
                            },
                            {
                                "id": 6,
                                "name": "创建博客",
                                "code": "CREATE_BLOG",
                                "action": "create",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.767Z",
                                "updatedAt": "2025-07-04T18:55:57.767Z"
                            },
                            {
                                "id": 7,
                                "name": "查看博客",
                                "code": "READ_BLOG",
                                "action": "read",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.776Z",
                                "updatedAt": "2025-07-04T18:55:57.776Z"
                            },
                            {
                                "id": 8,
                                "name": "更新博客",
                                "code": "UPDATE_BLOG",
                                "action": "update",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.785Z",
                                "updatedAt": "2025-07-04T18:55:57.785Z"
                            },
                            {
                                "id": 9,
                                "name": "删除博客",
                                "code": "DELETE_BLOG",
                                "action": "delete",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.795Z",
                                "updatedAt": "2025-07-04T18:55:57.795Z"
                            },
                            {
                                "id": 10,
                                "name": "管理博客",
                                "code": "MANAGE_BLOG",
                                "action": "manage",
                                "resource": "blog",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.804Z",
                                "updatedAt": "2025-07-04T18:55:57.804Z"
                            },
                            {
                                "id": 11,
                                "name": "创建分类",
                                "code": "CREATE_CATEGORY",
                                "action": "create",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.815Z",
                                "updatedAt": "2025-07-04T18:55:57.815Z"
                            },
                            {
                                "id": 12,
                                "name": "查看分类",
                                "code": "READ_CATEGORY",
                                "action": "read",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.827Z",
                                "updatedAt": "2025-07-04T18:55:57.827Z"
                            },
                            {
                                "id": 13,
                                "name": "更新分类",
                                "code": "UPDATE_CATEGORY",
                                "action": "update",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.840Z",
                                "updatedAt": "2025-07-04T18:55:57.840Z"
                            },
                            {
                                "id": 14,
                                "name": "删除分类",
                                "code": "DELETE_CATEGORY",
                                "action": "delete",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.850Z",
                                "updatedAt": "2025-07-04T18:55:57.850Z"
                            },
                            {
                                "id": 15,
                                "name": "管理分类",
                                "code": "MANAGE_CATEGORY",
                                "action": "manage",
                                "resource": "category",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.861Z",
                                "updatedAt": "2025-07-04T18:55:57.861Z"
                            },
                            {
                                "id": 16,
                                "name": "创建评论",
                                "code": "CREATE_COMMENT",
                                "action": "create",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.872Z",
                                "updatedAt": "2025-07-04T18:55:57.872Z"
                            },
                            {
                                "id": 17,
                                "name": "查看评论",
                                "code": "READ_COMMENT",
                                "action": "read",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.884Z",
                                "updatedAt": "2025-07-04T18:55:57.884Z"
                            },
                            {
                                "id": 18,
                                "name": "更新评论",
                                "code": "UPDATE_COMMENT",
                                "action": "update",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.895Z",
                                "updatedAt": "2025-07-04T18:55:57.895Z"
                            },
                            {
                                "id": 19,
                                "name": "删除评论",
                                "code": "DELETE_COMMENT",
                                "action": "delete",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.905Z",
                                "updatedAt": "2025-07-04T18:55:57.905Z"
                            },
                            {
                                "id": 20,
                                "name": "管理评论",
                                "code": "MANAGE_COMMENT",
                                "action": "manage",
                                "resource": "comment",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.915Z",
                                "updatedAt": "2025-07-04T18:55:57.915Z"
                            },
                            {
                                "id": 21,
                                "name": "创建角色",
                                "code": "CREATE_ROLE",
                                "action": "create",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.924Z",
                                "updatedAt": "2025-07-04T18:55:57.924Z"
                            },
                            {
                                "id": 22,
                                "name": "查看角色",
                                "code": "READ_ROLE",
                                "action": "read",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.935Z",
                                "updatedAt": "2025-07-04T18:55:57.935Z"
                            },
                            {
                                "id": 23,
                                "name": "更新角色",
                                "code": "UPDATE_ROLE",
                                "action": "update",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.944Z",
                                "updatedAt": "2025-07-04T18:55:57.944Z"
                            },
                            {
                                "id": 24,
                                "name": "删除角色",
                                "code": "DELETE_ROLE",
                                "action": "delete",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.954Z",
                                "updatedAt": "2025-07-04T18:55:57.954Z"
                            },
                            {
                                "id": 25,
                                "name": "管理角色",
                                "code": "MANAGE_ROLE",
                                "action": "manage",
                                "resource": "role",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.963Z",
                                "updatedAt": "2025-07-04T18:55:57.963Z"
                            },
                            {
                                "id": 26,
                                "name": "创建权限",
                                "code": "CREATE_PERMISSION",
                                "action": "create",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.972Z",
                                "updatedAt": "2025-07-04T18:55:57.972Z"
                            },
                            {
                                "id": 27,
                                "name": "查看权限",
                                "code": "READ_PERMISSION",
                                "action": "read",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.980Z",
                                "updatedAt": "2025-07-04T18:55:57.980Z"
                            },
                            {
                                "id": 28,
                                "name": "更新权限",
                                "code": "UPDATE_PERMISSION",
                                "action": "update",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.988Z",
                                "updatedAt": "2025-07-04T18:55:57.988Z"
                            },
                            {
                                "id": 29,
                                "name": "删除权限",
                                "code": "DELETE_PERMISSION",
                                "action": "delete",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:57.998Z",
                                "updatedAt": "2025-07-04T18:55:57.998Z"
                            },
                            {
                                "id": 30,
                                "name": "管理权限",
                                "code": "MANAGE_PERMISSION",
                                "action": "manage",
                                "resource": "permission",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:58.006Z",
                                "updatedAt": "2025-07-04T18:55:58.006Z"
                            },
                            {
                                "id": 31,
                                "name": "系统管理",
                                "code": "MANAGE_SYSTEM",
                                "action": "manage",
                                "resource": "system",
                                "description": null,
                                "isActive": true,
                                "isSystem": false,
                                "createdAt": "2025-07-04T18:55:58.015Z",
                                "updatedAt": "2025-07-04T18:55:58.015Z"
                            }
                        ],
                        "createdAt": "2025-07-04T18:55:58.035Z",
                        "updatedAt": "2025-07-04T18:55:58.035Z"
                    }
                ],
                "createdAt": "2025-07-04T18:56:33.653Z",
                "updatedAt": "2025-07-04T18:57:04.000Z"
            },
            "authorId": 1,
            "createdAt": "2025-07-04T20:10:50.381Z",
            "updatedAt": "2025-07-04T20:10:50.381Z"
        },
        "message": "操作成功",
        "timestamp": "2025-07-04T20:10:50.397Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-04T20:10:50.397Z"
}
curl 'http://localhost:3000/api/cloud-functions/1' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc1MTY1NTQyNCwiZXhwIjoxNzUyMjYwMjI0fQ.YLg6Rn3IzerJkB1LjxyQjsgbaFr808OpvhHlZ0dA61c' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://localhost:3000/api/docs' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'accept: */*' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'
  {
    "success": true,
    "data": {
        "success": true,
        "data": {
            "id": 1,
            "name": "theme-config",
            "reference": "shiro",
            "description": "string",
            "type": "json",
            "method": "GET",
            "status": "active",
            "content": "{}",
            "config": {},
            "callCount": 0,
            "lastCalledAt": null,
            "lastError": null,
            "isPublic": false,
            "timeout": 5000,
            "headers": {},
            "author": {
                "id": 1,
                "email": "user@example.com",
                "username": "username",
                "password": "$2a$12$QFYynj1vMIOQUEnERQjYgOByVSZEG.2YSRAQp36CHjqSXj8zWAzIK",
                "avatar": null,
                "nickname": "昵称",
                "bio": null,
                "status": "active",
                "provider": "local",
                "providerId": null,
                "emailVerified": false,
                "emailVerificationToken": null,
                "passwordResetToken": null,
                "passwordResetExpires": null,
                "lastLoginAt": "2025-07-04T18:57:04.000Z",
                "lastLoginIp": null,
                "createdAt": "2025-07-04T18:56:33.653Z",
                "updatedAt": "2025-07-04T18:57:04.000Z"
            },
            "authorId": 1,
            "secrets": [],
            "createdAt": "2025-07-04T20:10:50.381Z",
            "updatedAt": "2025-07-04T20:10:50.381Z"
        },
        "message": "操作成功",
        "timestamp": "2025-07-04T20:14:12.854Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-04T20:14:12.854Z"
}