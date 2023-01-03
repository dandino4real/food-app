import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { VendorAttributes, VendorInstance } from "../model/vendorModel";
import {
  GenerateSignature,
  loginSchema,
  option,
  updateVendorSchema,
  validatePassword,
} from "../utils";
import { FoodAttributes, FoodInstance } from "../model/foodModel";
import { v4 as uuidv4 } from "uuid";

/** ================= Vendor Login ===================== **/
export const vendorLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const validateResult = loginSchema.validate(req.body, option);
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    // check if the vendor exist
    const Vendor = (await VendorInstance.findOne({
      where: { email: email },
    })) as unknown as VendorAttributes;

    if (Vendor) {
      const validation = await validatePassword(
        password,
        Vendor.password,
        Vendor.salt
      );
      
      if (validation) {
        //Generate signature for vendor
        let signature = await GenerateSignature({
          id: Vendor.id,
          email: Vendor.email,
          serviceAvailable: Vendor.serviceAvailable,
        });

        return res.status(200).json({
          message: "You have successfully logged in",
          signature,
          email: Vendor.email,
          serviceAvailable: Vendor.serviceAvailable,
          role: Vendor.role,
        });
      }
    }
    return res.status(400).json({
      Error: "Wrong Username or password or not a verified vendor ",
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/vendors/login",
    });
  }
};

/** ================= Vendor Add Food ===================== **/

export const createFood = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;
    const { name, description, category, foodType, readyTime, price ,image} =
      req.body;

    // check if the vendor exist
    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
    })) as unknown as VendorAttributes;
    const foodid = uuidv4();
    if (Vendor) {
      const createfood = await FoodInstance.create({
        id: foodid,
        name,
        description,
        category,
        foodType,
        readyTime,
        price,
        rating: 0,
        vendorId: id,
        // image: req.file.path,
      });

      return res.status(201).json({
        message: "Food added successfully",
        createfood,
      });
    }
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/vendors/create-food",
    });
  }
};

/** ================= Get Vendor Profile ===================== **/
export const VendorProfile = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;

    // check if the vendor exist
    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
      // attributes:["id", ""],
      include: [
        {
          model: FoodInstance,
          as: "food",
          attributes: [
            "id",
            "name",
            "description",
            "category",
            "foodType",
            "readyTime",
            "price",
            "rating",
          ],
        },
      ],
    })) as unknown as VendorAttributes;
    return res.status(200).json({
      Vendor,
    });
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/vendors/get-profile",
    });
  }
};

/** ================= Vendor Delete food===================== **/
export const deleteFood = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;
    const foodid = req.params.id;
    // check if the vendor exist
    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
    })) as unknown as VendorAttributes;

    if (Vendor) {
      const deleteFood = await FoodInstance.destroy({
        where: { id: foodid },
      });

      res.status(200).json({
        message: "You have successfully delete food",
        deleteFood,
      });
    }
  } catch (err) {
    res.status(500).json({
      Error: "Internal server Error",
      route: "/vendors/delete-food",
    });
  }
};

export const updateVendorProfile = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.Vendor.id;
    const { coverImage, name, phone, address } = req.body;
    const joiValidateVendor = updateVendorSchema.validate(req.body, option);
    if (joiValidateVendor.error) {
      return res.status(400).json({
        Error: joiValidateVendor.error.details[0].message,
      });
    }
    const Vendor = (await VendorInstance.findOne({
      where: { id: id },
    })) as unknown as VendorAttributes;
    if (!Vendor) {
      return res.status(400).json({
        Error: "You are not authorized to update your profile",
      });
    }

    const updateVendor = (await VendorInstance.update(
      {
        // coverImage: req.file.path,
        name,
        phone,
        address,
      },
      { where: { id } }
    )) as unknown as VendorAttributes;

    if (updateVendor) {
      const Vendor = (await VendorInstance.findOne({
        where: { id },
      })) as unknown as VendorAttributes;
      return res.status(200).json({
        message: "You have successfully updated your account",
        Vendor,
      });
    }

    return res.status(400).json({
      Error: "There's an error",
    });
  } catch (error) {
    return res.status(500).json({
      Error: "Internal server error",
      route: "/vendor/update-profile",
    });
  }
};
