import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv()

db_name = os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST", "127.0.0.1")
db_port = int(os.getenv("DB_PORT", 3306))

try:
    # Connect without database specified to create it
    db = MySQLdb.connect(host=db_host, user=db_user, passwd=db_password, port=db_port)
    cursor = db.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print(f"Database '{db_name}' ensured.")
    db.close()
except Exception as e:
    print(f"Error ensuring database: {e}")
