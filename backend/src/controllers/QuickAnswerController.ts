import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import ListQuickAnswerService from "../services/QuickAnswerService/ListQuickAnswerService";
import CreateQuickAnswerService from "../services/QuickAnswerService/CreateQuickAnswerService";
import ShowQuickAnswerService from "../services/QuickAnswerService/ShowQuickAnswerService";
import UpdateQuickAnswerService from "../services/QuickAnswerService/UpdateQuickAnswerService";
import DeleteQuickAnswerService from "../services/QuickAnswerService/DeleteQuickAnswerService";

import AppError from "../errors/AppError";
import ShowByTicketQuickAnswerService from "../services/QuickAnswerService/ShowByTicketQuickAnswerService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

interface QuickAnswerData {
  shortcut: string;
  message: string;
  whatsappId: number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { quickAnswers, count, hasMore } = await ListQuickAnswerService({
    searchParam,
    pageNumber
  });

  return res.json({ quickAnswers, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const newQuickAnswer: QuickAnswerData = req.body;

  const QuickAnswerSchema = Yup.object().shape({
    shortcut: Yup.string().required(),
    message: Yup.string().required(),
    whatsappId: Yup.number().required()
  });

  try {
    await QuickAnswerSchema.validate(newQuickAnswer);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const quickAnswer = await CreateQuickAnswerService({
    ...newQuickAnswer
  });

  const io = getIO();
  io.emit("quickAnswer", {
    action: "create",
    quickAnswer
  });

  return res.status(200).json(quickAnswer);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { quickAnswerId } = req.params;

  const quickAnswer = await ShowQuickAnswerService(quickAnswerId);

  return res.status(200).json(quickAnswer);
};

export const showByTicket = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { ticketId } = req.params;

  const { count, hasMore, quickAnswers } = await ShowByTicketQuickAnswerService(ticketId, searchParam, pageNumber);

  return res.status(200).json({ quickAnswers, count, hasMore });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const quickAnswerData: QuickAnswerData = req.body;

  const schema = Yup.object().shape({
    shortcut: Yup.string(),
    message: Yup.string()
  });

  try {
    await schema.validate(quickAnswerData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const { quickAnswerId } = req.params;

  const quickAnswer = await UpdateQuickAnswerService({
    quickAnswerData,
    quickAnswerId
  });

  const io = getIO();
  io.emit("quickAnswer", {
    action: "update",
    quickAnswer
  });

  return res.status(200).json(quickAnswer);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { quickAnswerId } = req.params;

  await DeleteQuickAnswerService(quickAnswerId);

  const io = getIO();
  io.emit("quickAnswer", {
    action: "delete",
    quickAnswerId
  });

  return res.status(200).json({ message: "Quick Answer deleted" });
};
