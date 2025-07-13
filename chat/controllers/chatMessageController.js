const chatMessageModel = require("../models/chatMessageModel");

async function getAllMessagesInAChat(req, res) {
    try {
        const chatID = req.params.chatID;
        const messages = await chatMessageModel.getAllMessagesInAChat(chatID);
        return res.render("chat/oneChat", { chatID, messageData: messages });
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
        return res.redirect(`/chats/${chatID}`);
    } catch (error) {
        console.log("Controller error: ", error);
        return res.status(500).send("Error sending message");
    }
}

async function editMessage(req, res) {
    try {
        const chatID = req.params.chatID;
        const { messageID, message } = req.body;
        const isEdited = await chatMessageModel.editMessage(chatID, messageID, message);
        if (!isEdited) return res.status(400).send("Error editting message");
        return res.redirect(`/chats/${chatID}`);
    } catch (error) {
        console.log("Controller error: ", error);
        return res.status(500).send("Error updating message");
    }
}

async function deleteMessage(req, res) {
    try {
        const chatID = req.params.chatID;
        const { messageID } = req.body;
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
    editMessage,
    deleteMessage,
};
