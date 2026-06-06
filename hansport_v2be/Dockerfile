FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
RUN addgroup -S app && adduser -S app -G app && mkdir -p /app/upload && chown -R app:app /app
COPY --from=build /workspace/target/*.jar /app/hansport-api.jar

USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/hansport-api.jar"]
