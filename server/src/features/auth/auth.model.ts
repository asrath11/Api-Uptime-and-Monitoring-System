import mongoose, { Document } from "mongoose";
import bcrypt from "bcrypt";

interface IAuth extends Document {
  name: string;
  email: string;
  password: string;
  comparePassword(userPassword: string): Promise<boolean>;
}

const { Schema } = mongoose;

const userSchema = new Schema<IAuth>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (userPassword: string) {
  return bcrypt.compare(userPassword, this.password);
}

const User = mongoose.model<IAuth>("User", userSchema);

export default User;