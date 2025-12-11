import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

const UserRouter = Router();

// User routes
UserRouter.route("/")
  .get(getUsers)      // GET /api/users
  .post(createUser);  // POST /api/users

UserRouter.route("/:id")
  .get(getUserById)   // GET /api/users/:id
  .put(updateUser)    // PUT /api/users/:id
  .delete(deleteUser); // DELETE /api/users/:id

export default UserRouter;
