import argparse
import json
import time
from bs4 import BeautifulSoup
import pandas as pd
import asyncio
import pyppeteer

class TDMUNewsScraper:
    def __init__(self):
        self.base_url = "https://tdmu.edu.vn/tin-tuc"
        self.article_links = []
        self.articles_data = []
        self.browser = None
        self.page = None
        
    async def initialize(self):
        """Initialize Puppeteer browser"""
        self.browser = await pyppeteer.launch({
            'headless': True,
            'args': [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
            ]
        })
        self.page = await self.browser.newPage()
        await self.page.setViewport({'width': 1920, 'height': 1080})
        
    async def get_all_article_links(self):
        """Scrape all article links from the news page including pagination"""
        await self.page.goto(self.base_url, {'waitUntil': 'networkidle0'})
        print("Accessing TDMU News page...")
        
        # Get the initial links
        await self._extract_links_from_current_page()
        
        # Debug info
        page_num = 1
        print(f"Page {page_num}: Found {len(self.article_links)} articles so far")
        
        # Check if there are more pages and navigate through them
        while True:
            try:
                # Find the next page button - try different selectors
                next_button = None
                for selector in ["li.pager-next a", ".pager-next a", "a:contains('Next')", "a:contains('next')", "a:contains('Tiếp')"]:
                    try:
                        next_button = await self.page.querySelector(selector)
                        if next_button:
                            break
                    except Exception:
                        continue
                
                if next_button:
                    await next_button.click()
                    page_num += 1
                    print(f"Moving to page {page_num}...")
                    
                    # Wait for the page to load
                    await self.page.waitForNavigation({'waitUntil': 'networkidle0'})
                    
                    # Extract links from this page
                    await self._extract_links_from_current_page()
                    print(f"Page {page_num}: Found {len(self.article_links)} articles so far")
                else:
                    print("No next page button found. Finishing pagination.")
                    break
                    
            except Exception as e:
                print(f"Pagination ended or error occurred: {str(e)}")
                break
                
        print(f"Total articles found: {len(self.article_links)}")
        return self.article_links
    
    async def _extract_links_from_current_page(self):
        """Extract article links from the current page"""
        # Save the page source for debugging if needed
        content = await self.page.content()
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Try different selectors to find article links
        article_elements = []
        
        # Try method 1: direct article containers
        article_elements = soup.select('.view-content .views-row')
        
        # If no elements found, try other common selectors
        if not article_elements:
            article_elements = soup.select('article')
        
        if not article_elements:
            article_elements = soup.select('.news-item')
            
        if not article_elements:
            article_elements = soup.select('.article-item')
            
        if not article_elements:
            # Just try to get all links from the main content area
            article_elements = soup.select('main a, .main-content a, .content-area a, .region-content a')
            
            # Process these differently since they are direct links
            for link in article_elements:
                if link.has_attr('href'):
                    url = link['href']
                    # Filter links that look like news articles
                    if '/tin-tuc/' in url or '/news/' in url or '/thong-bao/' in url:
                        if not url.startswith('http'):
                            url = f"https://tdmu.edu.vn{url}"
                        if url not in self.article_links:
                            self.article_links.append(url)
                            print(f"Found article: {url}")
            return
        
        # Process regular article elements
        for article in article_elements:
            link_element = article.select_one('a')
            if link_element and link_element.has_attr('href'):
                url = link_element['href']
                if not url.startswith('http'):
                    url = f"https://tdmu.edu.vn{url}"
                if url not in self.article_links:
                    self.article_links.append(url)
                    print(f"Found article: {url}")
    
    async def scrape_article_content(self, url):
        """Scrape the full content of an article"""
        try:
            await self.page.goto(url, {'waitUntil': 'networkidle0'})
            print(f"Accessing article: {url}")
            
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract title - try different selectors
            title = "No title found"
            for selector in ['.page-header', 'h1', '.article-title', '.node-title']:
                title_element = soup.select_one(selector)
                if title_element:
                    title = title_element.text.strip()
                    break
            
            # Extract date (if available) - try different selectors
            date = "No date found"
            for selector in ['.field-name-post-date .field-item', '.date', '.submitted', '.post-date', 'time']:
                date_element = soup.select_one(selector)
                if date_element:
                    date = date_element.text.strip()
                    break
            
            # Extract author (if available) - try different selectors
            author = "No author found"
            for selector in ['.field-name-field-author .field-item', '.author', '.byline']:
                author_element = soup.select_one(selector)
                if author_element:
                    author = author_element.text.strip()
                    break
            
            # Extract article content - try different selectors
            content = "No content found"
            for selector in ['.node-content', '.content', 'article', '.article-content', '.field-name-body']:
                content_element = soup.select_one(selector)
                if content_element:
                    paragraphs = []
                    for para in content_element.find_all(['p', 'div', 'span']):
                        if para.text.strip():
                            paragraphs.append(para.text.strip())
                    content = "\n\n".join(paragraphs)
                    break
            
            # Extract images (if available)
            image_urls = []
            for selector in ['.field-name-field-image img', 'article img', '.content img']:
                image_elements = soup.select(selector)
                for img in image_elements:
                    if img.has_attr('src'):
                        image_url = img['src']
                        if not image_url.startswith('http'):
                            if image_url.startswith('/'):
                                image_url = f"https://tdmu.edu.vn{image_url}"
                            else:
                                image_url = f"https://tdmu.edu.vn/{image_url}"
                        image_urls.append(image_url)
                if image_urls:
                    break
            
            article_data = {
                'url': url,
                'title': title,
                'date': date,
                'author': author,
                'content': content,
                'image_urls': image_urls
            }
            
            return article_data
            
        except Exception as e:
            print(f"Error scraping article {url}: {str(e)}")
            return {
                'url': url,
                'title': "Error",
                'date': "Error",
                'author': "Error",
                'content': f"Error scraping: {str(e)}",
                'image_urls': []
            }
    
    async def scrape_all_articles(self):
        """Scrape all articles found on the website"""
        if not self.article_links:
            await self.get_all_article_links()
        
        # If we still don't have any links, try a direct approach
        if not self.article_links:
            print("No articles found through pagination. Trying direct approach...")
            await self._scrape_homepage_for_links()
            
        if not self.article_links:
            print("Could not find any article links. Please check the website structure.")
            return []
        
        total = len(self.article_links)
        for i, link in enumerate(self.article_links):
            print(f"Scraping article {i+1}/{total}: {link}")
            article_data = await self.scrape_article_content(link)
            self.articles_data.append(article_data)
            
            # Short pause to prevent overloading the server
            await asyncio.sleep(1)
        
        return self.articles_data
    
    async def _scrape_homepage_for_links(self):
        """Alternative method to get article links directly from the homepage"""
        try:
            await self.page.goto("https://tdmu.edu.vn", {'waitUntil': 'networkidle0'})
            
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            all_links = soup.find_all('a')
            
            for link in all_links:
                if link.has_attr('href'):
                    url = link['href']
                    # Filter links that look like news articles
                    if '/tin-tuc/' in url or '/news/' in url or '/thong-bao/' in url:
                        if not url.startswith('http'):
                            url = f"https://tdmu.edu.vn{url}"
                        if url not in self.article_links:
                            self.article_links.append(url)
                            print(f"Found article from homepage: {url}")
        except Exception as e:
            print(f"Error scraping homepage: {str(e)}")
    
    def save_to_csv(self, filename='tdmu_articles.csv'):
        """Save the scraped data to a CSV file"""
        if not self.articles_data:
            print("No data to save")
            return
        
        df = pd.DataFrame(self.articles_data)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"Data saved to {filename}")
    
    def save_to_json(self, filename='tdmu_articles.json'):
        """Save the scraped data to a JSON file"""
        if not self.articles_data:
            print("No data to save")
            return
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.articles_data, f, ensure_ascii=False, indent=4)
        print(f"Data saved to {filename}")
    
    async def close(self):
        """Close the browser"""
        if self.browser:
            await self.browser.close()
            print("Browser closed")

async def main():
    parser = argparse.ArgumentParser(description='TDMU News Scraper')
    parser.add_argument('--output', type=str, default='/tmp/tdmu_articles.json', help='Output file path')
    args = parser.parse_args()
    
    scraper = TDMUNewsScraper()
    try:
        await scraper.initialize()
        
        # Scrape all articles
        articles = await scraper.scrape_all_articles()
        print(f"Total articles scraped: {len(articles)}")
        
        # Save data to files
        if articles:
            scraper.save_to_json(args.output)
        else:
            print("No articles were found to save.")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        await scraper.close()

if __name__ == "__main__":
    asyncio.run(main())