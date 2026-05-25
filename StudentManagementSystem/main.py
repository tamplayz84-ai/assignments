import tkinter as tk
from ui import StudentManagementSystemUI

def main():
    root = tk.Tk()
    app = StudentManagementSystemUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()