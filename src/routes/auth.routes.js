const {Router} = require('express')
const { registerUserController, loginUserController, logoutUserController } = require("../controllers/auth.controller")

const authRouter = Router();

/**
 * @route Post /api/auth/register
 * @description register a new user
 * @access public
 */

authRouter.post("/register", registerUserController)

/**
 * @route Post/api/auth/login
 * @description login user with email and password
 * @access public
 */
authRouter.post("/login", loginUserController)

/**
 * @route get/api/auth/logout
 * @description logout user by clearing the token cookie and blacklisting the token
 * @access public
 */
authRouter.get("/logout", logoutUserController)

module.exports = authRouter;