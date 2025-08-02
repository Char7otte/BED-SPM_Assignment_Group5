const chatMessageModel = require("../models/chatMessageModel");
const chatModel = require("../models/chatModel");
const { format } = require("date-and-time");

async function getAllMessagesInAChat(req, res) {
    try {
        const { id, role } = req.user;
        const chatID = req.params.chatID;

        const chat = await chatModel.getChatByID(chatID); //This query can't be inner joined with the chat messages query in the event there are no chat messages sent
        const title = chat.title;

        if (role == "U" && !id == chat.helpee_id) {
            //Verify that the user is the helpee
            return res.status(403).send("Forbidden");
        }

        const messages = await chatMessageModel.getAllMessagesInAChat(chatID);
        messages.forEach((message) => {
            message.sent_date_time = format(message.sent_date_time, "ddd, D MMM YYYY hh:mm A"); //Fri, 1 Aug 2025 05:48 AM

            //This is kind of a scuffed solution but having to update everyone's code this late into development  is too much trouble
            switch (message.sender_role) {
                case "A":
                    message.sender_role = "Admin";
                    break;
                case "V":
                    message.sender_role = "Volunteer";
                    break;
                case "U":
                    message.sender_role = "User";
                    break;
            }
        });
        return res.render("chat/oneChat", { chatID, messageData: messages, title, userID: id, userRole: role });
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
