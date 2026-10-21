# Checklist Tool

发布检查清单工具：维护 Checklist 池（含多段变更代码/配置），按发布单逐项勾选、填写执行备注并跟踪发布进度。

- 前端/后端：Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS 4
- 数据库：MySQL（`mysql2`），数据全部存库，应用容器无状态
- 部署：Docker（多阶段构建），生产端口 `4399`

## 快速开始（本地 Docker，含 MySQL）

需要本机装好 Docker（当前用户不在 `docker` 组时，脚本会自动用 `sudo docker`）。

```bash
./scripts/local-docker.sh up
```

首次启动会自动完成：建库 → 执行 `sql/schema.sql` 建表 → 写入 `sql/seed.sql` 示例数据 → 构建并启动应用。

| 地址 | 说明 |
|---|---|
| http://localhost:4399 | 应用 |
| 127.0.0.1:3307 | MySQL（root / 123456，库 `checklist`） |

常用命令：

```bash
./scripts/local-docker.sh up        # 构建并启动（默认）
./scripts/local-docker.sh dev       # 只启动 MySQL，供本机 pnpm dev 使用
./scripts/local-docker.sh logs      # 跟踪应用日志（logs mysql 看数据库日志）
./scripts/local-docker.sh mysql     # 进入 MySQL 命令行
./scripts/local-docker.sh down      # 停止容器，保留数据卷
./scripts/local-docker.sh reset     # 停止并删除数据卷（数据会丢）
```

数据卷名为 `checklist-tool-next_mysql-data`，`down` 不会丢数据，`reset` 才会。

## 本地开发（热更新）

```bash
pnpm install
./scripts/local-docker.sh dev      # 起 MySQL 并等它就绪
cp .env.example .env.local         # 数据库指向本地 127.0.0.1:3307

pnpm dev                           # http://localhost:3000
```

`.env.local` 会被 Next.js 自动加载；不创建它时 `src/lib/db.ts` 会回退到内置默认库（线上 `192.168.1.61`）。

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DB_HOST` | `192.168.1.61` | MySQL 地址 |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_USER` | `root` | 用户名 |
| `DB_PASSWORD` | `123456` | 密码 |
| `DB_NAME` | `checklist` | 库名 |
| `DB_CONNECTION_LIMIT` | `10` | 连接池大小 |
| `APP_PORT` | `4399` | 仅 compose：宿主机应用端口 |
| `MYSQL_HOST_PORT` | `3307` | 仅 compose：宿主机 MySQL 端口 |

## 数据库

- 结构定义以 `sql/schema.sql` 为准（含 `is_deleted` 软删除、`highlights` 高亮字段）
- 示例数据：`sql/seed.sql`（仅首次初始化数据卷时执行；不需要可删掉 `docker-compose.yml` 里的对应挂载）
- `sql/migration_v2.sql`、`scripts/migrate.mjs` 是历史增量脚本，新库直接用 `schema.sql` 即可

手动初始化已有 MySQL：

```bash
mysql -h 127.0.0.1 -P 3307 -u root -p -e "CREATE DATABASE IF NOT EXISTS checklist DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -h 127.0.0.1 -P 3307 -u root -p checklist < sql/schema.sql
```

备份：

```bash
mysqldump -h 127.0.0.1 -P 3307 -u root -p --single-transaction checklist > checklist-$(date +%F).sql
```

## 生产发布

```bash
sudo ./build.sh     # 构建镜像并导出 checklist-tool.tar.gz
./deploy.sh         # scp 到 docoi@192.168.1.61，docker load 并重启容器（端口 4399）
```

`deploy.sh` 只上传现成的 tar 包、**不会重新构建**，所以改了代码必须重新 `build.sh`。生产数据库通过容器环境变量 `DB_*` 指定（不传则用内置默认值）。

## 目录

```
src/app            页面与 API 路由（/api/checklist、/api/releases）
src/components     UI 组件
src/lib/db.ts      MySQL 连接池（读 DB_* 环境变量）
sql/schema.sql     表结构
sql/seed.sql       示例数据
scripts/           local-docker.sh（本地一键运行）、migrate.mjs（历史迁移）
build.sh           构建镜像
deploy.sh          部署到服务器
```
