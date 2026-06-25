"""
DualSaaS - Flask Backend API
E-Commerce + Learning Management System
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from datetime import datetime
from database import db

app = Flask(__name__)
app.secret_key = 'dualsaas-secret-key-2024-change-in-production'

# ============================================================
# AUTHENTICATION HELPERS
# ============================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if request.is_json:
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
            user = db.get_by_id('users', session['user_id'])
            if not user or user['role'] not in roles:
                return jsonify({'success': False, 'message': 'Insufficient permissions'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def get_current_user():
    if 'user_id' in session:
        return db.get_by_id('users', session['user_id'])
    return None

# ============================================================
# PAGE ROUTES (FRONTEND)
# ============================================================

@app.route('/')
def index():
    return render_template('index.html', page='landing')

@app.route('/login')
def login_page():
    if get_current_user():
        return redirect(url_for('dashboard'))
    return render_template('index.html', page='login')

@app.route('/register')
def register_page():
    if get_current_user():
        return redirect(url_for('dashboard'))
    return render_template('index.html', page='register')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('index.html', page='dashboard')

@app.route('/products')
def products_page():
    return render_template('index.html', page='products')

@app.route('/products/<int:product_id>')
def product_detail_page(product_id):
    return render_template('index.html', page='product-detail', product_id=product_id)

@app.route('/cart')
@login_required
def cart_page():
    return render_template('index.html', page='cart')

@app.route('/checkout')
@login_required
def checkout_page():
    return render_template('index.html', page='checkout')

@app.route('/orders')
@login_required
def orders_page():
    return render_template('index.html', page='orders')

@app.route('/orders/<int:order_id>')
@login_required
def order_detail_page(order_id):
    return render_template('index.html', page='order-detail', order_id=order_id)

@app.route('/courses')
def courses_page():
    return render_template('index.html', page='courses')

@app.route('/courses/<int:course_id>')
def course_detail_page(course_id):
    return render_template('index.html', page='course-detail', course_id=course_id)

@app.route('/my-courses')
@login_required
def my_courses_page():
    return render_template('index.html', page='my-courses')

@app.route('/student-dashboard')
@login_required
def student_dashboard_page():
    return render_template('index.html', page='student-dashboard')

@app.route('/instructor-dashboard')
@login_required
def instructor_dashboard_page():
    return render_template('index.html', page='instructor-dashboard')

@app.route('/create-course')
@login_required
def create_course_page():
    return render_template('index.html', page='create-course')

@app.route('/admin-dashboard')
@login_required
def admin_dashboard_page():
    return render_template('index.html', page='admin-dashboard')

@app.route('/manage-products')
@login_required
def manage_products_page():
    return render_template('index.html', page='manage-products')

@app.route('/manage-orders')
@login_required
def manage_orders_page():
    return render_template('index.html', page='manage-orders')

@app.route('/manage-courses')
@login_required
def manage_courses_page():
    return render_template('index.html', page='manage-courses')

@app.route('/manage-users')
@login_required
def manage_users_page():
    return render_template('index.html', page='manage-users')

@app.route('/profile')
@login_required
def profile_page():
    return render_template('index.html', page='profile')

@app.route('/settings')
@login_required
def settings_page():
    return render_template('index.html', page='settings')

@app.route('/invoice/<int:order_id>')
@login_required
def invoice_page(order_id):
    return render_template('index.html', page='invoice', order_id=order_id)

@app.route('/certificate/<int:course_id>')
@login_required
def certificate_page(course_id):
    return render_template('index.html', page='certificate', course_id=course_id)

# ============================================================
# API ROUTES - AUTHENTICATION
# ============================================================

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    users = db.get_all('users')
    user = next((u for u in users if u['email'] == email and u['password'] == password), None)

    if user:
        session['user_id'] = user['id']
        return jsonify({'success': True, 'user': {k: v for k, v in user.items() if k != 'password'}})
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'customer')

    users = db.get_all('users')
    if any(u['email'] == email for u in users):
        return jsonify({'success': False, 'message': 'Email already registered'}), 400

    new_user = db.insert('users', {'name': name, 'email': email, 'password': password, 'role': role, 'avatar': None})
    session['user_id'] = new_user['id']
    return jsonify({'success': True, 'user': {k: v for k, v in new_user.items() if k != 'password'}})

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/me')
def api_me():
    user = get_current_user()
    if user:
        return jsonify({'success': True, 'user': {k: v for k, v in user.items() if k != 'password'}})
    return jsonify({'success': False}), 401

# ============================================================
# API ROUTES - E-COMMERCE (PRODUCTS)
# ============================================================

@app.route('/api/products')
def api_products():
    products = db.get_all('products')
    query = request.args.get('q', '').lower()
    category_id = request.args.get('category')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    sort = request.args.get('sort', 'name')

    if query:
        products = [p for p in products if query in p['name'].lower() or query in p['description'].lower()]
    if category_id:
        products = [p for p in products if p['category_id'] == int(category_id)]
    if min_price:
        products = [p for p in products if p['price'] >= float(min_price)]
    if max_price:
        products = [p for p in products if p['price'] <= float(max_price)]

    if sort == 'price-low':
        products.sort(key=lambda x: x['price'])
    elif sort == 'price-high':
        products.sort(key=lambda x: x['price'], reverse=True)
    elif sort == 'rating':
        products.sort(key=lambda x: x['rating'], reverse=True)
    else:
        products.sort(key=lambda x: x['name'])

    categories = {c['id']: c['name'] for c in db.get_all('categories')}
    for p in products:
        p['category_name'] = categories.get(p['category_id'], 'General')

    return jsonify({'success': True, 'products': products})

@app.route('/api/products/<int:product_id>')
def api_product_detail(product_id):
    product = db.get_by_id('products', product_id)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    category = db.get_by_id('categories', product['category_id'])
    product['category_name'] = category['name'] if category else 'General'
    related = [p for p in db.get_all('products') if p['category_id'] == product['category_id'] and p['id'] != product_id][:4]

    return jsonify({'success': True, 'product': product, 'related': related})

@app.route('/api/products', methods=['POST'])
@login_required
def api_create_product():
    data = request.get_json()
    product = db.insert('products', {
        'name': data.get('name'),
        'slug': data.get('name', '').lower().replace(' ', '-'),
        'description': data.get('description'),
        'price': float(data.get('price', 0)),
        'category_id': int(data.get('category_id', 1)),
        'stock': int(data.get('stock', 0)),
        'image': data.get('image'),
        'rating': 0, 'reviews': 0, 'status': 'active'
    })
    return jsonify({'success': True, 'product': product})

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@login_required
def api_update_product(product_id):
    data = request.get_json()
    product = db.update('products', product_id, data)
    if product:
        return jsonify({'success': True, 'product': product})
    return jsonify({'success': False, 'message': 'Product not found'}), 404

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@login_required
def api_delete_product(product_id):
    db.delete('products', product_id)
    return jsonify({'success': True})

@app.route('/api/categories')
def api_categories():
    return jsonify({'success': True, 'categories': db.get_all('categories')})

# ============================================================
# API ROUTES - E-COMMERCE (CART)
# ============================================================

@app.route('/api/cart')
@login_required
def api_cart():
    user = get_current_user()
    items = db.get_where('cart_items', {'user_id': user['id']})
    for item in items:
        item['product'] = db.get_by_id('products', item['product_id'])
    total = sum(item['product']['price'] * item['quantity'] for item in items if item['product'])
    return jsonify({'success': True, 'items': items, 'total': total, 'count': sum(i['quantity'] for i in items)})

@app.route('/api/cart', methods=['POST'])
@login_required
def api_add_to_cart():
    user = get_current_user()
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    existing = db.get_where('cart_items', {'user_id': user['id'], 'product_id': product_id})
    if existing:
        db.update('cart_items', existing[0]['id'], {'quantity': existing[0]['quantity'] + quantity})
    else:
        db.insert('cart_items', {'user_id': user['id'], 'product_id': product_id, 'quantity': quantity})

    return jsonify({'success': True, 'message': 'Item added to cart'})

@app.route('/api/cart/<int:item_id>', methods=['PUT'])
@login_required
def api_update_cart_item(item_id):
    data = request.get_json()
    quantity = data.get('quantity', 0)
    if quantity <= 0:
        db.delete('cart_items', item_id)
    else:
        db.update('cart_items', item_id, {'quantity': quantity})
    return jsonify({'success': True})

@app.route('/api/cart/<int:item_id>', methods=['DELETE'])
@login_required
def api_remove_cart_item(item_id):
    db.delete('cart_items', item_id)
    return jsonify({'success': True})

@app.route('/api/cart/clear', methods=['POST'])
@login_required
def api_clear_cart():
    user = get_current_user()
    items = db.get_where('cart_items', {'user_id': user['id']})
    for item in items:
        db.delete('cart_items', item['id'])
    return jsonify({'success': True})

# ============================================================
# API ROUTES - E-COMMERCE (ORDERS)
# ============================================================

@app.route('/api/orders')
@login_required
def api_orders():
    user = get_current_user()
    orders = db.get_where('orders', {'user_id': user['id']})
    orders.sort(key=lambda x: x['id'], reverse=True)
    return jsonify({'success': True, 'orders': orders})

@app.route('/api/orders/all')
@login_required
@role_required(['admin'])
def api_all_orders():
    orders = db.get_all('orders')
    orders.sort(key=lambda x: x['id'], reverse=True)
    for order in orders:
        user = db.get_by_id('users', order['user_id'])
        order['customer_name'] = user['name'] if user else 'Unknown'
    return jsonify({'success': True, 'orders': orders})

@app.route('/api/orders/<int:order_id>')
@login_required
def api_order_detail(order_id):
    order = db.get_by_id('orders', order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404

    items = db.get_where('order_items', {'order_id': order_id})
    for item in items:
        item['product'] = db.get_by_id('products', item['product_id'])
    user = db.get_by_id('users', order['user_id'])

    return jsonify({'success': True, 'order': order, 'items': items, 'user': user})

@app.route('/api/orders', methods=['POST'])
@login_required
def api_create_order():
    user = get_current_user()
    data = request.get_json()
    shipping_address = data.get('shipping_address', '')
    payment_method = data.get('payment_method', 'credit_card')

    cart_items = db.get_where('cart_items', {'user_id': user['id']})
    if not cart_items:
        return jsonify({'success': False, 'message': 'Cart is empty'}), 400

    total = 0
    for item in cart_items:
        product = db.get_by_id('products', item['product_id'])
        if product:
            total += product['price'] * item['quantity']

    order = db.insert('orders', {
        'user_id': user['id'],
        'status': 'processing',
        'total': round(total, 2),
        'shipping_address': shipping_address,
        'payment_method': payment_method
    })

    for item in cart_items:
        product = db.get_by_id('products', item['product_id'])
        db.insert('order_items', {
            'order_id': order['id'],
            'product_id': item['product_id'],
            'quantity': item['quantity'],
            'price': product['price'] if product else 0
        })
        if product:
            db.update('products', product['id'], {'stock': product['stock'] - item['quantity']})
        db.delete('cart_items', item['id'])

    return jsonify({'success': True, 'order': order})

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@login_required
@role_required(['admin'])
def api_update_order_status(order_id):
    data = request.get_json()
    order = db.update('orders', order_id, {'status': data.get('status')})
    if order:
        return jsonify({'success': True, 'order': order})
    return jsonify({'success': False, 'message': 'Order not found'}), 404

# ============================================================
# API ROUTES - LMS (COURSES)
# ============================================================

@app.route('/api/courses')
def api_courses():
    courses = [c for c in db.get_all('courses') if c['status'] == 'published']
    query = request.args.get('q', '').lower()
    category = request.args.get('category')
    level = request.args.get('level')

    if query:
        courses = [c for c in courses if query in c['title'].lower() or query in c['description'].lower()]
    if category:
        courses = [c for c in courses if c['category'] == category]
    if level:
        courses = [c for c in courses if c['level'] == level]

    for course in courses:
        instructor = db.get_by_id('users', course['instructor_id'])
        course['instructor_name'] = instructor['name'] if instructor else 'Unknown'

    return jsonify({'success': True, 'courses': courses})

@app.route('/api/courses/<int:course_id>')
def api_course_detail(course_id):
    course = db.get_by_id('courses', course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Course not found'}), 404

    instructor = db.get_by_id('users', course['instructor_id'])
    course['instructor_name'] = instructor['name'] if instructor else 'Unknown'

    lessons = db.get_where('lessons', {'course_id': course_id})
    lessons.sort(key=lambda x: x['order'])

    user = get_current_user()
    is_enrolled = False
    progress = 0
    if user:
        enrollment = db.get_where('enrollments', {'user_id': user['id'], 'course_id': course_id})
        is_enrolled = len(enrollment) > 0
        if is_enrolled:
            completed = len([p for p in db.get_where('course_progress', {'user_id': user['id'], 'course_id': course_id}) if p['completed']])
            progress = round((completed / len(lessons)) * 100) if lessons else 0

    return jsonify({'success': True, 'course': course, 'lessons': lessons, 'is_enrolled': is_enrolled, 'progress': progress})

@app.route('/api/courses', methods=['POST'])
@login_required
def api_create_course():
    user = get_current_user()
    data = request.get_json()
    course = db.insert('courses', {
        'title': data.get('title'),
        'slug': data.get('title', '').lower().replace(' ', '-'),
        'description': data.get('description'),
        'instructor_id': user['id'],
        'price': float(data.get('price', 0)),
        'image': data.get('image'),
        'category': data.get('category', 'Development'),
        'level': data.get('level', 'Beginner'),
        'duration': data.get('duration', '24 hours'),
        'lessons_count': 0, 'students_count': 0, 'rating': 0, 'status': 'published'
    })
    return jsonify({'success': True, 'course': course})

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
@login_required
def api_update_course(course_id):
    data = request.get_json()
    course = db.update('courses', course_id, data)
    if course:
        return jsonify({'success': True, 'course': course})
    return jsonify({'success': False, 'message': 'Course not found'}), 404

@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
@login_required
def api_delete_course(course_id):
    db.delete('courses', course_id)
    return jsonify({'success': True})

@app.route('/api/courses/<int:course_id>/enroll', methods=['POST'])
@login_required
def api_enroll_course(course_id):
    user = get_current_user()
    existing = db.get_where('enrollments', {'user_id': user['id'], 'course_id': course_id})
    if existing:
        return jsonify({'success': False, 'message': 'Already enrolled'}), 400

    db.insert('enrollments', {'user_id': user['id'], 'course_id': course_id, 'status': 'active'})
    course = db.get_by_id('courses', course_id)
    if course:
        db.update('courses', course_id, {'students_count': course['students_count'] + 1})

    return jsonify({'success': True, 'message': 'Enrolled successfully'})

@app.route('/api/courses/<int:course_id>/lessons', methods=['POST'])
@login_required
def api_create_lesson(course_id):
    data = request.get_json()
    lesson = db.insert('lessons', {
        'course_id': course_id,
        'title': data.get('title'),
        'duration': data.get('duration', '10:00'),
        'order': data.get('order', 1),
        'type': data.get('type', 'video'),
        'content': data.get('content', '')
    })
    return jsonify({'success': True, 'lesson': lesson})

@app.route('/api/courses/<int:course_id>/lessons/<int:lesson_id>/complete', methods=['POST'])
@login_required
def api_complete_lesson(course_id, lesson_id):
    user = get_current_user()
    existing = db.get_where('course_progress', {'user_id': user['id'], 'course_id': course_id, 'lesson_id': lesson_id})

    if existing:
        db.update('course_progress', existing[0]['id'], {'completed': True, 'completed_at': datetime.now().isoformat()})
    else:
        db.insert('course_progress', {'user_id': user['id'], 'course_id': course_id, 'lesson_id': lesson_id, 'completed': True})

    lessons = db.get_where('lessons', {'course_id': course_id})
    progress_items = db.get_where('course_progress', {'user_id': user['id'], 'course_id': course_id})
    completed_count = len([p for p in progress_items if p['completed']])

    if lessons and completed_count >= len(lessons):
        enrollment = db.get_where('enrollments', {'user_id': user['id'], 'course_id': course_id})
        if enrollment:
            db.update('enrollments', enrollment[0]['id'], {'status': 'completed', 'completed_at': datetime.now().isoformat()})

    return jsonify({'success': True, 'progress': round((completed_count / len(lessons)) * 100) if lessons else 0})

# ============================================================
# API ROUTES - LMS (ENROLLMENTS & PROGRESS)
# ============================================================

@app.route('/api/enrollments')
@login_required
def api_enrollments():
    user = get_current_user()
    enrollments = db.get_where('enrollments', {'user_id': user['id']})

    for enrollment in enrollments:
        course = db.get_by_id('courses', enrollment['course_id'])
        enrollment['course'] = course
        if course:
            lessons = db.get_where('lessons', {'course_id': course['id']})
            progress_items = db.get_where('course_progress', {'user_id': user['id'], 'course_id': course['id']})
            completed = len([p for p in progress_items if p['completed']])
            enrollment['progress'] = round((completed / len(lessons)) * 100) if lessons else 0

    return jsonify({'success': True, 'enrollments': enrollments})

@app.route('/api/instructor/courses')
@login_required
def api_instructor_courses():
    user = get_current_user()
    courses = db.get_where('courses', {'instructor_id': user['id']})
    for course in courses:
        course['revenue'] = course['price'] * course['students_count']
    return jsonify({'success': True, 'courses': courses})

# ============================================================
# API ROUTES - ADMIN
# ============================================================

@app.route('/api/admin/stats')
@login_required
@role_required(['admin'])
def api_admin_stats():
    users = db.get_all('users')
    orders = db.get_all('orders')
    products = db.get_all('products')
    courses = db.get_all('courses')
    total_revenue = sum(o['total'] for o in orders)

    return jsonify({
        'success': True,
        'stats': {
            'total_users': len(users),
            'total_orders': len(orders),
            'total_revenue': total_revenue,
            'total_products': len(products),
            'total_courses': len(courses),
            'total_enrollments': len(db.get_all('enrollments'))
        }
    })

@app.route('/api/admin/users')
@login_required
@role_required(['admin'])
def api_admin_users():
    users = db.get_all('users')
    for user in users:
        if 'password' in user:
            del user['password']
    return jsonify({'success': True, 'users': users})

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@login_required
@role_required(['admin'])
def api_admin_delete_user(user_id):
    db.delete('users', user_id)
    return jsonify({'success': True})

# ============================================================
# API ROUTES - INVOICE & CERTIFICATE
# ============================================================

@app.route('/api/invoice/<int:order_id>')
@login_required
def api_invoice(order_id):
    order = db.get_by_id('orders', order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404

    items = db.get_where('order_items', {'order_id': order_id})
    for item in items:
        item['product'] = db.get_by_id('products', item['product_id'])

    user = db.get_by_id('users', order['user_id'])
    if user:
        user = {k: v for k, v in user.items() if k != 'password'}

    return jsonify({'success': True, 'order': order, 'items': items, 'user': user})

@app.route('/api/certificate/<int:course_id>')
@login_required
def api_certificate(course_id):
    user = get_current_user()
    enrollment = db.get_where('enrollments', {'user_id': user['id'], 'course_id': course_id})

    if not enrollment or enrollment[0]['status'] != 'completed':
        return jsonify({'success': False, 'message': 'Course not completed'}), 400

    course = db.get_by_id('courses', course_id)
    instructor = db.get_by_id('users', course['instructor_id']) if course else None

    return jsonify({
        'success': True,
        'certificate': {
            'user_name': user['name'],
            'course_title': course['title'] if course else 'Unknown',
            'instructor_name': instructor['name'] if instructor else 'Unknown',
            'certificate_id': f"CERT-{course_id}-{user['id']}-{int(datetime.now().timestamp())}",
            'issued_at': datetime.now().strftime('%B %d, %Y'),
            'completed_at': enrollment[0].get('completed_at', 'N/A')
        }
    })

# ============================================================
# API ROUTES - PROFILE
# ============================================================

@app.route('/api/profile', methods=['PUT'])
@login_required
def api_update_profile():
    user = get_current_user()
    data = request.get_json()

    updated = db.update('users', user['id'], {
        'name': data.get('name', user['name']),
        'email': data.get('email', user['email'])
    })

    if updated:
        return jsonify({'success': True, 'user': {k: v for k, v in updated.items() if k != 'password'}})
    return jsonify({'success': False, 'message': 'Update failed'}), 400

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
