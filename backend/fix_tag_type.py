import psycopg2
conn = psycopg2.connect('postgresql://postgres:kavi@127.0.0.1:5432/spa_ceylon_db')
cur = conn.cursor()

# Show current tag_types
cur.execute("SELECT DISTINCT tag_type FROM tags ORDER BY tag_type")
print("Current tag_types:", [r[0] for r in cur.fetchall()])

# Rename tag_type 'skin' -> 'face' (leave 'skin_type' untouched)
cur.execute("UPDATE tags SET tag_type = 'face' WHERE tag_type = 'skin'")
print(f"Updated {cur.rowcount} tags: skin -> face")

# Verify
cur.execute("SELECT DISTINCT tag_type FROM tags ORDER BY tag_type")
print("New tag_types:", [r[0] for r in cur.fetchall()])

conn.commit()
conn.close()
print("Done!")
