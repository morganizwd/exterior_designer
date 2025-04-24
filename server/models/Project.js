import mongoose from "mongoose";
const { Schema, Types: { ObjectId } } = mongoose;

const ProjectSchema = new Schema({
    user: { type: ObjectId, ref: "User", required: true },
    name: { type: String, default: "Без названия" },
    description: { type: String },

    plot: {
        type: { type: String, enum: ["Rectangle", "Polygon"], default: "Rectangle" },
        width: Number,
        height: Number,
        points: [{ x: Number, y: Number }] 
    },

    objects: [{
        asset: { type: ObjectId, ref: "Asset", required: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        scale: { type: Number, default: 1 },
        rotation: { type: Number, default: 0 }
    }]
}, {
    timestamps: true
});

export default mongoose.model("Project", ProjectSchema);
