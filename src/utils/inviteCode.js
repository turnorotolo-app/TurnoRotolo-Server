/**
 * Genera un codice invito univoco di 6 caratteri
 * Formato: ABC123 (3 lettere + 3 numeri)
 * @returns {string} - Codice invito
 */
export const generateInviteCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let code = '';
  
  // 3 lettere casuali
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // 3 numeri casuali
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
};

/**
 * Valida il formato di un codice invito
 * @param {string} code - Codice da validare
 * @returns {boolean} - true se valido
 */
export const validateInviteCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  
  // Deve essere lungo esattamente 6 caratteri
  if (code.length !== 6) return false;
  
  // Formato: 3 lettere maiuscole + 3 numeri
  const regex = /^[A-Z]{3}[0-9]{3}$/;
  return regex.test(code);
};

/**
 * Formatta un codice invito (converte in maiuscolo e rimuove spazi)
 * @param {string} code - Codice da formattare
 * @returns {string} - Codice formattato
 */
export const formatInviteCode = (code) => {
  if (!code) return '';
  return code.trim().toUpperCase().replace(/\s/g, '');
};