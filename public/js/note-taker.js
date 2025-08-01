let selectedNoteId = null;

document.addEventListener('DOMContentLoaded', () => {

    const noteListContainer = document.getElementById('noteList');

    // Note title and content fields
    const noteTitleField = document.getElementById('NoteTitle');
    const noteContentField = document.getElementById('NoteContent');

    const searchBtn = document.getElementById('searchBtn');
    // Add event listener for Enter key in search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });

    // Get all notes to display in the list, and auto-select first note
    async function fetchNotes() {
        try {
            const res = await fetch('/notes-api');
            const notes = await res.json();
            selectedNoteId = notes.length ? notes[0].id : null;  // auto-select first
            renderNoteList(notes);
            if (selectedNoteId) {
                loadNoteById(selectedNoteId);
            }
        } catch (err) {
            console.error('Error fetching notes:', err.message);
            noteListContainer.innerHTML = '<p class="text-danger">Failed to load notes.</p>';
        }
    }
    async function fetchNoteById(noteId) {
        try {
            const res = await fetch(`/notes-api/${noteId}`);
            if (!res.ok) {
                throw new Error(`Error fetching note with ID ${noteId}: ${res.statusText}`);
            }
            const note = await res.json();
            return note;
        } catch (err) {
            console.error(`Error fetching note with ID ${noteId}:`, err);
            noteListContainer.innerHTML = `<p class="text-danger">Failed to load note with ID ${noteId}.</p>`;
            return null;
        }
    }

    // Render notes in the list
    function renderNoteList(notes) {
        noteListContainer.innerHTML = '';

        // Show message if no notes found
        if (!notes || notes.length === 0) {
            noteListContainer.innerHTML = '<p class="text-muted fade-in-message">No notes found.</p>';
            return;
        }

        notes.forEach((note, index) => {
            setTimeout(() => {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'note-item';
                noteDiv.dataset.id = note.id;
                noteDiv.innerHTML = `
                    <strong>${note.NoteTitle}</strong><br>
                    <small>${note.NoteContent.substring(0, 30)}...</small>
                `;
                noteDiv.addEventListener('click', () => {
                    loadNoteById(note.id);
                    selectedNoteId = note.id;
                    document.querySelectorAll('.note-item').forEach(item => item.classList.remove('selected'));
                    noteDiv.classList.add('selected');
                });
                // Highlight if selected (safe check)
                // apparently this prevents all notes from being selected?
                if (selectedNoteId && note.id === selectedNoteId) {
                    noteDiv.classList.add('selected');
                }
                noteListContainer.appendChild(noteDiv);
            }, index * 50); // 50ms staggered animation delay
        });
    }

    function renderSelectedNote(selectedNoteId) {
        // render the selected note 
        // with id = selectedNoteId


    }

    // Load note by ID
    async function loadNoteById(id) {
        try {
            const res = await fetch(`/notes-api/${id}`);
            const note = await res.json();

            const noteTitleField = document.getElementById('NoteTitle');
            const noteContentField = document.getElementById('NoteContent');

            noteTitleField.value = note.NoteTitle;
            noteContentField.value = note.NoteContent;

            noteTitleField.readOnly = true;
            noteContentField.readOnly = true;

            noteTitleField.addEventListener('dblclick', () => {
                noteTitleField.readOnly = false;
                noteTitleField.focus();
            });
            noteTitleField.addEventListener('blur', () => {
                noteTitleField.readOnly = true;
            });

            noteContentField.addEventListener('dblclick', () => {
                noteContentField.readOnly = false;
                noteContentField.focus();
            });
            noteContentField.addEventListener('blur', () => {
                noteContentField.readOnly = true;
            });

        } catch (err) {
            console.error(`Failed to load note ${id}:`, err);
        }
    }

    // Search notes by title or content, clear selection on search
    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) {
            selectedNoteId = null;
            return fetchNotes();
        }
        try {
            const res = await fetch(`/notes-api/search?search=${encodeURIComponent(query)}`);
            const notes = await res.json();
            // selectedNoteId = null; // Clear selection on search results
            renderNoteList(notes);

            if (notes.length > 0) {
                selectedNoteId = notes[0].id || notes[0].noteId // Auto-select first note in search results
                loadNoteById(selectedNoteId);
            }

            console.log(selectedNoteId);
        } catch (err) {
            console.error('Search failed:', err);
            noteListContainer.innerHTML = '<p class="text-danger">Couldn\'t find any notes.</p>';
        }
    });

    // Create a new note

    // Delete selected note

    fetchNotes();
});
