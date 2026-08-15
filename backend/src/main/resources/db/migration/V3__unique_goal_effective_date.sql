CREATE UNIQUE INDEX uq_goals_user_effective_from
    ON goals (user_id, effective_from);
