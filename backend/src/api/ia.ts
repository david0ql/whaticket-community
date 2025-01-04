import axios from "axios";

export const getIA = axios.create({
    baseURL: process.env.IA_URL,
})