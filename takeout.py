import os
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import argparse
import time
import threading

# --- Main Configuration ---
USE_GUI = False
CONVERT_TO_TXT_NO_GUI_DEFAULT = True
EMPTY_TAKEOUT_BEFORE_PROCESS = True
AUTO_DELETE_TIMER_SECONDS = 0.0


# --- Core Logic ---

def _delete_folder_after_delay(path, delay):
    """Waits for a delay then safely deletes a folder."""
    print(f"\nScheduled deletion of '{path}' in {delay} seconds.")
    time.sleep(delay)
    try:
        if os.path.exists(path):
            shutil.rmtree(path)
            print(f"Automatically deleted '{path}'.")
    except Exception as e:
        print(f"Error during scheduled deletion of '{path}': {e}")


def get_ignored_patterns(root_dir):
    """Reads the .takeoutignore file and returns a set of patterns."""
    ignore_file = os.path.join(root_dir, '.takeoutignore')
    if not os.path.exists(ignore_file):
        return set()
    try:
        with open(ignore_file, 'r', encoding='utf-8') as f:
            return {line.strip() for line in f if line.strip() and not line.startswith('#')}
    except Exception as e:
        print(f"Error reading .takeoutignore file: {e}")
        return set()

def create_takeout(root_dir, convert_to_txt, empty_before, delete_timer, use_gui=False):
    """
    Creates the .takeout folder with the project files and structure guide.
    """
    print("Starting takeout process...")
    print(f"  - Project Directory: {root_dir}")
    print(f"  - Convert to .txt: {convert_to_txt}")
    print(f"  - Empty before process: {empty_before}")
    print(f"  - Auto-delete timer: {delete_timer}s")

    takeout_dir = os.path.join(root_dir, '.takeout')
    if empty_before and os.path.exists(takeout_dir):
        shutil.rmtree(takeout_dir)
    
    if not os.path.exists(takeout_dir):
        os.makedirs(takeout_dir)

    ignore_patterns = get_ignored_patterns(root_dir)
    print(f"  - Loaded {len(ignore_patterns)} ignore patterns.")

    structure_guide_path = os.path.join(takeout_dir, 'structure_guide.txt')
    file_paths = {}

    for dirpath, dirnames, filenames in os.walk(root_dir, topdown=True):
        dirnames[:] = [d for d in dirnames if f"{d}/" not in ignore_patterns and d not in ['.git', '.takeout']]
        for filename in filenames:
            if filename in ignore_patterns or any(filename.endswith(p[1:]) for p in ignore_patterns if p.startswith('*.')):
                continue
            file_path = os.path.join(dirpath, filename)
            if filename not in file_paths:
                file_paths[filename] = []
            file_paths[filename].append(file_path)

    with open(structure_guide_path, 'w', encoding='utf-8') as f:
        f.write(f"Project Structure for: {os.path.basename(root_dir)}\n\n")
        for root, dirs, files in os.walk(root_dir, topdown=True):
            dirs[:] = [d for d in dirs if f"{d}/" not in ignore_patterns and d not in ['.git', '.takeout']]
            level = 0 if os.path.relpath(root, root_dir) == '.' else os.path.relpath(root, root_dir).count(os.sep) + 1
            indent = '    ' * level
            f.write(f"{indent}{os.path.basename(root)}/\n")
            sub_indent = '    ' * (level + 1)
            for file in sorted(files):
                 if file not in ignore_patterns and not any(file.endswith(p[1:]) for p in ignore_patterns if p.startswith('*.')):
                    f.write(f"{sub_indent}{file}\n")

    copied_files_count = 0
    for filename, paths in file_paths.items():
        if len(paths) == 1:
            shutil.copy2(paths[0], os.path.join(takeout_dir, filename))
            copied_files_count += 1
        else:
            for path in paths:
                relative_dir = os.path.relpath(os.path.dirname(path), root_dir)
                unique_name = os.path.join(relative_dir, filename).replace(os.sep, '_')
                shutil.copy2(path, os.path.join(takeout_dir, unique_name))
                copied_files_count += 1
    print(f"  - Copied {copied_files_count} files.")

    if convert_to_txt:
        print("  - Converting files to .txt format...")
        for item_name in os.listdir(takeout_dir):
            if item_name != 'structure_guide.txt':
                os.rename(os.path.join(takeout_dir, item_name), os.path.join(takeout_dir, item_name + '.txt'))

    success_message = f"Project takeout created successfully in:\n{takeout_dir}"
    
    if delete_timer > 0:
        deletion_thread = threading.Thread(
            target=_delete_folder_after_delay,
            args=(takeout_dir, delete_timer),
            daemon=True
        )
        deletion_thread.start()
        success_message += f"\n\nNOTE: This folder will be automatically deleted in {delete_timer} seconds."

    if use_gui:
        messagebox.showinfo("Success", success_message)
    else:
        print("\n" + success_message)


# --- GUI ---
def setup_gui():
    root = tk.Tk()
    root.title("Project Takeout Tool")
    root.geometry("500x320")
    root.configure(bg="#2e2e2e")

    style = ttk.Style(root)
    style.theme_use('clam')
    style.configure("TFrame", background="#2e2e2e")
    style.configure("TLabel", background="#2e2e2e", foreground="#dcdcdc", font=("Segoe UI", 10))
    style.configure("TButton", background="#4a4a4a", foreground="#ffffff", font=("Segoe UI", 10, "bold"), borderwidth=0)
    style.map("TButton", background=[('active', '#5a5a5a')])
    style.configure("TEntry", fieldbackground="#3c3c3c", foreground="#dcdcdc", borderwidth=1, insertcolor="#dcdcdc")
    style.configure("Switch.TCheckbutton", background="#2e2e2e", foreground="#dcdcdc")
    style.map('Switch.TCheckbutton', indicatorbackground=[('selected', '#007acc'), ('!selected', '#3c3c3c')], background=[('active', '#2e2e2e')])
    style.configure("TSpinbox", fieldbackground="#3c3c3c", foreground="#dcdcdc", borderwidth=1, arrowcolor="#dcdcdc", background="#3c3c3c")

    main_frame = ttk.Frame(root, padding="20")
    main_frame.pack(expand=True, fill="both")
    
    dir_frame = ttk.Frame(main_frame)
    dir_frame.pack(fill="x", pady=(0, 15))
    dir_frame.columnconfigure(0, weight=1)
    label_dir = ttk.Label(dir_frame, text="Project Directory")
    label_dir.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 5))
    entry_dir = ttk.Entry(dir_frame, font=("Segoe UI", 10), width=40)
    entry_dir.grid(row=1, column=0, sticky="ew", ipady=5)
    entry_dir.insert(0, os.getcwd())
    button_browse = ttk.Button(dir_frame, text="Browse...", command=lambda: select_directory(entry_dir))
    button_browse.grid(row=1, column=1, sticky="e", padx=(10, 0), ipady=2)

    options_frame = ttk.Frame(main_frame)
    options_frame.pack(fill="x", pady=5)
    
    var_empty = tk.BooleanVar(value=EMPTY_TAKEOUT_BEFORE_PROCESS)
    check_empty = ttk.Checkbutton(options_frame, text="Empty .takeout folder before process", variable=var_empty, style='Switch.TCheckbutton')
    check_empty.pack(anchor="w")

    var_convert = tk.BooleanVar(value=CONVERT_TO_TXT_NO_GUI_DEFAULT)
    check_convert = ttk.Checkbutton(options_frame, text="Convert all file types to .txt", variable=var_convert, style='Switch.TCheckbutton')
    check_convert.pack(anchor="w", pady=5)
    
    timer_frame = ttk.Frame(main_frame)
    timer_frame.pack(fill="x", pady=(10, 15))
    label_timer = ttk.Label(timer_frame, text="Auto Delete Timer (seconds, 0 to disable):")
    label_timer.pack(side="left", anchor="w")
    var_timer = tk.DoubleVar(value=AUTO_DELETE_TIMER_SECONDS)
    spin_timer = ttk.Spinbox(timer_frame, from_=0.0, to=3600.0, increment=1.0, textvariable=var_timer, width=6)
    spin_timer.pack(side="right")
    
    button_run = ttk.Button(main_frame, text="Create Takeout", command=lambda: run_from_gui(entry_dir, var_convert, var_empty, var_timer), style="Accent.TButton")
    style.configure("Accent.TButton", background="#007acc", foreground="#ffffff")
    style.map("Accent.TButton", background=[('active', '#005f9e')])
    button_run.pack(fill="x", ipady=8)

    root.mainloop()

def select_directory(entry_widget):
    folder_selected = filedialog.askdirectory(initialdir=os.getcwd())
    if folder_selected:
        entry_widget.delete(0, tk.END)
        entry_widget.insert(0, folder_selected)

def run_from_gui(entry_dir_widget, var_convert_widget, var_empty_widget, var_timer_widget):
    project_dir = entry_dir_widget.get()
    if not project_dir or not os.path.isdir(project_dir):
        messagebox.showerror("Error", "Please select a valid project directory.")
        return
    try:
        timer_value = var_timer_widget.get()
        create_takeout(
            project_dir,
            convert_to_txt=var_convert_widget.get(),
            empty_before=var_empty_widget.get(),
            delete_timer=timer_value,
            use_gui=True
        )
    except tk.TclError:
        messagebox.showerror("Error", "Invalid input for delete timer. Please enter a valid number.")
    except Exception as e:
        messagebox.showerror("Error", f"An error occurred: {e}")


# --- Main Execution ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a takeout of a project directory.")
    gui_group = parser.add_mutually_exclusive_group()
    gui_group.add_argument('--gui', action='store_true', help="Force the script to run with a GUI.")
    gui_group.add_argument('--no-gui', action='store_true', help="Force the script to run without a GUI.")
    parser.add_argument('--convert-txt', action='store_true', help="Convert all files to .txt format.")
    
    parser.add_argument('--timer', type=float, default=None, help=f"Auto-delete timer in seconds. Overrides default ({AUTO_DELETE_TIMER_SECONDS}s).")
    parser.add_argument('--no-empty', dest='empty_flag', action='store_false', help="Do not empty the .takeout folder before processing.")
    
    args = parser.parse_args()

    run_with_gui = USE_GUI
    if args.gui:
        run_with_gui = True
    # --- THIS IS THE CORRECTED LINE ---
    elif args.no_gui:
        run_with_gui = False

    if run_with_gui:
        try:
            setup_gui()
        except tk.TclError:
            print("Could not launch GUI. Run with '--no-gui' flag or set USE_GUI=False in the script.")
    else:
        project_dir = os.getcwd()
        convert = args.convert_txt or CONVERT_TO_TXT_NO_GUI_DEFAULT
        empty_before_run = args.empty_flag
        delete_timer_run = args.timer if args.timer is not None else AUTO_DELETE_TIMER_SECONDS

        try:
            create_takeout(
                project_dir,
                convert_to_txt=convert,
                empty_before=empty_before_run,
                delete_timer=delete_timer_run,
                use_gui=False
            )
        except Exception as e:
            print(f"\nAn error occurred: {e}")