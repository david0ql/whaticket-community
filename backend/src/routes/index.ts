import { Router } from "express";
import { verify } from "jsonwebtoken";

import userRoutes from "./userRoutes";
import authRoutes from "./authRoutes";
import settingRoutes from "./settingRoutes";
import contactRoutes from "./contactRoutes";
import ticketRoutes from "./ticketRoutes";
import whatsappRoutes from "./whatsappRoutes";
import messageRoutes from "./messageRoutes";
import whatsappSessionRoutes from "./whatsappSessionRoutes";
import queueRoutes from "./queueRoutes";
import quickAnswerRoutes from "./quickAnswerRoutes";
import apiRoutes from "./apiRoutes";
import authConfig from "../config/auth";
import AppError from "../errors/AppError";
import { TokenPayload } from "../middleware/isAuth";
import Interaction from "../models/Interaction";

const routes = Router();

const interactionRouter = Router();

interactionRouter.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    try {
        const [, token] = authHeader.split(" ");

        const decoded = verify(token, authConfig.secret);

        const { id } = decoded as TokenPayload;

        await Interaction.create({
            userId: id,
        })
    } catch (error) {
        throw new AppError("ERR_SESSION_EXPIRED", 401);
    }

    next();
});

interactionRouter.use(userRoutes);
interactionRouter.use(settingRoutes);
interactionRouter.use(contactRoutes);
interactionRouter.use(ticketRoutes);
interactionRouter.use(whatsappRoutes);
interactionRouter.use(messageRoutes);
interactionRouter.use(whatsappSessionRoutes);
interactionRouter.use(queueRoutes);
interactionRouter.use(quickAnswerRoutes);
interactionRouter.use("/api/messages", apiRoutes);

routes.use("/auth", authRoutes);

routes.use(interactionRouter);

export default routes;
