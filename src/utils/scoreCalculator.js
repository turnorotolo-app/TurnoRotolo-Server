/**
 * Calcola il punteggio di disagio per un ordine
 * @param {string} distance - short, medium, long
 * @param {string} wait - low, medium, high
 * @param {string} money - low, medium, high
 * @param {object} weights - { distance: number, wait: number, money: number }
 * @returns {number} - Punteggio calcolato
 */
export const calculateScore = (distance, wait, money, weights = {}) => {
  // Pesi di default
  const defaultWeights = {
    distance: 1,
    wait: 0.8,
    money: 0.6
  };
  
  const finalWeights = { ...defaultWeights, ...weights };
  
  // Punti base per ogni parametro
  const distancePoints = {
    short: 3,
    medium: 6,
    long: 10
  };
  
  const waitPoints = {
    low: 2,
    medium: 5,
    high: 8
  };
  
  const moneyPoints = {
    low: 2,
    medium: 4,
    high: 7
  };
  
  // Validazione input
  if (!distancePoints[distance]) {
    throw new Error(`Distanza non valida: ${distance}`);
  }
  if (!waitPoints[wait]) {
    throw new Error(`Tempo d'attesa non valido: ${wait}`);
  }
  if (!moneyPoints[money]) {
    throw new Error(`Anticipo non valido: ${money}`);
  }
  
  // Calcolo punteggio totale
  const score = 
    (distancePoints[distance] * finalWeights.distance) +
    (waitPoints[wait] * finalWeights.wait) +
    (moneyPoints[money] * finalWeights.money);
  
  return Math.round(score);
};

/**
 * Ottiene una descrizione testuale del punteggio
 * @param {number} score - Punteggio
 * @returns {string} - Descrizione
 */
export const getScoreDescription = (score) => {
  if (score <= 5) return 'Passeggiata facile 🚶';
  if (score <= 10) return 'Piccolo impegno 🏃';
  if (score <= 15) return 'Bel sacrificio 💪';
  if (score <= 20) return 'Eroe del giorno 🦸';
  return 'Leggenda assoluta 🏆';
};

/**
 * Calcola il punteggio medio di un array di ordini
 * @param {Array} orders - Array di ordini
 * @returns {number} - Punteggio medio
 */
export const calculateAverageScore = (orders) => {
  if (!orders || orders.length === 0) return 0;
  
  const total = orders.reduce((sum, order) => sum + order.score, 0);
  return Math.round(total / orders.length);
};

/**
 * Trova la persona con il punteggio più basso (prossimo turno)
 * @param {Array} members - Array di membri del gruppo
 * @returns {Object|null} - Membro con punteggio minimo
 */
export const getNextPerson = (members) => {
  if (!members || members.length === 0) return null;
  
  return members.reduce((min, member) => 
    member.score < min.score ? member : min
  );
};

/**
 * Calcola statistiche per un gruppo
 * @param {Array} members - Array di membri
 * @param {Array} orders - Array di ordini
 * @returns {Object} - Statistiche
 */
export const calculateGroupStats = (members, orders) => {
  const stats = {
    totalOrders: orders.length,
    totalScore: orders.reduce((sum, o) => sum + o.score, 0),
    averageScore: 0,
    mostActiveUser: null,
    fairnessIndex: 0
  };
  
  if (orders.length > 0) {
    stats.averageScore = Math.round(stats.totalScore / orders.length);
  }
  
  // Trova utente più attivo
  const userCounts = {};
  orders.forEach(order => {
    userCounts[order.personId] = (userCounts[order.personId] || 0) + 1;
  });
  
  const maxOrders = Math.max(...Object.values(userCounts));
  const mostActiveId = Object.keys(userCounts).find(
    id => userCounts[id] === maxOrders
  );
  
  if (mostActiveId) {
    const mostActive = members.find(m => m.userId.toString() === mostActiveId);
    if (mostActive) {
      stats.mostActiveUser = {
        name: mostActive.name,
        ordersCount: maxOrders
      };
    }
  }
  
  // Indice di equità (0-100, dove 100 = perfettamente equo)
  if (members.length > 1) {
    const scores = members.map(m => m.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => 
      sum + Math.pow(score - avgScore, 2), 0
    ) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalizza tra 0 e 100 (meno varianza = più equo)
    stats.fairnessIndex = Math.max(0, Math.min(100, 
      100 - (stdDev / avgScore * 100)
    ));
  }
  
  return stats;
};