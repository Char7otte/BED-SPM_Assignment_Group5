const chatModel = require("../models/chatModel");

async function getAllChats(req, res) {
    try {
        const chats = await chatModel.getAllChats();
        return res.render("chat/allChats", { chatData: chats });
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
        const newChatID = await chatModel.createChat(userID);

        if (!newChatID) return res.status(404).send("Account error.");

        const newChat = await chatModel.getChatByID(newChatID);

        if (!newChat) return res.status(404).send("Error creating chat.");
        return res.redirect(`/chats/${newChatID}`);
    } catch (error) {
        console.error("Controller error: ", error);
        return res.status(500).send("Error creating chat");
    }
}

async function deleteChat(req, res) {
    try {
        const chatID = req.params.chatID;
        const isDeleted = await chatModel.deleteChat(chatID);
        if (!isDeleted) return res.status(404).send("Chat ID not found");
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
