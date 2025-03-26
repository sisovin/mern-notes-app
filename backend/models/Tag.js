import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

tagSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;