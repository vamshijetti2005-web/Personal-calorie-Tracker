INSERT INTO users (id, email, password_hash, display_name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@nourish.local',
    'NOT_USED_IN_SINGLE_USER_MODE',
    'Demo User'
)
ON CONFLICT (id) DO NOTHING;
