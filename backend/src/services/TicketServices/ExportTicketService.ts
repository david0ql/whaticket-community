import AppError from "../../errors/AppError";
import Message from "../../models/Message";

const ExportTicketService = async (id: string): Promise<Message[]> => {
  const messages = await Message.findAll({
    where: { ticketId: id }
  });

  if (!messages) {
    throw new AppError("Ticket not found.", 404);
  }

  return messages;
};

export default ExportTicketService;
