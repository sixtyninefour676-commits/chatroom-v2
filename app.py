from flask import Flask, render_template, request, session, redirect, url_for, make_response
import mysql.connector
import json
import uuid

app = Flask(__name__)
app.secret_key = 'changethis_to_something_random'

# ─── DB ────────

def db():
    return mysql.connector.connect(
        host="localhost", user="root", password="", database="chat_room"
    )

def qone(sql, params=()):
    con = db(); cur = con.cursor(dictionary=True)
    cur.execute(sql, params); row = cur.fetchone()
    cur.close(); con.close(); return row

def qall(sql, params=()):
    con = db(); cur = con.cursor(dictionary=True)
    cur.execute(sql, params); rows = cur.fetchall()
    cur.close(); con.close(); return rows

def qrun(sql, params=()):
    con = db(); cur = con.cursor()
    cur.execute(sql, params); con.commit()
    cur.close(); con.close()

# ─── HELPERS ──────
def uid():
    return session.get('uid') or request.cookies.get('uid')

def get_username(user_uid=None):
    u = qone("SELECT username FROM users WHERE uid=%s", (user_uid or uid(),))
    return u['username'] if u else None

def logged_in():
    return bool(uid())

# ─── PAGES ─────────
@app.route('/')
def index():
    if not logged_in():
        return redirect(url_for('signup'))
    return render_template('index.html', username=get_username())

@app.route('/login')
def login():
    if logged_in():
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/signup')
def signup():
    if logged_in():
        return redirect(url_for('index'))
    return render_template('signup.html')

@app.route('/room')
def room():
    if not logged_in():
        return redirect(url_for('login'))
    room_id = request.args.get('id')
    if not room_id:
        return redirect(url_for('index'))
    room_row = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room_row:
        return "<script>alert('Invalid room ID');location.href='/login';</script>"
    username = get_username()
    members = [m for m in room_row['users'].split(',') if m]
    if username not in members:
        return "<script>alert('You are not in this room.');location.href='/';</script>"
    return render_template('room.html', roomName=room_row['name'], roomId=room_id)

@app.route('/invite')
def invite():
    room_id = request.args.get('id')
    if not room_id:
        return redirect(url_for('login'))
    room_row = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room_row:
        return "<script>alert('Invalid room ID');location.href='/login';</script>"
    return render_template('invite.html', admin=room_row['admin'], room_id=room_id)

@app.route('/logout')
def logout():
    session.clear()
    resp = make_response(redirect(url_for('login')))
    resp.delete_cookie('uid')
    resp.delete_cookie('logged_in')
    return resp

# ─── AUTH ────────

@app.route('/php/login.php', methods=['POST'])
def php_login():
    username = request.form.get('username')
    password = request.form.get('password')
    keep = request.form.get('keep_logged')
    row = qone("SELECT * FROM users WHERE username=%s", (username,))
    if not row or row['password'] != password:
        return '2'
    session['uid'] = row['uid']
    resp = make_response('1')
    resp.set_cookie('uid', row['uid'], max_age=86400*30, path='/')
    if keep == 'true':
        resp.set_cookie('logged_in', '1', max_age=86400*30, path='/')
    return resp

@app.route('/php/signup.php', methods=['POST'])
def php_signup():
    username = request.form.get('username')
    password = request.form.get('password')
    keep = request.form.get('keep_logged')
    if qone("SELECT uid FROM users WHERE username=%s", (username,)):
        return '2'
    new_uid = uuid.uuid4().hex
    qrun(
        "INSERT INTO users (username,password,online,bookmarked,pending,friends,uid) VALUES(%s,%s,'false','[]','[]','[]',%s)",
        (username, password, new_uid)
    )
    session['uid'] = new_uid
    resp = make_response('1')
    resp.set_cookie('uid', new_uid, max_age=86400*30, path='/')
    if keep == 'true':
        resp.set_cookie('logged_in', '1', max_age=86400*30, path='/')
    return resp

# ─── ROOMS ───────────────
@app.route('/php/create.php', methods=['POST'])
def php_create():
    name = request.form.get('name')
    admin = get_username()
    room_uid = uuid.uuid4().hex
    try:
        qrun(
            "INSERT INTO rooms (name,admin,users,messages,muted,banned,uid) VALUES(%s,%s,%s,'[]','[]','[]',%s)",
            (name, admin, admin, room_uid)
        )
        return room_uid
    except:
        return 'Error'

@app.route('/php/join.php', methods=['POST'])
def php_join():
    room_id = request.form.get('id')
    room = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room:
        return '2'
    username = get_username()
    banned = json.loads(room['banned'] or '[]')
    if username in banned:
        return '5'
    members = [m for m in room['users'].split(',') if m]
    if username in members:
        return '4'
    members.append(username)
    qrun("UPDATE rooms SET users=%s WHERE uid=%s", (','.join(members) + ',', room_id))
    return '1'

@app.route('/php/leave.php', methods=['POST'])
def php_leave():
    room_id = request.form.get('rId')
    username = get_username()
    room = qone("SELECT users FROM rooms WHERE uid=%s", (room_id,))
    members = [m for m in room['users'].split(',') if m and m != username]
    qrun("UPDATE rooms SET users=%s WHERE uid=%s", (','.join(members), room_id))
    return '1'

@app.route('/php/rooms.php', methods=['POST'])
def php_rooms():
    username = get_username()
    all_rooms = qall("SELECT name, uid, users FROM rooms")
    result = [[r['name'], r['uid']] for r in all_rooms if username in [m for m in r['users'].split(',') if m]]
    return json.dumps(result)

@app.route('/php/deleteRoom.php', methods=['POST'])
def php_delete_room():
    room_id = request.form.get('rId')
    room = qone("SELECT admin FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username():
        return '2'
    qrun("DELETE FROM rooms WHERE uid=%s", (room_id,))
    return '1'

@app.route('/php/changeName.php', methods=['POST'])
def php_change_name():
    room_id = request.form.get('rId')
    name = request.form.get('name')
    room = qone("SELECT admin FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username():
        return '2'
    qrun("UPDATE rooms SET name=%s WHERE uid=%s", (name, room_id))
    return '1'

@app.route('/php/transferAdmin.php', methods=['POST'])
def php_transfer_admin():
    room_id = request.form.get('rId')
    name = request.form.get('name')
    room = qone("SELECT admin FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username():
        return '2'
    qrun("UPDATE rooms SET admin=%s WHERE uid=%s", (name, room_id))
    return '1'

@app.route('/php/checkAdmin.php', methods=['POST'])
def php_check_admin():
    room_id = request.form.get('rId')
    room = qone("SELECT admin FROM rooms WHERE uid=%s", (room_id,))
    return '1' if room and room['admin'] == get_username() else '0'

# ─── MESSAGES ──────────────

@app.route('/php/fetch.php', methods=['POST'])
def php_fetch():
    room_id = request.form.get('rId')
    room = qone("SELECT messages FROM rooms WHERE uid=%s", (room_id,))
    return room['messages'] if room else '[]'

@app.route('/php/send.php', methods=['POST'])
def php_send():
    message = request.form.get('message')
    room_id = request.form.get('rId')
    time = request.form.get('time')
    username = get_username()
    room = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    muted = json.loads(room['muted'] or '[]')
    if username in muted:
        return '2'
    msgs = json.loads(room['messages'] or '[]')
    msgs.append({"sender": username, "content": message, "id": uuid.uuid4().hex, "time": time})
    qrun("UPDATE rooms SET messages=%s WHERE uid=%s", (json.dumps(msgs), room_id))
    return '1'

@app.route('/php/delete.php', methods=['POST'])
def php_delete():
    msg_id = request.form.get('id')
    room_id = request.form.get('rId')
    username = get_username()
    room = qone("SELECT messages FROM rooms WHERE uid=%s", (room_id,))
    msgs = [m for m in json.loads(room['messages'] or '[]') if not (m['id'] == msg_id and m['sender'] == username)]
    qrun("UPDATE rooms SET messages=%s WHERE uid=%s", (json.dumps(msgs), room_id))
    return '1'

# ─── MEMBERS ──────────────────

@app.route('/php/members.php', methods=['POST'])
def php_members():
    room_id = request.form.get('rId')
    room = qone("SELECT users FROM rooms WHERE uid=%s", (room_id,))
    return ('++' + room['users']) if room else '0'

@app.route('/php/memberStatus.php', methods=['POST'])
def php_member_status():
    members = json.loads(request.form.get('members', '[]'))
    result = []
    for m in members:
        row = qone("SELECT online FROM users WHERE username=%s", (m,))
        result.append([m, row['online'] if row else 'false'])
    return json.dumps(result)

# ─── MODERATION ────────────\

@app.route('/php/muteUser.php', methods=['POST'])
def php_mute():
    room_id = request.form.get('rId')
    target = request.form.get('user')
    room = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username(): return '2'
    if target == room['admin']: return '4'
    muted = json.loads(room['muted'] or '[]')
    if target in muted: return '3'
    muted.append(target)
    qrun("UPDATE rooms SET muted=%s WHERE uid=%s", (json.dumps(muted), room_id))
    return '1'

@app.route('/php/unmuteUser.php', methods=['POST'])
def php_unmute():
    room_id = request.form.get('rId')
    target = request.form.get('user')
    room = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username(): return '2'
    muted = json.loads(room['muted'] or '[]')
    if target not in muted: return '3'
    qrun("UPDATE rooms SET muted=%s WHERE uid=%s", (json.dumps([m for m in muted if m != target]), room_id))
    return '1'

@app.route('/php/getMuted.php', methods=['POST'])
def php_get_muted():
    room = qone("SELECT muted FROM rooms WHERE uid=%s", (request.form.get('rId'),))
    return room['muted'] if room else '[]'

@app.route('/php/checkMuted.php', methods=['POST'])
def php_check_muted():
    room = qone("SELECT muted FROM rooms WHERE uid=%s", (request.form.get('rId'),))
    muted = json.loads(room['muted'] or '[]') if room else []
    return '1' if get_username() in muted else '0'

@app.route('/php/kickUser.php', methods=['POST'])
def php_kick():
    room_id = request.form.get('rId')
    target = request.form.get('user')
    room = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username(): return '2'
    if target == room['admin']: return '3'
    members = [m for m in room['users'].split(',') if m and m != target]
    qrun("UPDATE rooms SET users=%s WHERE uid=%s", (','.join(members), room_id))
    return '1'

@app.route('/php/banUser.php', methods=['POST'])
def php_ban():
    room_id = request.form.get('rId')
    target = request.form.get('user')
    room = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username(): return '2'
    if target == room['admin']: return '3'
    banned = json.loads(room['banned'] or '[]')
    banned.append(target)
    members = [m for m in room['users'].split(',') if m and m != target]
    qrun("UPDATE rooms SET banned=%s, users=%s WHERE uid=%s", (json.dumps(banned), ','.join(members), room_id))
    return '1'

@app.route('/php/unbanUser.php', methods=['POST'])
def php_unban():
    room_id = request.form.get('rId')
    target = request.form.get('user')
    room = qone("SELECT * FROM rooms WHERE uid=%s", (room_id,))
    if not room or room['admin'] != get_username(): return '2'
    banned = [b for b in json.loads(room['banned'] or '[]') if b != target]
    qrun("UPDATE rooms SET banned=%s WHERE uid=%s", (json.dumps(banned), room_id))
    return '1'

@app.route('/php/getBanned.php', methods=['POST'])
def php_get_banned():
    room = qone("SELECT banned FROM rooms WHERE uid=%s", (request.form.get('rId'),))
    return room['banned'] if room else '[]'

# ─── FRIENDS ─────────
@app.route('/php/sendRequest.php', methods=['POST'])
def php_send_request():
    target_name = request.form.get('user')
    target = qone("SELECT * FROM users WHERE username=%s", (target_name,))
    if not target: return '2'
    sender_name = get_username()
    if sender_name in json.loads(target['friends'] or '[]'): return '3'
    pending = json.loads(target['pending'] or '[]')
    pending.append(sender_name)
    qrun("UPDATE users SET pending=%s WHERE username=%s", (json.dumps(pending), target_name))
    return '1'

@app.route('/php/getPending.php', methods=['POST'])
def php_get_pending():
    row = qone("SELECT pending FROM users WHERE uid=%s", (uid(),))
    return row['pending'] if row else '[]'

@app.route('/php/acceptRequest.php', methods=['POST'])
def php_accept_request():
    sender_name = request.form.get('user')
    me = qone("SELECT * FROM users WHERE uid=%s", (uid(),))
    my_name = me['username']
    pending = json.loads(me['pending'] or '[]')
    if sender_name not in pending: return '2'
    # remove from pending
    pending = [p for p in pending if p != sender_name]
    qrun("UPDATE users SET pending=%s WHERE uid=%s", (json.dumps(pending), uid()))
    # add to both friends lists
    my_friends = json.loads(me['friends'] or '[]')
    my_friends.append(sender_name)
    qrun("UPDATE users SET friends=%s WHERE uid=%s", (json.dumps(my_friends), uid()))
    sender = qone("SELECT * FROM users WHERE username=%s", (sender_name,))
    s_friends = json.loads(sender['friends'] or '[]')
    s_friends.append(my_name)
    qrun("UPDATE users SET friends=%s WHERE username=%s", (json.dumps(s_friends), sender_name))
    return '1'

@app.route('/php/getFriends.php', methods=['POST'])
def php_get_friends():
    row = qone("SELECT friends FROM users WHERE uid=%s", (uid(),))
    return row['friends'] if row else '[]'

@app.route('/php/getAllFriends.php', methods=['POST'])
def php_get_all_friends():
    row = qone("SELECT friends FROM users WHERE uid=%s", (uid(),))
    return row['friends'] if row else '[]'

@app.route('/php/getOnlineFriends.php', methods=['POST'])
def php_get_online_friends():
    row = qone("SELECT friends FROM users WHERE uid=%s", (uid(),))
    friends = json.loads(row['friends'] or '[]') if row else []
    online = [f for f in friends if (lambda r: r and r['online'] == 'true')(qone("SELECT online FROM users WHERE username=%s", (f,)))]
    return json.dumps(online)

# ─── BOOKMARKS ──────────

@app.route('/php/bookmark.php', methods=['POST'])
def php_bookmark():
    msg_id = request.form.get('id')
    row = qone("SELECT bookmarked FROM users WHERE uid=%s", (uid(),))
    bookmarks = json.loads(row['bookmarked'] or '[]')
    if any(b['id'] == msg_id for b in bookmarks): return '2'
    bookmarks.append({
        "id": msg_id, "rId": request.form.get('rId'),
        "sender": request.form.get('sender'),
        "content": request.form.get('content'),
        "time": request.form.get('time')
    })
    qrun("UPDATE users SET bookmarked=%s WHERE uid=%s", (json.dumps(bookmarks), uid()))
    return '1'

@app.route('/php/getBookmarks.php', methods=['POST'])
def php_get_bookmarks():
    row = qone("SELECT bookmarked FROM users WHERE uid=%s", (uid(),))
    return row['bookmarked'] if row else '[]'

@app.route('/php/deleteBookmark.php', methods=['POST'])
def php_delete_bookmark():
    msg_id = request.form.get('id')
    row = qone("SELECT bookmarked FROM users WHERE uid=%s", (uid(),))
    bookmarks = [b for b in json.loads(row['bookmarked'] or '[]') if b['id'] != msg_id]
    qrun("UPDATE users SET bookmarked=%s WHERE uid=%s", (json.dumps(bookmarks), uid()))
    return '1'

# ─── ONLINE STATUS ─────────
@app.route('/php/load.php', methods=['POST'])
def php_load():
    qrun("UPDATE users SET online='true' WHERE uid=%s", (uid(),))
    return '1'

@app.route('/php/unload.php', methods=['POST'])
def php_unload():
    qrun("UPDATE users SET online='false' WHERE uid=%s", (uid(),))
    return '1'

@app.route('/php/userFromId.php', methods=['POST'])
def php_user_from_id():
    return get_username() or ''

# ──────────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, port=5000)
