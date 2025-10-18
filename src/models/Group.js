import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const WeightsSchema = new mongoose.Schema({
  distance: {
    type: Number,
    default: 1,
    min: 0,
    max: 2
  },
  wait: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 2
  },
  money: {
    type: Number,
    default: 0.6,
    min: 0,
    max: 2
  }
}, { _id: false });

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Il nome del gruppo è obbligatorio'],
    trim: true,
    minlength: [2, 'Il nome deve avere almeno 2 caratteri'],
    maxlength: [50, 'Il nome non può superare 50 caratteri']
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    length: 6
  },
  members: [MemberSchema],
  weights: {
    type: WeightsSchema,
    default: () => ({})
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index per performance
// GroupSchema.index({ inviteCode: 1 });
GroupSchema.index({ adminId: 1 });
GroupSchema.index({ 'members.userId': 1 });

// Virtual per contare membri
GroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method per ottenere il prossimo turno
GroupSchema.methods.getNextPerson = function() {
  if (!this.members || this.members.length === 0) {
    return null;
  }
  
  // Ordina per punteggio crescente (chi ha meno punti va prima)
  const sorted = [...this.members].sort((a, b) => a.score - b.score);
  return sorted[0];
};

// Method per aggiungere membro
GroupSchema.methods.addMember = function(userId, name) {
  const existingMember = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('Membro già presente nel gruppo');
  }
  
  this.members.push({
    userId,
    name,
    score: 0,
    joinedAt: new Date()
  });
  
  return this.save();
};

// Method per rimuovere membro
GroupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(
    m => m.userId.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method per reset punteggi
GroupSchema.methods.resetScores = function() {
  this.members.forEach(member => {
    member.score = 0;
  });
  
  return this.save();
};

// Method per aggiornare punteggio membro
GroupSchema.methods.updateMemberScore = function(userId, scoreToAdd) {
  const member = this.members.find(
    m => m.userId.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('Membro non trovato nel gruppo');
  }
  
  member.score += scoreToAdd;
  return this.save();
};

export default mongoose.model('Group', GroupSchema);