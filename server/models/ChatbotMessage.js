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
    relatedTo: {
        type: String,
        enum: ['general', 'course', 'assignment', 'schedule', 'payment', 'technical']
    },
    relevantIds: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'relevantModel'
    }],
    relevantModel: {
        type: String,
        enum: ['Course', 'Lesson', 'Assignment', 'User']
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
});

// Index for efficient querying
ChatbotMessageSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model('ChatbotMessage', ChatbotMessageSchema);