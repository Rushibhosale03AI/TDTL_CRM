import time
import MySQLdb
import os
import dotenv

dotenv.load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

db_name = os.environ.get("DB_NAME", "crm_sales_db")
db_user = os.environ.get("DB_USER", "root")
db_password = os.environ.get("DB_PASSWORD", "")
db_port = int(os.environ.get("DB_PORT", "3306"))

print(f"Connecting to {db_name} with user {db_user}")

# Test with 'localhost'
t0 = time.time()
try:
    conn1 = MySQLdb.connect(
        host="localhost",
        user=db_user,
        passwd=db_password,
        db=db_name,
        port=db_port
    )
    t1 = time.time()
    print(f"Connected to localhost in {t1 - t0:.4f} seconds")
    conn1.close()
except Exception as e:
    print(f"Failed to connect to localhost: {e}")

# Test with '127.0.0.1'
t0 = time.time()
try:
    conn2 = MySQLdb.connect(
        host="127.0.0.1",
        user=db_user,
        passwd=db_password,
        db=db_name,
        port=db_port
    )
    t1 = time.time()
    print(f"Connected to 127.0.0.1 in {t1 - t0:.4f} seconds")
    conn2.close()
except Exception as e:
    print(f"Failed to connect to 127.0.0.1: {e}")
