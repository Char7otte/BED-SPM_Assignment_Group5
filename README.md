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
