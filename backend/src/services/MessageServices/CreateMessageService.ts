import { getIA } from "../../api/ia";
import { getIO } from "../../libs/socket";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";

interface MessageData {
  id: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
}

interface Request {
  messageData: MessageData;
}

const CreateMessageService = async ({
  messageData,
}: Request): Promise<{ message: Message; body: string }> => {
  await Message.upsert(messageData);

  const ticket = await Ticket.findOne({
    where: {
      id: messageData.ticketId,
    }
  });

  if (ticket) {
    await ticket.update({
      status: "open",
      userId: null,
      unreadMessages: 0,
    });
  }

  let responseBody = "";

  if (messageData?.fromMe === false && "fromMe" in messageData) {
    const { data } = await getIA.post("/conversation", {
      ticketID: messageData.ticketId,
      userMessage: messageData.body,
      messageID: messageData.id,
    });

    responseBody = data.message;
  }

  const message = await Message.findByPk(messageData.id, {
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        include: [
          "contact",
          "queue",
          {
            model: Whatsapp,
            as: "whatsapp",
            attributes: ["name"],
          },
        ],
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"],
      },
    ],
  });

  if (!message) {
    throw new Error("ERR_CREATING_MESSAGE");
  }

  const io = getIO();
  io.to(message.ticketId.toString())
    .to(message.ticket.status)
    .to("notification")
    .emit("appMessage", {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact,
    });

  return {
    message,
    body: responseBody,
  };
};

export default CreateMessageService;
