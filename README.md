# the-old-people-app

## Remember to install node dependencies!

> npm i

## Node apps used

-   [Express](https://www.npmjs.com/package/express)
-   [mssql](https://www.npmjs.com/package/mssql) - Connecting to SQL databases
-   [ejs](https://www.npmjs.com/package/ejs) - Embedded JS to aid with frontend
-   [method-override](https://www.npmjs.com/package/method-override) - Use unsupported HTTP verbs with html forms (forms only support GET and POST by default)
-   [dotenv](https://www.npmjs.com/package/dotenv) - I don't really know tbh

## Other tools used

-   [Bulma](https://bulma.io/) - CSS Framework so it looks half decent

## Folder structure

CSS, js, img & other assets go into the public folder. <br>
HTML files go in views.

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
| `GET` Get all notes              | `/notes`                 |                                        | 
| `POST` Create a new note         | `/notes`                 |                                        | `user_id`, `NoteTitle`, `NoteContent`
| `DELETE` Delete a note           | `/notes/:id`             | `id` (Note ID)                         | `noteId` 
| `GET` Get notes by note id       | `/notes/:id`             | `id` (Note ID)                         | `id` (Note ID)
| `GET` Get notes by search term   | `/notes/search`          | `search`                               | `search`
| `PUT` Edit a note                | `/notes/:id`             | `id` (Note ID)                         |  `NoteTitle`, `NoteContent`
| `DELETE` Bulk delete notes       | `/notes/bulk`            | `bulk`                                 | `noteIds`        |
| `GET` Export note as markdown    | `/notes/export-md/:id`   | `bulk`                                 |                  |

### Medical Appointment API

| Request                          | URL                      | Path Parameters                        | Body Parameters |
| -------------------------------- | ------------------------ | -------------------------------------- | --------------- |
| `GET` Get all appointments       | `/med-appointments`      |                                        | 
| `GET` Get appointments by date   | `/med-appointments/:date`| `date`                                 | 
| `POST` Create a new appointment  | `/med-appointments`      |                                        | `appointment_date`, `appointment_title`, `doctor`, `start_time`, `end_time`, `location`, `notes`
| `PUT` Edit an appointment        | `/med-appointments/:id`  | `id` (Appointment ID)                  | `appointment_date`, `appointment_title`, `doctor`, `start_time`, `end_time`, `location`, `notes`
| `DELETE` Delete an appointment   | `/med-appointments/:id`  | `id` (Appointment ID)                  | 

