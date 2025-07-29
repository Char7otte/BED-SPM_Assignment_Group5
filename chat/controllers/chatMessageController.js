const chatMessageModel = require("../models/chatMessageModel");
const chatModel = require("../models/chatModel");

async function getAllMessagesInAChat(req, res) {
    try {
        let messages;
        const { id, role } = req.user;
        const chatID = req.params.chatID;

        if (role == "U") {
            //Verify that the user is the helpee
            const chat = await chatModel.getChatByID(chatID);
            if (!id == chat.helpee_id) {
                return res.status(403).send("Forbidden");
            }
        }

        messages = await chatMessageModel.getAllMessagesInAChat(chatID);
        return res.render("chat/oneChat", { chatID, messageData: messages });
    } catch (error) {
        console.error("Controller error: ", error);
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
        console.error("Controller error: ", error);
        return res.status(500).send("Error sending message");
    }
}

async function editMessage(req, res) {
    try {
        const chatID = req.params.chatID;
        const { messageID, message } = req.body;
        const isEdited = await chatMessageModel.editMessage(chatID, messageID, message);
        if (!isEdited) return res.status(400).send("Error editing message");
        return res.redirect(`/chats/${chatID}`);
    } catch (error) {
        console.error("Controller error: ", error);
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
        console.error("Controller error: ", error);
        return res.status(500).send("Error deleting message");
    }
}

module.exports = {
    getAllMessagesInAChat,
    createMessage,
    editMessage,
    deleteMessage,
};
