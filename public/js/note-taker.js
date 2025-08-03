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
            selectedNoteId = notes.length ? notes[0].NoteID : null;  // auto-select first
            renderNoteList(notes);
            if (selectedNoteId) {
                loadNoteById(selectedNoteId);
            }
            setTimeout(() => {
                const firstNoteElement = document.querySelector(`.note-item[data-id="${selectedNoteId}"]`);
                if (firstNoteElement) {
                    firstNoteElement.classList.add('selected');
                }
            }, 0);
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

        if (!notes || notes.length === 0) {
            noteListContainer.innerHTML = '<p class="text-muted fade-in-message">No notes found.</p>';
            return;
        }

        notes.forEach((note) => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            noteDiv.dataset.NoteID = note.NoteID;
            noteDiv.innerHTML = `
            <strong>${note.NoteTitle}</strong><br>
            <small>${note.NoteContent}...</small>
        `;

            if (!selectedNoteId || note.NoteID !== selectedNoteId) {
                noteDiv.addEventListener('click', async () => {
                    selectedNoteId = note.NoteID;
                    renderNoteList(notes); // no animation on selection
                    updateDeleteButtonState();
                    await loadNoteById(note.NoteID);
                    console.log("Selected note ID:", selectedNoteId);
                });
            } else {
                noteDiv.classList.add('selected');
            }

            noteListContainer.appendChild(noteDiv);
        });
    }

    // Animate note list items
    function animateNoteList() {
        const noteItems = document.querySelectorAll('.note-item');
        noteItems.forEach((item, index) => {
            item.style.opacity = 0;
            setTimeout(() => {
                item.style.transition = "opacity 0.3s";
                item.style.opacity = 1;
            }, index * 50);
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

            console.log(`Loading note with ID ${id}:`, note);
            noteTitleField.value = note.NoteTitle || 'what';
            noteContentField.value = note.NoteContent || 'smth went wrong';
            // Make fields editable when a note is selected
            noteTitleField.readOnly = false;
            noteContentField.readOnly = false;

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

            // 1. Select first note if available
            if (notes.length > 0) {
                selectedNoteId = notes[0].NoteID || notes[0].noteId;
            } else {
                selectedNoteId = null;
            }

            // 2. Render list with selection
            renderNoteList(notes);

            // 3. Animate after rendering
            animateNoteList();

            // 4. Load first note if available
            if (selectedNoteId) {
                await loadNoteById(selectedNoteId);
            }

            console.log(selectedNoteId);
        } catch (err) {
            console.error('Search failed:', err);
            noteListContainer.innerHTML = '<p class="text-danger">Couldn\'t find any notes.</p>';
        }
    });

    // Create or update a note
    const saveBtn = document.querySelector('#noteArea button[type="submit"]');

    saveBtn.addEventListener('click', async () => {
        const noteTitle = noteTitleField.value.trim();
        const noteContent = noteContentField.value.trim();

        if (!noteTitle || !noteContent) {
            alert('Note title and content cannot be empty.');
            return;
        }

        const newNote = {
            NoteTitle: noteTitle,
            NoteContent: noteContent
        };

        try {
            if (selectedNoteId !== null) {
                // Update existing note
                console.log("Updating note ID:", selectedNoteId, newNote);
                const res = await fetch(`/notes-api/${Number(selectedNoteId)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newNote)
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.error || 'Failed to update note');
                }

                alert('Note updated successfully!');
            } else {
                // Create new note
                const res = await fetch('/notes-api', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newNote)
                });

                const result = await res.json();

                if (!res.ok) {
                    throw new Error(result.error || 'Failed to create note');
                }

                alert('Note created successfully!');
                // Make the newly created note the selected one and reload it
                selectedNoteId = result.note.NoteID;
                await loadNoteById(selectedNoteId);
            }

            fetchNotes(); // refresh note list
        } catch (err) {
            console.error(selectedNoteId !== null ? 'Error updating note:' : 'Error creating note:', err);
            alert(selectedNoteId !== null ? 'Error updating note.' : 'Error creating note.');
        }
    });

    // Edit button: Clear fields and set to editable, and disable delete button if no note selected
    const editBtn = document.getElementById('toolbarCreateBtn');
    editBtn.addEventListener('click', () => {
        const noteTitleField = document.getElementById('NoteTitle');
        const noteContentField = document.getElementById('NoteContent');
        if (noteTitleField) noteTitleField.value = '';
        if (noteContentField) noteContentField.value = '';
        if (noteTitleField) noteTitleField.readOnly = false;
        if (noteContentField) noteContentField.readOnly = false;
        if (noteTitleField) noteTitleField.focus();
        selectedNoteId = null;
        document.querySelectorAll('.note-item').forEach(item => item.classList.remove('selected'));
        // Disable the delete button and add Bootstrap disabled style
        const deleteBtn = document.getElementById('toolbarDeleteBtn');
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.classList.add('disabled');
        }
    });

    // Delete selected note

    fetchNotes();
});

// Utility function to update Delete button state based on selectedNoteId
function updateDeleteButtonState() {
    const deleteBtn = document.getElementById('toolbarDeleteBtn');
    if (!deleteBtn) return;

    if (selectedNoteId === null) {
        deleteBtn.disabled = true;
        deleteBtn.classList.add('disabled');
    } else {
        deleteBtn.disabled = false;
        deleteBtn.classList.remove('disabled');
    }
}
