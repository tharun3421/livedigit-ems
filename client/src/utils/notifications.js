// ─── Sound ────────────────────────────────────────────────────────────────────

export const playNotificationSound = (priority = 'NORMAL') => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const configs = {
            NORMAL:    [{ freq: 523, dur: 0.12 }, { freq: 659, dur: 0.18 }],
            IMPORTANT: [{ freq: 659, dur: 0.12 }, { freq: 784, dur: 0.12 }, { freq: 880, dur: 0.22 }],
            URGENT:    [{ freq: 880, dur: 0.10 }, { freq: 988, dur: 0.10 }, { freq: 880, dur: 0.10 }, { freq: 988, dur: 0.25 }],
        }
        let time = ctx.currentTime
        ;(configs[priority] || configs.NORMAL).forEach(({ freq, dur }) => {
            const osc  = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = freq
            osc.type            = 'sine'
            gain.gain.setValueAtTime(0.35, time)
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
            osc.start(time)
            osc.stop(time + dur)
            time += dur + 0.04
        })
    } catch { /* AudioContext not supported */ }
}

// ─── Service Worker Registration ──────────────────────────────────────────────

export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return null
    try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        console.log('[SW] Registered:', reg.scope)
        return reg
    } catch (err) {
        console.error('[SW] Registration failed:', err)
        return null
    }
}

// ─── Notification Permission ───────────────────────────────────────────────────

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    return await Notification.requestPermission()
}

// ─── Show Notification (with sound) ───────────────────────────────────────────
// Used when user IS on the page — plays sound + shows browser notification

export const showNotification = async (title, body, priority = 'NORMAL') => {
    playNotificationSound(priority)

    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const icons = { NORMAL: 'ℹ️', IMPORTANT: '⚠️', URGENT: '🚨' }
    new Notification(`${icons[priority]} ${title}`, {
        body,
        icon:               '/favicon.ico',
        badge:              '/favicon.ico',
        tag:                `announcement-${Date.now()}`,
        requireInteraction: priority === 'URGENT',
    })
}

// ─── Background Notification via SW ───────────────────────────────────────────
// Used to show notification even when user is NOT on the page

export const showBackgroundNotification = async (title, body, priority = 'NORMAL') => {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    if (!reg) return

    const icons = { NORMAL: 'ℹ️', IMPORTANT: '⚠️', URGENT: '🚨' }
    await reg.showNotification(`${icons[priority]} ${title}`, {
        body,
        icon:               '/favicon.ico',
        badge:              '/favicon.ico',
        tag:                `announcement-${Date.now()}`,
        requireInteraction: priority === 'URGENT',
        data:               { url: '/announcements' },
    })
}