import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userMOdel from '../models/usermodel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';

//user register

export const register = async (req, resp) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return resp.json({ success: false, message: "Missing Details" })
    }
    try {
        const existingUser = await userMOdel.findOne({ email })

        if (existingUser) {
            return resp.json({ success: false, message: "User already exits" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        //user created here

        const user = new userMOdel({ name, email, password: hashPassword });
        await user.save();

        //auth token:-

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });  //when ever new user will create in to mongodb data base in that user collection  it will add one _id property to store the id in this token

        //cookie are created register Api

        resp.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",  //false for development environment true for production environment
            sameSite: process.env.NODE_ENV === "production" ?
                "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000   //exp time for cookie
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to MongoByte Solutions your account has been registered',
            text: `Welcome to MongoByte Solutions. Your account has been created with email id: ${email}`
        }

        var response = await transporter.sendMail(mailOptions)
        console.log(response);

        return resp.json({ success: true });

    } catch (error) {

        resp.json({ success: false, message: error.message })
    }
}

//user login

export const login = async (req, resp) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return resp.json({ success: false, message: "Email and password are required" })
    }
    try {
        const user = await userMOdel.findOne({ email }) //if user is available we will get the user 
        if (!user) {
            return resp.json({ success: false, message: "Invalid email" })
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return resp.json({ success: false, message: "Invalid password" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });  //when ever new user will create in to mongodb data base in that user collection  it will add one _id property to store the id in this token

        //cookie

        resp.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",  //false for development environment true for production environment
            sameSite: process.env.NODE_ENV === "production" ?
                "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000   //exp time for cookie
        });

        // Sending Welcome email

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to MongoByte Solutions your account has been successfully login....!',
            text: `Welcome to MongoByte Solutions. Your account has been created with email id: ${email}`
        }

        var response = await transporter.sendMail(mailOptions)
        console.log(response);




        return resp.json({ success: true });


    } catch (error) {
        return resp.json({ success: false, message: error.message })
    }
}

//user logout

export const logout = async (req, resp) => {
    try {
        resp.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",  //false for development environment true for production environment
            sameSite: process.env.NODE_ENV === "production" ?
                "none" : "strict",
        })

        return resp.json({ success: true, message: "Logged Out" })
    } catch (error) {
        return resp.json({ success: false, message: error.message })
    }
}

// Send Verification OTP to the User's Email

export const sendVerifyOtp = async (req, resp) => {
    try {
        const { userId } = req.body;

        const user = await userMOdel.findById(userId);

        if (user.isAccountVerified) {
            return resp.json({ success: false, message: "Account Already Verified" })
        }

        //to generate the otp we use math randum function  

        //Math.floar that will remove the decimal points ex.86.43 =>86
        //3 digit number should be converted as a string


        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            // text: ` Your OTP is  ${otp}. Verify your account using this OTP.`,
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        }

        //send the email

        await transporter.sendMail(mailOptions);

        resp.json({ success: true, message: "Verification OTP Sent on Email" })


    } catch (error) {
        resp.json({ success: false, message: error.message })
    }
}

//Verify the Email using the OTP

export const verifyEmail = async (req, resp) => {
    const { userId, otp } = req.body;

    //if the data is not available
    if (!userId || !otp) {
        return resp.json({ success: false, message: "Missing Details" });
    }
    try {
        const user = await userMOdel.findById(userId);
        if (!user) {
            return resp.json({ success: false, message: 'user not found' });
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return resp.json({ success: false, message: 'Invalid OTP' });
        }

        // if the otp is valid then,will check the expirey date

        if (user.verifyOtpExpireAt < Date.now()) {
            return resp.json({ success: false, message: 'OTP Expired' });
        }

        user.isAccountVerified = true;
        user.verifyOtp = "";
        user.verifyOtpExpireAt = 0;

        await user.save();
        return resp.json({ success: true, message: 'Email Verified Successfully'})

    } catch (error) {
        return resp.json({ success: false, message: error.message })
    }

}

// check if user is authenticated

export const isAuthenticated = async (req, resp) => {
    try {
        return resp.json({ success: true })
    } catch (error) {
        resp.json({ success: false, message: error.message })
    }

}

// Send Password Reset OTP

export const sendResetOtp = async (req, resp) => {
    const { email } = req.body

    if (!email) {
        return resp.json({ success: false, message: 'Email is required' })
    }

    try {

        const user = await userMOdel.findOne({ email });
        if (!user) {
            return resp.json({ success: false, message: 'User not found' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;

        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            // text: ` Your OTP is resetting your password is ${otp}.  Use this OTP to proceed with resetting your password.`,
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        }

        await transporter.sendMail(mailOptions);

        return resp.json({ success: true, message: 'OTP sent to your email' });


    } catch (error) {
        return resp.json({ success: false, message: error.message })

    }
}

// Reset User Password

export const resetPassword = async (req, resp) => {

    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
        return resp.json({ success: false, message: 'Email, OTP, and new password are required' });
    }
    try {
        const user = await userMOdel.findOne({ email });
        if (!user) {
            return resp.json({ success: false, message: "user not found" });
        }
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return resp.json({ success: false, message: 'Invalid OTP' });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return resp.json({ success: false, message: "OTP Expired" });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return resp.json({ success: true, message: 'password has been reset successfully' })

    } catch (error) {
        return resp.json({ success: false, message: error.message });
    }
}
