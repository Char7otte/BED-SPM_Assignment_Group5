# BED & SPM Assignment Group 5 :bubble_tea:

## Install node dependencies

> npm i

## Node apps used :gear:

-   [Express](https://www.npmjs.com/package/express) - Web framework
-   [mssql](https://www.npmjs.com/package/mssql) - Connecting to SQL databases
-   [ejs](https://www.npmjs.com/package/ejs) - Embedded JS templates to aid with frontend
-   [method-override](https://www.npmjs.com/package/method-override) - Enables HTTP verbs like PUT and DELETE in forms
-   [dotenv](https://www.npmjs.com/package/dotenv) - Loads environment variables

## Other tools used :toolbox:

-   [Bulma](https://bulma.io/) - CSS Framework for styling

## Folder structure :file_folder:

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

| Method | URL                              | User Type | Path Parameters       | Body Parameters                               | Function Used                 |
|--------|----------------------------------|-----------|------------------------|------------------------------------------------|------------------------------|
| POST   | `/users/register`                | All      | —                      | `username`, `password`, `email`, `age`, `number`, `gender` | `createUser`      |
| POST   | `/users/login`                   | All       | —                      | `username`, `password`                         | `loginUser`                 |
| GET    | `/users/logout`                  | All       | —                      | —                                              | `logoutUser`                |
| PUT    | `/users/changepassword/:id`      | All       | `id` = User ID         | `newPassword`                                  | `changePassword`            |
| GET    | `/users`                         | Admin     | —                      | —                                              | `getAllUsers`               |
| GET    | `/users/username/:username`      | Admin     | `username`             | —                                              | `getUserByUsername`         |
| GET    | `/users/:id`                     | Admin     | `id` = User ID         | —                                              | `getUserById`               |
| PATCH  | `/users/updatedetail/:id`        | Admin     | `id` = User ID         | `username`, `email`, `number`                  | `updateUser`                |
| PUT    | `/users/delete/:id`              | Admin     | `id` = User ID         | —                                              | `deleteUser`                |
| POST   | `/users/search`                  | Admin     | —                      | `username`, `UserID`                             | `searchUserByUsernameNid`   |

### Medication Tracker 

Request	URL	Path Parameters	Body Parameters
GET Get all medications	/medications/user/:userId	userId	
GET Get medication by ID	/medications/user/:userId/:medicationId	userId, medicationId	
POST Create medication	/medications		medication_name, medication_date, medication_time, medication_dosage, medication_quantity,  prescription_startdate, prescription_enddate
PUT Update medication	/medications/:userId/:medicationId	userId, medicationId	Same as create + is_taken, medication_reminders
DELETE Delete medication	/medications/:userId/:medicationId	userId, medicationId	
GET Daily medications	/medications/user/:userId/daily	userId	
GET Weekly medications	/medications/user/:userId/weekly	userId	startDate, endDate (optional)
GET Search by name	/medications/user/:userId/search	userId	name (search term)
GET Low quantity medications	/medications/user/:userId/low-quantity	userId	
GET Expired medications	/medications/user/:userId/expired	userId	
PUT Mark as taken	/medications/:userId/:medicationId/is-taken	userId, medicationId	
PUT Mark all as taken	/medications/:userId/tick-all	userId	
PUT Refill medication	/medications/:userId/:id/refill	userId, id	refillQuantity, refillDate
PUT Mark as missed	/medications/:userId/:id/missed	userId, id	
GET Upcoming reminders	/medications/user/:userId/reminders	userId	

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

### Medication API

| Method | URL                                         | User Type | Path Parameters                | Body Parameters                                                        | Function Used                |
|--------|---------------------------------------------|-----------|-------------------------------|------------------------------------------------------------------------|------------------------------|
| GET    | `/medications/user/:userId/reminders`       | User      | `userId`                      | —                                                                      | `remindMedication`           |
| GET    | `/medications/user/:userId/daily`           | User      | `userId`                      | —                                                                      | `getDailyMedicationByUser`   |
| GET    | `/medications/user/:userId/weekly`          | User      | `userId`                      | —                                                                      | `getWeeklyMedicationByUser`  |
| GET    | `/medications/user/:userId/search`          | User      | `userId`                      | `searchTerm`                                                           | `searchMedicationByName`     |
| GET    | `/medications/user/:userId/low-quantity`    | User      | `userId`                      | —                                                                      | `getLowQuantityMedication`   |
| GET    | `/medications/user/:userId/expired`         | User      | `userId`                      | —                                                                      | `getExpiredMedications`      |
| GET    | `/medications/user/:userId`                 | User      | `userId`                      | —                                                                      | `getAllMedicationByUser`     |
| GET    | `/medications/user/:userId/:medicationId`   | User      | `userId`, `medicationId`      | —                                                                      | `getMedicationById`          |
| PUT    | `/medications/:userId/tick-all`             | User      | `userId`                      | —                                                                      | `tickAllMedications`         |
| POST   | `/medications`                              | User      | —                             | `name`, `dosage`, `quantity`, `start_date`, `end_date`, `instructions` | `createMedication`           |
| PUT    | `/medications/:userId/:medicationId`        | User      | `userId`, `medicationId`      | `name`, `dosage`, `quantity`, `start_date`, `end_date`, `instructions` | `updateMedication`           |
| PUT    | `/medications/:userId/:medicationId/is-taken`| User     | `userId`, `medicationId`      | —                                                                      | `tickOffMedication`          |
| PUT    | `/medications/:userId/:id/refill`           | User      | `userId`, `id`                | `quantity`                                                             | `refillMedication`           |
| PUT    | `/medications/:userId/:id/missed`           | User      | `userId`, `id`                | —                                                                      | `markMedicationAsMissed`     |
| DELETE | `/medications/:userId/:medicationId`        | User      | `userId`, `medicationId`      | —                                                                      | `deleteMedication`           |


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

### Alerts API Routes

| Request     | URL                            | User Type   | Path Parameters       | Query Parameters         | Body Parameters                    |
|-------------|--------------------------------|-------------|------------------------|---------------------------|------------------------------------|
| `GET`       | `/alerts/search`              | User        | —                      | `title`, `category`       | —                                  |
| `GET`       | `/alerts/readstatus/:id`      | User        | `id` = UserID          | —                         | —                                  |
| `POST`      | `/alerts/updatestatus/:id`    | User        | `id` = AlertID         | —                         | `UserID`                           |
| `POST`      | `/alerts/checkhasnoties/:id`  | User        | `id` = AlertID         | —                         | `UserID`                                  |
| `POST`      | `/alerts`                     | Admin       | —                      | —                         | `title`, `catergory`, `severity`,`description`           |
| `PUT`       | `/alerts/:id`                 | Admin       | `id` = AlertID         | —                         | `title`, `catergory`, `severity`,`description`           |
| `PUT`       | `/alerts/delete/:id`          | Admin       | `id` = AlertID         | —                         | —                                  |
| `GET`       | `/alerts`                     | All         | —                      | —                         | —                                  |
| `GET`       | `/alerts/:id`                 | All         | `id` = AlertID         | —                         | —                                  |


