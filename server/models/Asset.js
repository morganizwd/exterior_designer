import mongoose from "mongoose";
const { Schema, Types: { ObjectId } } = mongoose;

const AssetSchema = new Schema({
    shop: { type: ObjectId, ref: "Shop", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },   // путь к PNG
    category: { type: String, required: true },   // напр. 'tree', 'bench'…
    color: { type: String, required: true },   // напр. 'green', 'brown'…
    price: { type: Number, required: true },   // в условных единицах
    width: { type: Number },                     // оригинальный размер
    height: { type: Number },
}, {
    timestamps: true
});

export default mongoose.model("Asset", AssetSchema);
