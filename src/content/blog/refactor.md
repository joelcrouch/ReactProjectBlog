---
title: "Breaking Up the Giant Script: Modularizing Your Project Setup in Python"
date: "2025-01-01"
summary: "Refactoring is good."
slug: "refactor"
---

# 🛠️ Breaking Up the Giant Script: Modularizing Your Project Setup in Python

When starting a data-heavy project, it's easy to cram all your setup logic—file structure, environments, scripts, and downloads—into one massive script. And at first, it feels convenient. But quickly, this "giant script" becomes unwieldy: hard to test, tricky to modify, and painful to debug.

Recently, I refactored such a script into a modular, scalable setup. This post outlines that journey—what I changed, why it helped, and how you can do the same.

## 🚧 The Starting Point: One Script to Rule Them All

Originally, I had a single Python file that:

- Wrote out requirements.txt and installed dependencies
- Created project folders and **init**.py files
- Downloaded datasets (MovieLens, Amazon)
- Wrote helper shell scripts
- Created notebooks and .gitignore
- Ran data validation

Each of these tasks is logical and necessary—but packed into one file, it was messy, hard to troubleshoot, and not reusable. It was over 5 or 600 lines of code. That is fine for some scenarios, but in this case, it seems much more reasonable to break it up and make it just more readable, to me. I would get in the weeds pretty quickly with that verbose of a script.

## 🧩 Step 1: Define Responsibilities with Classes

I started by identifying distinct responsibilities and creating dedicated classes:

```
| Responsibility         | Class              |
| ---------------------- | ------------------ |
| File generation        | FileManager        |
| Folder structure setup | StructureManager   |
| Environment setup      | EnvironmentManager |
| Notebook creation      | NotebookManager    |
| Script generation      | ScriptManager      |
| Dataset handling       | DatasetManager     |
```

Each class handles just one thing. This makes the logic easier to follow—and easier to test independently. I allready had them defined in classes, so I just essentially copy/pasted them into their own respective scripts.

## 📁 Step 2: Organize the Scripts Directory

Rather than stuffing everything into a flat scripts/ folder, I grouped utility logic and generators into submodules:

```
project_root/
├── scripts/
│   ├── create_config.py
│   ├── create_structure.py
│   ├── setup_environment.py
│   ├── create_files.py
│   ├── data_utils/
│   │   ├── generate_notebook.py
│   │   ├── validate_data.py
│   │   ├── download_datasets.py
```

Even if you choose to keep everything in scripts/, giving each file a clear name like create_config.py or setup_environment.py pays off in clarity and discoverability. All the scripts in 'data_utils' are associated with actually getting, parsing and preliminary cleaning/interrogation of the data. The other scripts could really be in a 'setup' directory, because-they all set up the file structure and basic nuts and bolts.

## ⚙️ Step 3: Pass a project_root Path Everywhere

Every class takes project_root (a Path object) as an argument. This keeps all paths relative, making the code portable and consistent.

```python
from pathlib import Path

project_root = Path(".").resolve()
manager = FileManager(project_root)
manager.create_gitignore()
```

No more fragile string paths or os.path.join() spaghetti.

## 🧪 Step 4: Write Code That's Easy to Test

Because each class does just one thing, it's 'easy' to write unit tests:

```python
def test_create_gitignore(tmp_path):
    fm = FileManager(tmp_path)
    assert fm.create_gitignore()
    assert (tmp_path / ".gitignore").exists()
```

Simple, clean, and completely decoupled from your production environment.

## 📦 Bonus: Install Only What You Can Install

Originally, a single missing package would break the entire dependency install. Now, by splitting requirements into:

- requirements.txt
- requirements-dev.txt
- optional.txt (e.g., large packages like TensorFlow)

...the setup can gracefully skip or isolate hard-to-install packages. You get partial progress and detailed logs, rather than total failure.

## 🧨 The Wall of Woe: Errors We Hit

This refactor wasn't just clean theory. It came with a full stack of real-world hiccups that taught us more than the structure ever could:

### ❌ source venv/Scripts/activate failed in Git Bash

- **Why**: Shell incompatibility (Windows + Bash syntax).
- **Fix**: Used PowerShell (venv\Scripts\activate) or proper Bash paths inside WSL.
  The method to activate virtual environments differs, primarily based on OS(windows vs linux/macOS), but there are even differences between git bash on windows and powershell. So learn to use the terminals that you develop on, and/or stay on Linux for development. Harsh but true for a lot of development situations.

### ❌ ModuleNotFoundError: No module named 'yaml'

- **Why**: Install silently failed midway due to one bad package, but script kept running.
- **Lesson**: Validate critical installs. A success log doesn't mean a working environment. This was a real good lesson. When the 'setup_environment.py' script failed with the tensorFlow (b/c python 3.13 vs 3.12/3.11), the entire 'pip install -r' process fails, so pyyaml and all the other libraries are not installed. WUT. YesSir. True. So bear that in mind, next time a "pip install -r ..." fails.
-

### ❌ ERROR: No matching distribution found for tensorflow>=2.13.0

- **Why**: TensorFlow hadn't released a wheel for Python 3.13.
- **Fix**: Downgraded to Python 3.10 or commented out the package temporarily.

### ❌ logger is not defined

- **Why**: Forgot to configure logging in scripts using logger.info(...).
- **Fix**: Added a basic logging block to each file:

```python
import logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)
```

This is a great spot for refactoring in the future. When all these scripts are wrapped up in a 'super_setup_script.py', then we can have a logger that we can pass into each function. It will require adding something to each function, but also removing some code that will satisfy the DRY principle.

### ❌ chmod(00755) syntax error

- **Why**: Used old-style octal; also, chmod doesn't behave meaningfully on Windows.
- **Fix**: Use chmod(0o755) on Unix-like systems, and ignore it on Windows. This is weird, and I don't know what causes this. I need to do some more research. Is it Python, or windows?

### ❌ Misunderstanding "install failure"

- **Why**: Thought pip install didn't work at all, but partial installs did go through.
- **Lesson**: Always run pip list or try importing before assuming a package is missing.

## 🧘 Final Thoughts

Refactoring a massive setup script may feel like overkill—until you try to debug it, reuse parts of it in CI/CD, or understand what's actually happening line by line.

The benefits we gained:

✅ Easier debugging  
✅ Better test coverage  
✅ Cleaner folder structure  
✅ Reusable components  
✅ Much easier to understand and maintain

## 🚀 Want to Try It?

Start small. Pick one piece of your monolithic setup script. Turn it into a class or function with a single responsibility, pass in Path("."), and return something testable.

Trust me—future-you will thank you.
