import mongoose from 'mongoose';

const noteDetailSchema = new mongoose.Schema({
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
    detail: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

noteDetailSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const NoteDetail = mongoose.model('NoteDetail', noteDetailSchema);

export default NoteDetail;