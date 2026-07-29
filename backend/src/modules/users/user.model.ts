import { Schema, model, type HydratedDocument } from "mongoose";
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from "../../database/enums.js";
import { isEmail } from "../../database/validators.js";

export interface User {
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      validate: { validator: isEmail, message: "Invalid email format" }
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "CUSTOMER"
    },
    status: {
      type: String,
      enum: USER_STATUSES,
      required: true,
      default: "ACTIVE"
    }
  },
  {
    collection: "users",
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as Partial<User>).passwordHash;
        return ret;
      }
    }
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = model<User>("User", userSchema);
