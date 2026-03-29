import asyncio
import os
from aiohttp import web


async def handle_trigger(request: web.Request) -> web.Response:
    secret = os.environ.get("INGEST_WORKER_SECRET", "")
    if request.headers.get("x-ingest-secret") != secret:
        return web.Response(status=401, text="Unauthorized")

    # Import here to avoid circular imports
    from worker import run_once
    asyncio.create_task(run_once())
    return web.json_response({"ok": True})


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/trigger", handle_trigger)
    return app


async def start_server() -> None:
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.environ.get("PORT", "8080"))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    print(f"Worker HTTP server listening on port {port}")
