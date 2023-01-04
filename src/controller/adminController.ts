import express,{Request, Response} from 'express';
import { option, GenerateSalt, GeneratePassword, GenerateOTP, GenerateSignature, adminSchema, vendorSchema } from '../utils';
import {UserAttribute, UserInstance} from '../model/userModel';
import {v4 as uuidv4} from 'uuid'
import {FromAdminMail, userSubject} from '../config'
import jwt,{ JwtPayload } from 'jsonwebtoken';
import { VendorAttributes, VendorInstance } from '../model/vendorModel';





export const adminRegister = async (req: JwtPayload, res: Response)=>{
    try {
        const {email, phone, password, firstName, lastName, address} = req.body;
        const id = req.User.id;
        const uuiduser = uuidv4()
        const validateAdmin = adminSchema.validate(req.body, option);
        if(validateAdmin.error){
            return res.status(400).json({
                Error: validateAdmin.error.details[0].message
            })
        }
        const salt = await GenerateSalt();
        const adminPassword = await GeneratePassword(password, salt);
        const {otp, expiry} = GenerateOTP();

        const Admin = await UserInstance.findOne({where:{id: id}}) as unknown as UserAttribute;

        if(Admin.email === email){
            return res.status(400).json({
                Error: "email already exist"
            })
        }

        if(Admin.phone === phone){
            return res.status(400).json({
                Error: "phone-number already exist"
            })
        }
    
        //check if Admin exists
        if(Admin.role === "superadmin"){
            const user = await UserInstance.findOne({where:{email: email}}) as unknown as UserAttribute;
            if(!user){
                await UserInstance.create({
                    id: uuiduser,
                    email,
                    password: adminPassword,
                    firstName,
                    lastName,
                    salt,
                    address,
                    phone,
                    otp,
                    otp_expiry: expiry,
                    lng: 0,
                    lat: 0,
                    verified: true,
                    role: "admin"
                })
                //send otp to user
              
                //check if user exists in db, if yes give him jwt signature
                
                const Admin = await UserInstance.findOne({where:{id: id}}) as unknown as UserAttribute;
    
                let signature = await GenerateSignature({
                    id: Admin.id,
                    email: Admin.email,
                    verified: Admin.verified
                })
                return res.status(201).json({
                    message: "Admin created sucessfully",
                    signature,
                    verified: Admin.verified,
                })
            }
            return res.status(400).json({
                message: "Admin already exists"
            })
           
        }
       
        
    } catch (error) {
        res.status(500).json({
            Error: "Internal server error",
            route: "/admins/signup"
        });
    }
    }

    export const superRegister = async (req: Request, res: Response)=>{
        try {
            const {email, phone, password, firstName, lastName, address} = req.body;
            const uuiduser = uuidv4()
            const validateAdmin = adminSchema.validate(req.body, option);
            if(validateAdmin.error){
                return res.status(400).json({
                    Error: validateAdmin.error.details[0].message
                })
            }
            const salt = await GenerateSalt();
            const adminPassword = await GeneratePassword(password, salt);
            const {otp, expiry} = GenerateOTP();
    
            const Admin = await UserInstance.findOne({where:{email}}) as unknown as UserAttribute;
    
           
        
            //check if Admin exists
            if(!Admin){
                await UserInstance.create({
                    id: uuiduser,
                    email,
                    password: adminPassword,
                    firstName,
                    lastName,
                    salt,
                    address,
                    phone,
                    otp,
                    otp_expiry: expiry,
                    lng: 0,
                    lat: 0,
                    verified: true,
                    role: "superadmin"
                })
                //send otp to user
              
                //check if user exists in db, if yes give him jwt signature
                
                const Admin = await UserInstance.findOne({where:{email}}) as unknown as UserAttribute;
    
                let signature = await GenerateSignature({
                    id: Admin.id,
                    email: Admin.email,
                    verified: Admin.verified
                })
                return res.status(201).json({
                    message: "SuperAdmin created sucessfully",
                    signature,
                    verified: Admin.verified,
                })
            }
            return res.status(400).json({
                message: "SuperAdmin already exists"
            })
            
        } catch (error) {
            res.status(500).json({
                Error: "Internal server error",
                route: "/admins/signup"
            });
        }
        }



    export const createVendor=async(req: JwtPayload, res: Response)=>{
        try {
            const id = req.User.id;
            
            
            const validateVendor = vendorSchema.validate(req.body, option);
            if(validateVendor.error){
                return res.status(400).json({
                    Error: validateVendor.error.details[0].message
                })
            }
            const {email, password, name, pin, address, phone, restaurantName} = req.body;
            const salt = await GenerateSalt();
            const vendorPassword = await GeneratePassword(password, salt);
            const uuidvendor = uuidv4()
            // console.log(uuidvendor);
            
            const Vendor = await VendorInstance.findOne({where:{email}}) as unknown as VendorAttributes;
            console.log(Vendor);
            
            const Admin = await UserInstance.findOne({where:{id}}) as unknown as UserAttribute;
            console.log(Admin.role);
            
            if(Admin.role === 'admin' || Admin.role === 'superadmin'){
                
                
                if(!Vendor){
                    const createdVendor = await VendorInstance.create({
                        id: uuidvendor,
                        email,
                        password: vendorPassword,
                        name,
                        restaurantName,
                        salt,
                        address,
                        phone,
                        serviceAvailable: false,
                        role: "vendor",
                        rating: 0,
                        pin,
                        coverImage: "",
                    })
                   
                    return res.status(201).json({
                        message: "Vendor created sucessfully",
                        createdVendor
                    })
                }
                else{
                    return res.status(400).json({
                        message: "Vendor already exists"
                    })
                }
               
            }

            
            return res.status(400).json({
                message: "Unauthorized"
            })
            
        } catch (error) {
            res.status(500).json({
                Error: "Internal server error",
                route: "/admins/createvendor"
            });
        }
    }




