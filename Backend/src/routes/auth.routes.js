const {Router} = require('express')
const { registerUserController, loginUserController, logoutUserController, getMeController } = require("../controllers/auth.controller")
const authMiddleware = require("../Middleware/auth.middleware")

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

/**
 * @route get/api/auth/get-me
 * @description get the currently logged in user's details, requires authentication
 * @access private
 */
authRouter.get("/get-me", authMiddleware.authUser, getMeController)

module.exports = authRouter;