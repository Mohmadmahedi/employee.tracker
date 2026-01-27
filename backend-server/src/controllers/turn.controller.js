exports.getTurnCredentials = (req, res) => {
    const user = process.env.TURN_USER;
    const pass = process.env.TURN_PASS;
    const domain = process.env.TURN_DOMAIN || 'free.expressturn.com';

    if (!user || !pass) {
        console.error('[TURN] Configuration missing: TURN_USER or TURN_PASS not set.');
        return res.status(500).json({ error: 'TURN credentials missing on server' });
    }

    res.json({
        iceServers: [
            {
                urls: [
                    'turn:free.expressturn.com:3478?transport=udp',
                    'turn:free.expressturn.com:3478?transport=tcp'
                ],
                username: user,
                credential: pass
            }
        ]
    });

};
