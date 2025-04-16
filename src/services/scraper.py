import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
import pandas as pd
import json

class TDMUNewsScraper:
    def __init__(self):
        # Set up Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        # Initialize the Chrome driver
        self.driver = webdriver.Chrome(options=chrome_options)
        self.base_url = "https://tdmu.edu.vn/tin-tuc"
        self.article_links = []
        self.articles_data = []
        
    def get_all_article_links(self):
        """Scrape all article links from the news page including pagination"""
        self.driver.get(self.base_url)
        print("Accessing TDMU News page...")
        
        # Wait for the page to load properly
        time.sleep(3)
        
        # Get the initial links
        self._extract_links_from_current_page()
        
        # Debug info
        page_num = 1
        print(f"Page {page_num}: Found {len(self.article_links)} articles so far")
        
        # Check if there are more pages and navigate through them
        while True:
            try:
                # Find the next page button - try different selectors
                try:
                    next_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, "li.pager-next a"))
                    )
                except TimeoutException:
                    try:
                        next_button = WebDriverWait(self.driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, ".pager-next a"))
                        )
                    except TimeoutException:
                        try:
                            next_button = WebDriverWait(self.driver, 5).until(
                                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Next') or contains(text(), 'next') or contains(text(), 'Tiếp')]"))
                            )
                        except TimeoutException:
                            next_button = None
                
                if next_button:
                    next_button.click()
                    page_num += 1
                    print(f"Moving to page {page_num}...")
                    
                    # Wait for the page to load
                    time.sleep(3)
                    
                    # Extract links from this page
                    self._extract_links_from_current_page()
                    print(f"Page {page_num}: Found {len(self.article_links)} articles so far")
                else:
                    print("No next page button found. Finishing pagination.")
                    break
                    
            except Exception as e:
                print(f"Pagination ended or error occurred: {str(e)}")
                break
                
        print(f"Total articles found: {len(self.article_links)}")
        return self.article_links
    
    def _extract_links_from_current_page(self):
        """Extract article links from the current page"""
        # Save the page source for debugging if needed
        with open(f"page_source_{len(self.article_links)}.html", "w", encoding="utf-8") as f:
            f.write(self.driver.page_source)
            
        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
        
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
    
    def scrape_article_content(self, url):
        """Scrape the full content of an article"""
        try:
            self.driver.get(url)
            print(f"Accessing article: {url}")
            
            # Wait for the page to load
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
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
    
    def scrape_all_articles(self):
        """Scrape all articles found on the website"""
        if not self.article_links:
            self.get_all_article_links()
        
        # If we still don't have any links, try a direct approach
        if not self.article_links:
            print("No articles found through pagination. Trying direct approach...")
            self._scrape_homepage_for_links()
            
        if not self.article_links:
            print("Could not find any article links. Please check the website structure.")
            return []
        
        total = len(self.article_links)
        for i, link in enumerate(self.article_links):
            print(f"Scraping article {i+1}/{total}: {link}")
            article_data = self.scrape_article_content(link)
            self.articles_data.append(article_data)
            
            # Short pause to prevent overloading the server
            time.sleep(1)
        
        return self.articles_data
    
    def _scrape_homepage_for_links(self):
        """Alternative method to get article links directly from the homepage"""
        try:
            self.driver.get("https://tdmu.edu.vn")
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
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
    
    def close(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()
            print("Browser closed")

def test_urls():
    """Test function to manually check a few URLs"""
    urls = [
        "https://tdmu.edu.vn/tin-tuc",
        "https://tdmu.edu.vn"
    ]
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        for url in urls:
            print(f"Testing URL: {url}")
            driver.get(url)
            time.sleep(3)
            
            # Save the page source
            with open(f"test_{url.split('/')[-1]}.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            
            print(f"Saved source for: {url}")
    finally:
        driver.quit()

if __name__ == "__main__":
    # Uncomment to run URL tests first
    # test_urls()
    
    scraper = TDMUNewsScraper()
    try:
        # Scrape all articles
        articles = scraper.scrape_all_articles()
        print(f"Total articles scraped: {len(articles)}")
        
        # Save data to files
        if articles:
            scraper.save_to_csv()
            scraper.save_to_json()
        else:
            print("No articles were found to save.")
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        scraper.close()