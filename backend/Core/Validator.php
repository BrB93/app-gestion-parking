<?php
namespace Core;

class Validator {
    /**
     * @param string
     * @return bool
     */
    public static function isSafeString($input): bool {
        if (!is_string($input)) return false;
        
        $dangerousPatterns = [
            '/<\?/',
            '/<script/i',
            '/<\/script>/i',
            '/javascript:/i',
            '/on\w+(\s*)=/i',
            '/data:text\/html/i',
            '/base64/i'
        ];
        
        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $input)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @param string
     * @return string
     */
    public static function sanitizeString($input): string {
        if (!is_string($input)) {
            return '';
        }
        
        $cleaned = strip_tags($input);
        $cleaned = htmlspecialchars($cleaned, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        
        return $cleaned;
    }
    
    /**
     * @param array
     * @return array
     */
    public static function sanitizeData(array $data): array {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = self::sanitizeData($value);
            } else if (is_string($value)) {
                $sanitized[$key] = self::sanitizeString($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
}