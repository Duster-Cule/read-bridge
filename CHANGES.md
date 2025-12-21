# 修改的内容

**请注意，所有的更改都在 dusterdev 分支而不是 main 分支上，如果你要部署或克隆，一定要记得切换分支。main分支仍然保留原项目的所有代码。**

## 存储方案变更
原项目将所有设置都保存在浏览器本地，在此项目中除 API Key 等涉及隐私的变量将会保存在服务器端而非客户端中（比如设置中的条目）。

## 鉴权
服务器可以鉴权，只让有权限的人访问网页。使用以下脚本可以生成密钥。

*如果没有配置公钥那么将允许所有人访问。*

使用方法:

  1. 生成密钥对 (将公钥直接写入服务端，打印出私钥内容):
```bash 
  python3 scripts/auth_keys.py generate --label "admin"
```

  2. 将私钥保存为文件:
```bash
  python3 scripts/auth_keys.py generate --label "admin" --out-private .data/admin.private.pem
```

  3. 列出现有公钥:
```bash
  python3 scripts/auth_keys.py list
```

  4. 显示公钥内容:
```bash
  python3 scripts/auth_keys.py show <key_id>
```

  5. 撤销公钥:
```bash
  python3 scripts/auth_keys.py revoke <key_id>
```

## 可能存在的问题
由于鉴权只是负责进入权限，并没有添加账户，所以有权限的人进入后除 API Key 等信息外共用同一套设置和权限，也就是说，所有人都可以更改其中的内容，并且更改会同步到所有人的网页中。

# 鸣谢
此修改由 [Github Copilot](https://github.com/features/copilot) 与 [Codex](https://openai.com/codex/) 共同完成。