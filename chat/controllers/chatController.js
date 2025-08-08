const chatModel = require("../models/chatModel");
const { format, addHours } = require("date-and-time");

async function getAllChats(req, res) {
    try {
        let chats;
        const { id, role } = req.user;

        if (role == "U") {
            chats = await chatModel.getAllChatsByHelpeeID(id);
        } else {
            chats = await chatModel.getAllChats();
        }

        chats.forEach((chat) => {
            chat.created_date_time = addHours(chat.created_date_time, -8);
            chat.created_date_time = format(chat.created_date_time, "ddd, D MMM YYYY hh:mm A"); //Fri, 1 Aug 2025 05:48 AM
            chat.last_activity_date_time = addHours(chat.last_activity_date_time, -8);
            chat.last_activity_date_time = format(chat.last_activity_date_time, "ddd, D MMM YYYY hh:mm A"); //Fri, 1 Aug 2025 05:48 AM
        });

        return res.render("chat/allChats", { chatData: chats, userID: id, userRole: role });
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error retrieving chats");
    }
}

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

async function markChatAsAnswered(req, res) {
    try {
        const chatID = req.params.chatID;
        const isUpdated = await chatModel.markChatAsAnswered(chatID);
        if (isUpdated) res.redirect(`/chats/${chatID}`);
        else res.status(500).send("Error updating chat status");
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error updating chat status");
    }
}

async function checkIfChatIsAnswered(req, res, next) {
    try {
        const chatID = req.params.chatID;
        const chat = await chatModel.getChatByID(chatID);

        if (!chat) return res.status(404).send("Chat not found");
        if (chat.chat_status == "Closed") req.chatStatusClosed = true;

        next();
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error verifying chat status");
    }
}

async function searchClosedChats(req, res) {
    try {
        const searchQuery = `%${req.query.q || ""}%`;
        const chats = await chatModel.searchClosedChats(searchQuery);

        return res.json(chats);
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error getting all closed chats");
    }
}

module.exports = {
    getAllChats,
    getChatByID,
    createChat,
    deleteChat,
    markChatAsAnswered,
    checkIfChatIsAnswered,
    searchClosedChats,
};
