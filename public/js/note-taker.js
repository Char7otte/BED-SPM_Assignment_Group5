let selectedNoteIds = [];
let lastSelectedIndex = null;
let isNoteDirty = false;
let lastEditedNoteId = null;

document.addEventListener('DOMContentLoaded', () => {

    const noteListContainer = document.getElementById('noteList');

    // Note title and content fields
    const noteTitleField = document.getElementById('NoteTitle');
    const noteContentField = document.getElementById('NoteContent');

    noteTitleField.addEventListener('input', () => {
        isNoteDirty = true;
    });
    noteContentField.addEventListener('input', () => {
        isNoteDirty = true;
    });

    const searchBtn = document.getElementById('searchBtn');
    // Add event listener for Enter key in search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchBtn.click();
        }
    });

    // debounce utility function
    function debounce(fn, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    const debouncedSave = debounce(async () => {
        if (lastEditedNoteId) {
            await saveCurrentNote(lastEditedNoteId);
            const res = await fetch('/notes-api');
            const notes = await res.json();
            renderNoteList(notes);
        }
    }, 500);

    noteTitleField.addEventListener('input', () => {
        isNoteDirty = true;
        debouncedSave();
    });
    noteContentField.addEventListener('input', () => {
        isNoteDirty = true;
        debouncedSave();
    });

    // save current note on input change
    async function saveCurrentNote(noteId) {
        const noteTitle = noteTitleField.value.trim();
        const noteContent = noteContentField.value.trim();
        if (!noteTitle || !noteContent) return;
        try {
            const newNote = {
                NoteTitle: noteTitle,
                NoteContent: noteContent
            };
            const res = await fetch(`/notes-api/${Number(noteId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newNote)
            });
            if (res.ok) {
                isNoteDirty = false;
            }
        } catch (err) {
            console.error('Auto-save failed:', err);
        }
    }

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

        notes.forEach((note, index) => {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-item';
            noteDiv.dataset.NoteID = note.NoteID;
            noteDiv.innerHTML = `
        <strong>${note.NoteTitle}</strong><br>
        <small>${note.NoteContent}...</small>
    `;

            // Highlight if selected
            if (selectedNoteIds.includes(note.NoteID)) {
                noteDiv.classList.add('selected');
            }

            noteDiv.addEventListener('click', async (e) => {
                // Auto-save if dirty and leaving a single selected note
                if (isNoteDirty && lastEditedNoteId && !selectedNoteIds.includes(note.NoteID)) {
                    await saveCurrentNote(lastEditedNoteId);
                    await fetchNotes(); // Refresh the note list after saving
                    return; // Prevent further processing until refreshed list is displayed
                }
                if (e.shiftKey && lastSelectedIndex !== null) {
                    // Shift-click: select or unselect range
                    const start = Math.min(lastSelectedIndex, index);
                    const end = Math.max(lastSelectedIndex, index);
                    const rangeIds = notes.slice(start, end + 1).map(n => n.NoteID);

                    // Check if all in range are already selected
                    const allSelected = rangeIds.every(id => selectedNoteIds.includes(id));
                    if (allSelected) {
                        // Unselect the range, but prevent unselecting the last note
                        if (selectedNoteIds.length === rangeIds.length) {
                            // Prevent unselecting all notes
                            // Optionally, give feedback here
                        } else {
                            selectedNoteIds = selectedNoteIds.filter(id => !rangeIds.includes(id));
                        }
                    } else {
                        // Select the range (merge with existing selection, no duplicates)
                        selectedNoteIds = Array.from(new Set([...selectedNoteIds, ...rangeIds]));
                    }
                    lastSelectedIndex = index; // <-- Always update on shift-click
                } else if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd-click: toggle selection
                    if (selectedNoteIds.includes(note.NoteID)) {
                        if (selectedNoteIds.length === 1) {
                            // Prevent unselecting the last note
                        } else {
                            selectedNoteIds = selectedNoteIds.filter(id => id !== note.NoteID);
                        }
                    } else {
                        selectedNoteIds.push(note.NoteID);
                    }
                    lastSelectedIndex = index;
                } else {
                    // Single click: select only this note
                    if (selectedNoteIds.length === 1 && selectedNoteIds[0] === note.NoteID) {
                        // Do nothing: prevent unselecting the last note
                    } else {
                        if (isNoteDirty && lastEditedNoteId && lastEditedNoteId !== note.NoteID) {
                            await saveCurrentNote(lastEditedNoteId);
                            await fetchNotes(); // Refresh the note list after saving
                            return; // Prevent further processing until refreshed list is displayed
                        }
                        selectedNoteIds = [note.NoteID];
                        lastSelectedIndex = index;
                    }
                }
                renderNoteList(notes);
                updateDeleteButtonState();
                if (selectedNoteIds.length === 1) {
                    await loadNoteById(note.NoteID);
                } else {
                    noteTitleField.value = '';
                    noteContentField.value = '';
                }
                console.log("Selected note IDs:", selectedNoteIds);
            });

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

            lastEditedNoteId = id;
            isNoteDirty = false;

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

        try {
            if (selectedNoteId !== null) {
                // Update existing note (NO user_id)
                const newNote = {
                    NoteTitle: noteTitle,
                    NoteContent: noteContent
                };
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
                // ...existing code...
            } else {
                const newNote = {
                    NoteTitle: noteTitle,
                    NoteContent: noteContent
                };
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
                selectedNoteId = result.note.NoteID;
                await loadNoteById(selectedNoteId);
            }

        } catch (err) {
            console.error(selectedNoteId !== null ? 'Error updating note:' : 'Error creating note:', err);
            alert(selectedNoteId !== null ? 'Error updating note.' : 'Error creating note.');
        }
        fetchNotes(); // refresh note list
    });

    // Delete button: Delete selected note
    const deleteBtn = document.getElementById('toolbarDeleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!selectedNoteIds.length) {
                alert('No notes selected for deletion.');
                return;
            }
            if (!confirm(`Are you sure you want to delete ${selectedNoteIds.length} note(s)?`)) {
                return;
            }
            try {
                const res = await fetch(`/notes-api/bulk`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ noteIds: selectedNoteIds })
                });

                if (!res.ok) {
                    throw new Error('Failed to delete notes');
                }

                alert('Notes deleted successfully!');
                selectedNoteIds = [];
                fetchNotes(); // Refresh note list
                noteTitleField.value = '';
                noteContentField.value = '';
                noteTitleField.readOnly = true;
                noteContentField.readOnly = true;
                updateDeleteButtonState();
            } catch (err) {
                console.error('Error deleting notes:', err);
                alert('Error deleting notes.');
            }
        });
    }

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

    if (!selectedNoteIds.length) {
        deleteBtn.disabled = true;
        deleteBtn.classList.add('disabled');
    } else {
        deleteBtn.disabled = false;
        deleteBtn.classList.remove('disabled');
    }
}
