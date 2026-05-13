let notes = [];
let currentUser = null;
let editingNoteId = null;

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) - hash) + password.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString();
}

function getUsers() {
    return JSON.parse(localStorage.getItem('noteskeeper_users') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('noteskeeper_users', JSON.stringify(users));
}

// ===================== REGISTER =====================
function register() {
    console.log("Register function called");   // For debugging

    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm-password').value;

    if (!username || !password || !confirm) {
        alert("All fields are required!");
        return;
    }
    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }
    if (password.length < 4) {
        alert("Password must be at least 4 characters!");
        return;
    }

    const users = getUsers();

    if (users[username]) {
        alert("Username already exists!");
        return;
    }

    users[username] = { password: hashPassword(password) };
    saveUsers(users);

    alert("✅ Account created successfully! Logging you in...");

    // Auto Login
    currentUser = username;
    document.getElementById('username-display').textContent = username;

    closeRegisterModal();
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    loadNotes();
    updateTime();
}

// Other functions (Login, Logout, etc.)
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert("Please enter username and password");
        return;
    }

    const users = getUsers();
    if (!users[username] || users[username].password !== hashPassword(password)) {
        alert("Invalid username or password");
        return;
    }

    currentUser = username;
    document.getElementById('username-display').textContent = username;

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    loadNotes();
    updateTime();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('noteskeeper_current_user');
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function updateTime() {
    setInterval(() => {
        document.getElementById('current-time').textContent = new Date().toLocaleString('en-IN', {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }, 1000);
}

function showRegisterModal() {
    document.getElementById('register-modal').classList.remove('hidden');
}

function closeRegisterModal() {
    document.getElementById('register-modal').classList.add('hidden');
}

function showNewNoteModal() {
    editingNoteId = null;
    document.getElementById('modal-title').textContent = "New Note";
    document.getElementById('note-title').value = "";
    document.getElementById('note-content').value = "";
    document.getElementById('note-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('note-modal').classList.add('hidden');
}

function saveNote() { /* same as before */ 
    if (!currentUser) return alert("Please login first");
    // ... (rest same as previous version)
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    if (!title && !content) return alert("Note cannot be empty!");

    const now = new Date().toISOString();
    if (editingNoteId) {
        const note = notes.find(n => n.id === editingNoteId);
        if (note) {
            note.title = title || "Untitled Note";
            note.content = content;
            note.updatedAt = now;
        }
    } else {
        notes.unshift({
            id: Date.now(),
            title: title || "Untitled Note",
            content,
            createdAt: now,
            updatedAt: now
        });
    }
    saveToStorage();
    renderNotes();
    closeModal();
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    editingNoteId = id;
    document.getElementById('modal-title').textContent = "Edit Note";
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content || "";
    document.getElementById('note-modal').classList.remove('hidden');
}

function deleteNote(id) {
    if (confirm("Delete this note?")) {
        notes = notes.filter(n => n.id !== id);
        saveToStorage();
        renderNotes();
    }
}

function renderNotes(filtered = notes) {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:60px;color:#94a3b8;">No notes yet.<br>Click "New Note" to create one.</p>`;
        return;
    }

    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.content || 'No content'}</p>
            <div class="note-footer">
                <span>Updated ${new Date(note.updatedAt).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}</span>
                <div>
                    <button onclick="editNote(${note.id});event.stopImmediatePropagation()">✏️</button>
                    <button onclick="deleteNote(${note.id});event.stopImmediatePropagation()" style="color:#f87171">🗑</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterNotes() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtered = notes.filter(n => 
        n.title.toLowerCase().includes(term) || 
        (n.content && n.content.toLowerCase().includes(term))
    );
    renderNotes(filtered);
}

function saveToStorage() {
    if (currentUser) localStorage.setItem(`noteskeeper_notes_${currentUser}`, JSON.stringify(notes));
}

function loadNotes() {
    if (!currentUser) return;
    const data = localStorage.getItem(`noteskeeper_notes_${currentUser}`);
    notes = data ? JSON.parse(data) : [];
    renderNotes();
}

// Auto login
window.onload = () => {
    const saved = localStorage.getItem('noteskeeper_current_user');
    if (saved) {
        const users = getUsers();
        if (users[saved]) {
            currentUser = saved;
            document.getElementById('username-display').textContent = currentUser;
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            loadNotes();
            updateTime();
        }
    }
};