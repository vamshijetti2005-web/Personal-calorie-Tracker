CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals are append-only versions. A later change inserts a new row
-- so historical goal-vs-actual reports stay accurate.
CREATE TABLE goals (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    daily_calorie_target INTEGER NOT NULL,
    protein_grams NUMERIC(8, 2) NOT NULL,
    carbs_grams NUMERIC(8, 2) NOT NULL,
    fat_grams NUMERIC(8, 2) NOT NULL,
    weight_goal_kg NUMERIC(6, 2) NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_effective ON goals (user_id, effective_from);

CREATE TABLE food_entries (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL,
    food_name VARCHAR(160) NOT NULL,
    quantity NUMERIC(8, 2) NOT NULL,
    serving_unit VARCHAR(40) NOT NULL,
    calories NUMERIC(8, 2) NOT NULL,
    protein_grams NUMERIC(8, 2) NOT NULL,
    carbs_grams NUMERIC(8, 2) NOT NULL,
    fat_grams NUMERIC(8, 2) NOT NULL,
    vitamin_c_mg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    calcium_mg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    iron_mg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    vitamin_d_iu NUMERIC(8, 2) NOT NULL DEFAULT 0,
    potassium_mg NUMERIC(8, 2) NOT NULL DEFAULT 0,
    consumed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT food_entries_meal_type_chk CHECK (
        meal_type IN ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACKS')
    )
);

CREATE INDEX idx_entries_user_consumed ON food_entries (user_id, consumed_at);
CREATE INDEX idx_entries_user_meal_consumed ON food_entries (user_id, meal_type, consumed_at);
