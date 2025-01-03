import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  organizer_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  picture: {
    type: String,
    trim: true
  },
  public_id: {
    type: String
  },
  category: {
    type: Object,
    default: {},
  },
  start_date: {
    type: String,
  },
  start_time: {
    type: String,
  },
  end_date: {
    type: String,
  },
  end_time: {
    type: String,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  link_other: {
    type: String,
    trim: true
  },  
  type: {
    type: String,
    enum: ['info', 'event'],
    default: 'info'
  },
  member: {
    type: String,
    enum: ['yes', 'no'],
    default: 'no'
  },
  register_start_date: {
    type: String,
  },
  register_start_time: {
    type: String,
  },
  register_end_date: {
    type: String,
  },
  register_end_time: {
    type: String,
  },
  isRecruiting: {
    type: Boolean,
    default: false
  },
  maxParticipants: {
    type: Number,
    default: "0"
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  views: {
    type: Number,
    default: 0
  },
  description_image_ids: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approved_at: {
    type: Date,
    default: null
  },
  rejection_reason: {
    type: String,
    default: null
  },
  is_verified_organizer: {
    type: Boolean,
    default: false
  },
  admin_notes: {
    type: String,
    default: null
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'Posts_col'
});


PostSchema.virtual('likes_count').get(function() {
  return this.likes.length;
});

PostSchema.virtual('current_participants').get(function() {
  return this.participants.length;
});


// Index for efficient querying
PostSchema.index({ start_date: 1, category: 1, type: 1 });
PostSchema.index({ status: 1, created_at: -1 });

// Ensure virtuals are included in toJSON output
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

// Check if the model already exists before creating a new one
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

export default Post;