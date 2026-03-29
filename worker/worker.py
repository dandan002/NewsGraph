import asyncio
import os
from dotenv import load_dotenv

load_dotenv()


async def run_once() -> None:
    """Run one ingest cycle across news sources. Used by /trigger webhook."""
    print("Running manual ingest cycle...")
    from sources.nhk import fetch_nhk
    from sources.gdelt import fetch_gdelt
    from sources.edinet import fetch_edinet
    from sources.newsapi import fetch_newsapi
    from pipeline.summarize import summarize_article
    from pipeline.embed import embed_text
    from pipeline.store import upsert_article

    sources = [fetch_nhk, fetch_gdelt, fetch_newsapi, fetch_edinet]

    for fetch_fn in sources:
        try:
            articles = await fetch_fn()
            print(f"{fetch_fn.__name__}: {len(articles)} articles")
            for article in articles:
                try:
                    summary = await summarize_article(article["raw_text"])
                    embedding = await embed_text(summary)
                    await upsert_article({**article, "summary_en": summary, "embedding": embedding})
                except Exception as e:
                    print(f"Pipeline error for {article.get('url', '?')}: {e}")
        except Exception as e:
            print(f"{fetch_fn.__name__} fetch error: {e}")


async def run_market_loop() -> None:
    """Fetch Hyperliquid data every 30 seconds."""
    from sources.hyperliquid import fetch_hyperliquid
    from pipeline.store import upsert_snapshot

    while True:
        try:
            snapshots = await fetch_hyperliquid()
            for snap in snapshots:
                await upsert_snapshot(snap)
        except Exception as e:
            print(f"Market fetch error: {e}")
        await asyncio.sleep(30)


async def run_news_loop() -> None:
    """Run news sources (NHK, GDELT, NewsAPI) every 30 minutes."""
    from sources.nhk import fetch_nhk
    from sources.gdelt import fetch_gdelt
    from sources.newsapi import fetch_newsapi
    from pipeline.summarize import summarize_article
    from pipeline.embed import embed_text
    from pipeline.store import upsert_article

    news_sources = [fetch_nhk, fetch_gdelt, fetch_newsapi]
    while True:
        for fetch_fn in news_sources:
            try:
                articles = await fetch_fn()
                for article in articles:
                    try:
                        summary = await summarize_article(article["raw_text"])
                        embedding = await embed_text(summary)
                        await upsert_article({**article, "summary_en": summary, "embedding": embedding})
                    except Exception as e:
                        print(f"Pipeline error for {article.get('url', '?')}: {e}")
            except Exception as e:
                print(f"{fetch_fn.__name__} fetch error: {e}")
        await asyncio.sleep(30 * 60)


async def run_edinet_loop() -> None:
    """Run EDINET filings ingest every 60 minutes."""
    from sources.edinet import fetch_edinet
    from pipeline.summarize import summarize_article
    from pipeline.embed import embed_text
    from pipeline.store import upsert_article

    while True:
        try:
            articles = await fetch_edinet()
            for article in articles:
                try:
                    summary = await summarize_article(article["raw_text"])
                    embedding = await embed_text(summary)
                    await upsert_article({**article, "summary_en": summary, "embedding": embedding})
                except Exception as e:
                    print(f"EDINET pipeline error for {article.get('url', '?')}: {e}")
        except Exception as e:
            print(f"EDINET fetch error: {e}")
        await asyncio.sleep(60 * 60)


async def main() -> None:
    from server import start_server
    await start_server()
    await asyncio.gather(
        run_news_loop(),
        run_edinet_loop(),
        run_market_loop(),
    )


if __name__ == "__main__":
    asyncio.run(main())
