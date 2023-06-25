import time
import cx_Oracle
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

# Database connection details
dsn_tns = 'localhost/XE'
db_username = 'system'
db_password = 'ayesha123'

# Establish database connection
db_conn = cx_Oracle.connect(db_username, db_password, dsn_tns)
cursor = db_conn.cursor()

# Set up Selenium WebDriver with Chrome
options = Options()
options.add_argument('--headless')  # Run Chrome in headless mode, remove this line if you want to see the browser
service = Service('C:\\Users\\Home\\Downloads\\chromedriver_win32\\chromedriver.exe')  # Replace with the path to your chromedriver executable
driver = webdriver.Chrome(service=service, options=options)

# Define the base URL and search queries
base_url = 'https://www.coursera.org'
search_queries = ['data science', 'machine learning', 'artificial intelligence', 'web development', 'cloud computing', 'cybersecurity']

# Define the number of pages to scrape
num_pages = 1

# Scrape data for each search query
for search_query in search_queries:
    url = f'{base_url}/search?query={search_query}&skipBrowseRedirect=true&index=prod_all_launched_products_term_optimization'

    # Scrape data from the first 'num_pages' pages
    for page in range(1, num_pages + 1):
        page_url = f'{url}&page={page}'

        # Load the Coursera page
        driver.get(page_url)

        # Wait for the page to load completely
        time.sleep(5)  # Adjust the waiting time if needed

        # Get the page source and create BeautifulSoup object
        html_content = driver.page_source
        soup = BeautifulSoup(html_content, 'html.parser')

        # Find the course cards
        course_cards = soup.select('.css-1cj5od')

        # Extract and display the desired information for each course
        for card in course_cards:
            course_title_element = card.select_one('h2')
            if course_title_element:
                course_title = course_title_element.text.strip()
            else:
                course_title = 'N/A'

            provider_element = card.select_one('.partner-logo-lohp-legacy span')
            if provider_element:
                provider = provider_element.text.strip()
            else:
                provider = 'N/A'

            duration_element = card.select_one('.product-reviews + p')
            if duration_element:
                duration = duration_element.text.strip()
            else:
                duration = 'N/A'

            rating_element = card.select_one('.product-reviews p')
            if rating_element:
                rating = rating_element.text.strip()
            else:
                rating = 0

            num_reviews_element = card.select_one('.product-reviews p + p')
            if num_reviews_element:
                num_reviews = num_reviews_element.text.strip().replace('(', '').replace(' reviews)', '')
            else:
                num_reviews = 0

            # Get the course image URL
            image_element = card.select_one('img')
            if image_element and 'data:image' not in image_element['src']:
                image_url = image_element['src']
            else:
                image_url = 'N/A'

            print('Course Title:', course_title)
            print('Provider:', provider)
            print('Duration:', duration)
            print('Rating:', rating)
            print('Number of Reviews:', num_reviews)
            print('Course Image URL:', image_url)
            print('-----------------------')

            # Insert the data into the content table
            content_query = "INSERT INTO content (content_id, category) " \
                            "VALUES (content_seq.nextval, 'Courses')"
            cursor.execute(content_query)
            db_conn.commit()

            # Retrieve the content_id for the inserted row
            cursor.execute("SELECT content_seq.currval FROM dual")
            content_id = cursor.fetchone()[0]

            # Insert the data into the courses table
            course_query = "INSERT INTO courses (content_id, coursetitle, provider, duration, rating, number_of_reviews, image_url) " \
                           "VALUES (:content_id, :coursetitle, :provider, :duration, :rating, :number_of_reviews, :image_url)"
            course_data = {
                'content_id': content_id,
                'coursetitle': course_title,
                'provider': provider,
                'duration': duration,
                'rating': rating,
                'number_of_reviews': num_reviews,
                'image_url': image_url
            }
            cursor.execute(course_query, course_data)
            db_conn.commit()

# Close the database cursor and connection
cursor.close()
db_conn.close()

# Close the browser
driver.quit()
