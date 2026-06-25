</h3><p>Enrolled Courses</p></div><div class="stat-icon purple"><i class="fas fa-book"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>${completedCourses}</h3><p>Completed</p></div><div class="stat-icon green"><i class="fas fa-check-circle"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>${inProgress}</h3><p>In Progress</p></div><div class="stat-icon orange"><i class="fas fa-clock"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>${certificates.length}</h3><p>Certificates</p></div><div class="stat-icon pink"><i class="fas fa-certificate"></i></div></div>
                </div>
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header"><div class="card-title">Current Progress</div></div>
                        ${enrollments.filter(e => e.status === 'active').map(e => `
                            <div style="margin-bottom: 20px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="font-weight: 600;">${e.course ? e.course.title : 'Unknown'}</span><span style="color: var(--primary); font-weight: 700;">${e.progress || 0}%</span></div>
                                <div class="progress-bar"><div class="progress-fill" style="width: ${e.progress || 0}%"></div></div>
                            </div>
                        `).join('') || '<p style="color: var(--gray);">No active courses. Enroll in a course to start learning.</p>'}
                    </div>
                    <div class="card">
                        <div class="card-header"><div class="card-title">My Certificates</div></div>
                        ${certificates.length > 0 ? certificates.map(cert => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                                <div><div style="font-weight: 600;">${cert.course ? cert.course.title : 'Unknown'}</div><div style="font-size: 12px; color: var(--gray);">Completed on ${cert.completed_at || 'N/A'}</div></div>
                                <button class="btn btn-sm btn-primary" onclick="Router.navigate('certificate', ${cert.course_id})"><i class="fas fa-eye"></i> View</button>
                            </div>
                        `).join('') : '<p style="color: var(--gray);">Complete a course to earn your first certificate.</p>'}
                    </div>
                </div>
            </div>
        `;
    },

    async renderInstructorDashboard() {
        const courses = await CourseService.getInstructorCourses();
        const totalStudents = courses.reduce((sum, c) => sum + (c.students_count || 0), 0);
        const totalRevenue = courses.reduce((sum, c) => sum + (c.revenue || 0), 0);
        const avgRating = courses.length > 0 ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1) : '0.0';

        return `
            <div class="page active">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 32px;">Instructor Dashboard</h1>
                <div class="grid grid-4">
                    <div class="stat-card"><div class="stat-info"><h3>${courses.length}</h3><p>My Courses</p></div><div class="stat-icon purple"><i class="fas fa-chalkboard"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>${totalStudents}</h3><p>Total Students</p></div><div class="stat-icon green"><i class="fas fa-users"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>$${totalRevenue.toFixed(2)}</h3><p>Total Revenue</p></div><div class="stat-icon pink"><i class="fas fa-dollar-sign"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>${avgRating}</h3><p>Avg Rating</p></div><div class="stat-icon orange"><i class="fas fa-star"></i></div></div>
                </div>
                <div class="card">
                    <div class="card-header"><div class="card-title">My Courses</div><button class="btn btn-primary btn-sm" onclick="Router.navigate('create-course')"><i class="fas fa-plus"></i> New Course</button></div>
                    <div class="table-container">
                        <table><thead><tr><th>Course</th><th>Students</th><th>Revenue</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>${courses.map(course => `
                            <tr><td><strong>${course.title}</strong></td><td>${course.students_count || 0}</td><td>$${(course.revenue || 0).toFixed(2)}</td><td><i class="fas fa-star" style="color: var(--warning);"></i> ${course.rating || 0}</td><td><span class="status-badge ${course.status}">${course.status}</span></td>
                            <td><div class="table-actions"><button onclick="Router.navigate('course-detail', ${course.id})" title="View"><i class="fas fa-eye"></i></button><button onclick="UI.editCourse(${course.id})" title="Edit"><i class="fas fa-edit"></i></button><button onclick="UI.deleteCourse(${course.id})" title="Delete" style="color: var(--danger);"><i class="fas fa-trash"></i></button></div></td>
                            </tr>
                        `).join('')}</tbody></table>
                    </div>
                </div>
            </div>
        `;
    },

    renderCreateCourse() {
        return `
            <div class="page active">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 32px;">Create New Course</h1>
                <div class="card" style="max-width: 800px;">
                    <form onsubmit="UI.handleCreateCourse(event)">
                        <div class="form-group"><label class="form-label">Course Title</label><input type="text" class="form-input" id="course-title" placeholder="Enter course title" required></div>
                        <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="course-description" placeholder="Describe your course" required></textarea></div>
                        <div class="form-row">
                            <div class="form-group"><label class="form-label">Category</label><select class="form-select" id="course-category" required><option value="Development">Development</option><option value="Data Science">Data Science</option><option value="Design">Design</option><option value="DevOps">DevOps</option><option value="Business">Business</option></select></div>
                            <div class="form-group"><label class="form-label">Level</label><select class="form-select" id="course-level" required><option value="Beginner">Beginner</option><option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option></select></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label class="form-label">Price ($)</label><input type="number" class="form-input" id="course-price" placeholder="29.99" step="0.01" required></div>
                            <div class="form-group"><label class="form-label">Duration</label><input type="text" class="form-input" id="course-duration" placeholder="e.g. 24 hours" required></div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Course Image</label>
                            <div class="upload-zone" onclick="document.getElementById('course-image').click()">
                                <i class="fas fa-cloud-upload-alt"></i><p style="font-weight: 600; margin-bottom: 4px;">Click to upload</p><p style="font-size: 12px; color: var(--gray);">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                <input type="file" id="course-image" accept="image/*" style="display: none;" onchange="UI.handleImageUpload(this, 'course-preview')"><img id="course-preview" class="upload-preview" style="display: none;">
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px;"><button type="button" class="btn btn-secondary" onclick="Router.navigate('instructor-dashboard')">Cancel</button><button type="submit" class="btn btn-primary">Create Course</button></div>
                    </form>
                </div>
            </div>
        `;
    },

    async renderAdminDashboard() {
        const statsRes = await API.get('/api/admin/stats');
        const stats = statsRes.success ? statsRes.stats : {};
        const ordersRes = await API.get('/api/orders/all');
        const orders = ordersRes.success ? ordersRes.orders.slice(0, 5) : [];
        const usersRes = await API.get('/api/admin/users');
        const users = usersRes.success ? usersRes.users.slice(0, 5) : [];

        return `
            <div class="page active">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 32px;">Admin Dashboard</h1>
                <div class="grid grid-4">
                    <div class="stat-card"><div class="stat-info"><h3>${stats.total_users || 0}</h3><p>Total Users</p></div><div class="stat-icon purple"><i class="fas fa-users"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>${stats.total_orders || 0}</h3><p>Total Orders</p></div><div class="stat-icon green"><i class="fas fa-shopping-bag"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>$${(stats.total_revenue || 0).toFixed(2)}</h3><p>Total Revenue</p></div><div class="stat-icon pink"><i class="fas fa-dollar-sign"></i></div></div>
                    <div class="stat-card"><div class="stat-info"><h3>${stats.total_courses || 0}</h3><p>Total Courses</p></div><div class="stat-icon orange"><i class="fas fa-graduation-cap"></i></div></div>
                </div>
                <div class="grid grid-2">
                    <div class="card"><div class="card-header"><div class="card-title">Revenue Analytics</div></div><div class="chart-container"><canvas id="adminRevenueChart"></canvas></div></div>
                    <div class="card"><div class="card-header"><div class="card-title">User Growth</div></div><div class="chart-container"><canvas id="adminUserChart"></canvas></div></div>
                </div>
                <div class="grid grid-2">
                    <div class="card">
                        <div class="card-header"><div class="card-title">Recent Orders</div><button class="btn btn-sm btn-secondary" onclick="Router.navigate('manage-orders')">View All</button></div>
                        <div class="table-container"><table><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
                        <tbody>${orders.map(o => `<tr><td>#${o.id}</td><td>${o.customer_name || 'N/A'}</td><td>$${o.total.toFixed(2)}</td><td><span class="status-badge ${o.status}">${o.status}</span></td></tr>`).join('')}</tbody></table></div>
                    </div>
                    <div class="card">
                        <div class="card-header"><div class="card-title">Recent Users</div><button class="btn btn-sm btn-secondary" onclick="Router.navigate('manage-users')">View All</button></div>
                        <div class="table-container"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
                        <tbody>${users.map(u => `<tr><td><strong>${u.name}</strong></td><td>${u.email}</td><td><span class="status-badge ${u.role}">${u.role}</span></td><td>${u.created_at || 'N/A'}</td></tr>`).join('')}</tbody></table></div>
                    </div>
                </div>
            </div>
        `;
    },

    async renderManageProducts() {
        const res = await API.get('/api/products');
        const products = res.success ? res.products : [];
        const catRes = await API.get('/api/categories');
        const categories = catRes.success ? catRes.categories : [];

        return `
            <div class="page active">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;"><h1 style="font-size: 28px; font-weight: 800;">Manage Products</h1><button class="btn btn-primary" onclick="UI.openProductModal()"><i class="fas fa-plus"></i> Add Product</button></div>
                <div class="card">
                    <div class="table-container">
                        <table><thead><tr><th>ID</th><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>${products.map(p => {
                            const cat = categories.find(c => c.id === p.category_id);
                            return `<tr><td>#${p.id}</td><td><strong>${p.name}</strong></td><td>${cat ? cat.name : 'N/A'}</td><td>$${p.price.toFixed(2)}</td><td>${p.stock}</td><td><span class="status-badge ${p.status}">${p.status}</span></td>
                            <td><div class="table-actions"><button onclick="UI.editProduct(${p.id})" title="Edit"><i class="fas fa-edit"></i></button><button onclick="UI.deleteProduct(${p.id})" title="Delete" style="color: var(--danger);"><i class="fas fa-trash"></i></button></div></td></tr>`;
                        }).join('')}</tbody></table>
                    </div>
                </div>
            </div>
        `;
    },

    async renderManageOrders() {
        const res = await API.get('/api/orders/all');
        const orders = res.success ? res.orders : [];

        return `
            <div class="page active">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 32px;">Manage Orders</h1>
                <div class="card">
                    <div class="table-container">
                        <table><thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>${orders.map(order => `
                            <tr><td><strong>#${order.id}</strong></td><td>${order.customer_name || 'N/A'}</td><td>${order.created_at}</td><td style="font-weight: 700;">$${order.total.toFixed(2)}</td>
                            <td><select class="form-select" style="width: auto; font-size: 12px;" onchange="OrderService.updateStatus(${order.id}, this.value).then(() => { Toast.success('Status updated'); })">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select></td>
                            <td><div class="table-actions"><button onclick="Router.navigate('order-detail', ${order.id})" title="View"><i class="fas fa-eye"></i></button><button onclick="Router.navigate('invoice', ${order.id})" title="Invoice"><i class="fas fa-file-invoice"></i></button></div></td></tr>
                        `).join('')}</tbody></table>
                    </div>
                </div>
            </div>
        `;
    },

    async renderManageCourses() {
        const res = await API.get('/api/courses');
        const courses = res.success ? res.products || [] : []; // Note: API returns courses in 'courses' key
        // Actually the courses endpoint returns courses, let me fix this in the actual call
        const coursesData = res.success ? (res.courses || []) : [];

        return `
            <div class="page active">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;"><h1 style="font-size: 28px; font-weight: 800;">Manage Courses</h1><button class="btn btn-primary" onclick="Router.navigate('create-course')"><i class="fas fa-plus"></i> Add Course</button></div>
                <div class="card">
                    <div class="table-container">
                        <table><thead><tr><th>ID</th><th>Course</th><th>Instructor</th><th>Students</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>${coursesData.map(c => `<tr><td>#${c.id}</td><td><strong>${c.title}</strong></td><td>${c.instructor_name || 'N/A'}</td><td>${c.students_count || 0}</td><td>$${c.price}</td><td><span class="status-badge ${c.status}">${c.status}</span></td>
                        <td><div class="table-actions"><button onclick="Router.navigate('course-detail', ${c.id})" title="View"><i class="fas fa-eye"></i></button><button onclick="UI.editCourse(${c.id})" title="Edit"><i class="fas fa-edit"></i></button><button onclick="UI.deleteCourse(${c.id})" title="Delete" style="color: var(--danger);"><i class="fas fa-trash"></i></button></div></td></tr>`).join('')}</tbody></table>
                    </div>
                </div>
            </div>
        `;
    },

    async renderManageUsers() {
        const res = await API.get('/api/admin/users');
        const users = res.success ? res.users : [];

        return `
            <div class="page active">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 32px;">Manage Users</h1>
                <div class="card">
                    <div class="table-container">
                        <table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
                        <tbody>${users.map(u => `
                            <tr><td>#${u.id}</td><td><div style="display: flex; align-items: center; gap: 12px;"><div class="avatar">${u.name.charAt(0)}</div><strong>${u.name}</strong></div></td><td>${u.email}</td><td><span class="status-badge ${u.role}">${u.role}</span></td><td>${u.created_at || 'N/A'}</td>
                            <td><div class="table-actions"><button onclick="UI.editUser(${u.id})" title="Edit"><i class="fas fa-edit"></i></button><button onclick="UI.deleteUser(${u.id})" title="Delete" style="color: var(--danger);"><i class="fas fa-trash"></i></button></div></td></tr>
                        `).join('')}</tbody></table>
                    </div>
                </div>
            </div>
        `;
    },

    async renderProfile() {
        const user = Store.get('user');
        if (!user) return '<div class="page active"><h1>Please login</h1></div>';
        const orders = await OrderService.getUserOrders();
        const enrollments = await CourseService.getEnrollments();

        return `
            <div class="page active">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 32px;">My Profile</h1>
                <div class="grid grid-2">
                    <div class="card">
                        <div style="text-align: center; margin-bottom: 32px;"><div class="avatar" style="width: 100px; height: 100px; font-size: 40px; margin: 0 auto 16px;">${user.name.charAt(0)}</div><h2 style="font-size: 24px; font-weight: 700;">${user.name}</h2><p style="color: var(--gray);">${user.email}</p><span class="status-badge ${user.role}" style="margin-top: 12px; display: inline-block;">${user.role}</span></div>
                        <form onsubmit="UI.updateProfile(event)">
                            <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-input" id="profile-name" value="${user.name}" required></div>
                            <div class="form-group"><label class="form-label">Email Address</label><input type="email" class="form-input" id="profile-email" value="${user.email}" required></div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Update Profile</button>
                        </form>
                    </div>
                    <div class="card">
                        <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 24px;">Account Statistics</h3>
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--light); border-radius: var(--radius-sm);"><div><i class="fas fa-shopping-bag" style="color: var(--primary); margin-right: 12px;"></i> Orders</div><div style="font-weight: 700;">${orders.length}</div></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--light); border-radius: var(--radius-sm);"><div><i class="fas fa-book" style="color: var(--primary); margin-right: 12px;"></i> Enrolled Courses</div><div style="font-weight: 700;">${enrollments.length}</div></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--light); border-radius: var(--radius-sm);"><div><i class="fas fa-certificate" style="color: var(--primary); margin-right: 12px;"></i> Certificates</div><div style="font-weight: 700;">${enrollments.filter(e => e.status === 'completed').length}</div></div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--light); border-radius: var(--radius-sm);"><div><i class="fas fa-calendar" style="color: var(--primary); margin-right: 12px;"></i> Member Since</div><div style="font-weight: 700;">${user.created_at || 'N/A'}</div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderSettings() {
        return `
            <div class="page active">
                <h1 style="font-size: 28px; font-weight: 800; margin-bottom: 32px;">Settings</h1>
                <div class="card" style="max-width: 600px;">
                    <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 24px;">General Settings</h3>
                    <div class="form-group">
                        <label class="form-label">Notifications</label>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;"><input type="checkbox" checked> Email notifications for orders</label>
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;"><input type="checkbox" checked> Email notifications for course updates</label>
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;"><input type="checkbox"> Marketing emails</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Privacy</label>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;"><input type="checkbox" checked> Make profile visible to other users</label>
                            <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;"><input type="checkbox" checked> Show course progress publicly</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Danger Zone</label>
                        <button class="btn btn-danger" style="width: 100%;" onclick="if(confirm('Are you sure? This will delete all your data.')) { fetch('/api/reset', {method: 'POST'}).then(() => location.reload()); }"><i class="fas fa-exclamation-triangle"></i> Reset All Data</button>
                    </div>
                    <button class="btn btn-primary" onclick="Toast.success('Settings saved')">Save Changes</button>
                </div>
            </div>
        `;
    },

    async renderInvoice() {
        const orderId = Store.get('currentInvoiceId');
        const res = await InvoiceService.get(orderId);
        if (!res) return '<div class="page active"><h1>Invoice not found</h1></div>';
        const { order, items, user } = res;

        return `
            <div class="page active">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('orders')"><i class="fas fa-arrow-left"></i> Back</button>
                    <button class="btn btn-primary btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print Invoice</button>
                </div>
                <div class="invoice" id="invoice-content">
                    <div class="invoice-header">
                        <div class="invoice-company"><h2>DualSaaS</h2><p style="color: var(--gray);">123 Commerce Street<br>New York, NY 10001<br>contact@dualsaas.com</p></div>
                        <div class="invoice-details"><h3>INVOICE</h3><p style="color: var(--gray);">Invoice #: INV-${order.id}<br>Date: ${order.created_at}<br>Order #: ${order.id}</p></div>
                    </div>
                    <div style="margin-bottom: 48px;"><div style="font-weight: 600; margin-bottom: 8px;">Bill To:</div><p>${user.name}<br>${user.email}<br>${order.shipping_address || 'N/A'}</p></div>
                    <table class="invoice-table"><thead><tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr></thead>
                    <tbody>${items.map(item => `<tr><td>${item.product ? item.product.name : 'Unknown'}</td><td>${item.quantity}</td><td>$${item.price.toFixed(2)}</td><td style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')}</tbody></table>
                    <div class="invoice-total">
                        <div style="display: flex; justify-content: flex-end; gap: 48px; margin-bottom: 8px;"><span>Subtotal:</span><span style="font-weight: 600;">$${order.total.toFixed(2)}</span></div>
                        <div style="display: flex; justify-content: flex-end; gap: 48px; margin-bottom: 8px;"><span>Tax (8%):</span><span style="font-weight: 600;">$${(order.total * 0.08).toFixed(2)}</span></div>
                        <div style="display: flex; justify-content: flex-end; gap: 48px;"><span>Total:</span><span style="font-weight: 800; font-size: 24px; color: var(--primary);">$${(order.total * 1.08).toFixed(2)}</span></div>
                    </div>
                    <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e2e8f0; text-align: center; color: var(--gray);"><p>Thank you for your business!</p><p style="font-size: 12px; margin-top: 8px;">Payment is due within 30 days. Please include the invoice number on your check.</p></div>
                </div>
            </div>
        `;
    },

    async renderCertificate() {
        const courseId = Store.get('currentCertificateId');
        const res = await CertificateService.get(courseId);
        if (!res) return '<div class="page active"><h1>Certificate not available. Complete the course first.</h1></div>';
        const cert = res;

        return `
            <div class="page active">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                    <button class="btn btn-secondary btn-sm" onclick="Router.navigate('my-courses')"><i class="fas fa-arrow-left"></i> Back to My Courses</button>
                    <button class="btn btn-primary btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print Certificate</button>
                </div>
                <div class="certificate" id="certificate-content">
                    <div class="certificate-seal"><i class="fas fa-award"></i></div>
                    <h1>CERTIFICATE</h1>
                    <h2>OF COMPLETION</h2>
                    <p style="font-size: 18px; color: var(--gray); margin-bottom: 24px;">This is to certify that</p>
                    <div class="name">${cert.user_name}</div>
                    <p style="font-size: 18px; color: var(--gray); margin-bottom: 24px;">has successfully completed</p>
                    <div class="course">${cert.course_title}</div>
                    <div class="certificate-footer">
                        <div style="text-align: center;"><div style="border-bottom: 1px solid var(--dark); padding-bottom: 8px; margin-bottom: 8px; min-width: 200px;">${cert.instructor_name}</div><div style="font-size: 14px; color: var(--gray);">Instructor</div></div>
                        <div style="text-align: center;"><div style="border-bottom: 1px solid var(--dark); padding-bottom: 8px; margin-bottom: 8px; min-width: 200px;">${cert.issued_at}</div><div style="font-size: 14px; color: var(--gray);">Date</div></div>
                    </div>
                    <div style="margin-top: 32px; font-size: 12px; color: var(--gray);">Certificate ID: ${cert.certificate_id}</div>
                </div>
            </div>
        `;
    },

    // ========== EVENT HANDLERS ==========
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const result = await Auth.login(email, password);
        if (result.success) {
            Toast.success('Welcome back, ' + result.user.name + '!');
            Router.navigate('dashboard');
        } else {
            Toast.error(result.message);
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        const result = await Auth.register(name, email, password, role);
        if (result.success) {
            Toast.success('Account created successfully!');
            Router.navigate('dashboard');
        } else {
            Toast.error(result.message);
        }
    },

    async handleCreateCourse(e) {
        e.preventDefault();
        const title = document.getElementById('course-title').value;
        const description = document.getElementById('course-description').value;
        const category = document.getElementById('course-category').value;
        const level = document.getElementById('course-level').value;
        const price = parseFloat(document.getElementById('course-price').value);
        const duration = document.getElementById('course-duration').value;

        const course = await CourseService.create({ title, description, category, level, price, duration });
        if (course) {
            Toast.success('Course created successfully!');
            Router.navigate('instructor-dashboard');
        } else {
            Toast.error('Failed to create course');
        }
    },

    async updateProfile(e) {
        e.preventDefault();
        const name = document.getElementById('profile-name').value;
        const email = document.getElementById('profile-email').value;
        const res = await API.put('/api/profile', { name, email });
        if (res.success) {
            Store.set('user', res.user);
            Toast.success('Profile updated successfully');
            this.renderApp();
        } else {
            Toast.error('Update failed');
        }
    },

    nextCheckoutStep(e) {
        e.preventDefault();
        const step = Store.get('checkoutStep') || 1;
        if (step === 1) {
            const address = document.getElementById('shipping-address').value;
            Store.set('shippingAddress', address);
        }
        Store.set('checkoutStep', step + 1);
        this.renderApp();
    },

    prevCheckoutStep() {
        const step = Store.get('checkoutStep') || 1;
        Store.set('checkoutStep', Math.max(1, step - 1));
        this.renderApp();
    },

    async placeOrder() {
        const shippingAddress = Store.get('shippingAddress') || '123 Main St, New York, NY 10001';
        const order = await OrderService.create(shippingAddress, 'credit_card');
        if (order) {
            Store.set('checkoutStep', 1);
            Store.set('shippingAddress', '');
            Toast.success('Order placed successfully!');
            Router.navigate('orders');
        } else {
            Toast.error('Failed to place order');
        }
    },

    async continueLearning(courseId) {
        Router.navigate('course-detail', courseId);
    },

    async playLesson(lessonId) {
        const courseId = Store.get('currentCourseId');
        const res = await CourseService.completeLesson(courseId, lessonId);
        if (res.success) {
            Toast.success('Lesson completed!');
            this.renderApp();
        }
    },

    setFilter(key, value) {
        Store.set(key, value);
        Store.set('productPage', 1);
        this.renderApp();
    },

    setPage(page) {
        Store.set('productPage', page);
        this.renderApp();
    },

    setCourseFilter(key, value) {
        Store.set(key === 'category' ? 'courseCategoryFilter' : 'courseLevelFilter', value);
        Store.set('coursePage', 1);
        this.renderApp();
    },

    setCoursePage(page) {
        Store.set('coursePage', page);
        this.renderApp();
    },

    handleImageUpload(input, previewId) {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById(previewId);
                if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
            };
            reader.readAsDataURL(file);
        }
    },

    openProductModal() { Toast.info('Product creation modal would open here'); },
    editProduct(id) { Toast.info('Edit product: ' + id); },
    async deleteProduct(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            await API.del(`/api/products/${id}`);
            Toast.success('Product deleted');
            this.renderApp();
        }
    },
    editCourse(id) { Toast.info('Edit course: ' + id); },
    async deleteCourse(id) {
        if (confirm('Are you sure you want to delete this course?')) {
            await CourseService.delete(id);
            Toast.success('Course deleted');
            this.renderApp();
        }
    },
    editUser(id) { Toast.info('Edit user: ' + id); },
    async deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            await API.del(`/api/admin/users/${id}`);
            Toast.success('User deleted');
            this.renderApp();
        }
    },

    setupPageEvents(page) {
        if (page === 'dashboard' || page === 'admin-dashboard') {
            setTimeout(() => { this.initCharts(); }, 100);
        }
        if (page === 'checkout') {
            this.loadCheckoutSummary();
        }
    },

    async loadCheckoutSummary() {
        const res = await API.get('/api/cart');
        if (res.success) {
            const itemsContainer = document.getElementById('checkout-summary-items');
            const subtotalEl = document.getElementById('checkout-subtotal');
            const taxEl = document.getElementById('checkout-tax');
            const totalEl = document.getElementById('checkout-total');
            if (itemsContainer) {
                itemsContainer.innerHTML = res.items.map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
                        <span>${item.product ? item.product.name : 'Unknown'} x${item.quantity}</span>
                        <span>$${item.product ? (item.product.price * item.quantity).toFixed(2) : '0.00'}</span>
                    </div>
                `).join('');
            }
            if (subtotalEl) subtotalEl.textContent = '$' + res.total.toFixed(2);
            if (taxEl) taxEl.textContent = '$' + (res.total * 0.08).toFixed(2);
            if (totalEl) totalEl.textContent = '$' + (res.total * 1.08).toFixed(2);
        }
    },

    initCharts() {
        const revenueCtx = document.getElementById('revenueChart') || document.getElementById('adminRevenueChart');
        if (revenueCtx && typeof Chart !== 'undefined') {
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{ label: 'Revenue', data: [12000, 19000, 15000, 25000, 22000, 30000], borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }
        const userCtx = document.getElementById('adminUserChart');
        if (userCtx && typeof Chart !== 'undefined') {
            new Chart(userCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{ label: 'New Users', data: [50, 80, 65, 120, 95, 140], backgroundColor: '#10b981', borderRadius: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }
    },

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.modal-overlay')) {
                const modal = e.target.closest('.modal-overlay');
                if (e.target === modal) modal.classList.remove('active');
            }
        });
    }
};

// Router
const Router = {
    navigate(page, id = null) {
        Store.set('currentPage', page);
        if (id !== null) {
            if (page === 'product-detail') Store.set('currentProductId', id);
            if (page === 'course-detail') Store.set('currentCourseId', id);
            if (page === 'order-detail') Store.set('currentOrderId', id);
            if (page === 'invoice') Store.set('currentInvoiceId', id);
            if (page === 'certificate') Store.set('currentCertificateId', id);
        }
        UI.renderApp();
        window.scrollTo(0, 0);
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    Store.init();
    const isLoggedIn = await Auth.check();
    const currentPage = Store.get('currentPage') || 'landing';
    if (isLoggedIn && ['landing', 'login', 'register'].includes(currentPage)) {
        Router.navigate('dashboard');
    } else {
        UI.renderApp();
    }
});
