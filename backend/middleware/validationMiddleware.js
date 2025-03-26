import { body, validationResult } from "express-validator";

export const validateRole = [
  body("name").notEmpty().withMessage("Role name is required"),
  body("description").notEmpty().withMessage("Role description is required"),
  body("permissions").isArray().withMessage("Permissions must be an array"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
