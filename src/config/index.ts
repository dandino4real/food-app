import {Sequelize} from 'sequelize';
import dotenv from 'dotenv'
dotenv.config()

export const db = new Sequelize('app', '', '',{
    storage: "./food.sqlite",
    dialect : "sqlite",
    logging: false
    
})

export const accountSid = process.env.ACCOUNTSID;
export const authToken = process.env.AuthToken
export const fromAdminPhone = process.env.fromAdminPhone

export const GMAIL_USER = process.env.GMAIL_USER
export const GMAIL_PASS = process.env.GMAIL_PASS


export const userSubject = process.env.userSubject as string
export const FromAdminMail = process.env.FromAdminMail as string


export const APP_SECRET = process.env.APP_SECRET!