import { access, readdir, readFile, rename, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { basename, join, resolve } from "node:path";
import type { Plugin } from "vite";

const API_ROOT = "/__zjd-data";

function respondJson(
  response: ServerResponse,
  status: number,
  body: unknown,
) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 5_000_000) throw new Error("Request body is too large");
    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function writeJson(path: string, value: unknown) {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

function safeMapId(rawId: string): string | null {
  const id = basename(rawId, ".json")
    .trim()
    .toLowerCase()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return id || null;
}

export function mapData(): Plugin {
  let dataDirectory = "";

  return {
    name: "zjd-map-data",
    apply: "serve",
    configResolved(config) {
      dataDirectory = resolve(config.root, "app/maps/data");
    },
    handleHotUpdate(context) {
      const changedFile = resolve(context.file);
      const dataRoot = `${dataDirectory}\\`;

      if (
        changedFile.startsWith(dataRoot) &&
        changedFile.toLowerCase().endsWith(".json")
      ) {
        // These files are edited by the in-browser map editor. Reloading its
        // imported JSON modules would remount the editor and discard the
        // current, not-yet-saved map state (including a newly placed event).
        return [];
      }
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith(API_ROOT)) {
          next();
          return;
        }

        try {
          if (request.method === "GET" && url.pathname === `${API_ROOT}/project`) {
            const filenames = (await readdir(dataDirectory))
              .filter(
                (filename) =>
                  filename.endsWith(".json") && filename !== "events.json",
              )
              .sort();
            const maps = await Promise.all(
              filenames.map(async (filename) => ({
                id: basename(filename, ".json"),
                map: JSON.parse(
                  await readFile(join(dataDirectory, filename), "utf8"),
                ),
                name: basename(filename, ".json"),
              })),
            );
            const eventDatabase = JSON.parse(
              await readFile(join(dataDirectory, "events.json"), "utf8"),
            );
            respondJson(response, 200, { eventDatabase, maps });
            return;
          }

          if (request.method === "PUT" && url.pathname === `${API_ROOT}/events`) {
            await writeJson(
              join(dataDirectory, "events.json"),
              await readJsonBody(request),
            );
            respondJson(response, 200, { ok: true });
            return;
          }

          const mapMatch = url.pathname.match(/^\/__zjd-data\/maps\/([^/]+)$/);
          if (["POST", "PUT"].includes(request.method ?? "") && mapMatch) {
            const id = safeMapId(decodeURIComponent(mapMatch[1]!));
            if (!id) {
              respondJson(response, 400, { error: "Invalid map name" });
              return;
            }

            const mapPath = join(dataDirectory, `${id}.json`);
            if (request.method === "POST") {
              try {
                await access(mapPath);
                respondJson(response, 409, { error: "Map already exists" });
                return;
              } catch {
                // A missing file is expected when creating a map.
              }
            }

            await writeJson(mapPath, await readJsonBody(request));
            respondJson(response, 200, { id, name: id });
            return;
          }

          respondJson(response, 404, { error: "Unknown data endpoint" });
        } catch (error) {
          server.config.logger.error(
            error instanceof Error ? error.stack ?? error.message : String(error),
          );
          respondJson(response, 500, { error: "Failed to update JSON data" });
        }
      });
    },
  };
}
