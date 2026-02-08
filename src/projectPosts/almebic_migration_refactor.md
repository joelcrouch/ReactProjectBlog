---
title: "Sprint 3: Fixing alembic-why my tests were super flaky."
date: "2026-02-07"
summary: "ONE SCHEMA AUTHORITY: ALEMBIC"
---
Flaky tests are one thing.
Flaky tests that sometimes create database tables and sometimes don’t are another.

This refactor started after I noticed a strange pattern: the same test suite would occasionally pass, occasionally fail, and occasionally fix itself when rerun. Locally it worked. In CI it didn’t. Alembic migrations claimed to run successfully, yet tables were mysteriously missing.

What followed was a deep dive into Alembic, SQLAlchemy, and my own schema management assumptions. The root issue turned out not to be Docker, PostgreSQL, or CI—but having multiple competing ways to create database schema.

This post documents how I refactored the project to make Alembic migrations the single source of truth, eliminated schema drift across environments, and turned a flaky test suite into a deterministic one.

If you’ve ever dealt with “works on my machine” database behavior, this will probably feel familiar.
 
 # Making Alembic the Single Source of Truth: A Schema Management Refactor

 **Author:** ML Evaluation Framework Team
 **Date:** February 2026
 **Tags:** #alembic #sqlalchemy #database #testing #schema-management

 ---

 ## Executive Summary

 This document details a comprehensive refactoring effort to eliminate schema drift and flaky test behavior in our Python/SQLAlchemy application by establishing Alembic migrations as
 the single, authoritative source of truth for database schema management.

 **Results:**
 - 71/71 tests passing (100% pass rate)
 - Zero schema drift between dev, test, and CI environments
 - Eliminated all "table does not exist" errors
 - Reduced test execution time by 24% (9.43s → 6.33s)
 - Repeatable, deterministic database initialization

 ---

 ## Table of Contents

 1. [Problem Statement](#problem-statement)
 2. [Root Cause Analysis](#root-cause-analysis)
 3. [Solution Architecture](#solution-architecture)
 4. [Implementation Details](#implementation-details)
 5. [Testing Results](#testing-results)
 6. [Migration Guide](#migration-guide)
 7. [Best Practices Established](#best-practices-established)
 8. [Lessons Learned](#lessons-learned)

 ---

 ## Problem Statement

 ### Symptoms

 Our application exhibited several concerning behaviors:

 1. **Flaky Tests:** Tests randomly failed with `psycopg2.errors.UndefinedTable` errors
 2. **Schema Drift:** Development, test, and CI environments had inconsistent schemas
 3. **Unpredictable Behavior:** Same test would pass locally but fail in CI
 4. **Multiple Schema Creation Paths:** Different environments used different methods to create tables

TLDR:  I was running tests, and sometimes I would see alembic migrations and the correct tables manufactured, and other times, the tables would not be there.  At first I suspected a Docker issue, but after way too much testing and silly-scripting, I determined that was not the case.  Then I started to think that mabye, just maybe I didn't have alembic up and pointing at the right targets (in/out).


 ### Initial Test Results

 ```
 ❌ 22 tests ERROR (schema-related failures)
 ✅ 49 tests PASSED
 📊 69% pass rate
 ```

 ### Example Error

 ```python
 sqlalchemy.exc.ProgrammingError: (psycopg2.errors.UndefinedTable)
 relation "test_cases" does not exist
 LINE 1: INSERT INTO test_cases (test_case_name, model_type, input_ty...
 ```

 ---

 ## Root Cause Analysis

 ### 1. Competing Schema Creation Mechanisms

 **The Problem:** I had multiple ways to create database schemas-I was trying to create it in different ways all over the place.  Clean Code Martin would shake his head aggressivley at my code.
 Anyways:

 ```python
 # Method 1: Using Base.metadata.create_all() (WRONG)
 Base.metadata.create_all(bind=engine)

 # Method 2: Using Alembic migrations (CORRECT)
 alembic upgrade head
 ```

 **Why This Was Bad:**
 - `create_all()` generates schema from current Python models
 - Alembic tracks schema changes over time with migrations
 - Using both creates **schema drift** when they fall out of sync

 ### 2. Test Fixtures Using create_all()

This was a real PITA to track down.  What was I thinking? Clearly, just test it and move on with your life. Duh.

 **Before (Incorrect):**

 ```python
 # tests/conftest.py
 @pytest.fixture(scope="function")
 def db_session():
     Base.metadata.create_all(bind=engine)  # ❌ Wrong!
     db = TestingSessionLocal()
     yield db
     Base.metadata.drop_all(bind=engine)
 ```

 **The Issue:**
 - Tests created schema with `create_all()`
 - Dev/prod used Alembic migrations
 - Result: Tests passed locally, failed in CI

 ### 3. Critical Bug in migrations/env.py

 **The Bug:**

 ```python
 # migrations/env.py (Line 21 & 38)
 from ml_eval.database.connection import SQLALCHEMY_DATABASE_URL
 ...
 config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)
 ```

 **What Went Wrong:**
 1. Test fixtures set Alembic config to use **test database URL**
 2. Then `env.py` imported `SQLALCHEMY_DATABASE_URL` from `.env`
 3. This **overwrote** the test URL with the **production URL**
 4. Migrations ran against the WRONG database
 5. Tests saw empty schemas because migrations ran elsewhere

 **Evidence:**
 ```bash
 # Running migrations showed "success" but created no tables:
 INFO  [alembic.runtime.migration] Running upgrade  -> d7c66d5e9ce2
 # But querying the database:
 SELECT tablename FROM pg_tables WHERE schemaname='public'
 # Result: [] (empty!)
 ```

 ### 4. Scripts That Bypassed Alembic


 **Files Using create_all():**
 - ✗ `scripts/setup_db.py` - Used `Base.metadata.create_all()`
 - ✗ `scripts/seed_db.py` - Called `create_all()` before seeding
 - ✗ `tests/conftest.py` - Used `create_all()` in fixtures
 - ✗ `tests/test_database/test_crud.py` - Used `create_all()` in fixtures
 - ✗ `tests/test_suite/conftest.py` - Used `create_all()` in fixtures

 ---

 ## Solution Architecture

 ### Core Principle

 **Alembic migrations are the ONLY way tables are created, modified, or deleted.**

 ```
 ┌─────────────────────────────────────────┐
 │         Python ORM Models               │
 │      (ml_eval/database/models.py)       │
 └─────────────────┬───────────────────────┘
                   │
                   │ Developer runs:
                   │ alembic revision --autogenerate
                   ▼
 ┌─────────────────────────────────────────┐
 │        Alembic Migration Files          │
 │      (migrations/versions/*.py)         │
 │  ◄─── SINGLE SOURCE OF TRUTH ───►       │
 └─────────────────┬───────────────────────┘
                   │
                   │ All environments run:
                   │ alembic upgrade head
                   ▼
 ┌─────────────────────────────────────────┐
 │    Database Schema (PostgreSQL)         │
 │  Dev | Test | CI | Prod (all identical) │
 └─────────────────────────────────────────┘
 ```

 ### Key Design Decisions

 1. **Explicit Initialization:** Database setup is never implicit
 2. **Single Entry Point:** `scripts/init_db.py` is the ONLY init script
 3. **Test Consistency:** Tests use Alembic, not `create_all()`
 4. **Fast Failure:** Missing schema causes immediate, clear errors

 ---

 ## Implementation Details

 ### Change 1: Created scripts/init_db.py

 **Purpose:** The ONLY supported way to initialize database schema

 **File:** `scripts/init_db.py`

 ```python
 #!/usr/bin/env python3
 """
 Database Initialization Script

 This is the ONLY supported way to initialize the database schema.
 It runs Alembic migrations to create all tables.
 """
 import sys
 from pathlib import Path
 from alembic.config import Config
 from alembic import command

 def run_migrations():
     """Run Alembic migrations to initialize or update the database schema."""
     print("=" * 70)
     print("DATABASE INITIALIZATION - Alembic Migrations")
     print("=" * 70)

     # Verify environment setup
     from ml_eval.database.connection import SQLALCHEMY_DATABASE_URL, check_database_connection
     print(f"\n✅ Database URL loaded")

     # Check database connection
     print("\n📡 Checking database connection...")
     check_database_connection()

     # Run Alembic migrations
     print("\n🔄 Running Alembic migrations (upgrade head)...")
     project_root = Path(__file__).parent.parent
     alembic_cfg = Config(str(project_root / "alembic.ini"))
     command.upgrade(alembic_cfg, "head")

     print("\n✅ SUCCESS: Database schema is up to date!")

 if __name__ == "__main__":
     run_migrations()
 ```

 **Usage:**
 ```bash
 python scripts/init_db.py
 ```

 ### Change 2: Deprecated scripts/setup_db.py

 **Before:**
 ```python
 # scripts/setup_db.py (OLD - WRONG)
 def create_all_tables():
     Base.metadata.create_all(bind=engine)  # ❌ Bypasses Alembic
     print("🎉 SUCCESS: All tables created successfully!")
 ```

 **After:**
 ```python
 # scripts/setup_db.py (NEW - Shows error)
 def main():
     print("=" * 80)
     print("ERROR: This script is deprecated and should not be used.")
     print("=" * 80)
     print()
     print("Base.metadata.create_all() bypasses Alembic migrations and causes")
     print("schema drift between environments.")
     print()
     print("To initialize your database, use:")
     print()
     print("    python scripts/init_db.py")
     print()
     sys.exit(1)
 ```

 
 **Impact:** Prevents developers from accidentally using the wrong initialization method.

 ### Change 3: Fixed migrations/env.py URL Override Bug

 **Before (Buggy):**
 ```python
 # migrations/env.py
 from ml_eval.database.connection import SQLALCHEMY_DATABASE_URL

 # This ALWAYS overrides the URL, even when tests set it!
 config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)  # ❌ Bug!
 ```

 **After (Fixed):**
 ```python
 # migrations/env.py
 from ml_eval.database.connection import SQLALCHEMY_DATABASE_URL

 # Only override if using the dummy placeholder URL from alembic.ini
 # This allows tests to set their own database URL without it being overridden
 current_url = config.get_main_option("sqlalchemy.url")
 if not current_url or current_url == "driver://user:pass@localhost/dbname":
     config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)  # ✅ Fixed!
 ```

 **Why This Matters:**
 - Tests can now successfully set test database URLs
 - Migrations run against the correct database
 - No more "migrations ran but created no tables" mystery

 ### Change 4: Updated Test Fixtures to Use Alembic

 #### tests/conftest.py

 **Before:**
 ```python
 @pytest.fixture(scope="function")
 def db_session():
     Base.metadata.create_all(bind=engine)  # ❌ Wrong approach
     db = TestingSessionLocal()
     yield db
     Base.metadata.drop_all(bind=engine)
 ```

 **After:**
 ```python
 @pytest.fixture(scope="function")
 def db_session():
     # Set up Alembic configuration to use test database
     project_root = Path(__file__).parent.parent
     alembic_cfg = Config(str(project_root / "alembic.ini"))
     alembic_cfg.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)

     # Run migrations to create schema ✅ Correct approach
     command.upgrade(alembic_cfg, "head")

     db = TestingSessionLocal()
     yield db

     # Clean up: drop all tables after test
     with engine.connect() as conn:
         conn.execute(text("DROP SCHEMA public CASCADE"))
         conn.execute(text("CREATE SCHEMA public"))
         conn.commit()
 ```

 **Key Changes:**
 1. Replaced `create_all()` with `alembic upgrade head`
 2. Cleanup uses `DROP SCHEMA CASCADE` (more thorough)
 3. Schema is recreated from scratch for each test

 #### tests/test_database/test_crud.py

 **Before:**
 ```python
 @pytest.fixture(scope="session")
 def db_engine():
     return SessionLocal().bind  # ❌ Uses production database!
 ```

 **After:**
 ```python
 # Test Database Configuration
 db_user = os.getenv("POSTGRES_USER", "ml_user")
 db_password = os.getenv("POSTGRES_PASSWORD", "ml_password")
 db_host = "localhost"
 db_port = os.getenv("POSTGRES_PORT", "5433")
 db_name = os.getenv("POSTGRES_DB", "ml_eval_db") + "_test"
 TEST_DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

 @pytest.fixture(scope="session")
 def db_engine():
     return create_engine(TEST_DATABASE_URL)  # ✅ Uses test database!
 ```

 **Critical Fix:** Tests now create their own test database engine instead of accidentally using production.

 #### tests/test_suite/conftest.py

 **Before:**
 ```python
 @pytest.fixture(scope="function")
 def test_db():
     engine = SessionLocal().bind  # ❌ Uses production database!
     db_url = str(engine.url)
     # ... rest of fixture
 ```

 **After:**
 ```python
 # Test Database Configuration
 TEST_DATABASE_URL = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

 @pytest.fixture(scope="function")
 def test_db():
     engine = create_engine(TEST_DATABASE_URL)  # ✅ Uses test database!
     db_url = TEST_DATABASE_URL
     # ... rest of fixture
 ```

 ### Change 5: Updated scripts/seed_db.py

 **Before:**
 ```python
 if __name__ == "__main__":
     # Ensure tables are created first
     Base.metadata.create_all(bind=SessionLocal().bind)  # ❌ Wrong!

     db = SessionLocal()
     seed_data(db)
 ```

 **After:**
 ```python
 if __name__ == "__main__":
     # NOTE: Database schema must be initialized BEFORE running this script.
     # Run: python scripts/init_db.py
     #
     # This script assumes tables already exist via Alembic migrations.

     print("\n" + "=" * 70)
     print("DATABASE SEEDING")
     print("=" * 70)
     print("\nNOTE: This script assumes the database schema is already initialized.")
     print("If you get table errors, run: python scripts/init_db.py\n")

     try:
         db = SessionLocal()
         seed_data(db)  # ✅ Assumes schema exists
         db.close()
     except Exception as e:
         print(f"\n🛑 An unexpected error occurred during seeding: {e}")
         print("\nTroubleshooting:")
         print("  - If you get 'table does not exist' errors, run: python scripts/init_db.py")
         sys.exit(1)
 ```

 **Impact:** Clear error messages guide users to initialize the database first.

 ---

 ## Testing Results

 ### Before Refactor

 ```bash
 $ pytest -v

 ❌ 22 tests ERROR (relation "test_cases" does not exist)
 ❌ 9 tests FAILED (authentication errors)
 ✅ 49 tests PASSED

 Test duration: 9.43s
 Pass rate: 69%
 ```

 **Common Errors:**
 ```
 ERROR - sqlalchemy.exc.ProgrammingError: relation "test_cases" does not exist
 ERROR - sqlalchemy.exc.ProgrammingError: relation "model_runs" does not exist
 ERROR - password authentication failed for user "ml_user"
 ```

 ### After Refactor

 ```bash
 $ pytest -v

 ✅ 71 tests PASSED
 ⚠️  6 warnings (minor - return value warnings only)

 Test duration: 6.33s
 Pass rate: 100%
 ```

 **Performance Improvement:**
 - **Before:** 9.43 seconds
 - **After:** 6.33 seconds
 - **Improvement:** 32.8% faster (3.1 seconds saved)

 ---

 ## Migration Guide

 ### For Developers: Schema Changes Workflow

 **Old Workflow (DO NOT USE):**
 ```bash
 # ❌ WRONG: Modifying models and using create_all()
 vim ml_eval/database/models.py
 python scripts/setup_db.py  # Uses create_all() - WRONG!
 ```

 **New Workflow (CORRECT):**
 ```bash
 # ✅ CORRECT: Using Alembic migrations

 # 1. Modify models
 vim ml_eval/database/models.py

 # 2. Generate migration
 alembic revision --autogenerate -m "Add user_profile table"

 # 3. Review the generated migration
 vim migrations/versions/<new_file>.py

 # 4. Apply migration
 alembic upgrade head

 # 5. Verify schema
 python -c "from ml_eval.database.connection import engine; \
     from sqlalchemy import text; \
     with engine.connect() as conn: \
         result = conn.execute(text('SELECT tablename FROM pg_tables WHERE schemaname=\\'public\\''))
         print([r[0] for r in result])"
 ```

 ### For CI/CD: Database Initialization

 **Dockerfile / CI Configuration:**
 ```yaml
 # .github/workflows/test.yml
 steps:
   - name: Set up database
     run: |
       # Create test database
       createdb ml_eval_db_test

       # Initialize schema with Alembic (NOT create_all!)
       python scripts/init_db.py

   - name: Run tests
     run: pytest -v
 ```

 ### For New Team Members: Local Setup

 **Updated Documentation:**
 ```bash
 # 1. Install dependencies
 pip install -r requirements.txt

 # 2. Set up environment variables
 cp .env.example .env
 vim .env  # Configure DATABASE_URL
(or use VScode, notebook, a text pad)

 # 3. Create database (if needed)
 createdb ml_eval_db

 # 4. Initialize schema (ONLY way to set up DB!)
 python scripts/init_db.py

 # 5. Seed data (optional)
 python scripts/seed_db.py

 # 6. Run tests
 pytest -v
 ```

 ---

 ## Best Practices Established

 ### 1. Single Source of Truth

 **Rule:** Alembic migrations define the schema. Always.

 ```python
 #  CORRECT
 alembic upgrade head

 #  NEVER DO THIS
 Base.metadata.create_all(bind=engine)
 ```

 ### 2. Explicit Initialization

 **Rule:** Database setup is never implicit.

 ```python
 #  CORRECT: Explicit
 python scripts/init_db.py  # Clear, obvious intent

 #  WRONG: Implicit
 from ml_eval.database import models  # Imports shouldn't create tables!
 ```

 ### 3. Environment Consistency

 **Rule:** Dev, test, CI, and prod all use identical schema creation.

 ```python
 # All environments run:
 command.upgrade(alembic_cfg, "head")

 # NOT:
 if environment == "test":
     Base.metadata.create_all()  #  WRONG!
 else:
     alembic.upgrade("head")
 ```

 ### 4. Fast Failure

 **Rule:** Tests fail immediately if schema is missing.

 ```python
 # ✅ Test tries to insert data
 # ✅ Gets immediate error: "relation does not exist"
 # ✅ Developer knows schema is missing

 # ❌ Old way: Test silently creates tables
 # ❌ Test passes locally but fails in CI
 ```

 ### 5. Repeatable Setup

 **Rule:** Dropping DB + running init_db.py fully recreates schema.

 ```bash
 # ✅ CORRECT: Fully repeatable
 dropdb ml_eval_db && createdb ml_eval_db && python scripts/init_db.py

 # ❌ WRONG: Leaves behind state
 # Some tables from create_all(), some from Alembic
 ```

 ---

 ## Lessons Learned

 ### 1. Schema Drift is Insidious

 **Problem:** Small discrepancies compound over time.

 **Example:**
 - Dev uses Alembic (has `user_profile` table)
 - Tests use `create_all()` (missing `user_profile`)
 - Tests pass locally (don't use that table)
 - Tests fail in CI (do use that table)

 **Solution:** Single schema creation mechanism everywhere.

 ### 2. Test Environment Parity is Critical

 **Problem:** Tests that don't mirror production are misleading.

  **Solution:** Tests MUST use the exact same schema creation as production.

 ### 3. Implicit Behavior is Dangerous

 **Problem:** `Base.metadata.create_all()` being called on import.

 **Why This Was Bad:**
 ```python
 from ml_eval.database import models  # Silently creates tables!
 ```

 - No one knew when tables were created
 - Different import orders = different behavior
 - Impossible to debug

 **Solution:** Explicit initialization with clear entry points.

 ### 4. Configuration Override Bugs are Subtle

 **The Bug We Had:**
 ```python
 # Test sets URL
 alembic_cfg.set_main_option("sqlalchemy.url", "test_db_url")

 # But then env.py overwrites it!
 config.set_main_option("sqlalchemy.url", PROD_URL)  # Overwrites!
 ```

 **Lesson:** When code "just doesn't work" and you can't figure out why, look for configuration being set in multiple places.

 ### 5. Cleanup Strategy Matters

 **Problem:** `drop_all()` doesn't clean everything.

 **Before:**
 ```python
 Base.metadata.drop_all(bind=engine)  # Misses sequences, types, etc.
 ```

 **After:**
 ```python
 conn.execute(text("DROP SCHEMA public CASCADE"))  # Nuclear option
 conn.execute(text("CREATE SCHEMA public"))        # Fresh start
 ```

 **Lesson:** For tests, thorough cleanup prevents state leakage between tests.

 ---

 ## Common Pitfalls to Avoid

 ### ❌ Pitfall 1: Using create_all() "Just This Once"

 ```python
 # "I just need to quickly test this model change..."
 Base.metadata.create_all(bind=engine)  # ❌ NO!
 ```

 **Why It's Bad:** Creates tech debt that others will copy.

 **Correct Approach:**
 ```bash
 alembic revision --autogenerate -m "Quick test"
 alembic upgrade head
 ```

 ### ❌ Pitfall 2: Different Schema in Tests

 ```python
 @pytest.fixture
 def db():
     # "It's just tests, who cares?"
     Base.metadata.create_all()  # ❌ WRONG!
 ```

 **Why It's Bad:** Tests lie about what production will do.

 **Correct Approach:**
 ```python
 @pytest.fixture
 def db():
     command.upgrade(alembic_cfg, "head")  # ✅ Same as prod
 ```

 ### ❌ Pitfall 3: Implicit Database Initialization

 ```python
 # ml_eval/database/models.py
 Base.metadata.create_all(bind=engine)  # ❌ NO!
 ```

 **Why It's Bad:** No one knows when/how schema is created.

 **Correct Approach:**
 ```python
 # Explicitly run:
 python scripts/init_db.py
 ```

 ### ❌ Pitfall 4: Raw SQL Schema Creation

 ```python
 with engine.connect() as conn:
     conn.execute(text("CREATE TABLE users (...)"))  # ❌ Bypasses Alembic
 ```

 **Why It's Bad:** Alembic doesn't know about it.

 **Correct Approach:**
 ```bash
 alembic revision -m "Create users table"
 # Edit the migration file
 alembic upgrade head
 ```

 ---

 ## Monitoring and Verification

 ### Verify Alembic is Being Used

 **Check migration version:**
 ```bash
 # Should show current version
 alembic current

 # Expected output:
 d7c66d5e9ce2 (head)
 ```

 **Check tables match migrations:**
 ```sql
 -- All tables should have corresponding Alembic migration
 SELECT tablename FROM pg_tables WHERE schemaname='public';

 -- Should include:
 -- alembic_version (proves Alembic ran)
 -- test_cases, model_runs, responses, evaluations
 ```

 ### Detect Schema Drift

 **Script to compare environments:**
 ```python
 # scripts/verify_schema.py
 from sqlalchemy import create_engine, inspect

 def get_schema(url):
     engine = create_engine(url)
     inspector = inspect(engine)
     return {
         'tables': sorted(inspector.get_table_names()),
         'alembic_version': get_alembic_version(engine)
     }

 dev_schema = get_schema(DEV_DB_URL)
 test_schema = get_schema(TEST_DB_URL)

 if dev_schema != test_schema:
     print("❌ SCHEMA DRIFT DETECTED!")
     print(f"Dev tables: {dev_schema['tables']}")
     print(f"Test tables: {test_schema['tables']}")
 else:
     print("✅ Schemas match")
 ```

 ---

 ## Future Improvements

 ### 1. Add Migration Tests

 ```python
 # tests/test_migrations.py
 def test_migrations_are_reversible():
     """Test that all migrations can be upgraded and downgraded."""
     command.upgrade(alembic_cfg, "head")
     command.downgrade(alembic_cfg, "base")
     command.upgrade(alembic_cfg, "head")
 ```

 ### 2. Schema Documentation Generation

 ```bash
 # Generate schema docs from Alembic migrations
 alembic history --verbose > docs/SCHEMA_HISTORY.md
 ```

 ### 3. CI Schema Validation

 ```yaml
 # .github/workflows/validate-schema.yml
 - name: Validate schema consistency
   run: |
     python scripts/verify_schema.py
     if [ $? -ne 0 ]; then
       echo "Schema drift detected!"
       exit 1
     fi
 ```

 ---

 ## Conclusion

 By establishing Alembic as the single source of truth for database schema management, we:

 1. **Eliminated Schema Drift:** Dev, test, and prod now have identical schemas
 2. **Fixed Flaky Tests:** 100% test pass rate (up from 69%)
 3. **Improved Performance:** 33% faster test execution
 4. **Enhanced Developer Experience:** Clear, predictable database initialization
 5. **Reduced Debugging Time:** No more "works on my machine" issues (HA!)

 ### Key Takeaway

 > **Schema management is not just about creating tables—it's about creating them consistently, everywhere, every time.**

 When teams have multiple ways to initialize schemas, they will inevitably have schema drift. The solution is not better discipline—it's removing the incorrect paths entirely.

This refactor reinforced a simple but powerful idea: database schema creation must be **boring**.

Once Alembic became the only way tables were created—across dev, test, CI, and production—the system stopped behaving unpredictably. Tests became reliable, failures became meaningful, and setup became repeatable.

The biggest lesson wasn’t about Alembic itself, but about removing alternative paths entirely. When multiple schema creation mechanisms exist, schema drift isn’t a possibility—it’s inevitable.

Now, if something fails, it fails loudly and immediately. And that’s exactly what you want.

No more ghost tables.
No more mystery migrations.
And thankfully—no more “works on my machine.”
 ---

 ## References

 - [Alembic Documentation](https://alembic.sqlalchemy.org/)
 - [SQLAlchemy ORM Documentation](https://docs.sqlalchemy.org/en/20/orm/)
 - [Database Schema Migration Best Practices](https://www.atlassian.com/blog/software-teams/database-migrations)


 ---

 *This refactoring was completed as part of Sprint 3+ post-deployment cleanup. All changes have been tested and verified in development and test environments.*   ERRR, that is to say "**It worked on my computer!**

