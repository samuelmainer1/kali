export function roleLabel(role) {
    if (!role) {
        return '';
    }

    if (role === 'marketing') {
        return 'IT & Marketing';
    }

    return String(role)
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
