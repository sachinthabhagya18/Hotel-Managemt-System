// Helper to manage the Authentication Token

export const setToken = (token) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('hotel_admin_token', token);
    }
};

export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('hotel_admin_token');
    }
    return null;
};

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('hotel_admin_token');
    }
};

export const isAuthenticated = () => {
    return !!getToken();
};