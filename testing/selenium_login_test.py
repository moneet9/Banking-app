# Selenium UI Test Example for Banking App

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

# Update the path to your WebDriver
DRIVER_PATH = 'chromedriver.exe'

# Example: Test Login Functionality
def test_login():
    driver = webdriver.Chrome(DRIVER_PATH)
    driver.get('http://localhost:3000')  # Update with your frontend URL
    time.sleep(2)
    
    # Find and fill username
    driver.find_element(By.NAME, 'username').send_keys('testuser')
    # Find and fill password
    driver.find_element(By.NAME, 'password').send_keys('testpass')
    # Submit form
    driver.find_element(By.NAME, 'login').click()
    time.sleep(2)
    
    # Check for successful login (update selector as needed)
    assert 'Dashboard' in driver.page_source
    driver.quit()

if __name__ == '__main__':
    test_login()
