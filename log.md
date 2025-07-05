curl 'http://localhost:3000/api/categories/tree' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'If-None-Match: W/"1b0-0DE/6ZOJOf7cnyxP3vLLx21KPEk"' \
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
        "data": [
            {
                "id": 1,
                "name": "首页",
                "slug": "home",
                "description": "首页相关内容",
                "icon": "🏠",
                "color": "#3b82f6",
                "sort": 1,
                "isActive": true,
                "blogCount": 0,
                "parentId": null,
                "children": [
                    {
                        "id": 2,
                        "name": "自述",
                        "slug": "about-me",
                        "description": "个人介绍",
                        "icon": null,
                        "color": null,
                        "sort": 1,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 1,
                        "createdAt": "2025-07-05T17:05:06.990Z",
                        "updatedAt": "2025-07-05T17:05:06.990Z"
                    },
                    {
                        "id": 3,
                        "name": "此站点",
                        "slug": "about-site",
                        "description": "站点介绍",
                        "icon": null,
                        "color": null,
                        "sort": 2,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 1,
                        "createdAt": "2025-07-05T17:05:06.999Z",
                        "updatedAt": "2025-07-05T17:05:06.999Z"
                    },
                    {
                        "id": 4,
                        "name": "留言",
                        "slug": "guestbook",
                        "description": "留言板",
                        "icon": null,
                        "color": null,
                        "sort": 3,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 1,
                        "createdAt": "2025-07-05T17:05:07.009Z",
                        "updatedAt": "2025-07-05T17:05:07.009Z"
                    },
                    {
                        "id": 5,
                        "name": "历史",
                        "slug": "history",
                        "description": "历史记录",
                        "icon": null,
                        "color": null,
                        "sort": 4,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 1,
                        "createdAt": "2025-07-05T17:05:07.018Z",
                        "updatedAt": "2025-07-05T17:05:07.018Z"
                    },
                    {
                        "id": 6,
                        "name": "迭代",
                        "slug": "changelog",
                        "description": "更新日志",
                        "icon": null,
                        "color": null,
                        "sort": 5,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 1,
                        "createdAt": "2025-07-05T17:05:07.026Z",
                        "updatedAt": "2025-07-05T17:05:07.026Z"
                    },
                    {
                        "id": 7,
                        "name": "关于友链",
                        "slug": "about-friends",
                        "description": "友情链接说明",
                        "icon": null,
                        "color": null,
                        "sort": 6,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 1,
                        "createdAt": "2025-07-05T17:05:07.035Z",
                        "updatedAt": "2025-07-05T17:05:07.035Z"
                    }
                ],
                "createdAt": "2025-07-05T17:05:06.980Z",
                "updatedAt": "2025-07-05T17:05:06.980Z"
            },
            {
                "id": 8,
                "name": "文稿",
                "slug": "posts",
                "description": "文章内容",
                "icon": "📝",
                "color": "#10b981",
                "sort": 2,
                "isActive": true,
                "blogCount": 0,
                "parentId": null,
                "children": [
                    {
                        "id": 9,
                        "name": "生活",
                        "slug": "life",
                        "description": "生活随笔",
                        "icon": null,
                        "color": null,
                        "sort": 1,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 8,
                        "createdAt": "2025-07-05T17:05:07.052Z",
                        "updatedAt": "2025-07-05T17:05:07.052Z"
                    },
                    {
                        "id": 10,
                        "name": "归档",
                        "slug": "archive",
                        "description": "文章归档",
                        "icon": null,
                        "color": null,
                        "sort": 2,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 8,
                        "createdAt": "2025-07-05T17:05:07.059Z",
                        "updatedAt": "2025-07-05T17:05:07.059Z"
                    }
                ],
                "createdAt": "2025-07-05T17:05:07.042Z",
                "updatedAt": "2025-07-05T17:05:07.042Z"
            },
            {
                "id": 11,
                "name": "手记",
                "slug": "notes",
                "description": "学习笔记",
                "icon": "📚",
                "color": "#f59e0b",
                "sort": 3,
                "isActive": true,
                "blogCount": 0,
                "parentId": null,
                "children": [],
                "createdAt": "2025-07-05T17:05:07.068Z",
                "updatedAt": "2025-07-05T17:05:07.068Z"
            },
            {
                "id": 12,
                "name": "时光",
                "slug": "timeline",
                "description": "时光记录",
                "icon": "⏰",
                "color": "#8b5cf6",
                "sort": 4,
                "isActive": true,
                "blogCount": 0,
                "parentId": null,
                "children": [
                    {
                        "id": 13,
                        "name": "手记",
                        "slug": "timeline-notes",
                        "description": "时光手记",
                        "icon": null,
                        "color": null,
                        "sort": 1,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 12,
                        "createdAt": "2025-07-05T17:05:07.082Z",
                        "updatedAt": "2025-07-05T17:05:07.082Z"
                    },
                    {
                        "id": 14,
                        "name": "文稿",
                        "slug": "timeline-posts",
                        "description": "时光文稿",
                        "icon": null,
                        "color": null,
                        "sort": 2,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 12,
                        "createdAt": "2025-07-05T17:05:07.089Z",
                        "updatedAt": "2025-07-05T17:05:07.089Z"
                    },
                    {
                        "id": 15,
                        "name": "回忆",
                        "slug": "memories",
                        "description": "回忆录",
                        "icon": null,
                        "color": null,
                        "sort": 3,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 12,
                        "createdAt": "2025-07-05T17:05:07.098Z",
                        "updatedAt": "2025-07-05T17:05:07.098Z"
                    },
                    {
                        "id": 16,
                        "name": "专栏",
                        "slug": "columns",
                        "description": "专栏文章",
                        "icon": null,
                        "color": null,
                        "sort": 4,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 12,
                        "createdAt": "2025-07-05T17:05:07.107Z",
                        "updatedAt": "2025-07-05T17:05:07.107Z"
                    }
                ],
                "createdAt": "2025-07-05T17:05:07.074Z",
                "updatedAt": "2025-07-05T17:05:07.074Z"
            },
            {
                "id": 17,
                "name": "思考",
                "slug": "thinking",
                "description": "思考感悟",
                "icon": "💭",
                "color": "#ef4444",
                "sort": 5,
                "isActive": true,
                "blogCount": 0,
                "parentId": null,
                "children": [],
                "createdAt": "2025-07-05T17:05:07.115Z",
                "updatedAt": "2025-07-05T17:05:07.115Z"
            },
            {
                "id": 18,
                "name": "更多",
                "slug": "more",
                "description": "更多内容",
                "icon": "📦",
                "color": "#6b7280",
                "sort": 6,
                "isActive": true,
                "blogCount": 0,
                "parentId": null,
                "children": [
                    {
                        "id": 19,
                        "name": "友链",
                        "slug": "friends",
                        "description": "友情链接",
                        "icon": null,
                        "color": null,
                        "sort": 1,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 18,
                        "createdAt": "2025-07-05T17:05:07.134Z",
                        "updatedAt": "2025-07-05T17:05:07.134Z"
                    },
                    {
                        "id": 20,
                        "name": "项目",
                        "slug": "projects",
                        "description": "项目展示",
                        "icon": null,
                        "color": null,
                        "sort": 2,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 18,
                        "createdAt": "2025-07-05T17:05:07.145Z",
                        "updatedAt": "2025-07-05T17:05:07.145Z"
                    },
                    {
                        "id": 21,
                        "name": "一言",
                        "slug": "hitokoto",
                        "description": "一言语录",
                        "icon": null,
                        "color": null,
                        "sort": 3,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 18,
                        "createdAt": "2025-07-05T17:05:07.151Z",
                        "updatedAt": "2025-07-05T17:05:07.151Z"
                    },
                    {
                        "id": 22,
                        "name": "跃迁",
                        "slug": "transition",
                        "description": "跃迁记录",
                        "icon": null,
                        "color": null,
                        "sort": 4,
                        "isActive": true,
                        "blogCount": 0,
                        "parentId": 18,
                        "createdAt": "2025-07-05T17:05:07.159Z",
                        "updatedAt": "2025-07-05T17:05:07.159Z"
                    }
                ],
                "createdAt": "2025-07-05T17:05:07.124Z",
                "updatedAt": "2025-07-05T17:05:07.124Z"
            }
        ],
        "message": "操作成功",
        "timestamp": "2025-07-05T17:29:32.784Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-05T17:29:32.786Z"
}
curl 'http://localhost:3000/api/categories' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'If-None-Match: W/"e8-SrrnKi58liRo9KdkYYIdHuP/1p0"' \
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
            "data": [],
            "total": 0,
            "page": 1,
            "limit": 10,
            "totalPages": 0
        },
        "message": "操作成功",
        "timestamp": "2025-07-05T17:29:42.737Z"
    },
    "message": "操作成功",
    "timestamp": "2025-07-05T17:29:42.737Z"
}