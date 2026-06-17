const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  return { id: this._id.toString(), name: this.name, email: this.email };
};

module.exports = mongoose.model("User", userSchema);