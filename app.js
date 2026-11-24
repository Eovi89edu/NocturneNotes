let notes = []
let editingNoteId = null
let activeFilter = null

function loadNotes() {
  const saved = localStorage.getItem('nocturneNotes')
  if (!saved) return []

  return JSON.parse(saved).map(n => {
    if (Array.isArray(n.moods)) return n
    return { ...n, moods: n.mood ? [n.mood] : ['lucid'] }
  })
}

function saveNotes() {
  localStorage.setItem('nocturneNotes', JSON.stringify(notes))
}

function generateId() {
  return Date.now().toString()
}

// save and delete notes
function saveNote(event) {
  event.preventDefault()

  const title = document.getElementById('noteTitle').value.trim()
  const content = document.getElementById('noteContent').value.trim()
  const date = document.getElementById('noteDate').value

  const moods = Array.from(
    document.querySelectorAll('input[name="noteMood"]:checked')
  ).map(el => el.value)

  if (moods.length === 0) {
    alert('Please choose at least one category.')
    return
  }

  if (editingNoteId) {
    const i = notes.findIndex(n => n.id === editingNoteId)
    notes[i] = { ...notes[i], title, content, date, moods }
  } else {
    notes.unshift({ id: generateId(), title, content, date, moods })
  }

  closeNoteDialog()
  saveNotes()
  renderNotes()
}

function deleteNote(noteId) {
  const note = notes.find(n => n.id === noteId)
  const name = note ? `"${note.title}"` : 'this dream'
  if (!confirm(`Delete ${name}? This cannot be undone.`)) return
  notes = notes.filter(n => n.id != noteId)
  saveNotes()
  renderNotes()
}


function renderNotes() {
  const container = document.getElementById('notesContainer')

  const visible = activeFilter
    ? notes.filter(n => (n.moods || []).includes(activeFilter))
    : notes

  let html = `
    <button class="add-dream-card" onclick="openNoteDialog()">
      <span>Add Dream</span>
      <span class="plus">+</span>
    </button>
  `

  if (visible.length === 0 && notes.length > 0) {
    html += `
      <div class="empty-state">
        <h2>No dreams in this category</h2>
        <p>Try another filter or add a new dream.</p>
      </div>
    `
  } else if (notes.length === 0) {
    html += `
      <div class="empty-state">
        <h2>No dreams yet</h2>
        <p>Tap “Add Dream” to record your first one.</p>
      </div>
    `
  } else {
    html += visible.map(note => {
      const dots = (note.moods || [])
        .map(m => `<span class="dot dot-${m}"></span>`)
        .join('')

      const dateLabel = note.date
        ? `<div class="note-date">${formatDate(note.date)}</div>`
        : ''

      return `
        <div class="note-card">
          <div class="note-actions">
            <button class="edit-btn" onclick="openNoteDialog('${note.id}')" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="delete-btn" onclick="deleteNote('${note.id}')" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.3 5.71c-.39-.39-1.02-.39-1.41 0L12 10.59 7.11 5.7c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41L10.59 12 5.7 16.89c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0L12 13.41l4.89 4.88c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
              </svg>
            </button>
          </div>

          <div>
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            ${dateLabel}
          </div>

          <div class="note-dots">${dots}</div>
        </div>
      `
    }).join('')
  }

  container.innerHTML = html
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d)) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}


function openNoteDialog(noteId = null) {
  const dialog = document.getElementById('noteDialog')
  const titleInput = document.getElementById('noteTitle')
  const contentInput = document.getElementById('noteContent')
  const dateInput = document.getElementById('noteDate')

  document.querySelectorAll('input[name="noteMood"]').forEach(cb => (cb.checked = false))

  if (noteId) {
    const n = notes.find(x => x.id === noteId)
    if (!n) return
    editingNoteId = noteId
    titleInput.value = n.title
    contentInput.value = n.content
    dateInput.value = n.date || new Date().toISOString().slice(0, 10)
    ;(n.moods || []).forEach(m => {
      const cb = document.querySelector(`input[name="noteMood"][value="${m}"]`)
      if (cb) cb.checked = true
    })
  } else {
    editingNoteId = null
    titleInput.value = ''
    contentInput.value = ''
    dateInput.value = new Date().toISOString().slice(0, 10)
  }

  dialog.showModal()
  titleInput.focus()
}

function closeNoteDialog() {
  document.getElementById('noteDialog').close()
}


function setupFilters() {
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.category
      if (activeFilter === cat) {
        activeFilter = null
        btn.classList.remove('active')
      } else {
        activeFilter = cat
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
      }
      renderNotes()
    })
  })
}


document.addEventListener('DOMContentLoaded', () => {
  notes = loadNotes()
  renderNotes()
  setupFilters()

  document.getElementById('noteForm').addEventListener('submit', saveNote)

  document.getElementById('noteDialog').addEventListener('click', function (e) {
    if (e.target === this) closeNoteDialog()
  })
})