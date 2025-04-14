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
 *
 * 
 * @param {Object} data
 * @returns {Object}
 */
export function validateFormData(data) {
    const validatedData = {};
    const errors = {};
    let isValid = true;
    
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            if (!isSafeString(value)) {
                errors[key] = "Le champ contient du contenu potentiellement dangereux";
                isValid = false;
            } else {
                validatedData[key] = value.trim();
            }
        } else {
            validatedData[key] = value;
        }
    }
    
    return {
        isValid,
        data: validatedData,
        errors
    };
}