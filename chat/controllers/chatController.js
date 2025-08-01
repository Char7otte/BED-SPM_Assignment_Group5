const chatModel = require("../models/chatModel");

async function getAllChats(req, res) {
    try {
        let chats;
        const { id, role, username } = req.user;

        if (role == "U") {
            chats = await chatModel.getAllChatsByHelpeeID(id);
        } else {
            chats = await chatModel.getAllChats();
        }

        //Removing the time zone part of the DATETIME2s. I'm pretty
        chats[0].created_date_time = chats[0].created_date_time.toLocaleString();
        chats[0].last_activity_date_time = chats[0].last_activity_date_time.toLocaleString();

        return res.render("chat/allChats", { chatData: chats, userID: id, username });
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error retrieving chats");
    }
}

//This function is here for testing and is replaced by chatMessageController.getAllMessagesInAChat
async function getChatByID(req, res) {
    try {
        const chatID = req.params.chatID;
        const chat = await chatModel.getChatByID(chatID);

        if (!chat) return res.status(404).send("Chat not found.");
        return res.json(chat);
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error retrieving chat");
    }
}

async function createChat(req, res) {
    try {
        const userID = req.params.userID;
        const chatTitle = req.body.question;
        const newChat = await chatModel.createChat(userID, chatTitle);

        if (!newChat) return res.status(404).send("Error creating chat.");
        return res.redirect(`/chats/${newChat.chat_id}`);
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error creating chat");
    }
}

async function deleteChat(req, res) {
    try {
        const chatID = req.params.chatID;
        const isDeleted = await chatModel.deleteChat(chatID);
        if (!isDeleted) return res.status(404).send("Chat not found");
        return res.status(204).end();
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error deleting chat");
    }
}

module.exports = {
    getAllChats,
    getChatByID,
    createChat,
    deleteChat,
};
