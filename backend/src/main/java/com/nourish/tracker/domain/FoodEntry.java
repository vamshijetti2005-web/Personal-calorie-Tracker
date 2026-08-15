package com.nourish.tracker.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "food_entries")
public class FoodEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 20)
    private MealType mealType;

    @Column(name = "food_name", nullable = false, length = 160)
    private String foodName;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal quantity;

    @Column(name = "serving_unit", nullable = false, length = 40)
    private String servingUnit;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal calories;

    @Column(name = "protein_grams", nullable = false, precision = 8, scale = 2)
    private BigDecimal proteinGrams;

    @Column(name = "carbs_grams", nullable = false, precision = 8, scale = 2)
    private BigDecimal carbsGrams;

    @Column(name = "fat_grams", nullable = false, precision = 8, scale = 2)
    private BigDecimal fatGrams;

    @Column(name = "vitamin_c_mg", nullable = false, precision = 8, scale = 2)
    private BigDecimal vitaminCMg = BigDecimal.ZERO;

    @Column(name = "calcium_mg", nullable = false, precision = 8, scale = 2)
    private BigDecimal calciumMg = BigDecimal.ZERO;

    @Column(name = "iron_mg", nullable = false, precision = 8, scale = 2)
    private BigDecimal ironMg = BigDecimal.ZERO;

    @Column(name = "vitamin_d_iu", nullable = false, precision = 8, scale = 2)
    private BigDecimal vitaminDIU = BigDecimal.ZERO;

    @Column(name = "potassium_mg", nullable = false, precision = 8, scale = 2)
    private BigDecimal potassiumMg = BigDecimal.ZERO;

    @Column(name = "consumed_at", nullable = false)
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public MealType getMealType() {
        return mealType;
    }

    public void setMealType(MealType mealType) {
        this.mealType = mealType;
    }

    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getServingUnit() {
        return servingUnit;
    }

    public void setServingUnit(String servingUnit) {
        this.servingUnit = servingUnit;
    }

    public BigDecimal getCalories() {
        return calories;
    }

    public void setCalories(BigDecimal calories) {
        this.calories = calories;
    }

    public BigDecimal getProteinGrams() {
        return proteinGrams;
    }

    public void setProteinGrams(BigDecimal proteinGrams) {
        this.proteinGrams = proteinGrams;
    }

    public BigDecimal getCarbsGrams() {
        return carbsGrams;
    }

    public void setCarbsGrams(BigDecimal carbsGrams) {
        this.carbsGrams = carbsGrams;
    }

    public BigDecimal getFatGrams() {
        return fatGrams;
    }

    public void setFatGrams(BigDecimal fatGrams) {
        this.fatGrams = fatGrams;
    }

    public BigDecimal getVitaminCMg() {
        return vitaminCMg;
    }

    public void setVitaminCMg(BigDecimal vitaminCMg) {
        this.vitaminCMg = vitaminCMg;
    }

    public BigDecimal getCalciumMg() {
        return calciumMg;
    }

    public void setCalciumMg(BigDecimal calciumMg) {
        this.calciumMg = calciumMg;
    }

    public BigDecimal getIronMg() {
        return ironMg;
    }

    public void setIronMg(BigDecimal ironMg) {
        this.ironMg = ironMg;
    }

    public BigDecimal getVitaminDIU() {
        return vitaminDIU;
    }

    public void setVitaminDIU(BigDecimal vitaminDIU) {
        this.vitaminDIU = vitaminDIU;
    }

    public BigDecimal getPotassiumMg() {
        return potassiumMg;
    }

    public void setPotassiumMg(BigDecimal potassiumMg) {
        this.potassiumMg = potassiumMg;
    }

    public Instant getConsumedAt() {
        return consumedAt;
    }

    public void setConsumedAt(Instant consumedAt) {
        this.consumedAt = consumedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
