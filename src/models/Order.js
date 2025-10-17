import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Il gruppo è obbligatorio']
  },
  personId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La persona è obbligatoria']
  },
  personName: {
    type: String,
    required: true
  },
  restaurant: {
    type: String,
    required: [true, 'Il nome del ristorante è obbligatorio'],
    trim: true,
    maxlength: [100, 'Il nome del ristorante non può superare 100 caratteri']
  },
  distance: {
    type: String,
    enum: {
      values: ['short', 'medium', 'long'],
      message: 'La distanza deve essere: short, medium o long'
    },
    required: [true, 'La distanza è obbligatoria']
  },
  wait: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'L\'attesa deve essere: low, medium o high'
    },
    required: [true, 'Il tempo d\'attesa è obbligatorio']
  },
  money: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'L\'anticipo deve essere: low, medium o high'
    },
    required: [true, 'L\'anticipo è obbligatorio']
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Le note non possono superare 500 caratteri']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index per performance
OrderSchema.index({ groupId: 1, date: -1 });
OrderSchema.index({ personId: 1 });
OrderSchema.index({ createdAt: -1 });

// Static method per calcolare statistiche gruppo
OrderSchema.statics.getGroupStats = async function(groupId) {
  const stats = await this.aggregate([
    { $match: { groupId: mongoose.Types.ObjectId(groupId) } },
    {
      $group: {
        _id: '$personId',
        personName: { $first: '$personName' },
        totalOrders: { $sum: 1 },
        totalScore: { $sum: '$score' },
        avgScore: { $avg: '$score' }
      }
    },
    { $sort: { totalScore: -1 } }
  ]);
  
  return stats;
};

// Virtual per ottenere label leggibili
OrderSchema.virtual('distanceLabel').get(function() {
  const labels = {
    short: 'Vicino',
    medium: 'Medio',
    long: 'Lontano'
  };
  return labels[this.distance];
});

OrderSchema.virtual('waitLabel').get(function() {
  const labels = {
    low: 'Breve',
    medium: 'Medio',
    high: 'Lungo'
  };
  return labels[this.wait];
});

OrderSchema.virtual('moneyLabel').get(function() {
  const labels = {
    low: 'Basso',
    medium: 'Medio',
    high: 'Alto'
  };
  return labels[this.money];
});

// Abilita virtuals nel JSON
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export default mongoose.model('Order', OrderSchema);