const {Router} = require('express')
const { registerUserController, loginUserController } = require("../controllers/auth.controller")

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

module.exports = authRouter;