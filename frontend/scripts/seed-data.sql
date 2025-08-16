-- Insert sample data for testing

-- Insert admin user (password: 'password' - should be hashed in production)
INSERT INTO admin_users (id, username, password_hash, email) VALUES
('admin-1', 'admin', '$2b$10$rQZ8kHWKtGQ8mVVmYqNdxOzKQNn5n5n5n5n5n5n5n5n5n5n5n5n5n', 'admin@schoolbus.com');

-- Insert sample students
INSERT INTO students (id, name, class, school_name, pickup_location, drop_location, contact_info, monthly_fee, status) VALUES
('student-1', 'Rahul Sharma', '10th Grade', 'Delhi Public School', 'Sector 15, Noida', 'DPS Campus', '+91-9876543210', 2500.00, 'active'),
('student-2', 'Priya Patel', '8th Grade', 'Ryan International', 'Indirapuram', 'Ryan Campus', '+91-9876543211', 2200.00, 'active'),
('student-3', 'Amit Kumar', '12th Grade', 'Modern School', 'Vasundhara', 'Modern Campus', '+91-9876543212', 2800.00, 'active'),
('student-4', 'Sneha Gupta', '9th Grade', 'Delhi Public School', 'Sector 22, Noida', 'DPS Campus', '+91-9876543213', 2300.00, 'active'),
('student-5', 'Vikash Singh', '11th Grade', 'Amity International', 'Sector 44, Noida', 'Amity Campus', '+91-9876543214', 2600.00, 'active');

-- Insert sample payments
INSERT INTO payments (id, student_id, amount, payment_date, payment_mode, month, year, status) VALUES
('payment-1', 'student-1', 2500.00, '2024-01-15', 'UPI', 'January', 2024, 'completed'),
('payment-2', 'student-2', 2200.00, '2024-01-14', 'Cash', 'December', 2023, 'completed'),
('payment-3', 'student-3', 2800.00, '2024-01-13', 'Bank Transfer', 'January', 2024, 'completed'),
('payment-4', 'student-4', 2300.00, '2024-01-12', 'UPI', 'December', 2023, 'completed'),
('payment-5', 'student-5', 2600.00, '2024-01-11', 'Cash', 'January', 2024, 'completed');

-- Insert fee records for current month
INSERT INTO fee_records (id, student_id, month, year, amount_due, amount_paid, due_date, status) VALUES
('fee-1', 'student-1', 'February', 2024, 2500.00, 2500.00, '2024-02-05', 'paid'),
('fee-2', 'student-2', 'February', 2024, 2200.00, 0.00, '2024-02-05', 'pending'),
('fee-3', 'student-3', 'February', 2024, 2800.00, 2800.00, '2024-02-05', 'paid'),
('fee-4', 'student-4', 'February', 2024, 2300.00, 0.00, '2024-02-05', 'overdue'),
('fee-5', 'student-5', 'February', 2024, 2600.00, 2600.00, '2024-02-05', 'paid');

-- Insert system settings
INSERT INTO system_settings (id, setting_key, setting_value) VALUES
('setting-1', 'email_notifications', 'true'),
('setting-2', 'sms_notifications', 'true'),
('setting-3', 'reminder_days', '5'),
('setting-4', 'default_fee_amount', '2500'),
('setting-5', 'late_fee_percentage', '5'),
('setting-6', 'auto_backup', 'true'),
('setting-7', 'backup_frequency', 'daily');
