import MySQLdb
import os
import dotenv

dotenv.load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

db_name = os.environ.get("DB_NAME", "crm_sales_db")
db_user = os.environ.get("DB_USER", "root")
db_password = os.environ.get("DB_PASSWORD", "")
db_port = int(os.environ.get("DB_PORT", "3306"))

print(f"Checking locks on {db_name}")

try:
    conn = MySQLdb.connect(
        host="127.0.0.1",
        user=db_user,
        passwd=db_password,
        db=db_name,
        port=db_port
    )
    cursor = conn.cursor()
    
    # Check running processes
    cursor.execute("SHOW PROCESSLIST")
    processes = cursor.fetchall()
    print("\n--- PROCESSLIST ---")
    for p in processes:
        print(p)
        
    # Check engine innodb status
    cursor.execute("SHOW ENGINE INNODB STATUS")
    status = cursor.fetchone()
    print("\n--- INNODB STATUS ---")
    # print first 1000 chars of the status text
    print(status[2][:1000] if status else "No InnoDB status")
    
    conn.close()
except Exception as e:
    print(f"Error checking locks: {e}")
