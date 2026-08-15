package com.nourish.tracker.repository;

import com.nourish.tracker.api.report.CalorieReportResponse.CaloriePoint;
import com.nourish.tracker.api.report.GoalVsActualReportResponse.GoalVsActualPoint;
import com.nourish.tracker.api.report.GoalVsActualReportResponse.NutritionValues;
import com.nourish.tracker.api.report.MacroReportResponse.MacroPoint;
import com.nourish.tracker.api.report.MicronutrientReportResponse.Micronutrients;
import com.nourish.tracker.api.report.ReportGranularity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public class ReportRepository {
    private final JdbcClient jdbcClient;

    public ReportRepository(DataSource dataSource) {
        this.jdbcClient = JdbcClient.create(dataSource);
    }

    public List<CaloriePoint> calorieTrend(
            UUID userId,
            LocalDate from,
            LocalDate to,
            ReportGranularity granularity
    ) {
        String sql = periodSql(granularity, """
                COALESCE(SUM(entry.calories), 0) AS calories
                """);

        return reportQuery(sql, userId, from, to)
                .query((resultSet, rowNumber) -> new CaloriePoint(
                        resultSet.getObject("period_start", LocalDate.class),
                        resultSet.getBigDecimal("calories")
                ))
                .list();
    }

    public List<MacroPoint> macroTrend(
            UUID userId,
            LocalDate from,
            LocalDate to,
            ReportGranularity granularity
    ) {
        String sql = periodSql(granularity, """
                COALESCE(SUM(entry.protein_grams), 0) AS protein_grams,
                COALESCE(SUM(entry.carbs_grams), 0) AS carbs_grams,
                COALESCE(SUM(entry.fat_grams), 0) AS fat_grams
                """);

        return reportQuery(sql, userId, from, to)
                .query((resultSet, rowNumber) -> new MacroPoint(
                        resultSet.getObject("period_start", LocalDate.class),
                        resultSet.getBigDecimal("protein_grams"),
                        resultSet.getBigDecimal("carbs_grams"),
                        resultSet.getBigDecimal("fat_grams")
                ))
                .list();
    }

    public Micronutrients micronutrientTotals(UUID userId, LocalDate from, LocalDate to) {
        return jdbcClient.sql("""
                        SELECT
                            COALESCE(SUM(vitamin_c_mg), 0) AS vitamin_c_mg,
                            COALESCE(SUM(calcium_mg), 0) AS calcium_mg,
                            COALESCE(SUM(iron_mg), 0) AS iron_mg,
                            COALESCE(SUM(vitamin_d_iu), 0) AS vitamin_d_iu,
                            COALESCE(SUM(potassium_mg), 0) AS potassium_mg
                        FROM food_entries
                        WHERE user_id = :userId
                          AND consumed_at >= (
                              CAST(:fromDate AS date)::timestamp AT TIME ZONE 'UTC'
                          )
                          AND consumed_at < (
                              (CAST(:toDate AS date) + 1)::timestamp AT TIME ZONE 'UTC'
                          )
                        """)
                .param("userId", userId)
                .param("fromDate", from)
                .param("toDate", to)
                .query((resultSet, rowNumber) -> new Micronutrients(
                        resultSet.getBigDecimal("vitamin_c_mg"),
                        resultSet.getBigDecimal("calcium_mg"),
                        resultSet.getBigDecimal("iron_mg"),
                        resultSet.getBigDecimal("vitamin_d_iu"),
                        resultSet.getBigDecimal("potassium_mg")
                ))
                .single();
    }

    public List<GoalVsActualPoint> goalVsActual(UUID userId, LocalDate from, LocalDate to) {
        return jdbcClient.sql("""
                        WITH days AS (
                            SELECT generate_series(
                                CAST(:fromDate AS date)::timestamp AT TIME ZONE 'UTC',
                                CAST(:toDate AS date)::timestamp AT TIME ZONE 'UTC',
                                INTERVAL '1 day'
                            ) AS day_start
                        )
                        SELECT
                            (days.day_start AT TIME ZONE 'UTC')::date AS report_date,
                            COALESCE(actual.calories, 0) AS actual_calories,
                            COALESCE(actual.protein_grams, 0) AS actual_protein_grams,
                            COALESCE(actual.carbs_grams, 0) AS actual_carbs_grams,
                            COALESCE(actual.fat_grams, 0) AS actual_fat_grams,
                            goal.daily_calorie_target AS goal_calories,
                            goal.protein_grams AS goal_protein_grams,
                            goal.carbs_grams AS goal_carbs_grams,
                            goal.fat_grams AS goal_fat_grams
                        FROM days
                        LEFT JOIN LATERAL (
                            SELECT
                                SUM(calories) AS calories,
                                SUM(protein_grams) AS protein_grams,
                                SUM(carbs_grams) AS carbs_grams,
                                SUM(fat_grams) AS fat_grams
                            FROM food_entries
                            WHERE user_id = :userId
                              AND consumed_at >= days.day_start
                              AND consumed_at < days.day_start + INTERVAL '1 day'
                        ) actual ON TRUE
                        LEFT JOIN LATERAL (
                            SELECT
                                daily_calorie_target,
                                protein_grams,
                                carbs_grams,
                                fat_grams
                            FROM goals
                            WHERE user_id = :userId
                              AND effective_from < days.day_start + INTERVAL '1 day'
                            ORDER BY effective_from DESC
                            LIMIT 1
                        ) goal ON TRUE
                        ORDER BY days.day_start
                        """)
                .param("userId", userId)
                .param("fromDate", from)
                .param("toDate", to)
                .query((resultSet, rowNumber) -> {
                    BigDecimal goalCalories = resultSet.getBigDecimal("goal_calories");
                    NutritionValues goal = goalCalories == null
                            ? null
                            : new NutritionValues(
                                    goalCalories,
                                    resultSet.getBigDecimal("goal_protein_grams"),
                                    resultSet.getBigDecimal("goal_carbs_grams"),
                                    resultSet.getBigDecimal("goal_fat_grams")
                            );

                    return new GoalVsActualPoint(
                            resultSet.getObject("report_date", LocalDate.class),
                            new NutritionValues(
                                    resultSet.getBigDecimal("actual_calories"),
                                    resultSet.getBigDecimal("actual_protein_grams"),
                                    resultSet.getBigDecimal("actual_carbs_grams"),
                                    resultSet.getBigDecimal("actual_fat_grams")
                            ),
                            goal
                    );
                })
                .list();
    }

    private JdbcClient.StatementSpec reportQuery(
            String sql,
            UUID userId,
            LocalDate from,
            LocalDate to
    ) {
        return jdbcClient.sql(sql)
                .param("userId", userId)
                .param("fromDate", from)
                .param("toDate", to);
    }

    private String periodSql(ReportGranularity granularity, String aggregates) {
        String unit = granularity.sqlUnit();
        return """
                WITH periods AS (
                    SELECT generate_series(
                        date_trunc(
                            '%1$s',
                            CAST(:fromDate AS date)::timestamp
                        ) AT TIME ZONE 'UTC',
                        date_trunc(
                            '%1$s',
                            CAST(:toDate AS date)::timestamp
                        ) AT TIME ZONE 'UTC',
                        INTERVAL '1 %1$s'
                    ) AS period_start
                )
                SELECT
                    (periods.period_start AT TIME ZONE 'UTC')::date AS period_start,
                    %2$s
                FROM periods
                LEFT JOIN food_entries entry
                  ON entry.user_id = :userId
                 AND entry.consumed_at >= periods.period_start
                 AND entry.consumed_at < periods.period_start + INTERVAL '1 %1$s'
                 AND entry.consumed_at >= (
                     CAST(:fromDate AS date)::timestamp AT TIME ZONE 'UTC'
                 )
                 AND entry.consumed_at < (
                     (CAST(:toDate AS date) + 1)::timestamp AT TIME ZONE 'UTC'
                 )
                GROUP BY periods.period_start
                ORDER BY periods.period_start
                """.formatted(unit, aggregates);
    }
}
