FROM node:22-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:21-jdk-alpine AS backend-build
WORKDIR /build/backend
COPY backend/ ./
COPY --from=frontend-build /build/frontend/dist ./src/main/resources/static
RUN chmod +x mvnw && ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S nourish && adduser -S nourish -G nourish
WORKDIR /app
COPY --from=backend-build --chown=nourish:nourish \
    /build/backend/target/calorie-tracker-0.0.1-SNAPSHOT.jar \
    /app/calorie-tracker.jar
USER nourish
EXPOSE 10000
ENTRYPOINT ["java", "-jar", "/app/calorie-tracker.jar"]
