const chatMessageModel = require("../models/chatMessageModel");

async function getAllMessagesInAChat(req, res) {
    try {
        const chatID = req.params.chatID;
        const messages = await chatMessageModel.getAllMessagesInAChat(chatID);
        return res.json(messages);
    } catch (error) {
        console.log("Controller error: ", error);
        return res.status(500).send("Error getting chat messages");
    }
}

async function createMessage(req, res) {
    try {
        const chatID = req.params.chatID;
        const { senderID, message } = req.body;
        const isSent = await chatMessageModel.createMessage(chatID, senderID, message);

        if (!isSent) return res.status(400).send("Error sending message");
        return res.status(201).send("Message sent!");
    } catch (error) {
        console.log("Controller error: ", error);
        return res.status(500).send("Error sending message");
    }
}

async function deleteMessage(req, res) {
    try {
        const chatID = req.params.chatID;
        const messageID = req.params.messageID;
        const isDeleted = await chatMessageModel.deleteMessage(chatID, messageID);
        if (!isDeleted) return res.status(400).send("Error deleting message");
        return res.status(204).end();
    } catch (error) {
        console.log("Controller error: ", error);
        return res.status(500).send("Error deleting message");
    }
}

module.exports = {
    getAllMessagesInAChat,
    createMessage,
    deleteMessage,
};
