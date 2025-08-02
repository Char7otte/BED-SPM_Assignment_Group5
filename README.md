# BED & SPM Assignment Group 5

## Install node dependencies

> npm i

## Node apps used

-   [Express](https://www.npmjs.com/package/express) - Web framework
-   [mssql](https://www.npmjs.com/package/mssql) - Connecting to SQL databases
-   [ejs](https://www.npmjs.com/package/ejs) - Embedded JS templates to aid with frontend
-   [method-override](https://www.npmjs.com/package/method-override) - Enables HTTP verbs like PUT and DELETE in forms
-   [dotenv](https://www.npmjs.com/package/dotenv) - Loads environment variables

## Other tools used

-   [Bulma](https://bulma.io/) - CSS Framework for styling

## Folder structure

- **public** - CSS, JS, images, and other assets
- **views** - HTML & ejs files

## Features

### Chat Messaging Hotline

| Request                          | URL                      | Path Parameters                        | Body Parameters |
| -------------------------------- | ------------------------ | -------------------------------------- | --------------- |
| `GET` Get all chats              | `/chats`                 |                                        |
| `POST` Create a new chat         | `/chats/create/{userID}` | `UserID` of the user creating the chat |
| `DELETE` Delete a chat           | `/chats/{chatID}`        | `ChatID` of the chat to delete         |
| `GET` Get all messages in a chat | `/chats/{chatID}`        | `ChatID` of the chat to open           |
| `POST` Create a new message      | `/chats/{chatID}/`       | `ChatID` of the chat                   | TO ADD          |
| `PATCH`Edit a message            | `/chats/{chatID}/`       | `ChatID` of the chat                   | TO ADD          |
| `DELETE`Delete a message         | `/chats/{chatID}/`       | `ChatID` of the chat                   | TO ADD          |

### User Management API

| Method   | URL                                 | User Type   | Path Parameters        | Body Parameters                   | Function Used        |
|----------|--------------------------------------|-------------|-------------------------|------------------------------------|-----------------------|
| `POST`   | `/users/register`                    | User        |                         | `username`, `password`, `email`   | `createUser`          |
| `POST`   | `/users/login`                       | All         |                         | `username`, `password`            | `loginUser`           |
| `PUT`    | `/users/changepassword/:id`          | All         | `id` (User ID)          | `newPassword`                     | `changePassword`      |
| `GET`    | `/users`                             | Admin       |                         |                                    | `getAllUsers`         |
| `GET`    | `/users/username/:username`          | Admin       | `username`              |                                    | `getUserByUsername`   |
| `PUT`    | `/users/updatedetail/:id`            | Admin        | `id` (User ID)          | `username`, `email`, etc.         | `updateUser`          |
| `DELETE` | `/users/:id`                         | Admin       | `id` (User ID)          |                                    | `deleteUser`          |

### Note Taker API

| Request                          | URL                      | Path Parameters                        | Body Parameters |
| -------------------------------- | ------------------------ | -------------------------------------- | --------------- |
| `GET` Get all notes              | `/notes-api`                 |                                        | 
| `POST` Create a new note         | `/notes-api`                 |                                        | `NoteTitle`, `NoteContent`
| `DELETE` Delete a note           | `/notes-api/:id`             | `id` (Note ID)                         | `noteId` 
| `GET` Get notes by note id       | `/notes-api/:id`             | `id` (Note ID)                         | `id` (Note ID)
| `GET` Get notes by search term   | `/notes-api/search`          | `search`                               | `search`
| `PUT` Edit a note                | `/notes-api/:id`             | `id` (Note ID)                         |  `NoteTitle`, `NoteContent`
| `DELETE` Bulk delete notes       | `/notes-api/bulk`            | `bulk`                                 | `noteIds`        |
| `GET` Export note as markdown    | `/notes-api/export-md/:id`   | `bulk`                                 |                  |

### Medical Appointment API

| Request                       | URL                      | User Type   | Path Parameters   | Query Parameters  | Body Parameters   |
| ------------------------------| ------------------------ | ----------- |------------------ |----------- | ----------------- |
| `GET` Get all appointments        | `/med-appointments`           | User  |        
| `GET` Search appointments         | `/med-appointments/search`    | User  |       | `searchTerm`    | 
| `GET` Get appointments by date    | `/med-appointments/:date`     | User  | `date` | 
| `GET` Get appointments by month and year| `/med-appointments/:month/:year`| User  | `month`, `year` |
| `POST` Create a new appointment   | `/med-appointments`           | User  |       |       | `date`, `title`, `doctor`, `start_time`, `end_time`, `location`, `status`, `notes` |
| `PUT` Edit an appointment         | `/med-appointments/:appointment_id`   | User  |`appointment_id` |  | `date`, `title`, `doctor`, `start_time`, `end_time`, `location`, `status`, `notes` |
| `DELETE` Delete an appointment    | `/med-appointments/:appointment_id`   | User  | `appointment_id` |

### Feedback API

| Request                       | URL                      | User Type   | Path Parameters   | Query Parameters  | Body Parameters   |
| ------------------------------| ------------------------ | ----------- |------------------ |----------- | ----------------- |
| `GET` Get all feedbacks from user | `/feedback`               | User  |              
| `GET` Get all feedbacks from all users    | `/feedback/admin` | Admin |               
| `GET` Search feedbacks        | `/feedback/search`            | User  |               | `searchTerm` | 
| `GET` Search feedbacks by title or status | `/feedback/admin/search`  | Admin |       | `searchTerm` | 
| `POST` Create a new feedback  | `/feedback`                   | User  |               |              | `title`, `feature`, `description` |
| `PUT` Edit a feedback         | `/feedback/:feedback_id`      | User  | `feedback_id` |              | `title`, `feature`, `description`
| `PUT` Edit feedback status    | `/feedback/admin/:feedback_id`| Admin | `feedback_id` |              | `status` |
| `DELETE` Delete a feedback    | `/feedback/:feedback_id`      | User  | `feedback_id` | 
| `DELETE` Delete user feedback | `/feedback/admin/:feedback_id`| Admin | `feedback_id` |

