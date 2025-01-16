import { Sequelize, Op } from "sequelize";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import sequelize from "../../database";
import Interaction from "../../models/Interaction";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
}

const ListUsersService = async ({
  searchParam = "",
  pageNumber = "1"
}: Request): Promise<any> => {
  const whereCondition = {
    [Op.or]: [
      {
        "$User.name$": Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("User.name")),
          "LIKE",
          `%${searchParam.toLowerCase()}%`
        )
      },
      { email: { [Op.like]: `%${searchParam.toLowerCase()}%` } }
    ]
  };
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: users } = await User.findAndCountAll({
    where: whereCondition,
    attributes: ["name", "id", "email", "profile", "createdAt", "isConnected"],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      { model: Queue, as: "queues", attributes: ["id", "name", "color"] },
      { model: Whatsapp, as: "whatsapp", attributes: ["id", "name"] },
    ],
  });

  const usersWithFinalState = await Promise.all(
    users.map(async (user) => {
      const lastInteraction = await Interaction.findOne({
        where: { userId: user.id },
        order: [["createdAt", "DESC"]],
      });
      if (user.isConnected === 1) {

        if (lastInteraction) {
          const lastInteractionTime = new Date(lastInteraction.createdAt).getTime();
          const currentTime = Date.now();
          const timeDifferenceInSeconds = (currentTime - lastInteractionTime) / 1000;

          if (timeDifferenceInSeconds > 120) {
            return {
              ...user.toJSON(),
              lastInteraction: lastInteraction.createdAt,
              finalIsConnected: 3
            };
          }
        }
      }

      return {
        ...user.toJSON(),
        lastInteraction: lastInteraction ? lastInteraction.createdAt : null,
        finalIsConnected: user.isConnected,
      };
    })
  );

  const hasMore = count > offset + users.length;

  return {
    users: usersWithFinalState,
    count,
    hasMore,
  };
};

export default ListUsersService;
