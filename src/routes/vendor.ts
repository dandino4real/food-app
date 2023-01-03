import express from "express";
import {authVendor} from '../middleware/authorization'
import {createFood, deleteFood, vendorLogin, VendorProfile, updateVendorProfile} from "../controller/vendorController";
import { upload } from '../utils/multer';

const router = express.Router();
router.post('/login',vendorLogin)
router.post('/create-food',authVendor,upload.single('image'), createFood)
router.post('/get-profile',authVendor, VendorProfile)
router.delete('/deletefood/:id',authVendor, deleteFood)
router.patch('/update-profile', authVendor, upload.single('coverImage'), updateVendorProfile)





export default router;