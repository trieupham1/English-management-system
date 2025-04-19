const mongoose = require('mongoose');

const ChatbotMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isUserMessage: {
        type: Boolean,
        default: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        enum: ['schedule', 'assignment', 'course', 'progress', 'general'],
        default: 'general'
    },
    relatedIds: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relatedModel'
    }],
    relatedModel: {
        type: String,
        enum: ['Course', 'Assignment', 'None'],
        default: 'None'
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
});

// Index for efficient querying
ChatbotMessageSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('ChatbotMessage', ChatbotMessageSchema);