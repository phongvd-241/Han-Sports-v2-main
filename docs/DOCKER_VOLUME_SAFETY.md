# Han Sports v2 Docker Volume Safety Guide

This document implements DATA-03 from `docs/DATA_AND_MEDIA_IMPROVEMENT_PLAN.md`.
It explains which Docker commands are safe, which commands can delete data, and
which safeguards must exist before resetting volumes.

## Current Docker Data Volumes

Han Sports v2 uses two named Docker volumes in `docker-compose.yml`.

| Volume | Mounted in container | Contains | Data risk |
| --- | --- | --- | --- |
| `mysql-data` | `hansport-mysql:/var/lib/mysql` | MySQL database files for `hansport_v2` | Losing it deletes Docker DB data |
| `backend-upload` | `hansport-backend:/app/upload` | Uploaded product/logo/banner media files | Losing it breaks images even if DB still has filenames |

The Docker MySQL service is exposed to the host through `${MYSQL_HOST_PORT:-3307}:3306`.
The internal container port remains `3306`.

## Mental Model

| Docker object | Example | What happens when it is removed |
| --- | --- | --- |
| Image | Backend/frontend built images, `mysql:8.0` | App/container can be recreated from image or source |
| Container | `hansport-backend`, `hansport-frontend`, `hansport-mysql` | Runtime stops; named volumes can remain |
| Network | Compose default network | Recreated by Compose |
| Named volume | `mysql-data`, `backend-upload` | Persistent data is deleted if volume is removed |

The important distinction is this:

```text
Removing containers is usually recoverable.
Removing named volumes deletes persisted data.
```

## Command Safety Matrix

| Command | Safe? | Container impact | `mysql-data` impact | `backend-upload` impact | Risk level |
| --- | --- | --- | --- | --- | --- |
| `docker compose up -d` | Yes | Starts or recreates services if needed | Preserved | Preserved | Low |
| `docker compose up -d --build` | Usually yes | Rebuilds images and recreates services if needed | Preserved | Preserved | Low/Medium |
| `docker compose down` | Yes | Stops/removes Compose containers and network | Preserved | Preserved | Low |
| `docker compose down -v` | No | Stops/removes containers and network | Deleted | Deleted | Critical |
| `docker volume ls` | Yes | None | None | None | Low |
| `docker volume inspect <volume>` | Yes | None | None | None | Low |
| `docker volume rm <volume>` | No | Usually none if not attached | Deleted if selected | Deleted if selected | Critical |
| `docker system prune` | Be careful | Removes unused containers/images/networks | Usually preserved unless `--volumes` is used | Usually preserved unless `--volumes` is used | Medium |
| `docker system prune --volumes` | No | Removes unused Docker resources | May delete unused volumes | May delete unused volumes | Critical |

## When To Use Each Command

| Command | Allowed use | Backup required first? |
| --- | --- | --- |
| `docker compose up -d` | Normal start | No |
| `docker compose up -d --build` | After source or Dockerfile changes | Not required, but recommended before testing new migrations |
| `docker compose down` | Normal stop | No |
| `docker compose down -v` | Only intentional clean reset | Yes |
| `docker volume ls` | Inspect available volumes | No |
| `docker volume inspect <volume>` | Inspect volume metadata | No |
| `docker volume rm <volume>` | Only intentional deletion through reset workflow | Yes |
| `docker system prune` | Clean unused Docker resources | No, unless using `--volumes` |
| `docker system prune --volumes` | Avoid for this project unless all volumes are backed up | Yes |

## Reset Guardrails

Do not reset volumes directly during normal development. A reset workflow must
use a script in a later task and must enforce these checks:

1. A valid backup package exists under `backups/YYYY-MM-DD_HHMMSS/`.
2. The backup package contains:
   - `manifest.json`
   - `database/hansport-demo.sql`
   - `upload/product/`
   - `upload/logo/`
   - `upload/banner/`
3. The backup manifest records database and upload file counts.
4. The user types an explicit confirmation phrase:

```text
I_UNDERSTAND_THIS_WILL_DELETE_DOCKER_DATA
```

5. The reset script prints which volumes will be deleted:

```text
mysql-data
backend-upload
```

6. The script refuses to continue if the backup package is missing or incomplete.

## Safe Daily Workflow

For normal local work:

```powershell
docker compose up -d
docker compose ps
docker compose down
```

For rebuilding after code or Dockerfile changes:

```powershell
docker compose up -d --build
docker compose ps
```

These commands preserve `mysql-data` and `backend-upload`.

## Dangerous Commands

These commands can remove persistent data and should not be used casually:

```powershell
docker compose down -v
docker volume rm <volume-name>
docker system prune --volumes
```

If one of these commands is needed, create a backup package first using the
future DATA-02 backup scripts, then run integrity checks after restore.

## Recovery Expectations

| Scenario | Expected recovery path |
| --- | --- |
| Container deleted, volumes preserved | Run `docker compose up -d` |
| Image deleted, source preserved | Run `docker compose up -d --build` |
| `mysql-data` deleted | Restore database dump from backup package |
| `backend-upload` deleted | Restore upload folders from backup package |
| Both volumes deleted | Restore full backup package and run integrity checks |
| Backup missing | Data may not be recoverable from Docker |

## Verification Commands

Read-only checks:

```powershell
docker compose ps
docker volume ls
docker volume inspect han-sports-v2-main_mysql-data
docker volume inspect han-sports-v2-main_backend-upload
git check-ignore backups/
```

Do not run `docker compose down -v` as a verification command.

