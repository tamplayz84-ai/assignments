# DualSaaS - E-Commerce & Learning Management System

## Features
- **E-Commerce**: Products, Cart, Checkout, Orders, Invoices
- **LMS**: Courses, Lessons, Enrollments, Progress Tracking, Certificates
- **Admin**: User management, Product/Order/Course management, Analytics
- **Authentication**: Role-based access (Admin, Instructor, Student, Customer)

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dualsaas.com | admin123 |
| Student | john@example.com | password123 |
| Instructor | jane@example.com | password123 |
| Customer | mike@example.com | password123 |

## Setup & Run

### Option 1: Visual Studio Code
1. Open folder in VS Code
2. Create virtual environment: `python -m venv venv`
3. Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. Install: `pip install -r requirements.txt`
5. Run: `python app.py`
6. Open browser: http://localhost:5000

### Option 2: Antigravity
1. Upload the entire `DualSaaS_Project` folder
2. The platform will auto-detect Flask and install dependencies
3. Run with the provided run button

## Database
- Uses JSON file storage (`data/database.json`)
- 10 tables: users, products, categories, cart_items, orders, order_items, courses, lessons, enrollments, course_progress
- Pre-seeded with demo data

## Project Structure
```
DualSaaS_Project/
├── app.py              # Flask backend (API routes)
├── database.py         # Database layer with demo data
├── requirements.txt    # Python dependencies
├── README.md          # Setup instructions
├── data/              # Created at runtime (database.json)
├── templates/
│   └── index.html     # Main HTML template
└── static/
    ├── css/
    │   └── style.css  # All styles
    └── js/
        └── app.js     # Frontend JavaScript SPA
```

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Products
- `GET /api/products` - List with search, filter, sort
- `GET /api/products/<id>` - Product detail
- `POST /api/products` - Create product
- `PUT /api/products/<id>` - Update product
- `DELETE /api/products/<id>` - Delete product
- `GET /api/categories` - List categories

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- `PUT /api/cart/<id>` - Update quantity
- `DELETE /api/cart/<id>` - Remove item
- `POST /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders` - User orders
- `GET /api/orders/all` - All orders (admin)
- `GET /api/orders/<id>` - Order detail
- `POST /api/orders` - Create order
- `PUT /api/orders/<id>/status` - Update status

### Courses
- `GET /api/courses` - List with search, filter
- `GET /api/courses/<id>` - Course detail
- `POST /api/courses` - Create course
- `PUT /api/courses/<id>` - Update course
- `DELETE /api/courses/<id>` - Delete course
- `POST /api/courses/<id>/enroll` - Enroll

### Lessons
- `POST /api/courses/<id>/lessons` - Create lesson
- `POST /api/courses/<id>/lessons/<lid>/complete` - Complete lesson

### Enrollments
- `GET /api/enrollments` - My enrollments
- `GET /api/instructor/courses` - Instructor courses

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `DELETE /api/admin/users/<id>` - Delete user

### Invoice & Certificate
- `GET /api/invoice/<id>` - Generate invoice
- `GET /api/certificate/<id>` - Generate certificate

### Profile
- `PUT /api/profile` - Update profile
