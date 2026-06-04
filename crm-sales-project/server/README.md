# CRM Sales Project - Backend Server

This is the Django REST backend for the CRM Sales Project.

## Tech Stack
- Django 4.2+
- Django REST Framework
- djangorestframework-simplejwt (JWT Auth)
- MySQL (Database)
- pandas & openpyxl (Excel Import)

## Backend Architecture
- `sales.views`: REST entrypoints and role-based endpoint routing.
- `sales.services`: Excel import processing and data ingestion logic.
- `sales.dashboard`: analytics and aggregated KPI builders for admin, manager, and sales dashboards.
- `sales.reports`: reusable report generation for revenue, pipeline, and user performance.
- `sales.notifications`: centralized activity logging and notification creation helpers.

## Setup Instructions

### 1. Database Setup
Create a MySQL database and user. The `utf8mb4` encoding is recommended.
```sql
CREATE DATABASE crm_sales_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'crm_user'@'localhost' IDENTIFIED BY 'your_db_password';
GRANT ALL PRIVILEGES ON crm_sales_db.* TO 'crm_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Environment Variables
1. Copy the `.env.example` file to a new file named `.env`.
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your database credentials (`DB_PASSWORD`), `SECRET_KEY`, and `JWT_SECRET_KEY`.

### 3. Install Dependencies
Ensure you have Python 3.10+ installed. It is recommended to use a virtual environment.
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

> Data should be entered through the frontend UI or imported from Excel. Seed scripts are not required for normal operation and are not part of the live frontend/backend workflow.

### 4. Apply Migrations
Run the following commands to create the database schema:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create a Superuser
Create an initial Admin user to log into the Django admin and access Admin endpoints:
```bash
python manage.py createsuperuser
```
*(When prompted, provide an email and password. This user will automatically be given the `ADMIN` role.)*

### 6. Run the Server
```bash
python manage.py runserver
```
The API will be available at `http://127.0.0.1:8000/api/`.

## Testing the API
You can use the provided **Postman collection** (`crm-sales-postman.json`) to test the API endpoints.
Import the JSON file into Postman. Make sure to set up environment variables in Postman for `base_url` (e.g., `http://127.0.0.1:8000`) and `token` (from the login response).

### Example cURL Commands

**Login:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email":"your_email@example.com","password":"your_password"}'
```

**Get Admin Dashboard (Requires ADMIN role):**
```bash
curl -X GET http://127.0.0.1:8000/api/dashboard/admin/ \
     -H "Authorization: Bearer <your_access_token>"
```
