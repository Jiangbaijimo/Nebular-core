curl 'http://localhost:3000/api/auth/github/callback?code=343926a6838ff72658d6&state=zaLVXj8nr4VRYG2b21nnHMn41wjzswy3' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'Accept-Language: zh-CN,zh;q=0.9' \
  -H 'Connection: keep-alive' \
  -H 'Referer: http://127.0.0.1:3001/' \
  -H 'Sec-Fetch-Dest: document' \
  -H 'Sec-Fetch-Mode: navigate' \
  -H 'Sec-Fetch-Site: cross-site' \
  -H 'Sec-Fetch-User: ?1' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"'
  {
    "success": false,
    "statusCode": 500,
    "error": "InternalOAuthError",
    "message": "Failed to obtain access token",
    "timestamp": "2025-07-06T10:31:25.564Z",
    "path": "/api/auth/github/callback?code=343926a6838ff72658d6&state=zaLVXj8nr4VRYG2b21nnHMn41wjzswy3",
    "method": "GET"
}