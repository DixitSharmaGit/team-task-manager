const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  color: String,
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);