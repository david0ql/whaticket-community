import QuickAnswer from "../../models/QuickAnswer";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import { Sequelize } from "sequelize";

interface Response {
  quickAnswers: QuickAnswer[];
  count: number;
  hasMore: boolean;
}

const ShowByTicketQuickAnswerService = async ( id: string, searchParam: string = "", pageNumber: string = "1" ): Promise<Response> => {
  const ticket = await Ticket.findByPk(id);

  if (!ticket) {
    throw new AppError("ERR_NO_QUICK_ANSWERS_FOUND", 404);
  }

  const whereCondition = {
    message: Sequelize.where(
      Sequelize.fn("LOWER", Sequelize.col("message")),
      "LIKE",
      `%${searchParam.toLowerCase().trim()}%`
    ),
    whatsappId: ticket.whatsappId
  };

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: quickAnswers } = await QuickAnswer.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["message", "ASC"]]
  });

  const hasMore = count > offset + quickAnswers.length;

  return {
    quickAnswers,
    count,
    hasMore
  };
};

export default ShowByTicketQuickAnswerService;
