import{NextFunction, Request, Response} from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import {APP_SECRET} from '../config'
import { UserAttribute, UserInstance } from '../model/userModel'


export const auth = async(req: JwtPayload, res:Response, next: NextFunction)=>{
try {
    const authorization = req.headers.authorization

    if(!authorization){
        return res.status(401).json({
            Error: "kindly login as a user"
        })
    }

    //Bearer ebddbcdftgfdgfgfg

    const token = authorization.slice(7, authorization.length)
    let verified = jwt.verify(token, APP_SECRET)
    if(!verified){
        return res.status(401).json({
            Error: "unauthorised "
        })
    }

    const {id} = verified as {[key:string] : string}
    // find user by id
    const user = (await UserInstance.findOne({
        where: { id : id },
      })) as unknown as UserAttribute;

      if(!user){
        return res.status(401).json({
            Error: "Invalid credentials "
        })

      }
      req.user = verified
      next()


} catch (err) {
    return res.status(401).json({
            Error: "unauthorised"
        })
}

}
