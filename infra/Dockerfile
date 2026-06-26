# Build the React frontend
FROM mirror.gcr.io/library/node:20 AS frontend-build

WORKDIR /js
COPY js/package.json js/pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

COPY js/ ./
RUN pnpm run build

# Build the Spring Boot backend and package the frontend into the app
FROM mirror.gcr.io/library/eclipse-temurin:25-jdk-jammy AS backend-build

WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn/ .mvn/
RUN ./mvnw dependency:resolve -B

COPY src ./src
COPY --from=frontend-build /js/dist/ src/main/resources/static/
RUN ./mvnw package -B -DskipTests

# Create the final runtime image
FROM mirror.gcr.io/library/eclipse-temurin:25-jre-jammy

RUN groupadd --system spring \
    && useradd --system --gid spring --home-dir /app spring \
    && mkdir -p /app \
    && chown spring:spring /app

WORKDIR /app

COPY --from=backend-build --chown=spring:spring /app/target/*.jar app.jar

ARG SERVER_PROFILES=prod
ENV SPRING_PROFILES_ACTIVE=${SERVER_PROFILES}

USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]