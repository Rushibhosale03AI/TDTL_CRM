import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = MySQLdb.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        user=os.getenv('DB_USER', 'root'),
        passwd=os.getenv('DB_PASSWORD', 'root'),
        db=os.getenv('DB_NAME', 'crm_sales_db')
    )
    print("Connected to MySQL database")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
