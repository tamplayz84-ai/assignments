import json
import os
import re

DATA_FILE = "students.json"

def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except json.JSONDecodeError:
        return {}

def save_data(data):
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)

def validate_student_data(student_id, name, student_class, age, email, phone, marks):
    if not all([student_id, name, student_class, age, email, phone, marks]):
        return "All fields are required!"
    if not student_id.isalnum():
        return "Student ID must be alphanumeric."
    if not age.isdigit() or not (5 <= int(age) <= 100):
        return "Age must be a valid number between 5 and 100."
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return "Invalid email format."
    if not (phone.isdigit() or phone.startswith('+')) or len(phone) < 7:
        return "Invalid phone number format."
    try:
        marks_val = float(marks)
        if not (0 <= marks_val <= 100):
            return "Marks must be between 0 and 100."
    except ValueError:
        return "Marks must be a numeric value."
    return None

def add_student(student_id, name, student_class, age, email, phone, marks):
    data = load_data()
    if student_id in data:
        return False, "Student ID already exists!"
    validation_err = validate_student_data(student_id, name, student_class, age, email, phone, marks)
    if validation_err:
        return False, validation_err
    data[student_id] = {
        "name": name, "class": student_class, "age": int(age),
        "email": email, "phone": phone, "marks": float(marks)
    }
    save_data(data)
    return True, "Student added successfully!"

def view_students():
    return load_data()

def search_students(query):
    data = load_data()
    results = {}
    query = query.lower().strip()
    for s_id, info in data.items():
        if query in s_id.lower() or query in info["name"].lower():
            results[s_id] = info
    return results

def update_student(student_id, name, student_class, age, email, phone, marks):
    data = load_data()
    if student_id not in data:
        return False, "Student ID not found."
    validation_err = validate_student_data(student_id, name, student_class, age, email, phone, marks)
    if validation_err:
        return False, validation_err
    data[student_id] = {
        "name": name, "class": student_class, "age": int(age),
        "email": email, "phone": phone, "marks": float(marks)
    }
    save_data(data)
    return True, "Student updated successfully!"

def delete_student(student_id):
    data = load_data()
    if student_id in data:
        del data[student_id]
        save_data(data)
        return True, "Student deleted successfully!"
    return False, "Student ID not found."

def generate_report_metrics():
    data = load_data()
    if not data:
        return None, "No student records available to generate a report."
    total_students = len(data)
    marks_list = [info["marks"] for info in data.values()]
    avg_marks = sum(marks_list) / total_students
    highest_student = max(data.items(), key=lambda x: x[1]["marks"])
    lowest_student = min(data.items(), key=lambda x: x[1]["marks"])
    passed_students = sum(1 for info in data.values() if info["marks"] >= 40)
    failed_students = total_students - passed_students
    
    report_text = (
        f"Student Result Report\n-----------------------\n"
        f"Total Students: {total_students}\nAverage Marks: {avg_marks:.2f}\n"
        f"Highest Marks: {highest_student[1]['name']} - {highest_student[1]['marks']}\n"
        f"Lowest Marks: {lowest_student[1]['name']} - {lowest_student[1]['marks']}\n"
        f"Passed Students: {passed_students}\nFailed Students: {failed_students}\n"
    )
    with open("student_report.txt", "w") as file:
        file.write(report_text)
    return report_text, None