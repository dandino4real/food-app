import express, { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  option,
  GenerateSalt,
  GeneratePassword,
  GenerateOTP,
  onRequestOTP,
  emailHtml,
  mailSent,
  GenerateSignature,
  verifySignature,
  loginSchema,
  validatePassword,
  updateSchema,
} from "../utils";
import { UserAttribute, UserInstance } from "../model/userModel";
import { v4 as uuidv4 } from "uuid";
import { FromAdminMail, userSubject } from "../config";
import { JwtPayload } from "jsonwebtoken";


export const Register = async (req: Request, res: Response) => {
  try {
    const { email, phone, password, confirm_password } = req.body;
    const uuiduser = uuidv4();
    const validateResult = registerSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    //generate salt
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    //Generate OTP
    const { otp, expiry } = GenerateOTP();

    //check if the user exist
    const User = await UserInstance.findOne({ where: { email: email } });

    //create admin
    if (!User) {
      let user = await UserInstance.create({
        id: uuiduser,
        email,
        password: userPassword,
        firstName: "",
        lastName: "",
        salt,
        address: "",
        phone,
        otp,
        otp_expiry: expiry,
        lng: 0,
        lat: 0,
        verified: false,
        role:"user"
      });

      //send otp to user
        await onRequestOTP(otp, phone);
        let html = emailHtml(otp)
        await  mailSent( FromAdminMail, email, userSubject, html)

      //check if the admin exist
      const User = (await UserInstance.findOne({
        where: { email: email },
      })) as unknown as UserAttribute;

      
      //Generate a signature
      let signature = await GenerateSignature({
        id: User.id,
        email: User.email,
        verified: User.verified,
      });

      return res.status(201).json({
        message:
          "User created successfully check your email or phone for verification",
        signature,
        verified: User.verified,
      });
    }
    return res.status(400).json({
      message: "User already exist",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/signup",
    });
  }
};

// verify users

export const verifyUser = async (req: Request, res: Response) => {
  try {
    // const {signature}  = req.params
    const token = req.params.signature;
    const decode = await verifySignature(token);

    // check if the user is a registerd user
    const User = (await UserInstance.findOne({
      where: { email: decode.email },
    })) as unknown as UserAttribute;

    if (User) {
      const { otp } = req.body;
      if (User.otp === parseInt(otp) && User.otp_expiry >= new Date()) {
        const updatedUser = (await UserInstance.update(
          { verified: true },
          { where: { email: decode.email } }
        )) as unknown as UserAttribute;

        //Regenerate a new signature
        let signature = await GenerateSignature({
          id: updatedUser.id,
          email: updatedUser.email,
          verified: updatedUser.verified,
        });

        if (updatedUser) {
          const User = (await UserInstance.findOne({
            where: { email: decode.email },
          })) as unknown as UserAttribute;
          return res.status(200).json({
            message: "You have succesfully verified your account",
            signature,
            verified: User.verified,
          });
        }
      }
    }
    return res.status(400).json({
      Error: "Invalid credential or OTP already expired",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internalserver Error",
      route: "/users/verify",
    });
  }
};

//Login Users

export const Login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const validateResult = loginSchema.validate(req.body, option);

    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    //checkif user exist
    const User = (await UserInstance.findOne({
      where: { email: email },
    })) as unknown as UserAttribute;

    if (User.verified === true) {
      const validation = await validatePassword(
        password,
        User.password,
        User.salt
      );

      if (validation) {
        //Generate a signature
        let signature = await GenerateSignature({
          id: User.id,
          email: User.email,
          verified: User.verified,
        });
        return res.status(200).json({
          message: "You have successfully logged in",
          signature,
          email: User.email,
          verified: User.verified,
        });
      }
    }
    return res.status(400).json({
      Error: "Wrong Username or Password or not a verified password",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/login",
    });
  }
};

//resend OTP

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const token = req.params.signature;
    const decode = await verifySignature(token);

    //check ifthe user is a registered user
    const User = (await UserInstance.findOne({
      where: { email: decode.email },
    })) as unknown as UserAttribute;
    if (User) {
      //Generate
      const { otp, expiry } = GenerateOTP();
      const updatedUser = (await UserInstance.update(
        {
          otp,
          otp_expiry: expiry,
        },
        { where: { email: decode.email } }
      )) as unknown as UserAttribute;
      if (updatedUser) {
        await onRequestOTP(otp, User.phone);
        //send mail to user
        const html = emailHtml(otp);
        await mailSent(FromAdminMail, User.email, userSubject, html);
        return res.status(200).json({
          message: "OTP resend to registered phone number and email",
        });
      }
    }
    return res.status(400).json({
      Error: "Error sending OTP",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internalserver Error",
      route: "/users/resend-otp/:signature",
    });
  }
};

// profile

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // const users = await UserInstance.findAll({})
    // return res.status(200).json({
    //     message: "You have successfully retrieve all users",
    //     users
    // }) OR

    const limit = req.query.limit as number | undefined;
    const users = await UserInstance.findAndCountAll({
      limit: limit,
    });
    return res.status(200).json({
      message: "You have successfully retrieve all users",
      Count: users.count,
      Users: users.rows,
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/users/get-all-users",
    });
  }
};

export const getSingleUser = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;

    // find user by id
    const User = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttribute;
    if (User) {
      return res.status(200).json({
        User,
      });
    }
    return res.status(400).json({
      message: "User not found",
    });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/get-user",
    });
  }
};


// update user profile
export const updateUserProfile = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.user.id;
    const { firstName, lastName, address, phone } = req.body;
    //Joi validation
    const validateResult = updateSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    // check if the user is a registered user
    const User = (await UserInstance.findOne({
      where: { id: id },
    })) as unknown as UserAttribute;

    if (!User) {
      return res.status(400).json({
        Error: "You are not authorised to update your profile",
      });
    }

    const updatedUser = (await UserInstance.update(
      {
        firstName,
        lastName,
        address,
        phone,
      },
      { where: { id: id } }
    )) as unknown as UserAttribute;

    if (updatedUser) {
      const User = (await UserInstance.findOne({
        where: { id: id },
      })) as unknown as UserAttribute;
      return res.status(200).json({
        message: "You have successfully updated your profile",
        User,
      });
    }
    return res.status(400).json({
      message: "Error occured",
    });
  } catch (err) {
    return res.status(500).json({
      Error: "Internal server Error",
      route: "/users/update-profile",
    });
  }
};

