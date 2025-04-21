import mongoose from "mongoose";
const { Schema } = mongoose;

const ShopSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String },
    info: { type: String },   // контакты, сайт и т.п.
}, {
    timestamps: true
});

export default mongoose.model("Shop", ShopSchema);
