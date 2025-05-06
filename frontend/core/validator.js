/**
 * 
 * @param {string} input
 * @returns {boolean}
 */
export function isSafeString(input) {
    if (typeof input !== 'string') return false;
    
    const dangerousPatterns = [
        /<\?/,
        /<script/i,
        /<\/script>/i,
        /javascript:/i,
        /on\w+(\s*)=/i,
        /data:text\/html/i,
        /base64/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * 
 * @param {string} input
 * @returns {string}
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    let cleaned = div.innerHTML;
    
    cleaned = cleaned
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    return cleaned;
}

/**
 * Valide les données d'un formulaire
 * @param {Object} data - Les données du formulaire à valider
 * @returns {Object} - Résultat de la validation { isValid, data, errors }
 */
export function validateFormData(data) {
    const errors = {};
    let isValid = true;
    
    if (data.username !== undefined) {
        if (data.username.trim() === '') {
            errors.username = "Le nom d'utilisateur est requis";
            isValid = false;
        } else if (data.username.length < 3) {
            errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
            isValid = false;
        }
    }
    
    if (data.email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (data.email.trim() === '') {
            errors.email = "L'email est requis";
            isValid = false;
        } else if (!emailRegex.test(data.email)) {
            errors.email = "Format d'email invalide";
            isValid = false;
        }
    }
    
    if (data.password !== undefined && data.id === undefined) {
        if (data.password.trim() === '') {
            errors.password = "Le mot de passe est requis";
            isValid = false;
        } else if (data.password.length < 6) {
            errors.password = "Le mot de passe doit contenir au moins 6 caractères";
            isValid = false;
        }
    }
    
    if (data.first_name !== undefined && data.first_name.trim() === '') {
        errors.first_name = "Le prénom est requis";
        isValid = false;
    }
    
    if (data.last_name !== undefined && data.last_name.trim() === '') {
        errors.last_name = "Le nom est requis";
        isValid = false;
    }
    
    if (data.address !== undefined && data.address.trim() === '') {
        errors.address = "L'adresse est requise";
        isValid = false;
    }
    
    if (data.zip_code !== undefined && data.zip_code.trim() === '') {
        errors.zip_code = "Le code postal est requis";
        isValid = false;
    }
    
    if (data.city !== undefined && data.city.trim() === '') {
        errors.city = "La ville est requise";
        isValid = false;
    }
    
    if (data.phone && !/^[0-9+\s()-]{6,20}$/.test(data.phone)) {
        errors.phone = "Format de numéro de téléphone invalide";
        isValid = false;
    }
    
    return {
        isValid,
        errors
    };
}

/**
 * Valide les données d'une réservation
 * @param {Object} data - Les données de la réservation à valider
 * @returns {Object} - Résultat de la validation { isValid, data, errors }
 */
export function validateReservationData(data) {
    const validatedData = {};
    const errors = {};
    let isValid = true;
    
    if (!data.spot_id) {
      errors.spot_id = "Veuillez sélectionner une place de parking";
      isValid = false;
    }
    
    if (!data.start_time) {
      errors.start_time = "La date et l'heure de début sont requises";
      isValid = false;
    }
    
    if (!data.end_time) {
      errors.end_time = "La date et l'heure de fin sont requises";
      isValid = false;
    }
    
    if (data.start_time && data.end_time) {
      const start = new Date(data.start_time);
      const end = new Date(data.end_time);
      
      if (end <= start) {
        errors.end_time = "La date de fin doit être postérieure à la date de début";
        isValid = false;
      }
    }
    
    return {
      isValid,
      data: validatedData,
      errors
    };
}