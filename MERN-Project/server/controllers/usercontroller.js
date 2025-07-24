import userMOdel from "../models/usermodel.js";
import userModel from "../models/usermodel.js"

export const getUserData = async (req, resp) => {
    try {
        const { userId } = req.body;
        const user = await userMOdel.findById(userId);

        if (!user) {
            return resp.json({ success: false, message: 'User not found' });
        }

        resp.json({
            success: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        });
        
    } catch (error) {
        resp.json({ success: false, message: error.message })
    }
}