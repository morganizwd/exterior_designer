import mongoose from "mongoose";
const { Schema, Types: { ObjectId } } = mongoose;

const AssetSchema = new Schema({
    shop: { type: ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },   
    category: { type: String, required: true },   
    color: { type: String, required: true },  
    price: { type: Number, required: true },   
    width: { type: Number },                     
    height: { type: Number },
}, {
    timestamps: true
});

export default mongoose.model("Asset", AssetSchema);
