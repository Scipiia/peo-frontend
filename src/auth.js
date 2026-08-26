
const API_BASE = '/api'

export function getToken() {
    return localStorage.getItem('token')
}

export function saveToken(token) {
    localStorage.setItem('token', token)
}

export function removeToken() {
    localStorage.removeItem('token')
}

export function getUser() {
    const data = localStorage.getItem('user')
    return data ? JSON.parse(data) : null
}

export function saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user))
}

export function removeUser() {
    localStorage.removeItem('user')
}

export function isLoggedIn() {
    return !!getToken()
}

export async function login(username, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    })

    if (!response.ok) {
        const error = await response.json().catch(()=>({ error: "Ошибка входа" }))
        throw new Error(error.error || 'Неверный логин и пароль')
    }

    const data = await response.json()
    saveToken(data.token)
    saveUser(data.user)
    return data
}

export function logout() {
    removeToken()
    removeUser()
}

export function hasPermission(permission) {
    const user = getUser()
    return user?.permissions?.includes(permission) ?? false
}