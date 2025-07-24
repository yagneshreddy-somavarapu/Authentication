// find th token from the  cookie and from that token it will find the user id

import jwt from 'jsonwebtoken'

const userAuth = async (req, resp, next) => {
    const { token } = req.cookies;

    if (!token) {
        return resp.json({ success: false, message: "Not Authorized. Login Again" })
    }
    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if (tokenDecode.id) {
            req.body.userId = tokenDecode.id
        }else{
            return resp.json({ success: false, message: "Not Authorized. Login Again" })
        }
        next();
    } catch (error) {
         resp.json({ success: false, message: error.message })
    }
}


export default userAuth;