# Quick Start Commands

## Initial Setup (First Time)

```bash
# 1. Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create MySQL database
mysql -u root -p
# Password: #supriya2003
# Then in MySQL:
# CREATE DATABASE crm_sales_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4. Run migrations
python manage.py migrate

# 5. Create admin user
python manage.py createsuperuser
# Email: admin@example.com
# Password: [your choice]

# 6. Start development server
python manage.py runserver
```

## Regular Development Commands

```bash
# Start development server
python manage.py runserver 0.0.0.0:8000

# Make migrations after model changes
python manage.py makemigrations

# Apply pending migrations
python manage.py migrate

# View all migrations
python manage.py showmigrations

# Access admin panel
# http://localhost:8000/admin/
```

## Verification & Troubleshooting

```bash
# Verify setup is working
python verify_setup.py

# Troubleshoot common errors
python troubleshoot.py

# Check database connectivity only
python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('✓ Database OK')"

# List all installed apps
python manage.py shell
>>> from django.conf import settings
>>> for app in settings.INSTALLED_APPS: print(app)
>>> exit()
```

## Database Commands

```bash
# Connect to MySQL directly
mysql -u root -p crm_sales_db
# Password: #supriya2003

# Reset database (DELETE ALL DATA)
mysql -u root -p -e "DROP DATABASE crm_sales_db; CREATE DATABASE crm_sales_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
python manage.py migrate
python manage.py createsuperuser

# Backup database
mysqldump -u root -p crm_sales_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
mysql -u root -p crm_sales_db < backup_file.sql
```

## Testing APIs

```bash
# Get authentication token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "your_password"}'

# Use token in requests
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test with Postman
# Import: crm-sales-postman.json
```

## Environment Variables (.env)

Key variables to configure:
- `DEBUG=True` - Development mode
- `SECRET_KEY` - Django secret (change for production)
- `DB_NAME=crm_sales_db` - Database name
- `DB_USER=root` - MySQL user
- `DB_PASSWORD=#supriya2003` - MySQL password
- `DB_HOST=localhost` - MySQL host
- `DB_PORT=3306` - MySQL port
- `CORS_ALLOWED_ORIGIN` - Frontend URL (e.g., http://localhost:5173)

## Common Errors

| Error | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'django'` | Run: `pip install -r requirements.txt` |
| `Can't connect to MySQL server` | Ensure MySQL is running on port 3306 |
| `Access denied for user 'root'` | Check DB_PASSWORD in .env file |
| `django.db.utils.OperationalError: no such table` | Run: `python manage.py migrate` |
| `INSTALLED_APPS reference 'accounts.AdminConfig'` | Check apps.py in accounts folder |

## Frontend Development

React client runs on `http://localhost:5173` by default.

```bash
# In client directory
cd client
npm install
npm run dev

# Backend must be running for API calls to work
```

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Update `SECRET_KEY` with secure value
3. Configure `ALLOWED_HOSTS` 
4. Run: `python manage.py collectstatic`
5. Use production server: `gunicorn core.wsgi`
6. Set up proper database backups
7. Enable HTTPS

See `SETUP_GUIDE.md` for detailed information.
