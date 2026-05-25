import tkinter as tk
from tkinter import ttk, messagebox
import backend

class StudentManagementSystemUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Student Management System")
        self.root.geometry("1100x550")
        
        title_label = tk.Label(root, text="Student Management System", font=("Arial", 20, "bold"), bg="#2c3e50", fg="white", pady=10)
        title_label.pack(side=tk.TOP, fill=tk.X)
        
        main_frame = tk.Frame(root, padx=15, pady=15)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        left_frame = tk.LabelFrame(main_frame, text="Student Management Form", font=("Arial", 11, "bold"), padx=10, pady=10)
        left_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 15))
        
        right_frame = tk.LabelFrame(main_frame, text="Student Records Lookup", font=("Arial", 11, "bold"), padx=10, pady=10)
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        fields = [
            ("Student ID:", "id"), ("Name:", "name"), ("Class:", "class"),
            ("Age:", "age"), ("Email:", "email"), ("Phone Number:", "phone"), ("Marks:", "marks")
        ]
        self.entries = {}
        for i, (label_text, key) in enumerate(fields):
            lbl = tk.Label(left_frame, text=label_text, font=("Arial", 10))
            lbl.grid(row=i, column=0, sticky="w", pady=6)
            entry = tk.Entry(left_frame, font=("Arial", 10), width=28)
            entry.grid(row=i, column=1, pady=6, padx=5)
            self.entries[key] = entry
            
        btn_frame = tk.Frame(left_frame, pady=10)
        btn_frame.grid(row=len(fields), column=0, columnspan=2, sticky="ew")
        
        tk.Button(btn_frame, text="Add Student", bg="#2ecc71", fg="white", font=("Arial", 10, "bold"), width=12, command=self.add_record).grid(row=0, column=0, padx=4, pady=5)
        tk.Button(btn_frame, text="Update Record", bg="#3498db", fg="white", font=("Arial", 10, "bold"), width=12, command=self.update_record).grid(row=0, column=1, padx=4, pady=5)
        tk.Button(btn_frame, text="Delete Record", bg="#e74c3c", fg="white", font=("Arial", 10, "bold"), width=12, command=self.delete_record).grid(row=1, column=0, padx=4, pady=5)
        tk.Button(btn_frame, text="Clear Fields", bg="#95a5a6", fg="white", font=("Arial", 10, "bold"), width=12, command=self.clear_fields).grid(row=1, column=1, padx=4, pady=5)
        
        tk.Button(left_frame, text="📊 Generate Report", bg="#9b59b6", fg="white", font=("Arial", 11, "bold"), height=2, command=self.display_report).grid(row=len(fields)+1, column=0, columnspan=2, sticky="ew", pady=10)

        columns = ("id", "name", "class", "age", "email", "phone", "marks", "status")
        self.tree = ttk.Treeview(right_frame, columns=columns, show="headings")
        headings = {"id": "ID", "name": "Name", "class": "Class", "age": "Age", "email": "Email", "phone": "Phone", "marks": "Marks", "status": "Status"}
        widths = {"id": 60, "name": 120, "class": 60, "age": 45, "email": 140, "phone": 100, "marks": 55, "status": 65}
        
        for col, head in headings.items():
            self.tree.heading(col, text=head)
            self.tree.column(col, width=widths[col], anchor="center" if col in ["id","age","marks","status","class"] else "w")
            
        scrollbar = ttk.Scrollbar(right_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        self.tree.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y, before=self.tree)
        self.tree.bind("<<TreeviewSelect>>", self.get_selected_row)

        search_frame = tk.Frame(right_frame, pady=10)
        search_frame.pack(side=tk.BOTTOM, fill=tk.X)
        tk.Label(search_frame, text="Search (ID / Name):", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=5)
        self.search_entry = tk.Entry(search_frame, font=("Arial", 10), width=30)
        self.search_entry.pack(side=tk.LEFT, padx=5)
        
        tk.Button(search_frame, text="Find", bg="#34495e", fg="white", font=("Arial", 9, "bold"), width=8, command=self.search_records).pack(side=tk.LEFT, padx=5)
        tk.Button(search_frame, text="Reset Table", bg="#7f8c8d", fg="white", font=("Arial", 9, "bold"), width=10, command=self.refresh_table).pack(side=tk.LEFT, padx=5)
        self.refresh_table()

    def refresh_table(self, data=None):
        self.tree.delete(*self.tree.get_children())
        records = data if data is not None else backend.view_students()
        for s_id, info in records.items():
            status = "Pass" if info["marks"] >= 40 else "Fail"
            self.tree.insert("", tk.END, values=(s_id, info["name"], info["class"], info["age"], info["email"], info["phone"], info["marks"], status))

    def clear_fields(self):
        for entry in self.entries.values():
            entry.delete(0, tk.END)
        self.entries["id"].config(state=tk.NORMAL)

    def get_selected_row(self, event):
        selected_item = self.tree.focus()
        if not selected_item: return
        values = self.tree.item(selected_item, "values")
        self.clear_fields()
        keys = ["id", "name", "class", "age", "email", "phone", "marks"]
        for idx, key in enumerate(keys):
            self.entries[key].insert(0, values[idx])
        self.entries["id"].config(state=tk.DISABLED)

    def add_record(self):
        success, message = backend.add_student(
            self.entries["id"].get().strip(), self.entries["name"].get().strip(),
            self.entries["class"].get().strip(), self.entries["age"].get().strip(),
            self.entries["email"].get().strip(), self.entries["phone"].get().strip(),
            self.entries["marks"].get().strip()
        )
        if success:
            self.clear_fields(); self.refresh_table(); messagebox.showinfo("Success", message)
        else: messagebox.showerror("Error", message)

    def update_record(self):
        self.entries["id"].config(state=tk.NORMAL)
        s_id = self.entries["id"].get().strip()
        self.entries["id"].config(state=tk.DISABLED)
        success, message = backend.update_student(
            s_id, self.entries["name"].get().strip(),
            self.entries["class"].get().strip(), self.entries["age"].get().strip(),
            self.entries["email"].get().strip(), self.entries["phone"].get().strip(),
            self.entries["marks"].get().strip()
        )
        if success:
            self.clear_fields(); self.refresh_table(); messagebox.showinfo("Success", message)
        else: messagebox.showerror("Error", message)

    def delete_record(self):
        self.entries["id"].config(state=tk.NORMAL)
        s_id = self.entries["id"].get().strip()
        if not s_id:
            messagebox.showerror("Error", "Please select a student from the table to delete.")
            return
        if messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete student ID: {s_id}?"):
            success, message = backend.delete_student(s_id)
            if success: self.clear_fields(); self.refresh_table(); messagebox.showinfo("Deleted", message)
            else: messagebox.showerror("Error", message)
        else: self.entries["id"].config(state=tk.DISABLED)

    def search_records(self):
        query = self.search_entry.get()
        if not query.strip():
            messagebox.showwarning("Warning", "Please type a Search text first.")
            return
        self.refresh_table(data=backend.search_students(query))

    def display_report(self):
        report_text, error = backend.generate_report_metrics()
        if error: messagebox.showerror("Error", error)
        else: messagebox.showinfo("System Analytical Report", report_text)