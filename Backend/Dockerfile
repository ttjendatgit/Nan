FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .
RUN dotnet restore "src/Vifan.PrintTech.API/Vifan.PrintTech.API.csproj"
RUN dotnet publish "src/Vifan.PrintTech.API/Vifan.PrintTech.API.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Vifan.PrintTech.API.dll"]
