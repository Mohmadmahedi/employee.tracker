exports.getTurnCredentials = (req, res) => {
    const user = process.env.TURN_USER;
    const pass = process.env.TURN_PASS;
    const domain = process.env.TURN_DOMAIN || 'free.expressturn.com';

    // If TURN credentials are not configured, use public STUN servers
    // Note: STUN works for same-network connections, TURN is needed for NAT traversal
    if (!user || !pass) {
        console.warn('[TURN] Credentials not configured. Using public STUN servers (limited NAT traversal).');
        return res.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        });
    }

    res.json({
        iceServers: [
            {
                urls: [
                    `turn:${domain}:3478?transport=udp`,
                    `turn:${domain}:3478?transport=tcp`
                ],
                username: user,
                credential: pass
            },
            // Also include STUN as fallback
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });
};
