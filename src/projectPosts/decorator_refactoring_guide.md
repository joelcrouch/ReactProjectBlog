# The Decorator's Unexpected Guest: Refactoring, Circular Imports, and the Path to Clean Code

Refactoring is like tidying up before a party, it makes the house (or codebase) cleaner, easier to move around in, and more welcoming for future visitors. In Python, decorators often feel like the perfect guests to invite: they're polite, reusable, and know exactly how to wrap up repetitive logic.

But sometimes, when you open the door for a decorator, they bring along an **unexpected guest**. That's what happened in our Flask service when a seemingly simple refactor ended up crashing our Docker container before the party even started.

## Setting the Table: Why We Invited the Decorator

Our `garmin_api.py` file had grown cluttered with two patterns repeated in every endpoint:

**Login check:**
```python
if not api_client or not api_client.username:
```

**Error handling:**
```python
try: ... except Exception as e:
```

It was boilerplate, and the cure was obvious: a decorator, `garmin_api_wrapper`, that would take care of these chores and leave the endpoints free to focus on their real work.

So we wrote `garmin_utils.py` to host our guest of honor:

```python
# Initial (problematic) garmin_utils.py
from functools import wraps
from flask import jsonify

import garmin_api  # <-- This was the fateful invitation

def garmin_api_wrapper(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not garmin_api.api_client or not garmin_api.api_client.username:
            return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
        try:
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Error in {f.__name__}: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    return decorated_function
```

## The Unexpected Guest Arrives

We rebuilt the Docker containers, expecting a cleaner codebase and leaner endpoints. Instead, the Python service collapsed on startup. Checking the logs revealed the culprit:

```
ImportError: cannot import name 'garmin_api_wrapper' from partially initialized module 'garmin_utils'
```

Our decorator had brought an **unexpected guest**: the dreaded **circular import**.

**Why?**
- `garmin_api.py` needed the decorator from `garmin_utils.py`.
- But `garmin_utils.py` had imported `garmin_api`.
- Python tried to load `garmin_api` while it was still half-dressed, caught in the import cycle.

The party was over before it began.

## Kicking Out the Guest (Without Offending the Host)

The decorator needed `api_client`, but importing `garmin_api` directly caused the loop. The solution was to be a little sneakier: instead of asking `garmin_api` for `api_client`, we'd fetch it from the global scope of the decorated function's module.

```python
# Final garmin_utils.py
from functools import wraps
from flask import jsonify

def garmin_api_wrapper(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        global_api_client = f.__globals__.get('api_client')

        if not global_api_client or not global_api_client.username:
            return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
        try:
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Error in {f.__name__}: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500
    return decorated_function
```

By pulling `api_client` from `f.__globals__`, we broke the dependency cycle. The decorator could still do its job, but without dragging `garmin_api` in through the back door.

## Party Restored

After this change, the Docker containers rebuilt cleanly, the Flask service started, and all 13 unit tests passed. The decorator did its job, the imports behaved, and the party was back on.

## Lessons from an Unexpected Guest

Decorators are powerful because they tidy up our code and make it easier to maintain. But they also introduce new dependencies, and if we're not careful, they might bring along unexpected guests like circular imports.

The takeaway?
- Refactor boldly, but watch your imports.
- When decorators threaten to pull in unwanted company, remember you can lean on Python's introspection (`f.__globals__`) to keep the guest list under control.

In coding, as in life, the right guest can make the party, but only if you manage the invitations wisely.

## Explanation and Next Steps

Fetching from `f.__globals__` isn't really "industry standard." It's more of a pragmatic workaround for specific cases like this one (breaking a circular import). The technique leverages Python's introspection to look inside a function's module, but it's not something you'd see every day in production frameworks.

### Why does it work?

Every Python function has a reference to the global namespace in which it was defined. That's what `f.__globals__` points to: a dictionary representing the module-level variables where `f` lives.

So if you decorate `get_activities()` in `garmin_api.py`, then:
- `f` is `get_activities`.
- `f.__globals__` is essentially the `globals()` dict of `garmin_api.py`.
- `f.__globals__.get("api_client")` gives you the `api_client` defined at the top of `garmin_api.py`.

This sidesteps the need for `garmin_utils.py` to import `garmin_api`, which would cause the circular import.

### Why it's not "standard"

- **Readability**: Someone unfamiliar with `__globals__` might scratch their head "where did this variable come from?"
- **Tight coupling**: You're still depending on `garmin_api` having a global `api_client`. It's just hidden behind introspection.
- **Fragility**: If `garmin_api` ever changes how it manages state (e.g., moves `api_client` into a class), the decorator breaks silently.
These are breaking the ten commandments of Clean Code.  


### What's more standard?

#### 1. Dependency Injection
Make dependencies explicit by passing `api_client` where it's needed, instead of hiding it in globals.

```python
def garmin_api_wrapper(api_client):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not api_client or not api_client.username:
                return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
            try:
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'status': 'error', 'message': str(e)}), 500
        return decorated_function
    return decorator
```

#### 2. Flask Application Context (`g`)
Flask provides a per-request `g` object for exactly this kind of problem. Store the `api_client` after login, and let the decorator check it:

```python
from flask import g, jsonify
from functools import wraps

def garmin_api_wrapper(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(g, "api_client") or not g.api_client.username:
            return jsonify({'status': 'error', 'message': 'Not logged in'}), 401
        try:
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 500
    return decorated_function
```

And in your login route:

```python
@app.route("/login", methods=["POST"])
def login():
    g.api_client = GarminClient(username, password)
    return jsonify({'status': 'ok'})
```

This avoids global variables, plays nicely with Flask's request lifecycle, and eliminates the circular import problem altogether.

## ✅ Next steps:
- Stick with `f.__globals__` if you need a quick, effective workaround.
- For long-term maintainability, consider moving to **dependency injection** or **Flask's `g` context**, which are cleaner and more standard approaches in production Python apps.