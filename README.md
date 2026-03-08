# Chat Room - Flask Setup

## Requirements
Install with:
```
python -m pip install flask mysql-connector-python
```

## Setup Steps

1. **Set up the database** — open MySQL and run:
   ```
   source setup.sql
   ```
   Or paste the contents of `setup.sql` into your MySQL client.

2. **Edit `app.py`** if your MySQL password is not empty:
   ```python
   def get_db():
       return mysql.connector.connect(
           host="localhost",
           user="root",
           password="YOUR_PASSWORD_HERE",  # change this
           database="chat_room"
       )
   ```

3. **Run the app:**
   ```
   python app.py
   ```

4. Open your browser at: **http://localhost:5000**

## Folder Structure
```
chat_room/
├── app.py               ← Flask backend (replaces all PHP)
├── setup.sql            ← Database setup
├── templates/           ← HTML pages
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── room.html
│   └── invite.html
├── css/                 ← Copy from original project
└── js/                  ← Copy from original project
```


