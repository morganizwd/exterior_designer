import mongoose from "mongoose";
const { Schema, Types: { ObjectId } } = mongoose;

const UserSchema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
}, {
    timestamps: true  // automatically adds createdAt, updatedAt
});

// индекс на email не обязателен — unique: true уже создаёт его
export default mongoose.model("User", UserSchema);