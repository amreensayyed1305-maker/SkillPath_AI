import os
import sqlite3
from config import Config

db_path = Config.DB_PATH
print(f"Database Path: {db_path}")
print(f"Exists on disk: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    print(f"File size: {os.path.getsize(db_path)} bytes")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"\nFound {len(tables)} tables:")
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        cnt = cursor.fetchone()[0]
        print(f"  • {t:<22}: {cnt} rows")

    # Check sample data
    print("\nSample Careers:")
    cursor.execute("SELECT id, title, category, roadmap_track FROM careers LIMIT 3;")
    for row in cursor.fetchall():
        print(f"  - [{row[0]}] {row[1]} ({row[2]}) -> Roadmap: {row[3]}")

    print("\nSample Roadmaps:")
    cursor.execute("SELECT id, track, total_days FROM roadmaps LIMIT 3;")
    for row in cursor.fetchall():
        print(f"  - [{row[0]}] {row[1]} ({row[2]} days)")

    print("\nSample Quizzes:")
    cursor.execute("SELECT id, track, title FROM quizzes LIMIT 3;")
    for row in cursor.fetchall():
        print(f"  - [{row[0]}] {row[1]}: {row[2]}")

    print("\nSample User Accounts:")
    cursor.execute("SELECT id, email, role, created_at FROM users;")
    for row in cursor.fetchall():
        print(f"  - User {row[0]}: {row[1]} (Role: {row[2]})")

    conn.close()
else:
    print("Database file does not exist yet.")
