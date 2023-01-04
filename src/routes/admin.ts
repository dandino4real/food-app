import express from 'express';
import { adminRegister, createVendor, superRegister } from '../controller/adminController';
import { getAllUsers, getSingleUser, Login, Register, resendOTP, updateUserProfile, verifyUser } from '../controller/userController';
import { auth} from '../middleware/authorization';




const router = express.Router();
router.post('/signup', auth, adminRegister)
router.post('/supersignup', superRegister)
router.post('/createvendor', auth, createVendor)


export default router;