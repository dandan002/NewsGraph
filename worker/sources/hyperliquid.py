import httpx

HYPERLIQUID_URL = "https://api.hyperliquid.xyz/info"
ASSETS_OF_INTEREST = {"BTC", "ETH", "SOL"}


async def fetch_hyperliquid() -> list[dict]:
    """Fetch perp market data from Hyperliquid for BTC, ETH, SOL."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            HYPERLIQUID_URL,
            json={"type": "metaAndAssetCtxs"},
        )
        res.raise_for_status()

    data = res.json()
    if not isinstance(data, list) or len(data) < 2:
        return []

    # data is [meta, asset_ctxs]
    # meta["universe"] is list of {name, szDecimals, ...}
    # asset_ctxs is list of {markPx, openInterest, funding, ...} in same order
    meta, asset_ctxs = data[0], data[1]
    universe = meta.get("universe", [])

    snapshots = []
    for i, asset_meta in enumerate(universe):
        name = asset_meta.get("name", "")
        if name not in ASSETS_OF_INTEREST:
            continue
        if i >= len(asset_ctxs):
            continue

        ctx = asset_ctxs[i]
        try:
            mark_price = float(ctx.get("markPx", 0))
            open_interest = float(ctx.get("openInterest", 0))
            funding_rate = float(ctx.get("funding", 0))
        except (TypeError, ValueError):
            continue

        snapshots.append({
            "asset": name,
            "market_type": "perp",
            "mark_price": mark_price,
            "open_interest": open_interest,
            "funding_rate": funding_rate,
        })

    return snapshots
