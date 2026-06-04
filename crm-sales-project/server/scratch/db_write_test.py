import time
import MySQLdb
import os
import dotenv

dotenv.load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

db_name = os.environ.get("DB_NAME", "crm_sales_db")
db_user = os.environ.get("DB_USER", "root")
db_password = os.environ.get("DB_PASSWORD", "")
db_port = int(os.environ.get("DB_PORT", "3306"))

print(f"Connecting to {db_name} with user {db_user} at 127.0.0.1")

t0 = time.time()
try:
    conn = MySQLdb.connect(
        host="127.0.0.1",
        user=db_user,
        passwd=db_password,
        db=db_name,
        port=db_port
    )
    cursor = conn.cursor()
    
    t1 = time.time()
    print(f"Connected in {t1 - t0:.4f} seconds")
    
    # Test a select count
    cursor.execute("SELECT COUNT(*) FROM sales_lead")
    count = cursor.fetchone()[0]
    print(f"Count: {count} leads in {time.time() - t1:.4f} seconds")
    
    # Test a dummy insert
    t2 = time.time()
    cursor.execute("""
        INSERT INTO sales_lead (name, company, email, phone, designation, status, value, score, is_deleted, created_at, updated_at) 
        VALUES ('Test Optimistic Lead', 'Test Corp', '', '', '', 'Yet to approach', 0, 10, 0, NOW(), NOW())
    """)
    conn.commit()
    inserted_id = cursor.lastrowid
    t3 = time.time()
    print(f"Inserted dummy lead ID {inserted_id} in {t3 - t2:.4f} seconds")
    
    # Clean up the dummy lead
    cursor.execute(f"DELETE FROM sales_lead WHERE id = {inserted_id}")
    conn.commit()
    print(f"Cleaned up in {time.time() - t3:.4f} seconds")
    
    conn.close()
except Exception as e:
    print(f"Error during db operations: {e}")
