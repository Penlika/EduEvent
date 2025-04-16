from fastapi import FastAPI
from scraper import TDMUNewsScraper

app = FastAPI()

@app.get("/scrape")
async def scrape():
    scraper = TDMUNewsScraper()
    try:
        await scraper.initialize()
        await scraper.get_all_article_links()
        data = await scraper.scrape_all_articles()
        return {"status": "success", "article_count": len(data), "articles": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        await scraper.close()
